import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const orgId = request.cookies.get('tai_guest_id')?.value

    if (orgId) {
      const supabase = createAdminClient()

      // Delete org — cascades all teams, invites, and responses
      await supabase
        .from('organizations')
        .delete()
        .eq('id', orgId)
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
