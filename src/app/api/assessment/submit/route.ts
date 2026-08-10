import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { calculateIndividualScore } from '@/lib/scoringEngine'

interface SubmitPayload {
  token: string
  invite_id: string
  team_id: string
  respondent_name: string
  respondent_role: string
  respondent_department: string
  tool_usage_score?: number
  workflow_automation_score?: number
  data_literacy_score?: number
  output_evaluation_score?: number
  leadership_buyin_score?: number
  tech_coding_score?: number
  tech_ml_concepts_score?: number
  tech_infrastructure_score?: number
  tech_observability_score?: number
  tech_applied_practice_score?: number
  tech_deployment_score?: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SubmitPayload

    const {
      token,
      invite_id,
      team_id,
      respondent_name,
      respondent_role,
      respondent_department,
      tool_usage_score,
      workflow_automation_score,
      data_literacy_score,
      output_evaluation_score,
      leadership_buyin_score,
      tech_coding_score,
      tech_ml_concepts_score,
      tech_infrastructure_score,
      tech_observability_score,
      tech_applied_practice_score,
      tech_deployment_score,
    } = body

    // Validate required fields
    if (!token || !team_id || !respondent_name || !respondent_role || !respondent_department) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const isTechRole = respondent_department === 'Engineering' || respondent_department === 'Data'

    if (!isTechRole) {
      // Validate Likert scores 1–4
      const scores = [
        tool_usage_score,
        workflow_automation_score,
        data_literacy_score,
        output_evaluation_score,
        leadership_buyin_score,
      ]

      for (const score of scores) {
        if (!Number.isInteger(score) || score! < 1 || score! > 4) {
          return NextResponse.json(
            { error: 'All pillar scores must be integers between 1 and 4' },
            { status: 400 }
          )
        }
      }
    }

    const supabase = createAdminClient()

    // Validate token is still active
    const { data: invite } = await supabase
      .from('assessment_invites')
      .select('id, status, expires_at, team_id')
      .eq('token', token)
      .maybeSingle() as unknown as {
        data: {
          id: string
          status: string
          expires_at: string
          team_id: string
        } | null
        error: unknown
      }

    if (!invite) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
    }

    if (new Date(invite.expires_at) < new Date() || invite.status === 'expired' || invite.status === 'completed') {
      return NextResponse.json({ error: 'This assessment link has expired.' }, { status: 410 })
    }

    if (invite.team_id !== team_id) {
      return NextResponse.json({ error: 'Token team mismatch' }, { status: 403 })
    }

    // Check seat limit — reject if team already has enough responses
    const { data: teamData } = await supabase
      .from('teams')
      .select('target_seats')
      .eq('id', team_id)
      .single() as unknown as { data: { target_seats: number } | null; error: unknown }

    if (teamData) {
      const { count: existingCount } = await supabase
        .from('assessment_responses')
        .select('id', { count: 'exact', head: true })
        .eq('team_id', team_id)

      if (existingCount !== null && existingCount >= teamData.target_seats) {
        if (invite_id) {
          await supabase
            .from('assessment_invites')
            .update({ status: 'completed' } as never)
            .eq('id', invite_id)
        }
        return NextResponse.json(
          { error: `This assessment link has reached its maximum limit of ${teamData.target_seats} response(s) and is now complete.` },
          { status: 410 }
        )
      }
    }
    // Calculate individual score: (sum / 20) * 100 for non-tech, or out of 30 for tech
    let individual_score = 0
    let tech_total_score = null

    if (isTechRole) {
      tech_total_score = (tech_coding_score || 0) +
        (tech_ml_concepts_score || 0) +
        (tech_infrastructure_score || 0) +
        (tech_observability_score || 0) +
        (tech_applied_practice_score || 0) +
        (tech_deployment_score || 0)
      
      individual_score = Math.round((tech_total_score / 30) * 100 * 100) / 100
    } else {
      individual_score = calculateIndividualScore({
        tool_usage_score: tool_usage_score!,
        workflow_automation_score: workflow_automation_score!,
        data_literacy_score: data_literacy_score!,
        output_evaluation_score: output_evaluation_score!,
        leadership_buyin_score: leadership_buyin_score!,
      })
    }

    // Insert response — triggers recalculate_readiness_scores() automatically
    const { data: response, error: insertError } = await supabase
      .from('assessment_responses')
      .insert({
        team_id,
        invite_id: invite_id || null,
        respondent_name,
        respondent_role,
        respondent_department,
        tool_usage_score: tool_usage_score ?? null,
        workflow_automation_score: workflow_automation_score ?? null,
        data_literacy_score: data_literacy_score ?? null,
        output_evaluation_score: output_evaluation_score ?? null,
        leadership_buyin_score: leadership_buyin_score ?? null,
        tech_coding_score: tech_coding_score ?? null,
        tech_ml_concepts_score: tech_ml_concepts_score ?? null,
        tech_infrastructure_score: tech_infrastructure_score ?? null,
        tech_observability_score: tech_observability_score ?? null,
        tech_applied_practice_score: tech_applied_practice_score ?? null,
        tech_deployment_score: tech_deployment_score ?? null,
        tech_total_score: tech_total_score ?? null,
        individual_score,
      } as never)
      .select('id, individual_score')
      .single() as unknown as {
        data: { id: string; individual_score: number } | null
        error: unknown
      }

    if (insertError || !response) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save response' }, { status: 500 })
    }

    // Update invite status based on total responses for the team / invite
    const { count: responseCount } = await supabase
      .from('assessment_responses')
      .select('id', { count: 'exact', head: true })
      .eq('team_id', team_id)

    const totalCount = responseCount ?? 1
    const targetSeats = teamData?.target_seats ?? 10
    const newStatus = totalCount >= targetSeats ? 'completed' : 'active'

    if (invite_id) {
      await supabase
        .from('assessment_invites')
        .update({ status: newStatus } as never)
        .eq('id', invite_id)
    } else {
      await supabase
        .from('assessment_invites')
        .update({ status: newStatus } as never)
        .eq('team_id', team_id)
    }

    return NextResponse.json({
      success: true,
      response_id: response.id,
      individual_score: response.individual_score,
      message: 'Assessment submitted successfully. Team scores have been updated.',
    })
  } catch (err) {
    console.error('Submit assessment error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
