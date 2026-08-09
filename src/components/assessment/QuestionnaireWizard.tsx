'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { ChevronRight, ChevronLeft, CheckCircle2, Sparkles } from 'lucide-react'
import { PillarIcon } from '@/components/common/PillarIcon'
import Image from 'next/image'
import type { TokenContext } from './TokenValidator'

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

export function QuestionnaireWizard({ tokenContext, token }: QuestionnaireWizardProps) {
  const [step, setStep] = useState<WizardStep>('identity')
  const [currentPillar, setCurrentPillar] = useState(0)
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [nameError, setNameError] = useState('')
  const [roleError, setRoleError] = useState('')
  const [scores, setScores] = useState<Partial<PillarScores>>({})
  const [finalScore, setFinalScore] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [animating, setAnimating] = useState(false)

  const currentPillarData = PILLARS[currentPillar]
  const currentSelection = currentPillarData ? scores[currentPillarData.key] : undefined

  // ─── Keyboard shortcuts ────────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (step !== 'question') return
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
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [step, currentPillar, currentSelection, currentPillarData]
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
    if (valid) {
      setStep('question')
    }
  }

  // ─── Navigation ───────────────────────────────────────────────────────────

  const handleNext = async () => {
    if (currentSelection === undefined) return

    if (animating) return
    setAnimating(true)

    if (currentPillar < PILLARS.length - 1) {
      setTimeout(() => {
        setCurrentPillar((p) => p + 1)
        setAnimating(false)
      }, 200)
    } else {
      // Submit
      await handleSubmit()
      setAnimating(false)
    }
  }

  const handleBack = () => {
    if (currentPillar > 0) {
      setCurrentPillar((p) => p - 1)
    } else {
      setStep('identity')
    }
  }

  // ─── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const payload = {
        token,
        invite_id: tokenContext.invite_id,
        team_id: tokenContext.team_id,
        respondent_name: name.trim(),
        respondent_role: role.trim(),
        tool_usage_score: scores.tool_usage_score!,
        workflow_automation_score: scores.workflow_automation_score!,
        data_literacy_score: scores.data_literacy_score!,
        output_evaluation_score: scores.output_evaluation_score!,
        leadership_buyin_score: scores.leadership_buyin_score!,
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
        <Image
          src="/images/logos/tai-horizontal-primary.png"
          alt="TAI Readiness"
          width={150}
          height={42}
          priority
          style={{ height: '34px', width: 'auto', objectFit: 'contain' }}
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
          <div style={{ padding: '20px 32px 0' }}>
            <AssessmentProgressBar current={currentPillar} total={PILLARS.length} />
          </div>
        )}

        <div style={{ padding: step === 'question' ? '24px 32px 32px' : '40px 32px 40px' }}>

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
          {step === 'question' && currentPillarData && (
            <div key={currentPillar} className="question-enter" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
                    Pillar {currentPillar + 1} of {PILLARS.length}
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
                    fontSize: '20px',
                    fontWeight: '600',
                    color: 'var(--color-text-primary)',
                    lineHeight: '1.4',
                    margin: '0 0 10px',
                  }}
                >
                  {currentPillarData.question}
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: '1.6' }}>
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
                      gap: '16px',
                      textAlign: 'left',
                      width: '100%',
                      cursor: 'pointer',
                    }}
                  >
                    <div className="likert-number">{option.value}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                          {option.label}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                          / {option.sublabel}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
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
              <p style={{ fontSize: '12px', color: 'var(--color-text-disabled)', textAlign: 'center', margin: 0 }}>
                Press <kbd style={{ padding: '1px 6px', border: '1px solid var(--color-border)', borderRadius: '3px', fontSize: '11px' }}>1</kbd>–
                <kbd style={{ padding: '1px 6px', border: '1px solid var(--color-border)', borderRadius: '3px', fontSize: '11px' }}>4</kbd> to select · 
                <kbd style={{ padding: '1px 6px', border: '1px solid var(--color-border)', borderRadius: '3px', fontSize: '11px', marginLeft: '4px' }}>Enter</kbd> to continue
              </p>

              {/* Navigation */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
                <button
                  className="btn-secondary"
                  onClick={handleBack}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px' }}
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
                    padding: '10px 20px',
                    opacity: currentSelection === undefined ? 0.4 : 1,
                    cursor: currentSelection === undefined ? 'not-allowed' : 'pointer',
                    transition: 'opacity 0.15s ease',
                  }}
                >
                  {submitting ? (
                    'Submitting…'
                  ) : currentPillar === PILLARS.length - 1 ? (
                    <>Submit Assessment <CheckCircle2 size={16} /></>
                  ) : (
                    <>Next <ChevronRight size={16} /></>
                  )}
                </button>
              </div>
            </div>
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
