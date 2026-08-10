'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Copy,
  Plus,
  RefreshCw,
  Link2,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  Building2,
  ExternalLink,
  Cpu,
} from 'lucide-react'
import { ScenarioConfig, AssessmentSchemaPayload } from '@/lib/defaultTemplates'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { OnboardingTour } from '@/components/admin/OnboardingTour'

// ─── Types ────────────────────────────────────────────────────────────────────

interface InviteRow {
  id: string
  token: string
  masked_token: string
  invite_url: string
  title: string
  status: 'pending' | 'active' | 'completed' | 'expired'
  created_at: string
  expires_at: string
  team_id: string
  team_name: string
  target_seats: number
  response_count: number
  organization_name: string
  team_score: number
}

const PRESET_TEAMS = ['Engineering', 'Sales', 'Operations', 'Marketing', 'Customer Success', 'HR', 'Finance']

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: InviteRow['status'] }) {
  const config = {
    pending: {
      label: 'Pending',
      cls: 'badge-pending',
      Icon: Clock,
    },
    active: {
      label: 'Active',
      cls: 'badge-active',
      Icon: CheckCircle2,
    },
    completed: {
      label: 'Completed',
      cls: 'badge-completed',
      Icon: CheckCircle2,
    },
    expired: {
      label: 'Expired',
      cls: 'badge-expired',
      Icon: AlertCircle,
    },
  }[status] ?? {
    label: 'Pending',
    cls: 'badge-pending',
    Icon: Clock,
  }

  return (
    <span className={config.cls} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      <config.Icon size={10} />
      {config.label}
    </span>
  )
}

// ─── Skeleton Table ───────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div style={{ padding: '0 0 24px' }}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 2fr 1fr 1fr 1fr auto',
            gap: '16px',
            padding: '16px',
            borderBottom: '1px solid var(--color-border)',
            alignItems: 'center',
          }}
        >
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-24 rounded" />
        </div>
      ))}
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onGenerate }: { onGenerate: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 32px',
        textAlign: 'center',
        gap: '16px',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(255, 115, 0, 0.08)',
          border: '1px solid rgba(255, 115, 0, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Link2 size={28} color="var(--color-brand-accent)" />
      </div>
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text-primary)', margin: '0 0 8px' }}>
          No Assessment Links Yet
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: '0', maxWidth: '360px' }}>
          Generate your first team assessment link to start measuring AI readiness across your organization.
        </p>
      </div>
      <button className="btn-primary" onClick={onGenerate} style={{ marginTop: '8px' }}>
        Generate First Link
      </button>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function InviteManager() {
  const [invites, setInvites] = useState<InviteRow[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showGenDialog, setShowGenDialog] = useState(false)
  const [showCreateTeam, setShowCreateTeam] = useState(false)
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Form state
  const [savedOrgName, setSavedOrgName] = useState('')
  const [orgName, setOrgName] = useState('')
  const [selectedTeam, setSelectedTeam] = useState('')
  const [customTeam, setCustomTeam] = useState('')
  const [defaultSeatSetting, setDefaultSeatSetting] = useState(10)
  const [targetSeats, setTargetSeats] = useState(10)

  // Technical Scenario prompt & step state
  const [genDialogStep, setGenDialogStep] = useState<'form' | 'scenario' | 'success'>('form')
  const [availableScenarios, setAvailableScenarios] = useState<ScenarioConfig[]>([])
  const [selectedScenarioIds, setSelectedScenarioIds] = useState<string[]>(['all'])
  const [checkingTemplate, setCheckingTemplate] = useState(false)

  // ─── Fetch invites & settings ─────────────────────────────────────────────

  const fetchInvites = useCallback(async () => {
    setLoading(true)
    try {
      const [invitesRes, settingsRes] = await Promise.all([
        fetch('/api/invites/list'),
        fetch('/api/settings'),
      ])
      const data = await invitesRes.json()
      if (data.invites) setInvites(data.invites)

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json()
        if (settingsData.org_name) {
          setSavedOrgName(settingsData.org_name)
        }
        if (settingsData.default_seat_target) {
          setDefaultSeatSetting(settingsData.default_seat_target)
          setTargetSeats(settingsData.default_seat_target)
        }
      }
    } catch {
      toast.error('Failed to load invites')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInvites()
  }, [fetchInvites])

  // ─── Copy to clipboard ────────────────────────────────────────────────────

  const handleCopy = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(id)
      toast.success('Magic link copied to clipboard!', {
        description: 'Share this link with your team members.',
        duration: 3000,
      })
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast.error('Failed to copy link')
    }
  }

  // ─── Generate invite logic ────────────────────────────────────────────────

  const handleGenerate = async (scenarioId: string = 'all') => {
    const teamName = selectedTeam === '__custom__' ? customTeam : selectedTeam
    if (!teamName.trim()) {
      toast.error('Please select or enter a team name')
      return
    }

    setGenerating(true)
    try {
      const res = await fetch('/api/invites/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_name: teamName.trim(),
          target_seats: targetSeats,
          selected_scenario_id: scenarioId,
        }),
      })
      const data = await res.json()

      if (data.url) {
        setGeneratedUrl(data.url)
        setGenDialogStep('success')
        await fetchInvites()
        localStorage.setItem('tai_onboarding_completed', 'true')
        sessionStorage.removeItem('tai_tour_step_index')
        toast.success('Magic link generated!', {
          description: `Assessment link created for ${teamName}`,
        })
      } else {
        toast.error(data.error || 'Failed to generate link')
      }
    } catch {
      toast.error('Failed to generate invite')
    } finally {
      setGenerating(false)
    }
  }

  const handleInitiateGenerate = async () => {
    const teamName = selectedTeam === '__custom__' ? customTeam : selectedTeam
    if (!teamName.trim()) {
      toast.error('Please select or enter a team name')
      return
    }

    const lowerTeam = teamName.trim().toLowerCase()
    const isTechnical = lowerTeam.includes('engineering') || lowerTeam.includes('data') || lowerTeam.includes('tech')

    if (isTechnical) {
      setCheckingTemplate(true)
      try {
        const res = await fetch('/api/admin/templates?department_type=Engineering')
        if (res.ok) {
          const data = await res.json()
          const isCustom = data.is_custom
          const tmpl: AssessmentSchemaPayload = data.template
          const scenarios = tmpl?.scenarios && tmpl.scenarios.length > 0
            ? tmpl.scenarios
            : (tmpl?.scenario ? [tmpl.scenario] : [])

          // Rule: If system is default (is_custom === false) AND <= 1 scenario -> NO PROMPT STEP!
          if (isCustom || scenarios.length > 1) {
            setAvailableScenarios(scenarios)
            setSelectedScenarioIds(['all'])
            setGenDialogStep('scenario')
            setCheckingTemplate(false)
            return
          }
        }
      } catch (err) {
        console.error('Error checking template for scenario prompt:', err)
      } finally {
        setCheckingTemplate(false)
      }
    }

    // Directly generate without prompt if system default or non-technical
    await handleGenerate('all')
  }

  const handleCloseDialog = () => {
    setShowGenDialog(false)
    setGenDialogStep('form')
    setGeneratedUrl(null)
    setOrgName('')
    setSelectedTeam('')
    setCustomTeam('')
    setTargetSeats(defaultSeatSetting)
  }

  return (
    <div>
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: '20px',
              fontWeight: '600',
              color: 'var(--color-text-primary)',
              margin: '0 0 4px',
            }}
          >
            Assessment Distribution
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>
            Generate and manage tokenized assessment links for your teams
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn-secondary"
            onClick={fetchInvites}
            disabled={loading}
            style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            id="generate-link-cta"
            className="btn-primary"
            onClick={() => setShowGenDialog(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} />
            Generate New Link
          </button>
        </div>
      </div>

      {/* ─── Stats Strip ────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {[
          {
            icon: Clock,
            label: 'Pending',
            value: invites.filter((i) => i.status === 'pending').length,
            color: '#E65100',
          },
          {
            icon: CheckCircle2,
            label: 'Active',
            value: invites.filter((i) => i.status === 'active').length,
            color: 'var(--color-success)',
          },
          {
            icon: CheckCircle2,
            label: 'Completed',
            value: invites.filter((i) => i.status === 'completed').length,
            color: '#2E7D32',
          },
          {
            icon: AlertCircle,
            label: 'Expired',
            value: invites.filter((i) => i.status === 'expired').length,
            color: '#D32F2F',
          },
          {
            icon: Users,
            label: 'Total Responses',
            value: invites.reduce((s, i) => s + i.response_count, 0),
            color: 'var(--color-primary-dark)',
          },
          {
            icon: Building2,
            label: 'Teams',
            value: new Set(invites.map((i) => i.team_name)).size,
            color: '#9C27B0',
          },
        ].map(({ icon: Icon, label, value, color }) => (
          <div
            key={label}
            className="oxygen-card"
            style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: `${color}14`,
                border: `1px solid ${color}33`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon size={18} color={color} />
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--color-text-primary)', lineHeight: 1 }}>
                {loading ? <Skeleton className="h-6 w-8" /> : value}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Active Invites Table ────────────────────────────────────────────── */}
      <div className="oxygen-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h3 style={{ fontSize: '15px', fontWeight: '600', margin: 0, color: 'var(--color-text-primary)' }}>
            Active Invites
          </h3>
          <span
            style={{
              fontSize: '12px',
              color: 'var(--color-text-secondary)',
              background: 'var(--color-bg-app)',
              padding: '2px 10px',
              borderRadius: '999px',
              border: '1px solid var(--color-border)',
            }}
          >
            {invites.length} total
          </span>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : invites.length === 0 ? (
          <EmptyState onGenerate={() => setShowGenDialog(true)} />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="oxygen-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', minWidth: '120px' }}>Team</th>
                  <th style={{ textAlign: 'left', minWidth: '200px' }}>Assessment Link</th>
                  <th style={{ textAlign: 'left', minWidth: '120px' }}>Responses</th>
                  <th style={{ textAlign: 'left', minWidth: '100px' }}>Status</th>
                  <th style={{ textAlign: 'left', minWidth: '100px' }}>Expires</th>
                  <th style={{ textAlign: 'left', minWidth: '160px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invites.map((invite) => (
                  <tr key={invite.id}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontWeight: '500', fontSize: '14px' }}>{invite.team_name}</span>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                          {invite.organization_name && invite.organization_name !== 'Unknown' && invite.organization_name !== 'My Organization'
                            ? invite.organization_name
                            : (savedOrgName || invite.organization_name || 'My Organization')}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: 'var(--color-bg-app)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '4px',
                          padding: '6px 10px',
                          maxWidth: '260px',
                        }}
                      >
                        <Link2 size={12} color="var(--color-text-disabled)" style={{ flexShrink: 0 }} />
                        <code
                          style={{
                            fontSize: '12px',
                            color: 'var(--color-text-secondary)',
                            fontFamily: 'monospace',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1,
                          }}
                        >
                          {invite.masked_token}
                        </code>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            height: '6px',
                            flex: 1,
                            maxWidth: '60px',
                            background: 'var(--color-border)',
                            borderRadius: '999px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${Math.min(100, (invite.response_count / invite.target_seats) * 100)}%`,
                              background: 'var(--color-brand-accent)',
                              borderRadius: '999px',
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '13px', color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
                          {invite.response_count} / {invite.target_seats}
                        </span>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={invite.status} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} color="var(--color-text-disabled)" />
                        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                          {new Date(invite.expires_at).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => handleCopy(invite.invite_url, invite.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            background: copiedId === invite.id ? 'var(--color-success-bg)' : 'var(--color-bg-app)',
                            color: copiedId === invite.id ? '#2E7D32' : 'var(--color-text-primary)',
                            border: `1px solid ${copiedId === invite.id ? 'var(--color-success)' : 'var(--color-border)'}`,
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          {copiedId === invite.id ? (
                            <CheckCircle2 size={12} />
                          ) : (
                            <Copy size={12} />
                          )}
                          {copiedId === invite.id ? 'Copied!' : 'Copy'}
                        </button>
                        <button
                          onClick={() => {
                            if (invite.invite_url) {
                              window.open(invite.invite_url, '_blank', 'noopener,noreferrer')
                            }
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            background: 'transparent',
                            color: 'var(--color-text-secondary)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          <ExternalLink size={12} />
                          Open link
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Generate Link Wizard Dialog ─────────────────────────────────────── */}
      <Dialog open={showGenDialog} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent
          style={{
            maxWidth: '520px',
            width: 'calc(100vw - 32px)',
            maxHeight: '90vh',
            overflowY: 'auto',
            borderRadius: '12px',
            border: '1px solid var(--color-border)',
            fontFamily: 'var(--font-family)',
            padding: '24px 20px',
          }}
        >
          {genDialogStep === 'form' && (
            <>
              <DialogHeader>
                <DialogTitle
                  style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text-primary)' }}
                >
                  Generate Assessment Link
                </DialogTitle>
                <DialogDescription style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                  Create a tokenized magic link for {savedOrgName ? <strong style={{ color: 'var(--color-text-primary)' }}>{savedOrgName}</strong> : 'your organization'} bound to a specific team. Share this with team members to begin their assessment.
                </DialogDescription>
              </DialogHeader>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '8px' }}>
                {/* Team */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <Label style={{ fontSize: '13px', fontWeight: '500' }}>
                    Team / Department <span style={{ color: 'var(--color-danger)' }}>*</span>
                  </Label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
                    {PRESET_TEAMS.map((team) => (
                      <button
                        key={team}
                        onClick={() => setSelectedTeam(team)}
                        style={{
                          padding: '10px 12px',
                          fontSize: '13px',
                          fontWeight: '500',
                          borderRadius: '6px',
                          border: `2px solid ${selectedTeam === team ? 'var(--color-brand-accent)' : 'var(--color-border)'}`,
                          background: selectedTeam === team ? 'rgba(255, 115, 0, 0.08)' : 'var(--color-bg-card)',
                          color: selectedTeam === team ? 'var(--color-brand-accent)' : 'var(--color-text-primary)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {team}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        setSelectedTeam('__custom__')
                        setShowCreateTeam(true)
                      }}
                      style={{
                        padding: '10px 12px',
                        fontSize: '13px',
                        fontWeight: '500',
                        borderRadius: '6px',
                        border: `2px solid ${selectedTeam === '__custom__' ? 'var(--color-brand-accent)' : 'var(--color-border)'}`,
                        background: selectedTeam === '__custom__' ? 'rgba(255, 115, 0, 0.08)' : 'var(--color-bg-card)',
                        color: selectedTeam === '__custom__' ? 'var(--color-brand-accent)' : 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                      }}
                    >
                      <Plus size={13} /> Custom
                    </button>
                  </div>

                  {selectedTeam === '__custom__' && (
                    <Input
                      placeholder="Enter team name"
                      value={customTeam}
                      onChange={(e) => setCustomTeam(e.target.value)}
                      style={{ fontSize: '14px', marginTop: '8px' }}
                      autoFocus
                    />
                  )}
                </div>

                {/* Target Seats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <Label htmlFor="target-seats" style={{ fontSize: '13px', fontWeight: '500' }}>
                    Target Respondents
                  </Label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Input
                      id="target-seats"
                      type="number"
                      min={1}
                      max={500}
                      value={targetSeats}
                      onChange={(e) => setTargetSeats(parseInt(e.target.value) || 10)}
                      style={{ fontSize: '14px', maxWidth: '100px' }}
                    />
                    <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                      team members expected to respond
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '8px' }}>
                  <button className="btn-secondary" onClick={handleCloseDialog}>
                    Cancel
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleInitiateGenerate}
                    disabled={generating || checkingTemplate || (!selectedTeam || (selectedTeam === '__custom__' && !customTeam.trim()))}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: (generating || checkingTemplate) ? 0.7 : 1 }}
                  >
                    {generating || checkingTemplate ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        {checkingTemplate ? 'Checking Scenarios...' : 'Generating...'}
                      </>
                    ) : (
                      <>
                        <Link2 size={14} />
                        Generate Magic Link
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          {genDialogStep === 'scenario' && (
            <>
              <DialogHeader>
                <DialogTitle
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: '600', color: 'var(--color-text-primary)' }}
                >
                  <Cpu size={20} color="var(--color-brand-accent)" />
                  Select Technical Scenarios for Link
                </DialogTitle>
                <DialogDescription style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  Choose which technical scenario questions this assessment magic link should present to team members:
                </DialogDescription>
              </DialogHeader>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '16px 0' }}>
                {/* Option: All Scenarios Combined */}
                {(() => {
                  const isAllSelected = selectedScenarioIds.includes('all') || selectedScenarioIds.length === 0

                  return (
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: isAllSelected ? '2px solid var(--color-brand-accent)' : '1px solid var(--color-border)',
                        background: isAllSelected ? 'rgba(255, 115, 0, 0.04)' : 'var(--color-bg-card)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        wordBreak: 'break-word',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={() => {
                          setSelectedScenarioIds(['all'])
                        }}
                        style={{ marginTop: '3px', flexShrink: 0, accentColor: 'var(--color-brand-accent)', width: '16px', height: '16px' }}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-primary)', display: 'block' }}>
                          All Scenarios Combined (Full Assessment)
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginTop: '2px' }}>
                          Includes all configured technical scenarios for a comprehensive evaluation.
                        </span>
                      </div>
                    </label>
                  )
                })()}

                {/* Individual Scenarios */}
                {availableScenarios.map((sc, idx) => {
                  const scId = sc.scenario_id || `scenario_${idx}`
                  const isAllSelected = selectedScenarioIds.includes('all')
                  const isSelected = !isAllSelected && selectedScenarioIds.includes(scId)

                  // Clean up duplicate title formatting
                  const rawTitle = sc.title || `Scenario ${idx + 1}`
                  const formattedTitle = rawTitle.toLowerCase().startsWith('scenario')
                    ? rawTitle
                    : `Scenario ${idx + 1}: ${rawTitle}`

                  const toggleScenario = () => {
                    let next: string[] = []
                    if (isAllSelected) {
                      next = [scId]
                    } else if (selectedScenarioIds.includes(scId)) {
                      next = selectedScenarioIds.filter((id) => id !== scId)
                      if (next.length === 0) next = ['all']
                    } else {
                      next = [...selectedScenarioIds, scId]
                      if (next.length >= availableScenarios.length) {
                        next = ['all']
                      }
                    }
                    setSelectedScenarioIds(next)
                  }

                  return (
                    <label
                      key={scId}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: isSelected ? '2px solid var(--color-brand-accent)' : '1px solid var(--color-border)',
                        background: isSelected ? 'rgba(255, 115, 0, 0.04)' : 'var(--color-bg-card)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        wordBreak: 'break-word',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={toggleScenario}
                        style={{ marginTop: '3px', flexShrink: 0, accentColor: 'var(--color-brand-accent)', width: '16px', height: '16px' }}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-primary)', display: 'block' }}>
                          {formattedTitle}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginTop: '2px' }}>
                          Focuses specifically on this scenario ({sc.nodes?.length || 0} steps).
                        </span>
                      </div>
                    </label>
                  )
                })}
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '8px', flexWrap: 'wrap' }}>
                <button className="btn-secondary" onClick={() => setGenDialogStep('form')} disabled={generating}>
                  Back
                </button>
                <button
                  className="btn-primary"
                  onClick={() => {
                    const finalParam = (selectedScenarioIds.includes('all') || selectedScenarioIds.length === 0)
                      ? 'all'
                      : selectedScenarioIds.join(',')
                    handleGenerate(finalParam)
                  }}
                  disabled={generating}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {generating ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Link2 size={14} />
                      Confirm & Generate Magic Link
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {genDialogStep === 'success' && (
            <>
              <DialogHeader>
                <DialogTitle style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                  Magic Link Generated!
                </DialogTitle>
                <DialogDescription style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                  Share this link with your team members to begin the assessment.
                </DialogDescription>
              </DialogHeader>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '8px' }}>
                <div
                  style={{
                    padding: '16px',
                    background: 'rgba(76, 175, 80, 0.06)',
                    border: '1px solid rgba(76, 175, 80, 0.2)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <CheckCircle2 size={24} color="var(--color-success)" style={{ flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#2E7D32', margin: '0 0 2px' }}>
                      Assessment Link Ready
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
                      Copy the link below and distribute to your team.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Label style={{ fontSize: '13px', fontWeight: '500' }}>Assessment Link</Label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'var(--color-bg-app)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '6px',
                      padding: '10px 14px',
                    }}
                  >
                    <code
                      style={{
                        flex: 1,
                        fontSize: '13px',
                        color: 'var(--color-text-primary)',
                        fontFamily: 'monospace',
                        wordBreak: 'break-all',
                      }}
                    >
                      {generatedUrl}
                    </code>
                    <button
                      onClick={() => handleCopy(generatedUrl || '', 'generated')}
                      style={{
                        padding: '6px 12px',
                        fontSize: '13px',
                        fontWeight: '500',
                        background: copiedId === 'generated' ? 'var(--color-success-bg)' : 'var(--color-brand-accent)',
                        color: copiedId === 'generated' ? '#2E7D32' : 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        flexShrink: 0,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {copiedId === 'generated' ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                      {copiedId === 'generated' ? 'Copied!' : 'Copy Link'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button className="btn-secondary" onClick={handleCloseDialog}>
                    Close
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setGeneratedUrl(null)
                      setGenDialogStep('form')
                      setSelectedTeam('')
                      setCustomTeam('')
                      setTargetSeats(10)
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Plus size={14} />
                    Generate Another
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <OnboardingTour onOpenGenerateDialog={() => setShowGenDialog(true)} />
    </div>
  )
}
