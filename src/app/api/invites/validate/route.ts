import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

interface InviteWithRelations {
  id: string
  token: string
  title: string
  status: 'active' | 'completed' | 'expired'
  expires_at: string
  team_id: string
  teams: {
    id: string
    name: string
    organization_id: string
    organizations: {
      id: string
      name: string
    } | null
  } | null
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ valid: false, error: 'Token is required' }, { status: 400 })
  }

  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('assessment_invites')
      .select(`
        id,
        token,
        title,
        status,
        expires_at,
        team_id,
        teams (
          id,
          name,
          organization_id,
          organizations (
            id,
            name
          )
        )
      `)
      .eq('token', token)
      .maybeSingle()

    if (error || !data) {
      return NextResponse.json({ valid: false, error: 'Invalid token' }, { status: 404 })
    }

    const invite = data as unknown as InviteWithRelations

    // Check expiry
    if (new Date(invite.expires_at) < new Date()) {
      await supabase
        .from('assessment_invites')
        .update({ status: 'expired' } as never)
        .eq('id', invite.id)

      return NextResponse.json({ valid: false, error: 'Token has expired' }, { status: 410 })
    }

    if (invite.status === 'expired') {
      return NextResponse.json({ valid: false, error: 'Token has expired' }, { status: 410 })
    }

    return NextResponse.json({
      valid: true,
      invite_id: invite.id,
      team_id: invite.team_id,
      team_name: invite.teams?.name ?? 'Unknown Team',
      organization_name: invite.teams?.organizations?.name ?? 'Unknown Organization',
      status: invite.status,
      title: invite.title,
    })
  } catch (err) {
    console.error('Validate invite error:', err)
    return NextResponse.json({ valid: false, error: 'Internal server error' }, { status: 500 })
  }
}
