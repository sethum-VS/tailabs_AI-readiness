import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-tai-org-id')
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const { data: org, error } = await supabase
      .from('organizations')
      .select('id, name, default_seat_target, link_validity_days')
      .eq('id', orgId)
      .maybeSingle() as unknown as {
        data: { id: string; name: string; default_seat_target?: number | null; link_validity_days?: number | null } | null
        error: unknown
      }

    if (error || !org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    return NextResponse.json({
      org_name: org.name || 'My Organization',
      default_seat_target: org.default_seat_target ?? 10,
      link_validity_days: org.link_validity_days ?? 30,
    })
  } catch (err) {
    console.error('Fetch settings error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-tai-org-id')
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { org_name, default_seat_target, link_validity_days } = body as {
      org_name?: string
      default_seat_target?: number
      link_validity_days?: number
    }

    const updatePayload: Record<string, unknown> = {}

    if (typeof org_name === 'string') {
      const trimmed = org_name.trim()
      if (!trimmed) {
        return NextResponse.json({ error: 'Organization name cannot be empty' }, { status: 400 })
      }
      updatePayload.name = trimmed
    }

    if (typeof default_seat_target === 'number' && !isNaN(default_seat_target)) {
      updatePayload.default_seat_target = default_seat_target
    }

    if (typeof link_validity_days === 'number' && !isNaN(link_validity_days)) {
      updatePayload.link_validity_days = link_validity_days
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: 'No settings provided to update' }, { status: 400 })
    }

    updatePayload.updated_at = new Date().toISOString()

    const supabase = createAdminClient()
    const { data: updatedOrg, error } = await supabase
      .from('organizations')
      .update(updatePayload as never)
      .eq('id', orgId)
      .select('id, name, default_seat_target, link_validity_days')
      .single() as unknown as {
        data: { id: string; name: string; default_seat_target?: number | null; link_validity_days?: number | null } | null
        error: unknown
      }

    if (error || !updatedOrg) {
      console.error('Update settings error:', error)
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      settings: {
        org_name: updatedOrg.name,
        default_seat_target: updatedOrg.default_seat_target ?? 10,
        link_validity_days: updatedOrg.link_validity_days ?? 30,
      },
    })
  } catch (err) {
    console.error('Patch settings error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
