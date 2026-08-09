'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Share2, RefreshCw, BarChart2, LayoutDashboard, Settings, Construction, LogOut } from 'lucide-react'
import { PillarIcon } from '@/components/common/PillarIcon'
import { MacroScorecard } from '@/components/admin/MacroScorecard'
import { TeamDisparityChart } from '@/components/admin/TeamDisparityChart'
import { ActionMatrix } from '@/components/admin/ActionMatrix'
import { DashboardSkeleton } from '@/components/admin/DashboardSkeleton'
import type { Recommendation } from '@/lib/scoringEngine'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeamData {
  id: string
  name: string
  aggregate_score: number
  target_seats: number
  response_count: number
  pillar_averages: {
    tool_usage: number
    workflow_automation: number
    data_literacy: number
    output_evaluation: number
    leadership_buyin: number
  }
}

interface DashboardData {
  has_data: boolean
  org_score: number
  org_name: string
  teams: TeamData[]
  recommendations: Recommendation[]
  total_responses: number
  teams_assessed: number
  total_teams: number
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function AdminEmptyState() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: '48px 32px',
        gap: '24px',
      }}
    >
      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'rgba(255, 115, 0, 0.08)',
          border: '1px solid rgba(255, 115, 0, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <BarChart2 size={36} color="var(--color-brand-accent)" />
      </div>

      <div style={{ maxWidth: '440px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--color-text-primary)', margin: '0 0 12px' }}>
          No Assessment Data Yet
        </h2>
        <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)', margin: '0', lineHeight: '1.6' }}>
          Your dashboard will populate with real-time readiness metrics, team disparity charts, and upskilling recommendations once your teams complete their assessments.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/admin/distribution" style={{ textDecoration: 'none' }}>
          <button
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', padding: '12px 24px' }}
          >
            <Share2 size={16} />
            Generate First Assessment Link
          </button>
        </Link>
      </div>

      {/* Step indicators */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '8px' }}>
        {[
          { step: '1', text: 'Generate team links in Distribution' },
          { step: '2', text: 'Share with team members' },
          { step: '3', text: 'View real-time metrics here' },
        ].map(({ step, text }) => (
          <div
            key={step}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
            }}
          >
            <div
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: 'var(--color-brand-accent)',
                color: 'white',
                fontSize: '11px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {step}
            </div>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Admin Dashboard ─────────────────────────────────────────────────────

export default function AdminDashboard() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'departments' | 'settings'>('overview')
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      router.push('/login')
    }
  }

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/dashboard')
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json)
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'departments', label: 'Departments', icon: BarChart2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const

  if (loading && !data) {
    return <DashboardSkeleton />
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg-app)' }}>

      {/* ─── Top Nav ────────────────────────────────────────────────────────── */}
      <nav
        style={{
          backgroundColor: 'var(--color-bg-card)',
          borderBottom: '1px solid var(--color-border)',
          padding: '0 16px',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          {/* Logo */}
          <Link href="/admin" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
            <Image
              src="/images/logos/tai-horizontal-primary.png"
              alt="TAI Readiness"
              width={142}
              height={40}
              priority
              style={{ height: '28px', width: 'auto', objectFit: 'contain' }}
            />
          </Link>

          {/* Nav links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Link
              href="/admin"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                color: 'var(--color-brand-accent)',
                textDecoration: 'none',
                background: 'rgba(255, 115, 0, 0.08)',
              }}
            >
              <LayoutDashboard size={15} />
              <span className="hide-mobile">Dashboard</span>
            </Link>
            <Link
              href="/admin/distribution"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                color: 'var(--color-text-secondary)',
                textDecoration: 'none',
              }}
              className="nav-link"
            >
              <Share2 size={15} />
              <span className="hide-mobile">Distribution</span>
            </Link>
          </div>

          {/* Refresh */}
          <button
            onClick={fetchDashboard}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '13px',
              color: 'var(--color-text-secondary)',
              background: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              flexShrink: 0,
            }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span className="hide-mobile">Refresh</span>
          </button>
        </div>
      </nav>

      {/* ─── Page Header ─────────────────────────────────────────────────────── */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-card)',
          borderBottom: '1px solid var(--color-border)',
          padding: '0 16px',
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          {/* Tab navigation */}
          <div
            className="no-scrollbar"
            style={{
              display: 'flex',
              gap: '4px',
              marginTop: '0',
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '14px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: activeTab === id ? 'var(--color-brand-accent)' : 'var(--color-text-secondary)',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: `2px solid ${activeTab === id ? 'var(--color-brand-accent)' : 'transparent'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  fontFamily: 'var(--font-family)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Content ─────────────────────────────────────────────────────────── */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 16px' }}>

        {error && (
          <div
            style={{
              padding: '16px 20px',
              background: 'var(--color-danger-bg)',
              border: '1px solid rgba(244,67,54,0.3)',
              borderRadius: '8px',
              color: '#c62828',
              fontSize: '14px',
              marginBottom: '24px',
            }}
          >
            {error} —{' '}
            <button
              onClick={fetchDashboard}
              style={{ textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 'inherit' }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {!loading && data && !data.has_data ? (
              <AdminEmptyState />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Top row: Gauge + Bar chart */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '24px',
                    alignItems: 'start',
                  }}
                >
                  <MacroScorecard
                    score={data?.org_score ?? 0}
                    orgName={data?.org_name ?? 'Your Organization'}
                    totalResponses={data?.total_responses ?? 0}
                    teamsAssessed={data?.teams_assessed ?? 0}
                    totalTeams={data?.total_teams ?? 0}
                    loading={loading}
                  />
                  <TeamDisparityChart
                    teams={(data?.teams ?? []).map((t) => ({
                      name: t.name,
                      score: t.aggregate_score,
                      response_count: t.response_count,
                    }))}
                    loading={loading}
                  />
                </div>

                {/* Action Matrix */}
                <ActionMatrix
                  recommendations={data?.recommendations ?? []}
                  loading={loading}
                />
              </div>
            )}
          </>
        )}

        {/* Departments Tab */}
        {activeTab === 'departments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 8px' }}>Department Breakdown</h2>
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="oxygen-card skeleton-shimmer" style={{ height: '200px' }} />
                ))}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {(data?.teams ?? []).map((team) => {
                  const pillars = [
                    { pillarKey: 'tool_usage', label: 'Tool Usage', score: team.pillar_averages.tool_usage },
                    { pillarKey: 'workflow_automation', label: 'Workflow', score: team.pillar_averages.workflow_automation },
                    { pillarKey: 'data_literacy', label: 'Data Literacy', score: team.pillar_averages.data_literacy },
                    { pillarKey: 'output_evaluation', label: 'Output Eval', score: team.pillar_averages.output_evaluation },
                    { pillarKey: 'leadership_buyin', label: 'Leadership', score: team.pillar_averages.leadership_buyin },
                  ]

                  const scoreColor =
                    team.aggregate_score >= 70 ? '#4CAF50' :
                    team.aggregate_score >= 40 ? '#FF7300' : '#F44336'

                  return (
                    <div key={team.id} className="oxygen-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>{team.name}</h4>
                        <span style={{ fontSize: '20px', fontWeight: '700', color: scoreColor }}>
                          {team.aggregate_score.toFixed(0)}%
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
                        {team.response_count} / {team.target_seats} responses
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {pillars.map(({ pillarKey, label, score }) => (
                          <div key={pillarKey}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'center' }}>
                              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <PillarIcon pillar={pillarKey} size={14} />
                                <span>{label}</span>
                              </span>
                              <span style={{ fontSize: '12px', fontWeight: '500' }}>{score}%</span>
                            </div>
                            <div style={{ height: '4px', background: 'var(--color-border)', borderRadius: '999px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  height: '100%',
                                  width: `${score}%`,
                                  background: score >= 70 ? '#4CAF50' : score >= 40 ? '#FF7300' : '#F44336',
                                  borderRadius: '999px',
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '560px' }}>
            <div className="oxygen-card">
              <h2 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px' }}>Settings</h2>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: '0 0 24px' }}>
                Organization configuration and assessment settings will be available here in a future update.
              </p>
              <div
                style={{
                  padding: '16px',
                  background: 'var(--color-bg-app)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: 'var(--color-text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <Construction size={18} color="var(--color-warning)" style={{ flexShrink: 0 }} />
                <span>Coming soon: Organization name, assessment window, team management, and notification settings.</span>
              </div>
            </div>

            {/* Log Out Card */}
            <div className="oxygen-card" style={{ borderColor: 'rgba(244,67,54,0.2)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 8px', color: 'var(--color-text-primary)' }}>
                Session
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0 0 20px', lineHeight: '1.5' }}>
                This is a demo session. Logging out will permanently delete all data associated with your current session — including teams, invite links, and assessment responses.
              </p>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  background: loggingOut ? 'rgba(244,67,54,0.4)' : 'rgba(244,67,54,0.08)',
                  border: '1px solid rgba(244,67,54,0.3)',
                  borderRadius: '8px',
                  color: '#c62828',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: loggingOut ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <LogOut size={15} />
                {loggingOut ? 'Signing out...' : 'Log Out & Clear Data'}
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
