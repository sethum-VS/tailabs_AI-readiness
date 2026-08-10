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

/**
 * Safely extracts the clean origin base URL (scheme + hostname, e.g. "https://tai-readiness-tool.vercel.app").
 * Ensures no subpaths (like /admin/...) or trailing slashes contaminate the root URL.
 */
export function getAppBaseUrl(request?: NextRequest): string {
  // 1. Check process.env.NEXT_PUBLIC_APP_URL
  const rawEnvUrl = process.env.NEXT_PUBLIC_APP_URL
  if (rawEnvUrl) {
    try {
      const parsed = new URL(rawEnvUrl.startsWith('http') ? rawEnvUrl : `https://${rawEnvUrl}`)
      return parsed.origin
    } catch {
      // Ignore parse error and fall back
    }
  }

  // 2. Check process.env.VERCEL_URL (automatically provided by Vercel deployments)
  if (process.env.VERCEL_URL) {
    const vercelHost = process.env.VERCEL_URL.replace(/^https?:\/\//, '')
    return `https://${vercelHost}`
  }

  // 3. Fallback to Request headers (x-forwarded-proto, x-forwarded-host, host)
  if (request) {
    const hostHeader = request.headers.get('x-forwarded-host') || request.headers.get('host')
    const protoHeader = request.headers.get('x-forwarded-proto') || 'https'
    if (hostHeader) {
      const hostOnly = hostHeader.split('/')[0]
      return `${protoHeader}://${hostOnly}`
    }
  }

  // 4. Default fallback for local dev environment
  return 'http://localhost:3000'
}

/**
 * Normalizes any magic/invite URL so it always points directly to the public candidate route `/eval/invite?token=...`
 * and strips out any erroneous subpath prefixes like `/admin/...`.
 */
export function normalizeInviteUrl(rawUrl: string, baseOrigin?: string): string {
  if (!rawUrl) return ''
  try {
    const urlObj = new URL(rawUrl, baseOrigin || 'http://localhost:3000')
    const search = urlObj.search
    const origin = baseOrigin || urlObj.origin
    return `${origin}/eval/invite${search}`
  } catch {
    if (rawUrl.includes('/eval/invite')) {
      const idx = rawUrl.indexOf('/eval/invite')
      const pathAndQuery = rawUrl.substring(idx)
      return baseOrigin ? `${baseOrigin}${pathAndQuery}` : pathAndQuery
    }
    return rawUrl
  }
}

