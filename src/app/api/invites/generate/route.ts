import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { nanoid } from 'nanoid'
import { getAuthOrgId, getAppBaseUrl, normalizeInviteUrl } from '@/lib/apiUtils'

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthOrgId(request)
    if ('errorResponse' in auth) {
      return auth.errorResponse
    }
    const { orgId } = auth

    const body = await request.json()
    const { team_name, target_seats = 10, selected_scenario_id } = body as {
      team_name: string
      target_seats?: number
      selected_scenario_id?: string
    }

    if (!team_name) {
      return NextResponse.json(
        { error: 'team_name is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Verify the org exists & fetch settings
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name, default_seat_target, link_validity_days')
      .eq('id', orgId)
      .maybeSingle() as unknown as {
        data: { id: string; name: string; default_seat_target?: number | null; link_validity_days?: number | null } | null
      }

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const effectiveTargetSeats = target_seats || org.default_seat_target || 10
    const validityDays = org.link_validity_days || 30
    const expiresAt = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000).toISOString()

    // Find or create team within this guest's org only
    let teamId: string

    const { data: existingTeam } = await supabase
      .from('teams')
      .select('id')
      .eq('organization_id', orgId)
      .eq('name', team_name)
      .maybeSingle() as { data: { id: string } | null; error: unknown }

    if (existingTeam) {
      teamId = existingTeam.id
      // Update team target seats if it changed
      await supabase
        .from('teams')
        .update({ target_seats: effectiveTargetSeats } as never)
        .eq('id', teamId)
    } else {
      const { data: newTeam, error: teamError } = await supabase
        .from('teams')
        .insert({ organization_id: orgId, name: team_name, target_seats: effectiveTargetSeats } as never)
        .select('id')
        .single() as unknown as { data: { id: string } | null; error: unknown }

      if (teamError || !newTeam) {
        return NextResponse.json({ error: 'Failed to create team' }, { status: 500 })
      }
      teamId = newTeam.id
    }

    // Generate invite
    const token = nanoid(64)
    const appUrl = getAppBaseUrl(request)

    const scenarioQueryParam = selected_scenario_id && selected_scenario_id !== 'all'
      ? `&scenario=${encodeURIComponent(selected_scenario_id)}`
      : ''

    let { data: invite, error: inviteError } = await supabase
      .from('assessment_invites')
      .insert({
        team_id: teamId,
        token,
        title: `${org.name || 'AI Readiness'} Assessment`,
        status: 'pending',
        selected_scenario_id: selected_scenario_id || 'all',
        expires_at: expiresAt,
      } as never)
      .select('id, token')
      .single() as unknown as { data: { id: string; token: string } | null; error: unknown }

    if (inviteError) {
      console.error('Invite insert with selected_scenario_id error:', inviteError)
      // Fallback insert without selected_scenario_id if column fails
      const fallbackResult = await supabase
        .from('assessment_invites')
        .insert({
          team_id: teamId,
          token,
          title: `${org.name || 'AI Readiness'} Assessment`,
          status: 'pending',
          expires_at: expiresAt,
        } as never)
        .select('id, token')
        .single() as unknown as { data: { id: string; token: string } | null; error: unknown }

      invite = fallbackResult.data
      inviteError = fallbackResult.error
      if (inviteError) {
        console.error('Fallback invite insert error:', inviteError)
      }
    }

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
    }

    const generatedInviteUrl = normalizeInviteUrl(`${appUrl}/eval/invite?token=${invite.token}${scenarioQueryParam}`)

    return NextResponse.json({
      success: true,
      invite_id: invite.id,
      token: invite.token,
      url: generatedInviteUrl,
    })
  } catch (err) {
    console.error('Generate invite error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
