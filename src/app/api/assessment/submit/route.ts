import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { calculateIndividualScore } from '@/lib/scoringEngine'

interface SubmitPayload {
  token: string
  invite_id: string
  team_id: string
  respondent_name: string
  respondent_role: string
  tool_usage_score: number
  workflow_automation_score: number
  data_literacy_score: number
  output_evaluation_score: number
  leadership_buyin_score: number
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
      tool_usage_score,
      workflow_automation_score,
      data_literacy_score,
      output_evaluation_score,
      leadership_buyin_score,
    } = body

    // Validate required fields
    if (!token || !team_id || !respondent_name || !respondent_role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate Likert scores 1–4
    const scores = [
      tool_usage_score,
      workflow_automation_score,
      data_literacy_score,
      output_evaluation_score,
      leadership_buyin_score,
    ]

    for (const score of scores) {
      if (!Number.isInteger(score) || score < 1 || score > 4) {
        return NextResponse.json(
          { error: 'All pillar scores must be integers between 1 and 4' },
          { status: 400 }
        )
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

    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Token has expired' }, { status: 410 })
    }

    if (invite.team_id !== team_id) {
      return NextResponse.json({ error: 'Token team mismatch' }, { status: 403 })
    }

    // Calculate individual score: (sum / 20) * 100
    const individual_score = calculateIndividualScore({
      tool_usage_score,
      workflow_automation_score,
      data_literacy_score,
      output_evaluation_score,
      leadership_buyin_score,
    })

    // Insert response — triggers recalculate_readiness_scores() automatically
    const { data: response, error: insertError } = await supabase
      .from('assessment_responses')
      .insert({
        team_id,
        invite_id: invite_id || null,
        respondent_name,
        respondent_role,
        tool_usage_score,
        workflow_automation_score,
        data_literacy_score,
        output_evaluation_score,
        leadership_buyin_score,
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
