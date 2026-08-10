'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { ChevronRight, ChevronLeft, CheckCircle2, Sparkles, Server, Lock } from 'lucide-react'
import { PillarIcon } from '@/components/common/PillarIcon'
import Image from 'next/image'
import type { TokenContext } from './TokenValidator'
import { TECHNICAL_SCENARIO, type VectorScores } from './technicalScenarioConfig'
import type { AssessmentSchemaPayload } from '@/lib/defaultTemplates'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PillarScores {
  tool_usage_score: number
  workflow_automation_score: number
  data_literacy_score: number
  output_evaluation_score: number
  leadership_buyin_score: number
}

type PillarKey = keyof PillarScores
type WizardStep = 'identity' | 'question' | 'success'

// ─── Assessment Questions ─────────────────────────────────────────────────────

const PILLARS: Array<{
  key: PillarKey
  pillarKey: string
  pillar: string
  question: string
  helper: string
}> = [
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

const LIKERT_OPTIONS = [
  {
    value: 1,
    label: 'Never',
    sublabel: 'Novice',
    description: 'I rarely or never use AI for this',
  },
  {
    value: 2,
    label: 'Occasionally',
    sublabel: 'Developing',
    description: 'I use it sometimes but inconsistently',
  },
  {
    value: 3,
    label: 'Regularly',
    sublabel: 'Proficient',
    description: 'I use it most of the time with confidence',
  },
  {
    value: 4,
    label: 'Daily',
    sublabel: 'Expert',
    description: 'It\'s deeply embedded in my daily workflow',
  },
]

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function AssessmentProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((current / total) * 100)
  return (
    <div style={{ width: '100%' }}>
      <div className="assessment-progress-bar">
        <div className="assessment-progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '8px',
          fontSize: '12px',
          color: 'var(--color-text-secondary)',
        }}
      >
        <span>Question {Math.min(current + 1, total)} of {total}</span>
        <span style={{ color: 'var(--color-brand-accent)', fontWeight: '600' }}>{pct}% complete</span>
      </div>
    </div>
  )
}

// ─── Success Screen ───────────────────────────────────────────────────────────

function SuccessScreen({
  name,
  score,
  teamName,
}: {
  name: string
  score: number
  teamName: string
}) {
  const status =
    score >= 70 ? { label: 'High Readiness', color: 'var(--color-success)', bg: 'rgba(76,175,80,0.08)' } :
    score >= 40 ? { label: 'Developing', color: 'var(--color-warning)', bg: 'rgba(255,115,0,0.08)' } :
                  { label: 'Needs Focus', color: 'var(--color-danger)', bg: 'rgba(244,67,54,0.08)' }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '24px',
        padding: '16px 0',
      }}
      className="question-enter"
    >
      {/* Animated checkmark */}
      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'rgba(76, 175, 80, 0.1)',
          border: '2px solid var(--color-success)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CheckCircle2 size={40} color="var(--color-success)" />
      </div>

      <div>
        <h2 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 8px', color: 'var(--color-text-primary)' }}>
          Assessment Complete!
        </h2>
        <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: '1.6' }}>
          Thank you, <strong style={{ color: 'var(--color-text-primary)' }}>{name}</strong>.<br />
          Your response for <strong style={{ color: 'var(--color-brand-accent)' }}>{teamName}</strong> has been recorded.
        </p>
      </div>

      {/* Score card */}
      <div
        style={{
          width: '100%',
          padding: '24px',
          background: status.bg,
          border: `1px solid ${status.color}33`,
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <Sparkles size={20} color={status.color} />
        <div style={{ fontSize: '48px', fontWeight: '700', color: status.color, lineHeight: 1 }}>
          {score.toFixed(0)}%
        </div>
        <div
          style={{
            fontSize: '13px',
            fontWeight: '600',
            color: status.color,
            background: `${status.color}22`,
            padding: '3px 12px',
            borderRadius: '999px',
          }}
        >
          {status.label}
        </div>
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '4px 0 0', lineHeight: '1.5' }}>
          Your individual AI readiness score. Your team&apos;s aggregate score has been updated in real-time.
        </p>
      </div>

      <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
        You may safely close this window. Results are visible to your administrator.
      </p>
    </div>
  )
}

// ─── Main Wizard Component ────────────────────────────────────────────────────

interface QuestionnaireWizardProps {
  tokenContext: TokenContext
  token: string
}

const DEPARTMENTS = ['Engineering', 'Data', 'Product', 'Sales', 'Marketing', 'HR', 'Operations', 'Other']

function resolveDepartmentFromTeamName(teamName?: string): string {
  if (!teamName) return 'Other'
  const normalized = teamName.trim().toLowerCase()
  
  for (const dept of DEPARTMENTS) {
    if (dept === 'Other') continue
    if (normalized.includes(dept.toLowerCase())) {
      return dept
    }
  }

  if (normalized.includes('human resource') || normalized.includes('people') || normalized.includes('talent')) return 'HR'
  if (normalized.includes('ops') || normalized.includes('logistics')) return 'Operations'
  if (normalized.includes('dev') || normalized.includes('tech') || normalized.includes('software')) return 'Engineering'
  if (normalized.includes('analytics') || normalized.includes('bi')) return 'Data'

  return teamName.trim() || 'Other'
}

export function QuestionnaireWizard({ tokenContext, token }: QuestionnaireWizardProps) {
  const [step, setStep] = useState<WizardStep>('identity')
  const [currentPillar, setCurrentPillar] = useState(0)
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [department, setDepartment] = useState(() => resolveDepartmentFromTeamName(tokenContext?.team_name))
  const [nameError, setNameError] = useState('')
  const [roleError, setRoleError] = useState('')
  const [departmentError, setDepartmentError] = useState('')
  const [scores, setScores] = useState<Partial<PillarScores>>({})
  const [finalScore, setFinalScore] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [animating, setAnimating] = useState(false)
  const submittedRef = useRef(false)

  useEffect(() => {
    if (tokenContext?.team_name) {
      setDepartment(resolveDepartmentFromTeamName(tokenContext.team_name))
    }
  }, [tokenContext?.team_name])

  // Technical Scenario State
  const [techScores, setTechScores] = useState<VectorScores>({
    tech_coding_score: 0,
    tech_ml_concepts_score: 0,
    tech_infrastructure_score: 0,
    tech_observability_score: 0,
    tech_applied_practice_score: 0,
    tech_deployment_score: 0,
  })
  const [techStep, setTechStep] = useState(0)
  const [techSelection, setTechSelection] = useState<string | undefined>()
  const [transitionContext, setTransitionContext] = useState<string | undefined>()

  const searchParams = useSearchParams()
  const scenarioParam = searchParams?.get('scenario') || ''

  const [template, setTemplate] = useState<AssessmentSchemaPayload | null>(null)

  useEffect(() => {
    const fetchActiveTemplate = async () => {
      try {
        const scenarioQuery = scenarioParam ? `&scenario=${encodeURIComponent(scenarioParam)}` : ''
        const res = await fetch(`/api/assessment/template?token=${encodeURIComponent(token || '')}&department=${encodeURIComponent(department || 'Engineering')}${scenarioQuery}`)
        if (res.ok) {
          const data = await res.json()
          if (data.template) {
            setTemplate(data.template)
          }
        }
      } catch (err) {
        console.error('Error fetching assessment template:', err)
      }
    }
    fetchActiveTemplate()
  }, [token, department, scenarioParam])

  const activePillars = template?.pillars || PILLARS
  const activeScenario = useMemo(() => {
    if (template?.scenarios && template.scenarios.length > 0) {
      if (template.scenarios.length === 1) {
        return template.scenarios[0]
      }

      // Combine all scenario nodes into a single multi-scenario sequence
      const combinedNodes = template.scenarios.flatMap((sc, scIdx) =>
        (sc.nodes || []).map((node, nodeIdx) => ({
          ...node,
          context: node.context || (nodeIdx === 0 ? `Scenario ${scIdx + 1}: ${sc.title}` : undefined),
        }))
      )

      return {
        scenario_id: 'combined_scenarios',
        title: `Selected Technical Scenarios (${template.scenarios.length} Scenarios)`,
        nodes: combinedNodes,
      }
    }
    return template?.scenario || TECHNICAL_SCENARIO
  }, [template])

  const isTechRole = department === 'Engineering' || department === 'Data'
  const currentPillarData = activePillars[currentPillar]
  const currentSelection = currentPillarData ? scores[currentPillarData.key] : undefined
  const currentTechNode = activeScenario.nodes[techStep]

  // ─── Keyboard shortcuts ────────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (step !== 'question') return
      
      if (isTechRole) {
        if (e.key === 'Enter' && techSelection !== undefined) {
          handleNext()
        }
        if (e.key === 'ArrowLeft' && techStep > 0) {
          handleBack()
        }
      } else {
        const num = parseInt(e.key)
        if (num >= 1 && num <= 4 && currentPillarData) {
          setScores((s) => ({ ...s, [currentPillarData.key]: num }))
        }
        if (e.key === 'Enter' && currentSelection !== undefined) {
          handleNext()
        }
        if (e.key === 'ArrowLeft' && currentPillar > 0) {
          handleBack()
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [step, currentPillar, currentSelection, currentPillarData, isTechRole, techSelection, techStep]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // ─── Identity step submit ──────────────────────────────────────────────────

  const handleBeginAssessment = () => {
    let valid = true
    if (!name.trim()) {
      setNameError('Full name is required')
      valid = false
    } else {
      setNameError('')
    }
    if (!role.trim()) {
      setRoleError('Job role is required')
      valid = false
    } else {
      setRoleError('')
    }
    if (!department) {
      setDepartmentError('Department is required')
      valid = false
    } else {
      setDepartmentError('')
    }
    if (valid) {
      setStep('question')
    }
  }

  // ─── Navigation ───────────────────────────────────────────────────────────

  const handleNext = async () => {
    if (animating) return
    setAnimating(true)

    if (isTechRole) {
      if (!techSelection) {
        setAnimating(false)
        return
      }

      const selectedOption = currentTechNode.options.find(o => o.id === techSelection)
      let updatedScores = { ...techScores }

      if (selectedOption) {
        updatedScores = {
          tech_coding_score: (techScores.tech_coding_score || 0) + (selectedOption.vectors.tech_coding_score || 0),
          tech_ml_concepts_score: (techScores.tech_ml_concepts_score || 0) + (selectedOption.vectors.tech_ml_concepts_score || 0),
          tech_infrastructure_score: (techScores.tech_infrastructure_score || 0) + (selectedOption.vectors.tech_infrastructure_score || 0),
          tech_observability_score: (techScores.tech_observability_score || 0) + (selectedOption.vectors.tech_observability_score || 0),
          tech_applied_practice_score: (techScores.tech_applied_practice_score || 0) + (selectedOption.vectors.tech_applied_practice_score || 0),
          tech_deployment_score: (techScores.tech_deployment_score || 0) + (selectedOption.vectors.tech_deployment_score || 0),
        }
        setTechScores(updatedScores)
      }

      if (techStep < activeScenario.nodes.length - 1) {
        setTransitionContext(selectedOption?.next_context)
        setTimeout(() => {
          setTechStep((p) => p + 1)
          setTechSelection(undefined)
          setAnimating(false)
        }, 200)
      } else {
        await handleSubmit(updatedScores)
        setAnimating(false)
      }
    } else {
      if (currentSelection === undefined) {
        setAnimating(false)
        return
      }
      
      if (currentPillar < activePillars.length - 1) {
        setTimeout(() => {
          setCurrentPillar((p) => p + 1)
          setAnimating(false)
        }, 200)
      } else {
        await handleSubmit()
        setAnimating(false)
      }
    }
  }

  const handleBack = () => {
    if (isTechRole) {
      if (techStep > 0) {
        setTransitionContext(undefined)
        setTechStep((p) => p - 1)
        setTechSelection(undefined)
      } else {
        setStep('identity')
      }
    } else {
      if (currentPillar > 0) {
        setCurrentPillar((p) => p - 1)
      } else {
        setStep('identity')
      }
    }
  }

  // ─── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (finalTechScores?: VectorScores) => {
    // Guard against duplicate rapid-fire submissions
    if (submittedRef.current) return
    submittedRef.current = true
    setSubmitting(true)
    try {
      // Build payload with only the relevant score fields for the persona type.
      // Non-tech roles: send only the 5 pillar scores (never tech_* fields).
      // Tech roles: send only the 6 tech scores (never pillar fields).
      // This prevents cross-contamination of score types in the database.
      const basePayload = {
        token,
        invite_id: tokenContext.invite_id,
        team_id: tokenContext.team_id,
        respondent_name: name.trim(),
        respondent_role: role.trim(),
        respondent_department: department,
      }

      const payload = isTechRole
        ? {
            ...basePayload,
            // Tech persona: only 6 technical vector scores
            ...(finalTechScores || techScores),
          }
        : {
            ...basePayload,
            // Non-tech persona: only 5 Likert pillar scores
            tool_usage_score: scores.tool_usage_score,
            workflow_automation_score: scores.workflow_automation_score,
            data_literacy_score: scores.data_literacy_score,
            output_evaluation_score: scores.output_evaluation_score,
            leadership_buyin_score: scores.leadership_buyin_score,
          }

      const res = await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (data.success) {
        setFinalScore(data.individual_score)
        setStep('success')
        toast.success('Assessment submitted!', {
          description: `Your score: ${data.individual_score.toFixed(0)}%`,
        })
      } else {
        toast.error(data.error || 'Failed to submit assessment')
      }
    } catch {
      toast.error('Network error — please check your connection and try again')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg-app)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '32px 16px 80px',
      }}
    >
      {/* ─── Logo Header ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Image
          src="/images/logos/tai-horizontal-primary.png"
          alt="TAI Readiness"
          width={150}
          height={42}
          priority
          style={{ height: '30px', width: 'auto', objectFit: 'contain' }}
        />
        <div style={{ borderLeft: '1px solid var(--color-border)', paddingLeft: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
            Assessment
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
            {tokenContext.organization_name} · {tokenContext.team_name}
          </div>
        </div>
      </div>

      {/* ─── Card ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          width: '100%',
          maxWidth: '600px',
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-elevated)',
          overflow: 'hidden',
        }}
      >
        {/* Progress bar pinned to top of card */}
        {step === 'question' && (
          <div style={{ padding: '16px 20px 0' }}>
            <AssessmentProgressBar 
              current={isTechRole ? techStep : currentPillar} 
              total={isTechRole ? activeScenario.nodes.length : activePillars.length} 
            />
          </div>
        )}

        <div style={{ padding: step === 'question' ? '20px 20px 24px' : '28px 20px 28px' }}>

          {/* ─── Identity Step ────────────────────────────────────────────── */}
          {step === 'identity' && (
            <div className="question-enter" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <div>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--color-brand-accent)',
                    marginBottom: '12px',
                  }}
                >
                  AI Readiness Assessment · 5 Questions
                </div>
                <h1
                  style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: 'var(--color-text-primary)',
                    margin: '0 0 12px',
                    lineHeight: '1.3',
                  }}
                >
                  Let&apos;s get started
                </h1>
                <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: '1.6' }}>
                  This assessment takes ~3 minutes. You&apos;ll answer 5 questions about your AI usage across key dimensions. Your responses help your organization build a targeted AI enablement plan.
                </p>
              </div>

              {/* Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label
                  htmlFor="respondent-name"
                  style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-text-primary)' }}
                >
                  Full Name <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  id="respondent-name"
                  type="text"
                  placeholder="e.g. Alex Johnson"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleBeginAssessment()}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '15px',
                    border: `1px solid ${nameError ? 'var(--color-danger)' : 'var(--color-border-input)'}`,
                    borderRadius: '4px',
                    color: 'var(--color-text-primary)',
                    background: 'var(--color-bg-card)',
                    outline: 'none',
                    fontFamily: 'var(--font-family)',
                    transition: 'border-color 0.15s ease',
                  }}
                />
                {nameError && (
                  <span style={{ fontSize: '12px', color: 'var(--color-danger)' }}>{nameError}</span>
                )}
              </div>

              {/* Role */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label
                  htmlFor="respondent-role"
                  style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-text-primary)' }}
                >
                  Job Role <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  id="respondent-role"
                  type="text"
                  placeholder="e.g. Senior Product Manager"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleBeginAssessment()}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '15px',
                    border: `1px solid ${roleError ? 'var(--color-danger)' : 'var(--color-border-input)'}`,
                    borderRadius: '4px',
                    color: 'var(--color-text-primary)',
                    background: 'var(--color-bg-card)',
                    outline: 'none',
                    fontFamily: 'var(--font-family)',
                    transition: 'border-color 0.15s ease',
                  }}
                />
                {roleError && (
                  <span style={{ fontSize: '12px', color: 'var(--color-danger)' }}>{roleError}</span>
                )}
              </div>

              {/* Department (Auto-filled & Locked) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label
                    htmlFor="respondent-department"
                    style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-text-primary)' }}
                  >
                    Department <span style={{ color: 'var(--color-danger)' }}>*</span>
                  </label>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '500',
                      color: 'var(--color-text-secondary)',
                      background: 'var(--color-bg-card-hover)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <Lock size={11} color="var(--color-brand-accent)" /> Assigned to invite link
                  </span>
                </div>
                <div style={{ position: 'relative' }}>
                  <select
                    id="respondent-department"
                    value={department}
                    disabled
                    style={{
                      width: '100%',
                      padding: '10px 36px 10px 14px',
                      fontSize: '15px',
                      border: '1px solid var(--color-border-input)',
                      borderRadius: '4px',
                      color: 'var(--color-text-primary)',
                      background: 'var(--color-bg-card-hover)',
                      outline: 'none',
                      fontFamily: 'var(--font-family)',
                      appearance: 'none',
                      cursor: 'not-allowed',
                      opacity: 0.9,
                    }}
                  >
                    {!department && <option value="" disabled>Select a department</option>}
                    <option value="Engineering">Engineering</option>
                    <option value="Data">Data</option>
                    <option value="Product">Product</option>
                    <option value="Sales">Sales</option>
                    <option value="Marketing">Marketing</option>
                    <option value="HR">HR</option>
                    <option value="Operations">Operations</option>
                    <option value="Other">Other</option>
                    {department && !['Engineering', 'Data', 'Product', 'Sales', 'Marketing', 'HR', 'Operations', 'Other'].includes(department) && (
                      <option value={department}>{department}</option>
                    )}
                  </select>
                  <Lock
                    size={14}
                    style={{
                      position: 'absolute',
                      right: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--color-text-disabled)',
                      pointerEvents: 'none',
                    }}
                  />
                </div>
              </div>

              <button
                className="btn-primary"
                onClick={handleBeginAssessment}
                style={{ width: '100%', padding: '12px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                Begin Assessment
                <ChevronRight size={18} />
              </button>

              <p style={{ fontSize: '12px', color: 'var(--color-text-disabled)', textAlign: 'center', margin: 0 }}>
                Your individual responses are confidential. Only aggregate team scores are visible to administrators.
              </p>
            </div>
          )}

          {/* ─── Question Step ────────────────────────────────────────────── */}
          {step === 'question' && (
            isTechRole ? (
              // TECH FLOW
              currentTechNode && (
                <div key={techStep} className="question-enter" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Pillar label for Tech */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: 'rgba(255, 115, 0, 0.1)',
                        border: '1px solid rgba(255, 115, 0, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Server size={20} color="var(--color-brand-accent)" />
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: '11px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: 'var(--color-brand-accent)',
                        }}
                      >
                        Step {techStep + 1} of {activeScenario.nodes.length}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
                        {activeScenario.title}
                      </div>
                    </div>
                  </div>

                  {/* Context Transition */}
                  {transitionContext && (
                    <div style={{ padding: '12px 16px', background: 'var(--color-bg-card-hover)', borderRadius: '8px', borderLeft: '3px solid var(--color-brand-accent)' }}>
                      <p style={{ fontSize: '14px', color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.5 }}>
                        {transitionContext}
                      </p>
                    </div>
                  )}

                  {currentTechNode.context && !transitionContext && (
                    <div style={{ padding: '12px 16px', background: 'var(--color-bg-card-hover)', borderRadius: '8px', borderLeft: '3px solid var(--color-brand-accent)' }}>
                      <p style={{ fontSize: '14px', color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.5 }}>
                        {currentTechNode.context}
                      </p>
                    </div>
                  )}

                  {/* Question */}
                  <div>
                    <h2
                      style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: 'var(--color-text-primary)',
                        lineHeight: '1.4',
                        margin: '0 0 8px',
                      }}
                    >
                      {currentTechNode.prompt}
                    </h2>
                  </div>

                  {/* Options */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {currentTechNode.options.map((option) => (
                      <button
                        key={option.id}
                        className={`likert-card ${techSelection === option.id ? 'selected' : ''}`}
                        onClick={() => setTechSelection(option.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          textAlign: 'left',
                          width: '100%',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: '14px', fontWeight: '500', color: techSelection === option.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                            {option.text}
                          </span>
                        </div>
                        {techSelection === option.id && (
                          <CheckCircle2 size={18} color="var(--color-brand-accent)" style={{ flexShrink: 0 }} />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Keyboard hint */}
                  <p className="keyboard-hint" style={{ fontSize: '12px', color: 'var(--color-text-disabled)', textAlign: 'center', margin: 0 }}>
                    Select an option · 
                    <kbd style={{ padding: '1px 6px', border: '1px solid var(--color-border)', borderRadius: '3px', fontSize: '11px', marginLeft: '4px' }}>Enter</kbd> to continue
                  </p>

                  {/* Navigation */}
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
                    <button
                      className="btn-secondary"
                      onClick={handleBack}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px' }}
                    >
                      <ChevronLeft size={16} />
                      Back
                    </button>
                    <button
                      className="btn-primary"
                      onClick={handleNext}
                      disabled={techSelection === undefined || submitting}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        opacity: techSelection === undefined ? 0.4 : 1,
                        cursor: techSelection === undefined ? 'not-allowed' : 'pointer',
                        transition: 'opacity 0.15s ease',
                      }}
                    >
                      {submitting ? (
                        'Submitting…'
                      ) : techStep === activeScenario.nodes.length - 1 ? (
                        <>Submit Assessment <CheckCircle2 size={16} /></>
                      ) : (
                        <>Next <ChevronRight size={16} /></>
                      )}
                    </button>
                  </div>
                </div>
              )
            ) : (
              // BEHAVIORAL FLOW
              currentPillarData && (
                <div key={currentPillar} className="question-enter" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Pillar label */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: 'rgba(255, 115, 0, 0.1)',
                        border: '1px solid rgba(255, 115, 0, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <PillarIcon pillar={currentPillarData.pillarKey} size={20} color="var(--color-brand-accent)" />
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: '11px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: 'var(--color-brand-accent)',
                        }}
                      >
                        Pillar {currentPillar + 1} of {activePillars.length}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
                        {currentPillarData.pillar}
                      </div>
                    </div>
                  </div>

                  {/* Question */}
                  <div>
                    <h2
                      style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: 'var(--color-text-primary)',
                        lineHeight: '1.4',
                        margin: '0 0 8px',
                      }}
                    >
                      {currentPillarData.question}
                    </h2>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: '1.5' }}>
                      {currentPillarData.helper}
                    </p>
                  </div>

                  {/* Likert Cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {LIKERT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        className={`likert-card ${currentSelection === option.value ? 'selected' : ''}`}
                        onClick={() =>
                          setScores((s) => ({ ...s, [currentPillarData.key]: option.value }))
                        }
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          textAlign: 'left',
                          width: '100%',
                          cursor: 'pointer',
                        }}
                      >
                        <div className="likert-number">{option.value}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                              {option.label}
                            </span>
                            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                              / {option.sublabel}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                            {option.description}
                          </div>
                        </div>
                        {currentSelection === option.value && (
                          <CheckCircle2 size={18} color="var(--color-brand-accent)" style={{ flexShrink: 0 }} />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Keyboard hint */}
                  <p className="keyboard-hint" style={{ fontSize: '12px', color: 'var(--color-text-disabled)', textAlign: 'center', margin: 0 }}>
                    Press <kbd style={{ padding: '1px 6px', border: '1px solid var(--color-border)', borderRadius: '3px', fontSize: '11px' }}>1</kbd>–
                    <kbd style={{ padding: '1px 6px', border: '1px solid var(--color-border)', borderRadius: '3px', fontSize: '11px' }}>4</kbd> to select · 
                    <kbd style={{ padding: '1px 6px', border: '1px solid var(--color-border)', borderRadius: '3px', fontSize: '11px', marginLeft: '4px' }}>Enter</kbd> to continue
                  </p>

                  {/* Navigation */}
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
                    <button
                      className="btn-secondary"
                      onClick={handleBack}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px' }}
                    >
                      <ChevronLeft size={16} />
                      Back
                    </button>
                    <button
                      className="btn-primary"
                      onClick={handleNext}
                      disabled={currentSelection === undefined || submitting}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        opacity: currentSelection === undefined ? 0.4 : 1,
                        cursor: currentSelection === undefined ? 'not-allowed' : 'pointer',
                        transition: 'opacity 0.15s ease',
                      }}
                    >
                      {submitting ? (
                        'Submitting…'
                      ) : currentPillar === activePillars.length - 1 ? (
                        <>Submit Assessment <CheckCircle2 size={16} /></>
                      ) : (
                        <>Next <ChevronRight size={16} /></>
                      )}
                    </button>
                  </div>
                </div>
              )
            )
          )}


          {/* ─── Success Step ─────────────────────────────────────────────── */}
          {step === 'success' && (
            <SuccessScreen name={name} score={finalScore} teamName={tokenContext.team_name} />
          )}

        </div>
      </div>
    </div>
  )
}
