import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAuthOrgId } from '@/lib/apiUtils'

export interface McpIntegrationItem {
  id: string
  organization_id: string
  provider: 'slack' | 'jira' | 'github' | string
  status: 'connected' | 'disconnected' | 'syncing' | 'error'
  config: {
    endpoint_url?: string
    api_token?: string
    bot_id?: string
    workspace_domain?: string
    [key: string]: unknown
  }
  last_synced_at: string | null
  created_at: string
}

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthOrgId(request)
    if ('errorResponse' in auth) {
      return auth.errorResponse
    }
    const { orgId } = auth

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('mcp_integrations')
      .select('*')
      .eq('organization_id', orgId)
      .order('provider') as unknown as { data: McpIntegrationItem[] | null; error: unknown }

    if (error) {
      console.error('Fetch MCP integrations error:', error)
      return NextResponse.json({ error: 'Failed to fetch MCP integrations' }, { status: 500 })
    }

    return NextResponse.json({ integrations: data ?? [] })
  } catch (err) {
    console.error('GET /api/mcp/integrations error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthOrgId(request)
    if ('errorResponse' in auth) {
      return auth.errorResponse
    }
    const { orgId } = auth

    const body = await request.json()
    const { provider, status, config } = body as {
      provider: string
      status?: 'connected' | 'disconnected' | 'syncing' | 'error'
      config?: Record<string, unknown>
    }

    if (!provider || !['slack', 'jira', 'github'].includes(provider.toLowerCase())) {
      return NextResponse.json({ error: 'Invalid provider specified' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const hasConfigData = Boolean(
      config &&
      ((typeof config.endpoint_url === 'string' && config.endpoint_url.trim().length > 0) ||
       (typeof config.api_token === 'string' && config.api_token.trim().length > 0))
    )
    const computedStatus = hasConfigData ? (status || 'connected') : 'disconnected'

    // Upsert integration config
    const { data, error } = await (supabase
      .from('mcp_integrations') as unknown as {
        upsert: (payload: unknown, options: unknown) => {
          select: () => {
            single: () => Promise<{ data: McpIntegrationItem | null; error: unknown }>
          }
        }
      })
      .upsert(
        {
          organization_id: orgId,
          provider: provider.toLowerCase(),
          status: computedStatus,
          config: config || {},
        },
        { onConflict: 'organization_id,provider' }
      )
      .select()
      .single()

    if (error) {
      console.error('Save MCP integration error:', error)
      return NextResponse.json({ error: 'Failed to save MCP integration' }, { status: 500 })
    }

    return NextResponse.json({ success: true, integration: data })
  } catch (err) {
    console.error('POST /api/mcp/integrations error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
