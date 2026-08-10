import { TECHNICAL_SCENARIO } from '@/components/assessment/technicalScenarioConfig'

export interface PillarQuestion {
  key: 'tool_usage_score' | 'workflow_automation_score' | 'data_literacy_score' | 'output_evaluation_score' | 'leadership_buyin_score'
  pillarKey: string
  pillar: string
  question: string
  helper: string
}

export interface VectorScores {
  tech_coding_score?: number
  tech_ml_concepts_score?: number
  tech_infrastructure_score?: number
  tech_observability_score?: number
  tech_applied_practice_score?: number
  tech_deployment_score?: number
}

export interface ScenarioOption {
  id: string
  text: string
  vectors: VectorScores
  next_context: string
}

export interface ScenarioNode {
  step: number
  pillar_focus: string
  context?: string
  prompt: string
  options: ScenarioOption[]
}

export interface ScenarioConfig {
  scenario_id: string
  title: string
  nodes: ScenarioNode[]
}

export interface AssessmentSchemaPayload {
  pillars: PillarQuestion[]
  scenario?: ScenarioConfig
  scenarios?: ScenarioConfig[]
}

export const DEFAULT_PILLARS: PillarQuestion[] = [
  {
    key: 'tool_usage_score',
    pillarKey: 'tool_usage',
    pillar: 'Tool Usage',
    question: 'How frequently do you use AI to generate first drafts, write code, or summarize complex data?',
    helper: 'Think about tools like Claude, ChatGPT, GitHub Copilot, or any AI assistant in your daily work.',
  },
  {
    key: 'workflow_automation_score',
    pillarKey: 'workflow_automation',
    pillar: 'Workflow Automation',
    question: 'Do you currently use AI as a standalone chat tool, or is it embedded in your daily workflows (e.g., Zapier, CRM, IDE, terminal)?',
    helper: 'Consider how integrated AI is into your actual work processes vs. occasional manual queries.',
  },
  {
    key: 'data_literacy_score',
    pillarKey: 'data_literacy',
    pillar: 'Data Literacy',
    question: 'How confident are you in writing structured prompts that include system context, precise formatting rules, and edge-case constraints?',
    helper: 'This measures your ability to communicate precisely with AI systems to get reliable, structured outputs.',
  },
  {
    key: 'output_evaluation_score',
    pillarKey: 'output_evaluation',
    pillar: 'Output Evaluation',
    question: 'When an AI model provides an answer, how strictly do you evaluate it for hallucinations, logical errors, and data privacy compliance before deployment?',
    helper: 'Consider your process for verifying AI outputs before using them in real work or sharing with others.',
  },
  {
    key: 'leadership_buyin_score',
    pillarKey: 'leadership_buyin',
    pillar: 'Leadership Buy-in',
    question: 'Does your immediate manager actively encourage, incentivize, or mandate using AI to reduce operational drag?',
    helper: 'Reflect on whether AI adoption is supported, rewarded, or required by your leadership team.',
  },
]

export const DEFAULT_ENGINEERING_TEMPLATE: AssessmentSchemaPayload = {
  pillars: DEFAULT_PILLARS,
  scenario: TECHNICAL_SCENARIO,
  scenarios: [TECHNICAL_SCENARIO],
}

export const DEFAULT_GENERAL_TEMPLATE: AssessmentSchemaPayload = {
  pillars: DEFAULT_PILLARS,
}

export function getDefaultTemplate(departmentType: string): AssessmentSchemaPayload {
  if (departmentType === 'Engineering' || departmentType === 'Data') {
    return DEFAULT_ENGINEERING_TEMPLATE
  }
  return DEFAULT_GENERAL_TEMPLATE
}
