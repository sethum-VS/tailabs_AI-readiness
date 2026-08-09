import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getRecommendations, type RecommendationRule, type TeamPillarAverages } from '@/lib/scoringEngine'

interface TeamResponseRow {
  tool_usage_score: number
  workflow_automation_score: number
  data_literacy_score: number
  output_evaluation_score: number
  leadership_buyin_score: number
}

interface TeamRow {
  id: string
  name: string
  aggregate_score: number
  target_seats: number
  organization_id: string
}

interface OrgRow {
  id: string
  name: string
  aggregate_score: number
}

export async function GET() {
  try {
    const supabase = createAdminClient()

    // 1. Fetch organization data
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, name, aggregate_score')
      .order('created_at', { ascending: true }) as unknown as { data: OrgRow[] | null }

    if (!orgs || orgs.length === 0) {
      return NextResponse.json({
        has_data: false,
        org_score: 0,
        org_name: 'Your Organization',
        teams: [],
        recommendations: [],
        total_responses: 0,
        teams_assessed: 0,
      })
    }

    const org = orgs[0] // Primary org

    // 2. Fetch all teams for this org
    const { data: teams } = await supabase
      .from('teams')
      .select('id, name, aggregate_score, target_seats, organization_id')
      .eq('organization_id', org.id)
      .order('name') as unknown as { data: TeamRow[] | null }

    if (!teams || teams.length === 0) {
      return NextResponse.json({
        has_data: false,
        org_score: org.aggregate_score,
        org_name: org.name,
        teams: [],
        recommendations: [],
        total_responses: 0,
        teams_assessed: 0,
      })
    }

    const teamIds = teams.map((t) => t.id)

    // 3. Fetch all responses to compute pillar averages
    const { data: responses } = await supabase
      .from('assessment_responses')
      .select('team_id, tool_usage_score, workflow_automation_score, data_literacy_score, output_evaluation_score, leadership_buyin_score')
      .in('team_id', teamIds) as unknown as {
        data: (TeamResponseRow & { team_id: string })[] | null
      }

    // 4. Compute pillar averages per team
    const teamPillarMap: Record<string, {
      count: number
      tool_usage: number
      workflow_automation: number
      data_literacy: number
      output_evaluation: number
      leadership_buyin: number
    }> = {}

    for (const r of (responses ?? [])) {
      if (!teamPillarMap[r.team_id]) {
        teamPillarMap[r.team_id] = {
          count: 0,
          tool_usage: 0,
          workflow_automation: 0,
          data_literacy: 0,
          output_evaluation: 0,
          leadership_buyin: 0,
        }
      }
      const tm = teamPillarMap[r.team_id]
      tm.count++
      tm.tool_usage += r.tool_usage_score
      tm.workflow_automation += r.workflow_automation_score
      tm.data_literacy += r.data_literacy_score
      tm.output_evaluation += r.output_evaluation_score
      tm.leadership_buyin += r.leadership_buyin_score
    }

    // 5. Build enriched team data
    const enrichedTeams = teams.map((team) => {
      const tm = teamPillarMap[team.id]
      const n = tm?.count ?? 0
      const pillarAverages: TeamPillarAverages = n > 0
        ? {
            tool_usage: Math.round((tm.tool_usage / n / 4) * 100),
            workflow_automation: Math.round((tm.workflow_automation / n / 4) * 100),
            data_literacy: Math.round((tm.data_literacy / n / 4) * 100),
            output_evaluation: Math.round((tm.output_evaluation / n / 4) * 100),
            leadership_buyin: Math.round((tm.leadership_buyin / n / 4) * 100),
          }
        : {
            tool_usage: 0,
            workflow_automation: 0,
            data_literacy: 0,
            output_evaluation: 0,
            leadership_buyin: 0,
          }

      return {
        id: team.id,
        name: team.name,
        aggregate_score: team.aggregate_score,
        target_seats: team.target_seats,
        response_count: n,
        pillar_averages: pillarAverages,
      }
    })

    // 6. Compute org-level pillar averages (mean of team pillar averages)
    const teamsWithData = enrichedTeams.filter((t) => t.response_count > 0)
    const orgPillarAverages: TeamPillarAverages = teamsWithData.length > 0
      ? {
          tool_usage: Math.round(teamsWithData.reduce((s, t) => s + t.pillar_averages.tool_usage, 0) / teamsWithData.length),
          workflow_automation: Math.round(teamsWithData.reduce((s, t) => s + t.pillar_averages.workflow_automation, 0) / teamsWithData.length),
          data_literacy: Math.round(teamsWithData.reduce((s, t) => s + t.pillar_averages.data_literacy, 0) / teamsWithData.length),
          output_evaluation: Math.round(teamsWithData.reduce((s, t) => s + t.pillar_averages.output_evaluation, 0) / teamsWithData.length),
          leadership_buyin: Math.round(teamsWithData.reduce((s, t) => s + t.pillar_averages.leadership_buyin, 0) / teamsWithData.length),
        }
      : { tool_usage: 0, workflow_automation: 0, data_literacy: 0, output_evaluation: 0, leadership_buyin: 0 }

    // 7. Get recommendations from DB rules
    const { data: rules } = await supabase
      .from('recommendation_rules')
      .select('id, pillar, threshold_max, title, description, action_label, action_url') as unknown as {
        data: RecommendationRule[] | null
      }

    const recommendations = getRecommendations(orgPillarAverages, rules ?? [])

    const totalResponses = enrichedTeams.reduce((s, t) => s + t.response_count, 0)
    const teamsAssessed = enrichedTeams.filter((t) => t.response_count > 0).length

    return NextResponse.json({
      has_data: totalResponses > 0,
      org_score: org.aggregate_score,
      org_name: org.name,
      org_pillar_averages: orgPillarAverages,
      teams: enrichedTeams,
      recommendations,
      total_responses: totalResponses,
      teams_assessed: teamsAssessed,
      total_teams: teams.length,
    })
  } catch (err) {
    console.error('Dashboard error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
