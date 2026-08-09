import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { nanoid } from 'nanoid'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organization_name, team_name, target_seats = 10 } = body as {
      organization_name: string
      team_name: string
      target_seats?: number
    }

    if (!organization_name || !team_name) {
      return NextResponse.json(
        { error: 'organization_name and team_name are required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // 1. Find or create organization
    let orgId: string

    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('name', organization_name)
      .maybeSingle() as { data: { id: string } | null; error: unknown }

    if (existingOrg) {
      orgId = existingOrg.id
    } else {
      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({ name: organization_name } as never)
        .select('id')
        .single() as unknown as { data: { id: string } | null; error: unknown }

      if (orgError || !newOrg) {
        return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
      }
      orgId = newOrg.id
    }

    // 2. Find or create team
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

    // 3. Generate invite
    const token = nanoid(64)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const { data: invite, error: inviteError } = await supabase
      .from('assessment_invites')
      .insert({ team_id: teamId, token, title: 'AI Readiness Assessment', status: 'active' } as never)
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
