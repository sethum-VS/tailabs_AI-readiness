import { NextRequest, NextResponse } from 'next/server'

/**
 * Extracts and validates the organization ID injected by middleware from the tai_guest_id cookie.
 * Returns either the string orgId or a NextResponse error if unauthorized.
 */
export function getAuthOrgId(request: NextRequest): { orgId: string } | { errorResponse: NextResponse } {
  const orgId = request.headers.get('x-tai-org-id')

  if (!orgId) {
    return {
      errorResponse: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  return { orgId }
}
