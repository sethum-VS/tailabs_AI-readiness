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
  Send,
} from 'lucide-react'
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface InviteRow {
  id: string
  token: string
  masked_token: string
  invite_url: string
  title: string
  status: 'active' | 'completed' | 'expired'
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
      cls: 'badge-pending',
      Icon: AlertCircle,
    },
  }[status]

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
  const [orgName, setOrgName] = useState('')
  const [selectedTeam, setSelectedTeam] = useState('')
  const [customTeam, setCustomTeam] = useState('')
  const [targetSeats, setTargetSeats] = useState(10)

  // ─── Fetch invites ────────────────────────────────────────────────────────

  const fetchInvites = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/invites/list')
      const data = await res.json()
      if (data.invites) setInvites(data.invites)
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

  // ─── Generate invite ──────────────────────────────────────────────────────

  const handleGenerate = async () => {
    const teamName = selectedTeam === '__custom__' ? customTeam : selectedTeam
    if (!orgName.trim() || !teamName.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setGenerating(true)
    try {
      const res = await fetch('/api/invites/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_name: orgName.trim(),
          team_name: teamName.trim(),
          target_seats: targetSeats,
        }),
      })
      const data = await res.json()

      if (data.url) {
        setGeneratedUrl(data.url)
        await fetchInvites()
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

  const handleCloseDialog = () => {
    setShowGenDialog(false)
    setGeneratedUrl(null)
    setOrgName('')
    setSelectedTeam('')
    setCustomTeam('')
    setTargetSeats(10)
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
            icon: Link2,
            label: 'Total Links',
            value: invites.length,
            color: 'var(--color-brand-accent)',
          },
          {
            icon: CheckCircle2,
            label: 'Active',
            value: invites.filter((i) => i.status === 'active').length,
            color: 'var(--color-success)',
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
                          {invite.organization_name}
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
                            transition: 'all 0.15s ease',
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
                            handleCopy(invite.invite_url, invite.id)
                            toast.info('Reminder link ready to share via your communication tool')
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
                          <Send size={12} />
                          Resend
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

      {/* ─── Generate Link Dialog ─────────────────────────────────────────────── */}
      <Dialog open={showGenDialog} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent
          style={{
            maxWidth: '520px',
            borderRadius: '12px',
            border: '1px solid var(--color-border)',
            fontFamily: 'var(--font-family)',
          }}
        >
          <DialogHeader>
            <DialogTitle
              style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text-primary)' }}
            >
              Generate Assessment Link
            </DialogTitle>
            <DialogDescription style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              Create a tokenized magic link bound to a specific team. Share this with team members to begin their assessment.
            </DialogDescription>
          </DialogHeader>

          {!generatedUrl ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '8px' }}>
              {/* Organization */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <Label htmlFor="org-name" style={{ fontSize: '13px', fontWeight: '500' }}>
                  Organization Name <span style={{ color: 'var(--color-danger)' }}>*</span>
                </Label>
                <Input
                  id="org-name"
                  placeholder="e.g. Acme Corp"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  style={{ fontSize: '14px' }}
                />
              </div>

              {/* Team */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <Label style={{ fontSize: '13px', fontWeight: '500' }}>
                  Team / Department <span style={{ color: 'var(--color-danger)' }}>*</span>
                </Label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {PRESET_TEAMS.map((team) => (
                    <button
                      key={team}
                      onClick={() => setSelectedTeam(team)}
                      style={{
                        padding: '8px 12px',
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
                      padding: '8px 12px',
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
                  onClick={handleGenerate}
                  disabled={generating || !orgName.trim() || (!selectedTeam || (selectedTeam === '__custom__' && !customTeam.trim()))}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: generating ? 0.7 : 1 }}
                >
                  {generating ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Generating...
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
          ) : (
            /* ─── Generated URL Panel ──────────────────────────────────────────── */
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
                    Magic Link Generated!
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
                    Share this link with your team members to begin the assessment.
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
                    onClick={() => handleCopy(generatedUrl, 'generated')}
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

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button className="btn-secondary" onClick={handleCloseDialog}>
                  Close
                </button>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setGeneratedUrl(null)
                    setOrgName('')
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
