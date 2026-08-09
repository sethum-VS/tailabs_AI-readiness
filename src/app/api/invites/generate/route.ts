import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { nanoid } from 'nanoid'

export async function POST(request: NextRequest) {
  try {
    // Org ID is injected by middleware from the tai_guest_id cookie
    const orgId = request.headers.get('x-tai-org-id')

    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { team_name, target_seats = 10 } = body as {
      team_name: string
      target_seats?: number
    }

    if (!team_name) {
      return NextResponse.json(
        { error: 'team_name is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Verify the org exists
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', orgId)
      .maybeSingle() as unknown as { data: { id: string } | null }

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

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
    } else {
      const { data: newTeam, error: teamError } = await supabase
        .from('teams')
        .insert({ organization_id: orgId, name: team_name, target_seats } as never)
        .select('id')
        .single() as unknown as { data: { id: string } | null; error: unknown }

      if (teamError || !newTeam) {
        return NextResponse.json({ error: 'Failed to create team' }, { status: 500 })
      }
      teamId = newTeam.id
    }

    // Generate invite
    const token = nanoid(64)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const { data: invite, error: inviteError } = await supabase
      .from('assessment_invites')
      .insert({ team_id: teamId, token, title: 'AI Readiness Assessment', status: 'pending' } as never)
      .select('id, token')
      .single() as unknown as { data: { id: string; token: string } | null; error: unknown }

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      invite_id: invite.id,
      token: invite.token,
      url: `${appUrl}/eval/invite?token=${invite.token}`,
    })
  } catch (err) {
    console.error('Generate invite error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
