import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

interface InviteWithRelations {
  id: string
  token: string
  title: string
  status: 'active' | 'completed' | 'expired'
  created_at: string
  expires_at: string
  team_id: string
  teams: {
    id: string
    name: string
    target_seats: number
    aggregate_score: number
    organization_id: string
    organizations: {
      id: string
      name: string
      aggregate_score: number
    } | null
  } | null
}

interface ResponseRow {
  invite_id: string | null
}

export async function GET() {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('assessment_invites')
      .select(`
        id,
        token,
        title,
        status,
        created_at,
        expires_at,
        team_id,
        teams (
          id,
          name,
          target_seats,
          aggregate_score,
          organization_id,
          organizations (
            id,
            name,
            aggregate_score
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 })
    }

    const invites = (data ?? []) as unknown as InviteWithRelations[]
    const inviteIds = invites.map((i) => i.id)

    let responseCounts: Record<string, number> = {}

    if (inviteIds.length > 0) {
      const { data: responses } = await supabase
        .from('assessment_responses')
        .select('invite_id')
        .in('invite_id', inviteIds)

      if (responses) {
        const typedResponses = responses as ResponseRow[]
        responseCounts = typedResponses.reduce<Record<string, number>>((acc, r) => {
          if (r.invite_id) {
            acc[r.invite_id] = (acc[r.invite_id] ?? 0) + 1
          }
          return acc
        }, {})
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const enriched = invites.map((invite) => {
      const team = invite.teams
      const org = team?.organizations
      const responseCount = responseCounts[invite.id] ?? 0
      const targetSeats = team?.target_seats ?? 10

      return {
        id: invite.id,
        token: invite.token,
        masked_token: `${invite.token.slice(0, 8)}...${invite.token.slice(-6)}`,
        invite_url: `${appUrl}/eval/invite?token=${invite.token}`,
        title: invite.title,
        status: invite.status,
        created_at: invite.created_at,
        expires_at: invite.expires_at,
        team_id: invite.team_id,
        team_name: team?.name ?? 'Unknown',
        target_seats: targetSeats,
        response_count: responseCount,
        organization_name: org?.name ?? 'Unknown',
        organization_id: org?.id,
        team_score: team?.aggregate_score ?? 0,
      }
    })

    return NextResponse.json({ invites: enriched })
  } catch (err) {
    console.error('List invites error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
