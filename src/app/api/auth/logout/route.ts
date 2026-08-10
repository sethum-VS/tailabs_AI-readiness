import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const orgId = request.cookies.get('tai_guest_id')?.value

    const DEMO_ORG_ID = '00000000-0000-4000-a000-000000000000'

    if (orgId && orgId !== DEMO_ORG_ID) {
      const supabase = createAdminClient()

      // Check if org is demo by guest_id as an extra safety check
      const { data: org } = await supabase
        .from('organizations')
        .select('guest_id')
        .eq('id', orgId)
        .maybeSingle() as unknown as { data: { guest_id: string | null } | null }

      if (!org || org.guest_id !== 'demo') {
        // Delete guest org — cascades all teams, invites, and responses
        await supabase
          .from('organizations')
          .delete()
          .eq('id', orgId)
      }
    }

    // Clear the session cookie
    const response = NextResponse.json({ success: true })
    response.cookies.set('tai_guest_id', '', {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 0, // expire immediately
    })

    return response
  } catch (err) {
    console.error('Logout error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
