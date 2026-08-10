'use client'

import { useState, useMemo, useEffect } from 'react'
import { toast } from 'sonner'
import { PILLAR_LABELS, STATUS_COLORS, getScoreStatus, type Recommendation } from '@/lib/scoringEngine'
import { PillarIcon } from '@/components/common/PillarIcon'
import { X, Send, Users, Sparkles, Check } from 'lucide-react'

export interface TeamOption {
  id: string
  name: string
  aggregate_score?: number
  target_seats?: number
  is_tech?: boolean
  pillar_averages?: Record<string, number>
}

interface EnrollTeamModalProps {
  isOpen: boolean
  onClose: () => void
  recommendation: Recommendation | null
  allTeams: TeamOption[]
}

export function EnrollTeamModal({
  isOpen,
  onClose,
  recommendation,
  allTeams,
}: EnrollTeamModalProps) {
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([])
  const [customMessage, setCustomMessage] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  // Determine pillar threshold benchmark
  const isTechPillar = recommendation?.pillar === 'tech'
  const benchmarkThreshold = isTechPillar ? 70 : 50

  // Filter recommended teams: teams whose score in this specific pillar is < benchmark
  const recommendedTeams = useMemo(() => {
    if (!recommendation || !allTeams) return []
    return allTeams.filter((t) => {
      // For tech pillar, only consider tech teams or tech scores
      if (isTechPillar && !t.is_tech) return false
      const pillarScore = isTechPillar 
        ? (t.aggregate_score || 0)
        : (t.pillar_averages?.[recommendation.pillar] ?? 100)
      return pillarScore < benchmarkThreshold
    })
  }, [allTeams, recommendation, isTechPillar, benchmarkThreshold])

  // Sync state whenever modal opens or recommendation/allTeams change
  useEffect(() => {
    if (isOpen && recommendation) {
      if (recommendedTeams.length > 0) {
        setSelectedTeamIds(recommendedTeams.map((t) => t.id))
      } else if (allTeams.length > 0) {
        // Fallback: pre-select bottom scoring team for this pillar or all teams if no low readiness team
        const sorted = [...allTeams].sort((a, b) => {
          const scoreA = isTechPillar
            ? (a.aggregate_score || 0)
            : (a.pillar_averages?.[recommendation.pillar] ?? 100)
          const scoreB = isTechPillar
            ? (b.aggregate_score || 0)
            : (b.pillar_averages?.[recommendation.pillar] ?? 100)
          return scoreA - scoreB
        })
        const lowest = sorted[0]
        setSelectedTeamIds(lowest ? [lowest.id] : allTeams.map((t) => t.id))
      } else {
        setSelectedTeamIds([])
      }

      setCustomMessage(
        `Hi Team,\n\nBased on our recent AI Readiness assessment, your team has been enrolled in the "${recommendation.title}" upskilling track (${PILLAR_LABELS[recommendation.pillar] ?? recommendation.pillar}).\n\nPlease review your personalized upskilling syllabus and start completing the recommended learning modules.`
      )
    }
  }, [isOpen, recommendation?.id, recommendation?.title, recommendation?.pillar, allTeams, recommendedTeams, isTechPillar])

  if (!isOpen || !recommendation) return null

  const pillarLabel = PILLAR_LABELS[recommendation.pillar] ?? recommendation.pillar
  const status = getScoreStatus(recommendation.pillarScore)
  const pillarColor = STATUS_COLORS[status]

  // Calculate selected metrics
  const selectedTeamsList = allTeams.filter((t) => selectedTeamIds.includes(t.id))
  const totalRecipients = selectedTeamsList.reduce((sum, t) => sum + (t.target_seats || 1), 0)

  const toggleTeam = (teamId: string) => {
    setSelectedTeamIds((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    )
  }

  const handleEnrollSubmit = async () => {
    if (selectedTeamIds.length === 0) {
      toast.error('Please select at least one team to enroll.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendation_id: recommendation.id,
          recommendation_title: recommendation.title,
          pillar: recommendation.pillar,
          team_ids: selectedTeamIds,
          message: customMessage,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to enroll teams')
      }

      toast.success(`Successfully enrolled ${data.teams_count} team(s)!`, {
        description: `Notification email sent to approx. ${data.total_recipients} team member(s).`,
      })

      onClose()
    } catch (err: any) {
      console.error('Enrollment error:', err)
      toast.error(err.message || 'Failed to complete enrollment.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        className="oxygen-card"
        style={{
          width: '100%',
          maxWidth: '620px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: 'var(--color-bg-surface, #ffffff)',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          border: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          padding: '0',
          animation: 'scaleUp 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 28px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
            background: 'var(--color-bg-subtle, rgba(0,0,0,0.02))',
          }}
        >
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: `${pillarColor}18`,
                border: `1px solid ${pillarColor}33`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <PillarIcon pillar={recommendation.pillar} size={22} color={pillarColor} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: pillarColor,
                    background: `${pillarColor}18`,
                    padding: '2px 8px',
                    borderRadius: '999px',
                  }}
                >
                  {pillarLabel} · {recommendation.pillarScore.toFixed(0)}%
                </span>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: 'var(--color-text-primary)' }}>
                Enroll Teams: {recommendation.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-hover, rgba(0,0,0,0.05))')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Description */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '10px',
              background: 'var(--color-bg-subtle, #f8f9fa)',
              border: '1px solid var(--color-border)',
              fontSize: '13px',
              color: 'var(--color-text-secondary)',
              lineHeight: '1.5',
            }}
          >
            {recommendation.description}
          </div>

          {/* Section: Recommended & Team Selection */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={16} color="var(--color-brand-accent)" />
                Select Teams for Enrollment ({selectedTeamIds.length} selected)
              </label>
              {recommendedTeams.length > 0 && (
                <span style={{ fontSize: '11px', color: 'var(--color-brand-accent)', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles size={12} />
                  {recommendedTeams.length} Low readiness team(s) auto-detected
                </span>
              )}
            </div>

            {/* Team Chips / Checklist */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '10px',
                maxHeight: '180px',
                overflowY: 'auto',
                padding: '4px',
              }}
            >
              {allTeams.map((team) => {
                const isSelected = selectedTeamIds.includes(team.id)
                const teamPillarScore = isTechPillar 
                  ? team.aggregate_score
                  : team.pillar_averages?.[recommendation.pillar]
                const isLowScore = teamPillarScore !== undefined && teamPillarScore < benchmarkThreshold

                return (
                  <div
                    key={team.id}
                    onClick={() => toggleTeam(team.id)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: `1.5px solid ${isSelected ? 'var(--color-brand-accent, #ff7300)' : 'var(--color-border)'}`,
                      background: isSelected
                        ? 'rgba(255, 115, 0, 0.05)'
                        : 'var(--color-bg-surface, #ffffff)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 2px 8px rgba(255,115,0,0.12)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '4px',
                          border: `1.5px solid ${isSelected ? 'var(--color-brand-accent, #ff7300)' : 'var(--color-border-dark, #ccc)'}`,
                          background: isSelected ? 'var(--color-brand-accent, #ff7300)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {isSelected && <Check size={12} color="#ffffff" strokeWidth={3} />}
                      </div>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {team.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '1px' }}>
                          {team.target_seats || 1} members
                        </div>
                      </div>
                    </div>

                    {isLowScore && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: '600',
                          color: '#F44336',
                          background: 'rgba(244, 67, 54, 0.1)',
                          padding: '2px 6px',
                          borderRadius: '999px',
                          flexShrink: 0,
                          marginLeft: '6px',
                        }}
                      >
                        Needs Upskilling ({Math.round(teamPillarScore)}%)
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Section: Email Message Notification */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)', display: 'block', marginBottom: '8px' }}>
              Recommendation Email Notification Message
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={5}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg-app, #ffffff)',
                color: 'var(--color-text-primary)',
                fontSize: '13px',
                fontFamily: 'inherit',
                lineHeight: '1.5',
                outline: 'none',
                resize: 'vertical',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--color-brand-accent, #ff7300)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
            />
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px', display: 'block' }}>
              This email will be dispatched to all registered team members in the selected teams.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 28px',
            borderTop: '1px solid var(--color-border)',
            background: 'var(--color-bg-subtle, rgba(0,0,0,0.02))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={14} />
            <span>
              Total Recipients: <strong>{totalRecipients} team member(s)</strong> across {selectedTeamIds.length} team(s)
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn-secondary"
              onClick={onClose}
              disabled={submitting}
              style={{
                fontSize: '13px',
                padding: '8px 16px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              className="btn-primary"
              onClick={handleEnrollSubmit}
              disabled={submitting || selectedTeamIds.length === 0}
              style={{
                fontSize: '13px',
                padding: '8px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                opacity: selectedTeamIds.length === 0 || submitting ? 0.6 : 1,
                cursor: selectedTeamIds.length === 0 || submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? (
                <>Sending Notifications...</>
              ) : (
                <>
                  <Send size={14} />
                  Confirm & Send Email
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
