import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getRecommendations, type RecommendationRule, type TeamPillarAverages } from '@/lib/scoringEngine'

interface TeamResponseRow {
  tool_usage_score: number | null
  workflow_automation_score: number | null
  data_literacy_score: number | null
  output_evaluation_score: number | null
  leadership_buyin_score: number | null
  tech_coding_score: number | null
  tech_ml_concepts_score: number | null
  tech_infrastructure_score: number | null
  tech_observability_score: number | null
  tech_applied_practice_score: number | null
  tech_deployment_score: number | null
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
  default_seat_target?: number | null
  link_validity_days?: number | null
}

export async function GET(request: NextRequest) {
  try {
    // Org ID is injected by middleware from the tai_guest_id cookie
    const orgId = request.headers.get('x-tai-org-id')

    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // 1. Fetch this guest's organization only
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name, aggregate_score, default_seat_target, link_validity_days')
      .eq('id', orgId)
      .maybeSingle() as unknown as { data: OrgRow | null }

    if (!org) {
      return NextResponse.json({
        has_data: false,
        org_score: 0,
        org_name: 'Your Organization',
        default_seat_target: 10,
        link_validity_days: 30,
        teams: [],
        recommendations: [],
        total_responses: 0,
        teams_assessed: 0,
        total_teams: 0,
      })
    }

    // 2. Fetch teams for this org only
    const { data: teams } = await supabase
      .from('teams')
      .select('id, name, aggregate_score, target_seats, organization_id')
      .eq('organization_id', orgId)
      .order('name') as unknown as { data: TeamRow[] | null }

    if (!teams || teams.length === 0) {
      return NextResponse.json({
        has_data: false,
        org_score: org.aggregate_score,
        org_name: org.name,
        default_seat_target: org.default_seat_target ?? 10,
        link_validity_days: org.link_validity_days ?? 30,
        teams: [],
        recommendations: [],
        total_responses: 0,
        teams_assessed: 0,
        total_teams: 0,
      })
    }

    const teamIds = teams.map((t) => t.id)

    // 3. Fetch all responses to compute pillar averages
    const { data: responses } = await supabase
      .from('assessment_responses')
      .select('team_id, tool_usage_score, workflow_automation_score, data_literacy_score, output_evaluation_score, leadership_buyin_score, tech_coding_score, tech_ml_concepts_score, tech_infrastructure_score, tech_observability_score, tech_applied_practice_score, tech_deployment_score')
      .in('team_id', teamIds) as unknown as {
        data: (TeamResponseRow & { team_id: string })[] | null
      }

    // 4. Compute pillar averages per team
    const teamPillarMap: Record<string, {
      count: number
      nonTechCount: number
      techCount: number
      tool_usage: number
      workflow_automation: number
      data_literacy: number
      output_evaluation: number
      leadership_buyin: number
      tech_coding: number
      tech_ml_concepts: number
      tech_infrastructure: number
      tech_observability: number
      tech_applied_practice: number
      tech_deployment: number
    }> = {}

    for (const r of (responses ?? [])) {
      if (!teamPillarMap[r.team_id]) {
        teamPillarMap[r.team_id] = {
          count: 0,
          nonTechCount: 0,
          techCount: 0,
          tool_usage: 0,
          workflow_automation: 0,
          data_literacy: 0,
          output_evaluation: 0,
          leadership_buyin: 0,
          tech_coding: 0,
          tech_ml_concepts: 0,
          tech_infrastructure: 0,
          tech_observability: 0,
          tech_applied_practice: 0,
          tech_deployment: 0,
        }
      }
      const tm = teamPillarMap[r.team_id]
      tm.count++
      if (r.tool_usage_score != null) {
        tm.nonTechCount++
        tm.tool_usage += r.tool_usage_score ?? 0
        tm.workflow_automation += r.workflow_automation_score ?? 0
        tm.data_literacy += r.data_literacy_score ?? 0
        tm.output_evaluation += r.output_evaluation_score ?? 0
        tm.leadership_buyin += r.leadership_buyin_score ?? 0
      }
      if (r.tech_coding_score != null) {
        tm.techCount++
        tm.tech_coding += r.tech_coding_score ?? 0
        tm.tech_ml_concepts += r.tech_ml_concepts_score ?? 0
        tm.tech_infrastructure += r.tech_infrastructure_score ?? 0
        tm.tech_observability += r.tech_observability_score ?? 0
        tm.tech_applied_practice += r.tech_applied_practice_score ?? 0
        tm.tech_deployment += r.tech_deployment_score ?? 0
      }
    }

    // 5. Build enriched team data
    const enrichedTeams = teams.map((team) => {
      const tm = teamPillarMap[team.id]
      const n = tm?.count ?? 0
      const nNonTech = tm?.nonTechCount ?? 0
      const nTech = tm?.techCount ?? 0
      // A team is technical if its name is Engineering/Data, OR if it has tech responses
      // (nTech > 0 means at least one response has a non-null tech_coding_score).
      // Note: After the submit-route fix, non-tech roles now store null for tech fields
      // so nTech correctly counts only real tech respondents.
      const isTech = team.name === 'Engineering' || team.name === 'Data' || nTech > 0

      let pillarAverages: Record<string, number>

      if (isTech) {
        const denom = nTech > 0 ? nTech : 1
        pillarAverages = nTech > 0
          ? {
              coding: Math.round((tm.tech_coding / denom / 6) * 100),
              ml_concepts: Math.round((tm.tech_ml_concepts / denom / 6) * 100),
              infrastructure: Math.round((tm.tech_infrastructure / denom / 6) * 100),
              observability: Math.round((tm.tech_observability / denom / 6) * 100),
              applied_practice: Math.round((tm.tech_applied_practice / denom / 6) * 100),
            }
          : {
              coding: 0,
              ml_concepts: 0,
              infrastructure: 0,
              observability: 0,
              applied_practice: 0,
            }
      } else {
        const denom = nNonTech > 0 ? nNonTech : 1
        pillarAverages = nNonTech > 0
          ? {
              tool_usage: Math.round((tm.tool_usage / denom / 4) * 100),
              workflow_automation: Math.round((tm.workflow_automation / denom / 4) * 100),
              data_literacy: Math.round((tm.data_literacy / denom / 4) * 100),
              output_evaluation: Math.round((tm.output_evaluation / denom / 4) * 100),
              leadership_buyin: Math.round((tm.leadership_buyin / denom / 4) * 100),
            }
          : {
              tool_usage: 0,
              workflow_automation: 0,
              data_literacy: 0,
              output_evaluation: 0,
              leadership_buyin: 0,
            }
      }

      return {
        id: team.id,
        name: team.name,
        aggregate_score: team.aggregate_score,
        target_seats: team.target_seats,
        response_count: n,
        is_tech: isTech,
        pillar_averages: pillarAverages,
      }
    })

    // 6. Compute org-level pillar averages (mean of team pillar averages across ALL orgs)
    const teamsWithData = enrichedTeams.filter((t) => t.response_count > 0)
    const nonTechTeams = teamsWithData.filter((t) => !t.is_tech)
    
    const orgPillarAverages: TeamPillarAverages = nonTechTeams.length > 0
      ? {
          tool_usage: Math.round(nonTechTeams.reduce((s, t) => s + (t.pillar_averages.tool_usage || 0), 0) / nonTechTeams.length),
          workflow_automation: Math.round(nonTechTeams.reduce((s, t) => s + (t.pillar_averages.workflow_automation || 0), 0) / nonTechTeams.length),
          data_literacy: Math.round(nonTechTeams.reduce((s, t) => s + (t.pillar_averages.data_literacy || 0), 0) / nonTechTeams.length),
          output_evaluation: Math.round(nonTechTeams.reduce((s, t) => s + (t.pillar_averages.output_evaluation || 0), 0) / nonTechTeams.length),
          leadership_buyin: Math.round(nonTechTeams.reduce((s, t) => s + (t.pillar_averages.leadership_buyin || 0), 0) / nonTechTeams.length),
        }
      : { tool_usage: 100, workflow_automation: 100, data_literacy: 100, output_evaluation: 100, leadership_buyin: 100 }

    // 7. Use this org's aggregate_score
    const overallOrgScore = Number(org.aggregate_score)

    // 8. Get recommendations from DB rules
    const { data: rules } = await supabase
      .from('recommendation_rules')
      .select('id, pillar, threshold_max, title, description, action_label, action_url') as unknown as {
        data: RecommendationRule[] | null
      }

    let recommendations = nonTechTeams.length > 0 
      ? getRecommendations(orgPillarAverages, rules ?? [])
      : []

    // 9. Add technical recommendation if applicable.
    // Uses the 6-pillar raw sum (0–30) accumulated in teamPillarMap for accuracy.
    const techTeams = teamsWithData.filter((t) => t.is_tech)
    if (techTeams.length > 0) {
      let totalTechScore30 = 0
      let totalTechRespondents = 0
      for (const team of techTeams) {
        const tm = teamPillarMap[team.id]
        if (tm && tm.techCount > 0) {
          // Full 6-pillar sum (each pillar scored 0–5 per question, summed across respondents)
          const teamRawTotal = tm.tech_coding + tm.tech_ml_concepts + tm.tech_infrastructure +
            tm.tech_observability + tm.tech_applied_practice + tm.tech_deployment
          totalTechScore30 += teamRawTotal
          totalTechRespondents += tm.techCount
        }
      }
      // avgTechScore30: average raw score per respondent across all tech teams (scale 0-30)
      const avgTechScore30 = totalTechRespondents > 0 ? totalTechScore30 / totalTechRespondents : 0
      const avgTechScorePct = Math.round((avgTechScore30 / 30) * 100)

      if (avgTechScorePct < 70) {
        const { getTechnicalRecommendation } = await import('@/lib/scoringEngine')
        // getTechnicalRecommendation(score): score <= 10 → Beginner, 11-20 → Intermediate, > 20 → Applied
        const techRec = getTechnicalRecommendation(avgTechScore30)
        techRec.pillarScore = avgTechScorePct
        recommendations.push(techRec)
      }
    }

    // Sort all recommendations so the lowest score appears first
    recommendations.sort((a, b) => a.pillarScore - b.pillarScore)

    const totalResponses = enrichedTeams.reduce((s, t) => s + t.response_count, 0)
    const teamsAssessed = enrichedTeams.filter((t) => t.response_count > 0).length

    return NextResponse.json({
      has_data: totalResponses > 0,
      org_score: Math.round(overallOrgScore * 100) / 100,
      org_name: org.name,
      default_seat_target: org.default_seat_target ?? 10,
      link_validity_days: org.link_validity_days ?? 30,
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
