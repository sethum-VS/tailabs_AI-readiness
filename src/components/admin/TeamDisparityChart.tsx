'use client'

import { useState, useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

import { getScoreStatus, STATUS_COLORS } from '@/lib/scoringEngine'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts'

interface TeamBarData {
  name: string
  score: number
  response_count: number
}

interface TeamDisparityChartProps {
  teams: TeamBarData[]
  loading?: boolean
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: TeamBarData }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null
  const data = payload[0].payload
  const score = payload[0].value
  const status = getScoreStatus(score)
  const color = STATUS_COLORS[status]

  return (
    <div
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        padding: '12px 16px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        fontFamily: 'var(--font-family)',
      }}
    >
      <p style={{ fontWeight: '600', color: 'var(--color-text-primary)', margin: '0 0 6px', fontSize: '14px' }}>
        {label}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }} />
        <span style={{ fontSize: '20px', fontWeight: '700', color }}>
          {score.toFixed(1)}%
        </span>
      </div>
      <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
        {data.response_count} response{data.response_count !== 1 ? 's' : ''}
      </p>
    </div>
  )
}

export function TeamDisparityChart({ teams, loading = false }: TeamDisparityChartProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (loading) {
    return (
      <div className="oxygen-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', padding: '24px' }}>
        <Skeleton className="h-5 w-48 mb-4" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, justifyContent: 'center' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-4 w-10" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (teams.length === 0) {
    return (
      <div
        className="oxygen-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          minHeight: '240px',
          color: 'var(--color-text-secondary)',
          fontSize: '14px',
        }}
      >
        No team data yet
      </div>
    )
  }

  const chartData = [...teams]
    .sort((a, b) => b.score - a.score)
    .map((t) => ({
      ...t,
      score: Math.round(t.score * 100) / 100,
    }))

  const barHeight = 44
  const chartHeight = Math.max(180, chartData.length * (barHeight + 12) + 30)

  return (
    <div className="oxygen-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 4px', color: 'var(--color-text-primary)' }}>
          Team Readiness Disparity
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
          Comparative AI readiness scores across all departments
        </p>
      </div>

      <div style={{ padding: '16px 8px 16px 0', flex: 1, display: 'flex', alignItems: 'center' }}>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 0, right: 50, left: isMobile ? 4 : 8, bottom: 0 }}
            barSize={barHeight - 12}
          >
            <CartesianGrid
              horizontal={false}
              strokeDasharray="3 3"
              stroke="var(--color-border)"
            />
            <XAxis
              type="number"
              domain={[0, 100]}
              tickCount={6}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: 'var(--color-text-secondary)', fontFamily: 'var(--font-family)' }}
              tickFormatter={(v) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={isMobile ? 75 : 100}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: isMobile ? 11 : 13, fill: 'var(--color-text-primary)', fontFamily: 'var(--font-family)', fontWeight: 500 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(34,34,40,0.03)' }} />
            <Bar dataKey="score" radius={[0, 4, 4, 0]}>
              {chartData.map((entry) => {
                const status = getScoreStatus(entry.score)
                return <Cell key={entry.name} fill={STATUS_COLORS[status]} fillOpacity={0.85} />
              })}
              <LabelList
                dataKey="score"
                position="right"
                formatter={(v: unknown) => `${Number(v).toFixed(0)}%`}
                style={{ fontSize: '11px', fontWeight: '600', fontFamily: 'var(--font-family)', fill: 'var(--color-text-primary)' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          padding: '12px 20px',
          borderTop: '1px solid var(--color-border)',
          flexWrap: 'wrap',
        }}
      >
        {[
          { color: '#4CAF50', label: 'High (>70%)' },
          { color: '#FF7300', label: 'Developing (40–70%)' },
          { color: '#F44336', label: 'Needs Focus (<40%)' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: color }} />
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

