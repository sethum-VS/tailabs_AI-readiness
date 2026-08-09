// ─── Types ───────────────────────────────────────────────────────────────────

export interface PillarScores {
  tool_usage_score: number
  workflow_automation_score: number
  data_literacy_score: number
  output_evaluation_score: number
  leadership_buyin_score: number
}

export interface TeamPillarAverages {
  tool_usage: number
  workflow_automation: number
  data_literacy: number
  output_evaluation: number
  leadership_buyin: number
}

export interface Recommendation {
  id: string
  pillar: string
  title: string
  description: string
  action_label: string
  action_url: string | null
  pillarScore: number
}

export type ScoreStatus = 'danger' | 'warning' | 'success'

// ─── Score Calculation ────────────────────────────────────────────────────────

/**
 * Calculate individual assessment score as a percentage (0–100).
 * Formula: (sum of 5 pillar scores / 20) * 100
 */
export function calculateIndividualScore(pillars: PillarScores): number {
  const sum =
    pillars.tool_usage_score +
    pillars.workflow_automation_score +
    pillars.data_literacy_score +
    pillars.output_evaluation_score +
    pillars.leadership_buyin_score

  return Math.round((sum / 20) * 100 * 100) / 100
}

/**
 * Convert a raw 1–4 Likert score for a pillar into a percentage (0–100).
 * A score of 1 = 25%, 4 = 100%.
 */
export function pillarToPercent(score: number): number {
  return Math.round((score / 4) * 100 * 100) / 100
}

// ─── Status Color Mapping ─────────────────────────────────────────────────────

/**
 * Map a score percentage to a semantic status for UI coloring.
 * < 40  → danger  (Red  #F44336)
 * 40–70 → warning (Orange #FF7300)
 * > 70  → success (Green #4CAF50)
 */
export function getScoreStatus(score: number): ScoreStatus {
  if (score < 40) return 'danger'
  if (score <= 70) return 'warning'
  return 'success'
}

export const STATUS_COLORS: Record<ScoreStatus, string> = {
  danger: '#F44336',
  warning: '#FF7300',
  success: '#4CAF50',
}

export const STATUS_BG_COLORS: Record<ScoreStatus, string> = {
  danger: 'rgba(244, 67, 54, 0.1)',
  warning: 'rgba(255, 115, 0, 0.1)',
  success: 'rgba(76, 175, 80, 0.1)',
}

export const STATUS_LABELS: Record<ScoreStatus, string> = {
  danger: 'Low Readiness',
  warning: 'Developing',
  success: 'High Readiness',
}

// ─── Recommendation Engine ────────────────────────────────────────────────────

export interface RecommendationRule {
  id: string
  pillar: string
  threshold_max: number
  title: string
  description: string
  action_label: string
  action_url: string | null
}

/**
 * Deterministic recommendation lookup.
 * Evaluates team pillar averages (as percentages) against threshold rules.
 * Returns recommendations for any pillar scoring below threshold_max.
 */
export function getRecommendations(
  teamPillarAverages: TeamPillarAverages,
  rules: RecommendationRule[]
): Recommendation[] {
  const pillarMap: Record<string, number> = {
    data_literacy: teamPillarAverages.data_literacy,
    workflow_automation: teamPillarAverages.workflow_automation,
    output_evaluation: teamPillarAverages.output_evaluation,
    leadership_buyin: teamPillarAverages.leadership_buyin,
    tool_usage: teamPillarAverages.tool_usage,
  }

  return rules
    .filter((rule) => {
      const score = pillarMap[rule.pillar] ?? 100
      return score < rule.threshold_max
    })
    .map((rule) => ({
      id: rule.id,
      pillar: rule.pillar,
      title: rule.title,
      description: rule.description,
      action_label: rule.action_label,
      action_url: rule.action_url,
      pillarScore: pillarMap[rule.pillar] ?? 0,
    }))
    .sort((a, b) => a.pillarScore - b.pillarScore) // worst pillar first
}

// ─── Pillar Label Mapping ─────────────────────────────────────────────────────

import { Wrench, Workflow, BarChart3, SearchCheck, Target, type LucideIcon } from 'lucide-react'

export const PILLAR_LABELS: Record<string, string> = {
  tool_usage: 'Tool Usage',
  workflow_automation: 'Workflow Automation',
  data_literacy: 'Data Literacy',
  output_evaluation: 'Output Evaluation',
  leadership_buyin: 'Leadership Buy-in',
}

export const PILLAR_ICONS: Record<string, LucideIcon> = {
  tool_usage: Wrench,
  workflow_automation: Workflow,
  data_literacy: BarChart3,
  output_evaluation: SearchCheck,
  leadership_buyin: Target,
}

