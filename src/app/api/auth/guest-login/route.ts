import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { guestId } = body as { guestId: string }

    if (!guestId || typeof guestId !== 'string' || guestId.length < 8) {
      return NextResponse.json({ error: 'Invalid guest ID' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Check if a guest org already exists for this guest_id
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('guest_id', guestId)
      .maybeSingle() as unknown as { data: { id: string; name: string } | null }

    let orgId: string

    if (existingOrg) {
      orgId = existingOrg.id
    } else {
      // Create a fresh org for this guest
      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({ name: 'My Organization', guest_id: guestId } as never)
        .select('id')
        .single() as unknown as { data: { id: string } | null; error: unknown }

      if (orgError || !newOrg) {
        console.error('Failed to create guest org:', orgError)
        return NextResponse.json({ error: 'Failed to create guest session' }, { status: 500 })
      }

      orgId = newOrg.id

      // Upsert guest_sessions record
      await supabase
        .from('guest_sessions')
        .upsert({ guest_id: guestId, org_id: orgId } as never, { onConflict: 'guest_id' })
    }

    // Update last_seen_at
    await supabase
      .from('guest_sessions')
      .update({ last_seen_at: new Date().toISOString() } as never)
      .eq('guest_id', guestId)

    // Build the response and set the session cookie
    const response = NextResponse.json({ success: true, orgId })

    response.cookies.set('tai_guest_id', orgId, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    })

    return response
  } catch (err) {
    console.error('Guest login error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
