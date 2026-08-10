import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAuthOrgId, getAppBaseUrl, normalizeInviteUrl } from '@/lib/apiUtils'

interface InviteWithRelations {
  id: string
  token: string
  title: string
  status: 'pending' | 'active' | 'completed' | 'expired'
  selected_scenario_id?: string | null
  created_at: string
  expires_at: string
  team_id: string
  teams: {
    id: string
    name: string
    target_seats: number | null
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

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthOrgId(request)
    if ('errorResponse' in auth) {
      return auth.errorResponse
    }
    const { orgId } = auth

    const supabase = createAdminClient()

    // 1. Fetch team IDs for this org to filter in SQL
    const { data: orgTeams, error: teamsError } = await supabase
      .from('teams')
      .select('id')
      .eq('organization_id', orgId) as { data: Array<{ id: string }> | null; error: unknown }

    if (teamsError) {
      console.error('Fetch teams for invites list error:', teamsError)
      return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 })
    }

    if (!orgTeams || orgTeams.length === 0) {
      return NextResponse.json({ invites: [] })
    }

    const teamIds = orgTeams.map((t) => t.id)

    // 2. Fetch invites belonging strictly to this org's teams
    let { data, error } = await supabase
      .from('assessment_invites')
      .select(`
        id,
        token,
        title,
        status,
        selected_scenario_id,
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
      .in('team_id', teamIds)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch invites error with selected_scenario_id:', error)
      // Fallback query without selected_scenario_id
      const fallbackResult = await supabase
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
        .in('team_id', teamIds)
        .order('created_at', { ascending: false })

      data = fallbackResult.data
      error = fallbackResult.error
      if (error) {
        console.error('Fallback fetch invites error:', error)
      }
    }

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

    const appUrl = getAppBaseUrl(request)
    const statusUpdatePromises: Array<Promise<unknown>> = []

    const enriched = invites.map((invite) => {
      const team = invite.teams
      const org = team?.organizations
      const responseCount = responseCounts[invite.id] ?? 0
      const targetSeats = team?.target_seats ?? 10

      let computedStatus: 'pending' | 'active' | 'completed' | 'expired' = invite.status

      if (responseCount >= targetSeats) {
        computedStatus = 'completed'
      } else if (new Date(invite.expires_at) < new Date()) {
        computedStatus = 'expired'
      } else if (responseCount > 0) {
        computedStatus = 'active'
      } else {
        computedStatus = 'pending'
      }

      if (invite.status !== computedStatus) {
        statusUpdatePromises.push(
          Promise.resolve(
            supabase
              .from('assessment_invites')
              .update({ status: computedStatus } as never)
              .eq('id', invite.id)
          ).catch((e) => console.error(`Failed to update status for invite ${invite.id}`, e))
        )
      }

      const scenarioQueryParam = invite.selected_scenario_id && invite.selected_scenario_id !== 'all'
        ? `&scenario=${encodeURIComponent(invite.selected_scenario_id)}`
        : ''

      return {
        id: invite.id,
        token: invite.token,
        masked_token: `${invite.token.slice(0, 8)}...${invite.token.slice(-6)}`,
        invite_url: normalizeInviteUrl(`${appUrl}/eval/invite?token=${invite.token}${scenarioQueryParam}`),
        title: invite.title,
        status: computedStatus,
        created_at: invite.created_at,
        expires_at: invite.expires_at,
        team_id: invite.team_id,
        team_name: team?.name ?? 'Unknown',
        target_seats: targetSeats,
        response_count: responseCount,
        organization_name: org?.name ?? 'Unknown',
        organization_id: org?.id,
        team_score: team?.aggregate_score ?? 0,
        selected_scenario_id: invite.selected_scenario_id || 'all',
      }
    })

    if (statusUpdatePromises.length > 0) {
      await Promise.allSettled(statusUpdatePromises)
    }

    return NextResponse.json({ invites: enriched })
  } catch (err) {
    console.error('List invites error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
