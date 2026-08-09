'use client'

import { useEffect, useRef, useState } from 'react'
import { getScoreStatus, STATUS_COLORS, STATUS_LABELS } from '@/lib/scoringEngine'
import { Skeleton } from '@/components/ui/skeleton'

interface MacroScorecardProps {
  score: number
  orgName: string
  totalResponses: number
  teamsAssessed: number
  totalTeams: number
  loading?: boolean
}

export function MacroScorecard({
  score,
  orgName,
  totalResponses,
  teamsAssessed,
  totalTeams,
  loading = false,
}: MacroScorecardProps) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const animRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null)

  const status = getScoreStatus(score)
  const color = STATUS_COLORS[status]
  const label = STATUS_LABELS[status]

  // SVG circle config
  const size = 200
  const strokeWidth = 14
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (animatedScore / 100) * circumference

  // Animate score on mount
  useEffect(() => {
    if (loading) return
    const start = Date.now()
    const duration = 1200

    const animate = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setAnimatedScore(Math.round(eased * score))

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate)
      }
    }

    animRef.current = requestAnimationFrame(animate)
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [score, loading])

  if (loading) {
    return (
      <div className="oxygen-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', height: '100%', gap: '20px', padding: '24px 16px' }}>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="rounded-full" style={{ width: '180px', height: '180px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', width: '100%' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <Skeleton className="h-7 w-12 mx-auto mb-2" />
              <Skeleton className="h-3 w-16 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="oxygen-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', height: '100%', gap: '20px', padding: '24px 16px' }}>
      {/* Title */}
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-secondary)', margin: '0 0 4px' }}>
          {orgName}
        </h3>
        <p style={{ fontSize: '11px', color: 'var(--color-text-disabled)', margin: 0 }}>
          Org AI Readiness Score
        </p>
      </div>

      {/* SVG Radial Gauge */}
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth={strokeWidth}
          />
          {/* Fill */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.05s ease, stroke 0.3s ease' }}
          />
        </svg>

        {/* Center label */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
          }}
        >
          <span
            style={{
              fontSize: '36px',
              fontWeight: '700',
              color: color,
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {animatedScore}
          </span>
          <span style={{ fontSize: '14px', fontWeight: '400', color: 'var(--color-text-secondary)' }}>%</span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: '600',
              color: color,
              background: `${color}18`,
              padding: '2px 10px',
              borderRadius: '999px',
              marginTop: '2px',
            }}
          >
            {label}
          </span>
        </div>
      </div>

      {/* Stats strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1px',
          width: '100%',
          background: 'var(--color-border)',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid var(--color-border)',
        }}
      >
        {[
          { value: totalResponses, label: 'Responses' },
          { value: `${teamsAssessed}/${totalTeams}`, label: 'Teams' },
          { value: `${totalTeams > 0 ? Math.round((teamsAssessed / totalTeams) * 100) : 0}%`, label: 'Coverage' },
        ].map(({ value, label }) => (
          <div
            key={label}
            style={{
              background: 'var(--color-bg-card)',
              padding: '12px 6px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-text-primary)' }}>
              {value}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px', whiteSpace: 'nowrap' }}>
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

