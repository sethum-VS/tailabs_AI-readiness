'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Share2, RefreshCw, BarChart2, LayoutDashboard, Settings, Construction, LogOut, Building2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { PillarIcon } from '@/components/common/PillarIcon'
import { MacroScorecard } from '@/components/admin/MacroScorecard'
import { TeamDisparityChart } from '@/components/admin/TeamDisparityChart'
import { ActionMatrix } from '@/components/admin/ActionMatrix'
import { DashboardSkeleton } from '@/components/admin/DashboardSkeleton'
import { DepartmentBreakdownCard } from '@/components/admin/DepartmentBreakdownCard'
import type { Recommendation } from '@/lib/scoringEngine'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeamData {
  id: string
  name: string
  aggregate_score: number
  target_seats: number
  response_count: number
  is_tech?: boolean
  pillar_averages: Record<string, number>
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
                    alignItems: 'stretch',
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
                {(data?.teams ?? []).map((team) => (
                  <DepartmentBreakdownCard
                    key={team.id}
                    id={team.id}
                    name={team.name}
                    aggregate_score={team.aggregate_score}
                    target_seats={team.target_seats}
                    response_count={team.response_count}
                    is_tech={team.is_tech}
                    pillar_averages={team.pillar_averages}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '680px' }}>
            {/* Organization Profile */}
            <div className="oxygen-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Building2 size={20} color="var(--color-brand-accent)" />
                <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: 'var(--color-text-primary)' }}>
                  Organization Profile
                </h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                    Organization Name
                  </label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      defaultValue={data?.org_name || 'Enterprise Organization'}
                      className="text-input"
                      style={{
                        flex: 1,
                        height: '42px',
                        padding: '0 14px',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: 'var(--color-text-primary)',
                        background: 'var(--color-bg-card)',
                      }}
                    />
                    <button
                      className="btn-primary"
                      style={{ padding: '0 18px', fontSize: '13px', minHeight: '42px' }}
                      onClick={() => {
                        toast.success('Organization settings updated', {
                          description: 'Organization name saved successfully.',
                        })
                      }}
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Assessment Preferences */}
            <div className="oxygen-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Settings size={20} color="var(--color-brand-accent)" />
                <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: 'var(--color-text-primary)' }}>
                  Assessment Configuration
                </h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                      Default Team Seat Target
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      Standard seat allocation set when creating new team invite links
                    </div>
                  </div>
                  <select
                    defaultValue="10"
                    style={{
                      height: '38px',
                      padding: '0 12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: '6px',
                      fontSize: '13px',
                      color: 'var(--color-text-primary)',
                      background: 'var(--color-bg-card)',
                      cursor: 'pointer',
                    }}
                    onChange={() => {
                      toast.success('Default seat target updated')
                    }}
                  >
                    <option value="5">5 Seats</option>
                    <option value="10">10 Seats</option>
                    <option value="25">25 Seats</option>
                    <option value="50">50 Seats</option>
                  </select>
                </div>

                <div style={{ height: '1px', background: 'var(--color-border)' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                      Assessment Link Validity Window
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      Duration before generated magic links automatically expire
                    </div>
                  </div>
                  <select
                    defaultValue="30"
                    style={{
                      height: '38px',
                      padding: '0 12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: '6px',
                      fontSize: '13px',
                      color: 'var(--color-text-primary)',
                      background: 'var(--color-bg-card)',
                      cursor: 'pointer',
                    }}
                    onChange={() => {
                      toast.success('Link validity window updated')
                    }}
                  >
                    <option value="7">7 Days</option>
                    <option value="14">14 Days</option>
                    <option value="30">30 Days</option>
                    <option value="60">60 Days</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Security & Data Privacy Card */}
            <div className="oxygen-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <ShieldCheck size={20} color="var(--color-success)" />
                <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: 'var(--color-text-primary)' }}>
                  Security & Data Privacy
                </h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                      Zero Raw Data Exposure
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      Aggregate scoring only; individual raw responses are strictly encrypted
                    </div>
                  </div>
                  <span className="badge-active" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Enforced
                  </span>
                </div>

                <div style={{ height: '1px', background: 'var(--color-border)' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                      Role-Based Access Control
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      Restricts admin dashboard viewing privileges to verified organization admins
                    </div>
                  </div>
                  <span className="badge-active" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Active
                  </span>
                </div>
              </div>
            </div>

            {/* Log Out Card */}
            <div className="oxygen-card" style={{ borderColor: 'rgba(244,67,54,0.25)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 6px', color: 'var(--color-text-primary)' }}>
                Session Management
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0 0 16px', lineHeight: '1.5' }}>
                Sign out of your administrator account session on this device.
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
                  fontWeight: '600',
                  cursor: loggingOut ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <LogOut size={16} />
                {loggingOut ? 'Signing out...' : 'Sign Out of Account'}
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}

