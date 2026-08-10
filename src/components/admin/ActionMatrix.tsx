'use client'

import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { PILLAR_LABELS, STATUS_COLORS, getScoreStatus } from '@/lib/scoringEngine'
import type { Recommendation } from '@/lib/scoringEngine'
import { ExternalLink, BookOpen, Sparkles, CheckCircle2 } from 'lucide-react'
import { PillarIcon } from '@/components/common/PillarIcon'
import Link from 'next/link'

interface ActionMatrixProps {
  recommendations: Recommendation[]
  loading?: boolean
}

function RecommendationCard({ rec }: { rec: Recommendation }) {
  const status = getScoreStatus(rec.pillarScore)
  const color = STATUS_COLORS[status]

  return (
    <div
      className="oxygen-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.boxShadow = '0px 4px 20px rgba(0,0,0,0.1)'
        el.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.boxShadow = 'var(--shadow-card)'
        el.style.transform = 'translateY(0)'
      }}
    >
      {/* Card header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            background: `${color}14`,
            border: `1px solid ${color}33`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <PillarIcon pillar={rec.pillar} size={20} color={color} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: '600',
                color,
                background: `${color}18`,
                padding: '2px 8px',
                borderRadius: '999px',
              }}
            >
              {PILLAR_LABELS[rec.pillar] ?? rec.pillar} · {rec.pillarScore.toFixed(0)}%
            </span>
          </div>
          <h4
            style={{
              fontSize: '15px',
              fontWeight: '600',
              color: 'var(--color-text-primary)',
              margin: 0,
              lineHeight: '1.4',
            }}
          >
            {rec.title}
          </h4>
        </div>
      </div>

      {/* Description */}
      <p
        style={{
          fontSize: '13px',
          color: 'var(--color-text-secondary)',
          lineHeight: '1.6',
          margin: 0,
          flex: 1,
        }}
      >
        {rec.description}
      </p>

      {/* Score bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Current Score</span>
          <span style={{ fontSize: '11px', fontWeight: '600', color }}>
            {rec.pillarScore.toFixed(0)}% / 100%
          </span>
        </div>
        <div
          style={{
            height: '6px',
            background: 'var(--color-bg-app)',
            borderRadius: '999px',
            overflow: 'hidden',
            border: '1px solid var(--color-border)',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${rec.pillarScore}%`,
              background: color,
              borderRadius: '999px',
              transition: 'width 0.6s ease',
            }}
          />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          className="btn-primary"
          style={{
            flex: 1,
            minWidth: '130px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '13px',
            padding: '8px 16px',
          }}
          onClick={() => {
            toast.success(`Enrolled team in ${rec.title}`, {
              description: `Upskilling pathway initialized for ${PILLAR_LABELS[rec.pillar] ?? rec.pillar}.`,
            })
          }}
        >
          {rec.action_label}
        </button>
        {rec.action_url && (
          <button
            className="btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '13px',
              padding: '8px 16px',
            }}
            onClick={() => {
              window.open(rec.action_url ?? '#', '_blank')
            }}
          >
            <BookOpen size={13} />
            Syllabus
          </button>
        )}
      </div>
    </div>
  )
}

export function ActionMatrix({ recommendations, loading = false }: ActionMatrixProps) {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Skeleton className="h-5 w-48" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '16px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="oxygen-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <Skeleton className="h-11 w-11 rounded-xl" />
                <div style={{ flex: 1 }}>
                  <Skeleton className="h-3 w-24 mb-2" />
                  <Skeleton className="h-5 w-full" />
                </div>
              </div>
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-6 w-full rounded" />
              <Skeleton className="h-9 w-full rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Section header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Sparkles size={18} color="var(--color-brand-accent)" />
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text-primary)', margin: 0 }}>
            Upskilling Action Matrix
          </h3>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>
          Targeted recommendations based on pillar scores below 50%
        </p>
      </div>

      {recommendations.length === 0 ? (
        /* ─── All Pillars Performing Well ─────────────────────────────────── */
        <div
          className="oxygen-card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 32px',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(76, 175, 80, 0.1)',
              border: '1px solid rgba(76, 175, 80, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle2 size={28} color="var(--color-success)" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '440px' }}>
            <h4
              style={{
                fontSize: '18px',
                fontWeight: '600',
                color: 'var(--color-text-primary)',
                margin: '0 0 8px',
                textAlign: 'center',
              }}
            >
              All Pillars Performing Well!
            </h4>
            <p
              style={{
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                margin: 0,
                textAlign: 'left',
                lineHeight: '1.6',
              }}
            >
              {"All team pillar scores are above 50%. No targeted interventions required at this time. Continue monitoring scores as more team members complete assessments."}
            </p>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
            gap: '16px',
          }}
        >
          {recommendations.map((rec) => (
            <RecommendationCard key={rec.id} rec={rec} />
          ))}
        </div>
      )}
    </div>
  )
}

