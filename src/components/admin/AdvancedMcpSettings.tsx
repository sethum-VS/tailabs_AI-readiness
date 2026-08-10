'use client'

import { useState, useEffect, useCallback } from 'react'
import { Cpu, RefreshCw, CheckCircle2, AlertCircle, Clock, Link2, Zap, Server, Activity, ShieldAlert, ChevronDown, ChevronUp, MessageSquare, Kanban } from 'lucide-react'
import { toast } from 'sonner'

export interface McpIntegration {
  id: string
  organization_id: string
  provider: string
  status: 'connected' | 'disconnected' | 'syncing' | 'error'
  config: {
    endpoint_url?: string
    api_token?: string
    [key: string]: unknown
  }
  last_synced_at: string | null
  created_at: string
}

export interface TelemetryMetric {
  id: string
  provider: string
  metric_name: string
  observed_value: number
  normalized_score: number
  synced_at: string
}

interface AdvancedMcpSettingsProps {
  onSyncSuccess?: () => void
}

export function AdvancedMcpSettings({ onSyncSuccess }: AdvancedMcpSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [syncingProvider, setSyncingProvider] = useState<string | null>(null)
  const [savingProvider, setSavingProvider] = useState<string | null>(null)
  const [integrations, setIntegrations] = useState<McpIntegration[]>([])
  const [metrics, setMetrics] = useState<TelemetryMetric[]>([])
  const [observedScore, setObservedScore] = useState<number | null>(null)

  // Form states for endpoints
  const [slackUrl, setSlackUrl] = useState('')
  const [slackToken, setSlackToken] = useState('')
  const [jiraUrl, setJiraUrl] = useState('')
  const [jiraToken, setJiraToken] = useState('')

  const fetchMcpData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/mcp/integrations')
      const json = await res.json()
      if (json.integrations) {
        setIntegrations(json.integrations)

        const slack = json.integrations.find((i: McpIntegration) => i.provider === 'slack')
        if (slack?.config) {
          setSlackUrl(slack.config.endpoint_url || '')
          setSlackToken(slack.config.api_token || '')
        }

        const jira = json.integrations.find((i: McpIntegration) => i.provider === 'jira')
        if (jira?.config) {
          setJiraUrl(jira.config.endpoint_url || '')
          setJiraToken(jira.config.api_token || '')
        }
      }
    } catch (err) {
      console.error('Error fetching MCP integrations:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMcpData()
  }, [fetchMcpData])

  async function handleSaveConfig(provider: 'slack' | 'jira') {
    setSavingProvider(provider)
    const endpoint_url = provider === 'slack' ? slackUrl : jiraUrl
    const api_token = provider === 'slack' ? slackToken : jiraToken

    try {
      const res = await fetch('/api/mcp/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          status: 'connected',
          config: { endpoint_url, api_token },
        }),
      })

      const json = await res.json()
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Failed to update connection')
      }

      toast.success(`${provider.toUpperCase()} MCP Configuration Saved`, {
        description: 'Server credentials updated successfully.',
      })
      await fetchMcpData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save configuration')
    } finally {
      setSavingProvider(null)
    }
  }

  async function handleSyncNow(provider: 'slack' | 'jira' | 'all') {
    setSyncingProvider(provider)
    try {
      const res = await fetch('/api/mcp/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      })

      const json = await res.json()
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Failed to sync telemetry')
      }

      toast.success(`MCP Telemetry Sync Completed`, {
        description: `Observed AI Readiness Score: ${json.observed_score}%`,
      })

      if (json.integrations) setIntegrations(json.integrations)
      if (json.metrics) setMetrics(json.metrics)
      if (typeof json.observed_score === 'number') setObservedScore(json.observed_score)

      if (onSyncSuccess) onSyncSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Telemetry sync failed')
    } finally {
      setSyncingProvider(null)
    }
  }

  const slackInt = integrations.find((i) => i.provider === 'slack')
  const jiraInt = integrations.find((i) => i.provider === 'jira')

  const isSlackConnected = slackInt?.status === 'connected' && Boolean(slackUrl.trim() || slackToken.trim())
  const isJiraConnected = jiraInt?.status === 'connected' && Boolean(jiraUrl.trim() || jiraToken.trim())

  const formatMetricName = (name: string) => {
    return name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase())
  }

  return (
    <div
      id="mcp-telemetry-setting"
      className="oxygen-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: isExpanded ? '20px' : '0px',
        padding: '20px 24px',
        border: '1px solid var(--color-border)',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Header */}
      <div className="settings-card-header">
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            textAlign: 'left',
            color: 'inherit',
            flex: 1,
            minWidth: '240px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(255, 115, 0, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Cpu size={20} color="var(--color-brand-accent)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: '700', margin: 0, color: 'var(--color-text-primary)' }}>
                Advanced: MCP Integrations
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '2px 0 0', lineHeight: '1.4' }}>
              Connect enterprise MCP clients to automatically observe real AI tool adoption metrics across Slack AI & Jira.
            </p>
          </div>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }} className="mobile-full-width">
          {isExpanded && (
            <button
              onClick={() => handleSyncNow('all')}
              disabled={syncingProvider !== null || loading}
              className="btn-primary mobile-full-width"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '8px 16px',
                minHeight: '40px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: syncingProvider !== null ? 'not-allowed' : 'pointer',
              }}
            >
              <RefreshCw size={14} className={syncingProvider === 'all' ? 'animate-spin' : ''} />
              {syncingProvider === 'all' ? 'Syncing...' : 'Sync All Telemetry Now'}
            </button>
          )}

          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-label={isExpanded ? 'Collapse section' : 'Expand section'}
            className="mobile-full-width"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 14px',
              minHeight: '40px',
              fontSize: '13px',
              fontWeight: '600',
              color: 'var(--color-text-primary)',
              background: 'var(--color-bg-app)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            {isExpanded ? (
              <>
                <span>Hide</span>
                <ChevronUp size={16} />
              </>
            ) : (
              <>
                <span>Configure Integrations</span>
                <ChevronDown size={16} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Collapsed body container */}
      {isExpanded && (
        <>
          {observedScore !== null && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'rgba(255, 115, 0, 0.06)',
                border: '1px solid rgba(255, 115, 0, 0.2)',
                borderRadius: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Activity size={18} color="var(--color-brand-accent)" />
                <div>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                    Observed AI Readiness Score:
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginLeft: '8px' }}>
                    Derived from real-time tool usage telemetry
                  </span>
                </div>
              </div>
              <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-brand-accent)' }}>
                {observedScore}%
              </span>
            </div>
          )}

      <div style={{ height: '1px', background: 'var(--color-border)', margin: '4px 0' }} />

      {/* Grid of MCP Integration Providers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>

        {/* Slack MCP Integration Card */}
        <div
          style={{
            padding: '18px',
            background: 'var(--color-bg-app)',
            border: '1px solid var(--color-border)',
            borderRadius: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(74, 21, 75, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <MessageSquare size={18} color="#E01E5A" />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                  Slack AI Workflows
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  Bot executions & assistant threads
                </div>
              </div>
            </div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: '600',
                padding: '3px 8px',
                borderRadius: '999px',
                background: isSlackConnected ? 'rgba(76, 175, 80, 0.12)' : 'rgba(255, 152, 0, 0.12)',
                color: isSlackConnected ? '#2e7d32' : '#ed6c02',
              }}
            >
              {isSlackConnected ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
              {isSlackConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                MCP Server Endpoint URL
              </label>
              <input
                type="text"
                value={slackUrl}
                onChange={(e) => setSlackUrl(e.target.value)}
                placeholder="https://mcp.slack.enterprise.internal/v1"
                className="text-input"
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 10px',
                  fontSize: '12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  background: 'var(--color-bg-card)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                Bearer Token / API Key
              </label>
              <input
                type="password"
                value={slackToken}
                onChange={(e) => setSlackToken(e.target.value)}
                placeholder="xoxb-mcp-slack-token"
                className="text-input"
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 10px',
                  fontSize: '12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  background: 'var(--color-bg-card)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>
          </div>

          <div className="settings-row" style={{ marginTop: '4px' }}>
            <button
              onClick={() => handleSaveConfig('slack')}
              disabled={savingProvider === 'slack'}
              className="mobile-full-width"
              style={{
                flex: 1,
                minHeight: '40px',
                padding: '0 12px',
                fontSize: '12px',
                fontWeight: '600',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg-card)',
                color: 'var(--color-text-primary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {savingProvider === 'slack' ? 'Saving...' : 'Save Config'}
            </button>
            <button
              onClick={() => handleSyncNow('slack')}
              disabled={syncingProvider === 'slack'}
              className="mobile-full-width"
              style={{
                flex: 1,
                minHeight: '40px',
                padding: '0 12px',
                fontSize: '12px',
                fontWeight: '600',
                borderRadius: '6px',
                border: 'none',
                background: 'var(--color-brand-accent)',
                color: 'var(--color-text-on-accent)',
                cursor: syncingProvider === 'slack' ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                transition: 'all 0.15s ease',
              }}
            >
              <Zap size={13} />
              {syncingProvider === 'slack' ? 'Syncing...' : 'Sync Slack'}
            </button>
          </div>

          {slackInt?.last_synced_at && (
            <div style={{ fontSize: '11px', color: 'var(--color-text-disabled)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={11} />
              Last synced: {new Date(slackInt.last_synced_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>

        {/* Jira MCP Integration Card */}
        <div
          style={{
            padding: '18px',
            background: 'var(--color-bg-app)',
            border: '1px solid var(--color-border)',
            borderRadius: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(0, 82, 204, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Kanban size={18} color="#0052CC" />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                  Jira AI Automations
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  Ticket AI tags & auto summaries
                </div>
              </div>
            </div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: '600',
                padding: '3px 8px',
                borderRadius: '999px',
                background: isJiraConnected ? 'rgba(76, 175, 80, 0.12)' : 'rgba(255, 152, 0, 0.12)',
                color: isJiraConnected ? '#2e7d32' : '#ed6c02',
              }}
            >
              {isJiraConnected ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
              {isJiraConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                MCP Server Endpoint URL
              </label>
              <input
                type="text"
                value={jiraUrl}
                onChange={(e) => setJiraUrl(e.target.value)}
                placeholder="https://mcp.jira.enterprise.internal/v1"
                className="text-input"
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 10px',
                  fontSize: '12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  background: 'var(--color-bg-card)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                Bearer Token / API Key
              </label>
              <input
                type="password"
                value={jiraToken}
                onChange={(e) => setJiraToken(e.target.value)}
                placeholder="jira-mcp-token-xyz"
                className="text-input"
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 10px',
                  fontSize: '12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  background: 'var(--color-bg-card)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>
          </div>

          <div className="settings-row" style={{ marginTop: '4px' }}>
            <button
              onClick={() => handleSaveConfig('jira')}
              disabled={savingProvider === 'jira'}
              className="mobile-full-width"
              style={{
                flex: 1,
                minHeight: '40px',
                padding: '0 12px',
                fontSize: '12px',
                fontWeight: '600',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg-card)',
                color: 'var(--color-text-primary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {savingProvider === 'jira' ? 'Saving...' : 'Save Config'}
            </button>
            <button
              onClick={() => handleSyncNow('jira')}
              disabled={syncingProvider === 'jira'}
              className="mobile-full-width"
              style={{
                flex: 1,
                minHeight: '40px',
                padding: '0 12px',
                fontSize: '12px',
                fontWeight: '600',
                borderRadius: '6px',
                border: 'none',
                background: 'var(--color-brand-accent)',
                color: 'var(--color-text-on-accent)',
                cursor: syncingProvider === 'jira' ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                transition: 'all 0.15s ease',
              }}
            >
              <Zap size={13} />
              {syncingProvider === 'jira' ? 'Syncing...' : 'Sync Jira'}
            </button>
          </div>

          {jiraInt?.last_synced_at && (
            <div style={{ fontSize: '11px', color: 'var(--color-text-disabled)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={11} />
              Last synced: {new Date(jiraInt.last_synced_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>

      </div>

      {/* Latest Telemetry Snapshots Table */}
      {metrics.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
            Recent Observed Telemetry Snapshots
          </div>
          <div
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              overflow: 'hidden',
              background: 'var(--color-bg-card)',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg-app)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '8px 12px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Provider</th>
                  <th style={{ padding: '8px 12px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Metric</th>
                  <th style={{ padding: '8px 12px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Observed Value</th>
                  <th style={{ padding: '8px 12px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Normalized Score</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((m) => (
                  <tr key={m.id || `${m.provider}-${m.metric_name}`} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '8px 12px', fontWeight: '600', textTransform: 'capitalize' }}>{m.provider}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--color-text-primary)' }}>{formatMetricName(m.metric_name)}</td>
                    <td style={{ padding: '8px 12px', fontVariantNumeric: 'tabular-nums' }}>{m.observed_value}</td>
                    <td style={{ padding: '8px 12px', fontWeight: '700', color: 'var(--color-brand-accent)' }}>{m.normalized_score}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  )
}
