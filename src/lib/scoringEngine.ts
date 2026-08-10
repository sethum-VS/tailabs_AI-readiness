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
    (pillars.tool_usage_score || 0) +
    (pillars.workflow_automation_score || 0) +
    (pillars.data_literacy_score || 0) +
    (pillars.output_evaluation_score || 0) +
    (pillars.leadership_buyin_score || 0)

  return Math.round((sum / 20) * 100 * 100) / 100
}

export interface TechnicalScores {
  tech_coding_score: number
  tech_ml_concepts_score: number
  tech_infrastructure_score: number
  tech_observability_score: number
  tech_applied_practice_score: number
  tech_deployment_score: number
}

/**
 * Calculate technical score out of 30.
 * Sum of the 6 technical competency scores (each 0-6).
 */
export function calculateTechnicalScore(scores: TechnicalScores): number {
  const sum =
    (scores.tech_coding_score || 0) +
    (scores.tech_ml_concepts_score || 0) +
    (scores.tech_infrastructure_score || 0) +
    (scores.tech_observability_score || 0) +
    (scores.tech_applied_practice_score || 0) +
    (scores.tech_deployment_score || 0)
  
  return sum
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

/**
 * Get the recommendation for technical personas based on tech_total_score (0-30).
 */
export function getTechnicalRecommendation(score: number): Recommendation {
  if (score <= 10) {
    return {
      id: 'tech_beginner',
      pillar: 'tech',
      title: 'Beginner Builder',
      description: 'Focus on Python fundamentals, APIs, and recreating simple RAG examples using public tutorials.',
      action_label: 'Start Python & API Tutorials',
      action_url: null,
      pillarScore: score
    }
  }
  
  if (score <= 20) {
    return {
      id: 'tech_intermediate',
      pillar: 'tech',
      title: 'Intermediate Builder',
      description: 'Execute the 7-Day Challenge: Build a local command-line chatbot, add a local FAISS vector store, deploy with FastAPI, and containerize with Docker.',
      action_label: 'Start the 7-Day Challenge',
      action_url: null,
      pillarScore: score
    }
  }

  return {
    id: 'tech_applied',
    pillar: 'tech',
    title: 'Applied AI-Ready',
    description: 'Focus on observability, latency optimization, and cost tracking. Ready to deploy real AI systems, not just demos.',
    action_label: 'Prepare for Production',
    action_url: null,
    pillarScore: score
  }
}

// ─── Pillar Label Mapping ─────────────────────────────────────────────────────

import { Wrench, Workflow, BarChart3, SearchCheck, Target, Code, type LucideIcon } from 'lucide-react'

export const PILLAR_LABELS: Record<string, string> = {
  tool_usage: 'Tool Usage',
  workflow_automation: 'Workflow Automation',
  data_literacy: 'Data Literacy',
  output_evaluation: 'Output Evaluation',
  leadership_buyin: 'Leadership Buy-in',
  tech: 'Technical Implementation',
}

export const PILLAR_ICONS: Record<string, LucideIcon> = {
  tool_usage: Wrench,
  workflow_automation: Workflow,
  data_literacy: BarChart3,
  output_evaluation: SearchCheck,
  leadership_buyin: Target,
  tech: Code,
}

