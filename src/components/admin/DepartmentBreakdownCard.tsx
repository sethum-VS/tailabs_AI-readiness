'use client'

import { Code, Brain, Server, Activity, Rocket, Wrench, RefreshCw, BarChart2, Search, Target } from 'lucide-react'
import { PillarIcon } from '@/components/common/PillarIcon'

export interface DepartmentPillars {
  // Non-tech
  tool_usage?: number
  workflow_automation?: number
  data_literacy?: number
  output_evaluation?: number
  leadership_buyin?: number
  // Tech
  coding?: number
  ml_concepts?: number
  infrastructure?: number
  observability?: number
  applied_practice?: number
}

export interface DepartmentCardProps {
  id: string
  name: string
  aggregate_score: number
  target_seats: number
  response_count: number
  is_tech?: boolean
  pillar_averages: DepartmentPillars
}

export function DepartmentBreakdownCard({
  name,
  aggregate_score,
  target_seats,
  response_count,
  is_tech,
  pillar_averages,
}: DepartmentCardProps) {
  const isTechnical = is_tech || name === 'Engineering' || name === 'Data' || 'coding' in pillar_averages

  const pillars: Array<{ key: string; label: string; score: number; Icon: any; pillarKey?: string }> = isTechnical
    ? [
        { key: 'coding', label: 'Coding', score: pillar_averages.coding ?? 0, Icon: Code },
        { key: 'ml_concepts', label: 'ML Concepts', score: pillar_averages.ml_concepts ?? 0, Icon: Brain },
        { key: 'infrastructure', label: 'Infrastructure', score: pillar_averages.infrastructure ?? 0, Icon: Server },
        { key: 'observability', label: 'Observability', score: pillar_averages.observability ?? 0, Icon: Activity },
        { key: 'applied_practice', label: 'Applied Practice', score: pillar_averages.applied_practice ?? 0, Icon: Rocket },
      ]
    : [
        { key: 'tool_usage', label: 'Tool Usage', score: pillar_averages.tool_usage ?? 0, Icon: Wrench, pillarKey: 'tool_usage' },
        { key: 'workflow_automation', label: 'Workflow', score: pillar_averages.workflow_automation ?? 0, Icon: RefreshCw, pillarKey: 'workflow_automation' },
        { key: 'data_literacy', label: 'Data Literacy', score: pillar_averages.data_literacy ?? 0, Icon: BarChart2, pillarKey: 'data_literacy' },
        { key: 'output_evaluation', label: 'Output Eval', score: pillar_averages.output_evaluation ?? 0, Icon: Search, pillarKey: 'output_evaluation' },
        { key: 'leadership_buyin', label: 'Leadership', score: pillar_averages.leadership_buyin ?? 0, Icon: Target, pillarKey: 'leadership_buyin' },
      ]

  const scoreColor =
    aggregate_score >= 70 ? '#4CAF50' :
    aggregate_score >= 40 ? '#FF7300' : '#F44336'

  return (
    <div className="oxygen-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: 'var(--color-text-primary)' }}>{name}</h4>
        <span style={{ fontSize: '20px', fontWeight: '700', color: scoreColor }}>
          {aggregate_score.toFixed(0)}%
        </span>
      </div>
      <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
        {response_count} / {target_seats} responses
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {pillars.map(({ key, label, score, Icon, pillarKey }) => (
          <div key={key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {pillarKey ? (
                  <PillarIcon pillar={pillarKey} size={14} />
                ) : (
                  <Icon size={14} color="var(--color-brand-accent)" />
                )}
                <span>{label}</span>
              </span>
              <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--color-text-primary)' }}>{score}%</span>
            </div>
            <div style={{ height: '4px', background: 'var(--color-border)', borderRadius: '999px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, Math.max(0, score))}%`,
                  background: score >= 70 ? '#4CAF50' : score >= 40 ? '#FF7300' : '#F44336',
                  borderRadius: '999px',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
