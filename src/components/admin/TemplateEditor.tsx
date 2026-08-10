'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  FileCode2,
  Sliders,
  RotateCcw,
  Save,
  CheckCircle,
  HelpCircle,
  Code2,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Cpu,
  Plus,
  Trash2,
} from 'lucide-react'
import type {
  AssessmentSchemaPayload,
  PillarQuestion,
  ScenarioConfig,
  ScenarioNode,
  ScenarioOption,
  VectorScores,
} from '@/lib/defaultTemplates'

const VECTOR_KEYS: Array<{ key: keyof VectorScores; label: string }> = [
  { key: 'tech_coding_score', label: 'Coding & Algorithmic Practice' },
  { key: 'tech_ml_concepts_score', label: 'ML Concepts & Reasoning' },
  { key: 'tech_infrastructure_score', label: 'AI Infrastructure' },
  { key: 'tech_observability_score', label: 'Observability & Evaluation' },
  { key: 'tech_applied_practice_score', label: 'Applied AI Patterns' },
  { key: 'tech_deployment_score', label: 'Deployment & MLOps' },
]

export function TemplateEditor() {
  const [isCardCollapsed, setIsCardCollapsed] = useState(true)
  const [activeDepartment, setActiveDepartment] = useState<'Engineering' | 'General'>('Engineering')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [isCustom, setIsCustom] = useState(false)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)

  const [payload, setPayload] = useState<AssessmentSchemaPayload | null>(null)
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({ 1: true })
  const [activeScenarioIdx, setActiveScenarioIdx] = useState<number>(0)

  // Helper to extract scenario list from payload
  const getScenariosList = useCallback((p: AssessmentSchemaPayload | null): ScenarioConfig[] => {
    if (!p) return []
    if (p.scenarios && p.scenarios.length > 0) return p.scenarios
    if (p.scenario) return [p.scenario]
    return []
  }, [])

  // Fetch template for active department
  const fetchTemplate = useCallback(async (dept: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/templates?department_type=${encodeURIComponent(dept)}`)
      if (!res.ok) throw new Error('Failed to load template')
      const data = await res.json()
      setPayload(data.template)
      setIsCustom(data.is_custom)
      setUpdatedAt(data.updated_at)
      setActiveScenarioIdx(0)
    } catch (err) {
      console.error(err)
      toast.error('Could not load assessment template')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTemplate(activeDepartment)
  }, [activeDepartment, fetchTemplate])

  const handleSave = async () => {
    if (!payload) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department_type: activeDepartment,
          schema_payload: payload,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save changes')

      toast.success(`${activeDepartment} assessment template saved!`)
      setIsCustom(true)
      setUpdatedAt(data.updated_at)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error saving template')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset this template to baseline defaults? Any custom modifications will be removed.')) {
      return
    }

    setResetting(true)
    try {
      const res = await fetch(`/api/admin/templates?department_type=${encodeURIComponent(activeDepartment)}`, {
        method: 'DELETE',
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to reset template')

      setPayload(data.template)
      setIsCustom(false)
      setUpdatedAt(null)
      setActiveScenarioIdx(0)
      toast.success(`Reset ${activeDepartment} template to system baseline defaults.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error resetting template')
    } finally {
      setResetting(false)
    }
  }

  // Pillar field update handler
  const handlePillarChange = (index: number, field: keyof PillarQuestion, val: string) => {
    if (!payload) return
    const updatedPillars = [...payload.pillars]
    updatedPillars[index] = { ...updatedPillars[index], [field]: val }
    setPayload({ ...payload, pillars: updatedPillars })
  }

  // Add new scenario
  const handleAddScenario = () => {
    if (!payload) return
    const currentScenarios = getScenariosList(payload)
    const newNum = currentScenarios.length + 1
    const newScenario: ScenarioConfig = {
      scenario_id: `scenario_${Date.now()}`,
      title: `Scenario ${newNum}: Technical System Architecture & MLOps`,
      nodes: [
        {
          step: 1,
          pillar_focus: 'technical_practice',
          context: 'Describe technical challenge or deployment setup for this step...',
          prompt: 'Step 1: How do you architect the system to handle peak load?',
          options: [
            {
              id: '1a',
              text: 'High availability container cluster deployment',
              vectors: { tech_coding_score: 1, tech_infrastructure_score: 1 },
              next_context: 'Container cluster scales up seamlessly under traffic spikes...',
            },
            {
              id: '1b',
              text: 'Serverless event-driven architecture model',
              vectors: { tech_deployment_score: 1, tech_applied_practice_score: 1 },
              next_context: 'Serverless setup handles initial queries but hits cold starts...',
            },
          ],
        },
      ],
    }

    const updatedScenarios = [...currentScenarios, newScenario]
    setPayload({
      ...payload,
      scenario: updatedScenarios[0],
      scenarios: updatedScenarios,
    })
    setActiveScenarioIdx(updatedScenarios.length - 1)
    toast.success(`Created new Scenario ${newNum}`)
  }

  // Delete whole scenario
  const handleDeleteScenario = (sIndex: number) => {
    if (!payload) return
    const currentScenarios = getScenariosList(payload)
    if (currentScenarios.length <= 1) {
      toast.error('Template must retain at least 1 technical scenario.')
      return
    }

    const targetTitle = currentScenarios[sIndex]?.title || `Scenario ${sIndex + 1}`
    if (!confirm(`Are you sure you want to delete "${targetTitle}"?`)) return

    const updatedScenarios = currentScenarios.filter((_, i) => i !== sIndex)
    const nextActive = Math.max(0, Math.min(activeScenarioIdx, updatedScenarios.length - 1))

    setPayload({
      ...payload,
      scenario: updatedScenarios[0],
      scenarios: updatedScenarios,
    })
    setActiveScenarioIdx(nextActive)
    toast.info(`Deleted scenario`)
  }

  // Scenario title change handler
  const handleScenarioTitleChange = (val: string) => {
    if (!payload) return
    const currentScenarios = getScenariosList(payload)
    if (currentScenarios.length === 0) return

    const updatedScenarios = [...currentScenarios]
    const curIdx = Math.min(activeScenarioIdx, updatedScenarios.length - 1)
    updatedScenarios[curIdx] = { ...updatedScenarios[curIdx], title: val }

    setPayload({
      ...payload,
      scenario: updatedScenarios[0],
      scenarios: updatedScenarios,
    })
  }

  // Scenario step field handler
  const handleStepFieldChange = (stepIndex: number, field: keyof ScenarioNode, val: string) => {
    if (!payload) return
    const currentScenarios = getScenariosList(payload)
    if (currentScenarios.length === 0) return

    const updatedScenarios = [...currentScenarios]
    const curIdx = Math.min(activeScenarioIdx, updatedScenarios.length - 1)
    const targetScenario = { ...updatedScenarios[curIdx] }
    const updatedNodes = [...targetScenario.nodes]

    updatedNodes[stepIndex] = { ...updatedNodes[stepIndex], [field]: val }
    targetScenario.nodes = updatedNodes
    updatedScenarios[curIdx] = targetScenario

    setPayload({
      ...payload,
      scenario: updatedScenarios[0],
      scenarios: updatedScenarios,
    })
  }

  // Scenario option field handler
  const handleOptionFieldChange = (
    stepIndex: number,
    optionIndex: number,
    field: keyof ScenarioOption,
    val: string
  ) => {
    if (!payload) return
    const currentScenarios = getScenariosList(payload)
    if (currentScenarios.length === 0) return

    const updatedScenarios = [...currentScenarios]
    const curIdx = Math.min(activeScenarioIdx, updatedScenarios.length - 1)
    const targetScenario = { ...updatedScenarios[curIdx] }
    const updatedNodes = [...targetScenario.nodes]
    const updatedOptions = [...updatedNodes[stepIndex].options]

    updatedOptions[optionIndex] = { ...updatedOptions[optionIndex], [field]: val }
    updatedNodes[stepIndex] = { ...updatedNodes[stepIndex], options: updatedOptions }
    targetScenario.nodes = updatedNodes
    updatedScenarios[curIdx] = targetScenario

    setPayload({
      ...payload,
      scenario: updatedScenarios[0],
      scenarios: updatedScenarios,
    })
  }

  // Scenario option vector score handler
  const handleVectorScoreChange = (
    stepIndex: number,
    optionIndex: number,
    vectorKey: keyof VectorScores,
    val: number
  ) => {
    if (!payload) return
    const currentScenarios = getScenariosList(payload)
    if (currentScenarios.length === 0) return

    const updatedScenarios = [...currentScenarios]
    const curIdx = Math.min(activeScenarioIdx, updatedScenarios.length - 1)
    const targetScenario = { ...updatedScenarios[curIdx] }
    const updatedNodes = [...targetScenario.nodes]
    const updatedOptions = [...updatedNodes[stepIndex].options]
    const currentVectors = { ...updatedOptions[optionIndex].vectors }

    if (val === 0) {
      delete currentVectors[vectorKey]
    } else {
      currentVectors[vectorKey] = val
    }

    updatedOptions[optionIndex] = { ...updatedOptions[optionIndex], vectors: currentVectors }
    updatedNodes[stepIndex] = { ...updatedNodes[stepIndex], options: updatedOptions }
    targetScenario.nodes = updatedNodes
    updatedScenarios[curIdx] = targetScenario

    setPayload({
      ...payload,
      scenario: updatedScenarios[0],
      scenarios: updatedScenarios,
    })
  }

  const toggleStepAccordion = (stepNumber: number) => {
    setExpandedSteps((prev) => ({ ...prev, [stepNumber]: !prev[stepNumber] }))
  }

  // Add new Likert dimension question
  const handleAddPillar = () => {
    if (!payload) return
    const newIndex = payload.pillars.length + 1
    const newPillar: PillarQuestion = {
      key: `custom_pillar_${Date.now()}` as never,
      pillarKey: `custom_pillar_${newIndex}`,
      pillar: `Custom Dimension ${newIndex}`,
      question: 'How frequently do you perform this activity?',
      helper: 'Describe context or guidelines for respondents...',
    }
    setPayload({
      ...payload,
      pillars: [...payload.pillars, newPillar],
    })
    toast.success('Added new question dimension')
  }

  // Remove Likert dimension question
  const handleRemovePillar = (index: number) => {
    if (!payload) return
    if (payload.pillars.length <= 1) {
      toast.error('Template must contain at least 1 dimension question.')
      return
    }
    const updatedPillars = payload.pillars.filter((_, i) => i !== index)
    setPayload({ ...payload, pillars: updatedPillars })
    toast.info('Removed question dimension')
  }

  // Add new scenario step
  const handleAddStep = () => {
    if (!payload) return
    const currentScenarios = getScenariosList(payload)
    if (currentScenarios.length === 0) return

    const updatedScenarios = [...currentScenarios]
    const curIdx = Math.min(activeScenarioIdx, updatedScenarios.length - 1)
    const targetScenario = { ...updatedScenarios[curIdx] }

    const nextStepNum = targetScenario.nodes.length + 1
    const newStep: ScenarioNode = {
      step: nextStepNum,
      pillar_focus: 'technical_practice',
      context: 'Enter situation context for this step...',
      prompt: `Step ${nextStepNum}: Enter scenario decision prompt...`,
      options: [
        {
          id: `${nextStepNum}a`,
          text: 'First technical decision option',
          vectors: { tech_coding_score: 1 },
          next_context: 'Outcome narrative after selecting Option A...',
        },
        {
          id: `${nextStepNum}b`,
          text: 'Second technical decision option',
          vectors: { tech_infrastructure_score: 1 },
          next_context: 'Outcome narrative after selecting Option B...',
        },
      ],
    }

    targetScenario.nodes = [...targetScenario.nodes, newStep]
    updatedScenarios[curIdx] = targetScenario

    setPayload({
      ...payload,
      scenario: updatedScenarios[0],
      scenarios: updatedScenarios,
    })
    setExpandedSteps((prev) => ({ ...prev, [nextStepNum]: true }))
    toast.success(`Added Step ${nextStepNum} to scenario`)
  }

  // Remove scenario step
  const handleRemoveStep = (stepIndex: number) => {
    if (!payload) return
    const currentScenarios = getScenariosList(payload)
    if (currentScenarios.length === 0) return

    const updatedScenarios = [...currentScenarios]
    const curIdx = Math.min(activeScenarioIdx, updatedScenarios.length - 1)
    const targetScenario = { ...updatedScenarios[curIdx] }

    if (targetScenario.nodes.length <= 1) {
      toast.error('Scenario must contain at least 1 step.')
      return
    }

    const filteredNodes = targetScenario.nodes.filter((_, i) => i !== stepIndex)
    const reindexedNodes = filteredNodes.map((node, i) => ({
      ...node,
      step: i + 1,
    }))

    targetScenario.nodes = reindexedNodes
    updatedScenarios[curIdx] = targetScenario

    setPayload({
      ...payload,
      scenario: updatedScenarios[0],
      scenarios: updatedScenarios,
    })
    toast.info('Removed scenario step')
  }

  // Add option to scenario step
  const handleAddOption = (stepIndex: number) => {
    if (!payload) return
    const currentScenarios = getScenariosList(payload)
    if (currentScenarios.length === 0) return

    const updatedScenarios = [...currentScenarios]
    const curIdx = Math.min(activeScenarioIdx, updatedScenarios.length - 1)
    const targetScenario = { ...updatedScenarios[curIdx] }
    const updatedNodes = [...targetScenario.nodes]
    const stepObj = { ...updatedNodes[stepIndex] }

    const stepNum = stepObj.step
    const nextOptChar = String.fromCharCode(97 + stepObj.options.length)
    const newOption: ScenarioOption = {
      id: `${stepNum}${nextOptChar}`,
      text: 'Enter decision option text...',
      vectors: {},
      next_context: 'Enter outcome narrative...',
    }

    stepObj.options = [...stepObj.options, newOption]
    updatedNodes[stepIndex] = stepObj
    targetScenario.nodes = updatedNodes
    updatedScenarios[curIdx] = targetScenario

    setPayload({
      ...payload,
      scenario: updatedScenarios[0],
      scenarios: updatedScenarios,
    })
    toast.success(`Added Option ${newOption.id}`)
  }

  // Remove option from scenario step
  const handleRemoveOption = (stepIndex: number, optionIndex: number) => {
    if (!payload) return
    const currentScenarios = getScenariosList(payload)
    if (currentScenarios.length === 0) return

    const updatedScenarios = [...currentScenarios]
    const curIdx = Math.min(activeScenarioIdx, updatedScenarios.length - 1)
    const targetScenario = { ...updatedScenarios[curIdx] }
    const updatedNodes = [...targetScenario.nodes]
    const stepObj = { ...updatedNodes[stepIndex] }

    if (stepObj.options.length <= 2) {
      toast.error('Each scenario step must have at least 2 options.')
      return
    }

    stepObj.options = stepObj.options.filter((_, i) => i !== optionIndex)
    updatedNodes[stepIndex] = stepObj
    targetScenario.nodes = updatedNodes
    updatedScenarios[curIdx] = targetScenario

    setPayload({
      ...payload,
      scenario: updatedScenarios[0],
      scenarios: updatedScenarios,
    })
    toast.info('Removed decision option')
  }

  return (
    <div id="assessment-templates-customization" className="oxygen-card" style={{ padding: '24px' }}>
      {/* Header Title (Clickable to collapse/expand) */}
      <div
        onClick={() => setIsCardCollapsed(!isCardCollapsed)}
        className="settings-card-header"
        style={{
          marginBottom: isCardCollapsed ? '0px' : '20px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <div style={{ flex: 1, minWidth: '240px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sliders size={22} color="var(--color-brand-accent)" />
            <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: 'var(--color-text-primary)' }}>
              Assessment Templates
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '4px 0 0 32px' }}>
            Customize assessment questions, interactive scenario prompts, and vector scoring weights for your organization.
          </p>
        </div>

        {/* Status Badge & Toggle Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: '600',
              padding: '4px 10px',
              borderRadius: '20px',
              background: isCustom ? 'rgba(34, 197, 94, 0.12)' : 'rgba(59, 130, 246, 0.12)',
              color: isCustom ? '#16a34a' : '#2563eb',
              border: `1px solid ${isCustom ? 'rgba(34, 197, 94, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <CheckCircle size={13} />
            {isCustom ? 'Custom Template Active' : 'System Baseline Defaults'}
          </span>
          {updatedAt && (
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
              Saved {new Date(updatedAt).toLocaleDateString()}
            </span>
          )}

          <button
            type="button"
            aria-label={isCardCollapsed ? 'Expand customizer' : 'Collapse customizer'}
            style={{
              background: 'var(--color-bg-card-hover, rgba(255, 255, 255, 0.05))',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              fontSize: '12px',
              fontWeight: '600',
              minHeight: '36px',
            }}
          >
            {isCardCollapsed ? (
              <>
                Expand <ChevronDown size={16} />
              </>
            ) : (
              <>
                Collapse <ChevronUp size={16} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expandable Body */}
      {!isCardCollapsed && (
        <>

      {/* Tabs */}
      <div
        className="touch-scroll-x"
        style={{
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: '12px',
          marginBottom: '24px',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveDepartment('Engineering')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '600',
            border: 'none',
            cursor: 'pointer',
            background: activeDepartment === 'Engineering' ? 'var(--color-brand-accent)' : 'transparent',
            color: activeDepartment === 'Engineering' ? '#fff' : 'var(--color-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            minHeight: '40px',
          }}
        >
          <Code2 size={15} />
          Engineering & Data (Technical)
        </button>
        <button
          type="button"
          onClick={() => setActiveDepartment('General')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '600',
            border: 'none',
            cursor: 'pointer',
            background: activeDepartment === 'General' ? 'var(--color-brand-accent)' : 'transparent',
            color: activeDepartment === 'General' ? '#fff' : 'var(--color-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            minHeight: '40px',
          }}
        >
          <Layers size={15} />
          General & Business Roles
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          <Sparkles size={24} className="animate-spin" style={{ margin: '0 auto 8px', color: 'var(--color-brand-accent)' }} />
          Loading assessment template...
        </div>
      ) : !payload ? (
        <div style={{ padding: '20px', color: 'var(--color-danger)' }}>Error loading schema payload.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Section 1: General & Business Baseline Questions (Likert 1-4) */}
          {activeDepartment === 'General' && (
            <div>
              <div className="settings-row" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <HelpCircle size={18} color="var(--color-brand-accent)" />
                  <h3 style={{ fontSize: '15px', fontWeight: '600', margin: 0, color: 'var(--color-text-primary)' }}>
                    General Assessment Dimension Questions (Likert 1-4)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleAddPillar}
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', padding: '8px 14px', minHeight: '40px' }}
                >
                  <Plus size={14} /> Add Question Dimension
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {payload.pillars.map((pillar, idx) => (
                  <div
                    key={pillar.key}
                    style={{
                      background: 'var(--color-bg-subtle, rgba(255, 255, 255, 0.03))',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      padding: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-brand-accent)' }}>
                        Pillar {idx + 1}: {pillar.pillar}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <code style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{pillar.key}</code>
                        <button
                          type="button"
                          onClick={() => handleRemovePillar(idx)}
                          title="Delete Question"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--color-danger)',
                            cursor: payload.pillars.length <= 1 ? 'not-allowed' : 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            opacity: payload.pillars.length <= 1 ? 0.4 : 0.8,
                          }}
                          disabled={payload.pillars.length <= 1}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                          Question Prompt
                        </label>
                        <textarea
                          rows={2}
                          value={pillar.question}
                          onChange={(e) => handlePillarChange(idx, 'question', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-bg-card)',
                            color: 'var(--color-text-primary)',
                            fontSize: '13px',
                            resize: 'vertical',
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                          Helper / Context Subtitle
                        </label>
                        <input
                          type="text"
                          value={pillar.helper}
                          onChange={(e) => handlePillarChange(idx, 'helper', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-bg-card)',
                            color: 'var(--color-text-secondary)',
                            fontSize: '12px',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Technical Scenario Prompts & Scoring Vectors (Only for Engineering) */}
          {activeDepartment === 'Engineering' && (
            <div>
              <div className="settings-row" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Cpu size={18} color="var(--color-brand-accent)" />
                  <h3 style={{ fontSize: '15px', fontWeight: '600', margin: 0, color: 'var(--color-text-primary)' }}>
                    Engineering Technical Scenarios & Vector Scoring Weights
                  </h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleAddScenario}
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 14px', minHeight: '40px' }}
                  >
                    <Plus size={14} /> Add New Scenario
                  </button>
                  {getScenariosList(payload).length > 0 && (
                    <button
                      type="button"
                      onClick={handleAddStep}
                      className="btn-secondary"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 14px', minHeight: '40px' }}
                    >
                      <Plus size={14} /> Add Scenario Step
                    </button>
                  )}
                </div>
              </div>

              {/* Scenario Selector Tabs & Active Scenario Editor */}
              {(() => {
                const scenariosList = getScenariosList(payload)
                if (scenariosList.length === 0) return null
                const curIdx = Math.min(activeScenarioIdx, scenariosList.length - 1)
                const activeScenario = scenariosList[curIdx]

                return (
                  <div>
                    {/* Scenario Switcher Touch Tabs */}
                    <div className="touch-scroll-x" style={{ marginBottom: '20px', alignItems: 'center', background: 'var(--color-bg-subtle, rgba(255,255,255,0.02))', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-text-secondary)', marginRight: '4px', flexShrink: 0 }}>
                        Scenarios ({scenariosList.length}):
                      </span>
                      {scenariosList.map((sc, sIdx) => {
                        const isActive = sIdx === curIdx
                        return (
                          <div
                            key={sc.scenario_id || sIdx}
                            onClick={() => setActiveScenarioIdx(sIdx)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '8px 14px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              background: isActive ? 'var(--color-brand-accent)' : 'var(--color-bg-card)',
                              color: isActive ? '#fff' : 'var(--color-text-secondary)',
                              border: isActive ? '1px solid var(--color-brand-accent)' : '1px solid var(--color-border)',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              userSelect: 'none',
                              whiteSpace: 'nowrap',
                              flexShrink: 0,
                              minHeight: '38px',
                            }}
                          >
                            <span>Scenario {sIdx + 1}: {sc.title.length > 22 ? sc.title.slice(0, 22) + '...' : sc.title}</span>
                            {scenariosList.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteScenario(sIdx)
                                }}
                                title="Delete Scenario"
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: isActive ? '#fff' : 'var(--color-danger)',
                                  cursor: 'pointer',
                                  padding: '2px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  opacity: 0.85,
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Active Scenario Title & Actions */}
                    <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '240px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                          Scenario {curIdx + 1} Title
                        </label>
                        <input
                          type="text"
                          value={activeScenario.title}
                          onChange={(e) => handleScenarioTitleChange(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-bg-card)',
                            color: 'var(--color-text-primary)',
                            fontSize: '14px',
                            fontWeight: '600',
                          }}
                        />
                      </div>
                      {scenariosList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteScenario(curIdx)}
                          className="btn-secondary"
                          style={{ color: 'var(--color-danger)', borderColor: 'rgba(244, 67, 54, 0.3)', padding: '8px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', minHeight: '40px' }}
                        >
                          <Trash2 size={14} /> Delete Scenario
                        </button>
                      )}
                    </div>

                    {/* Scenario Steps */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {activeScenario.nodes.map((node, stepIdx) => {
                        const isExpanded = !!expandedSteps[node.step]
                        return (
                          <div
                            key={node.step}
                            style={{
                              border: '1px solid var(--color-border)',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              background: 'var(--color-bg-card)',
                            }}
                          >
                            {/* Accordion Header */}
                            <div
                              onClick={() => toggleStepAccordion(node.step)}
                              style={{
                                width: '100%',
                                padding: '12px 16px',
                                background: 'var(--color-bg-subtle, rgba(255, 255, 255, 0.02))',
                                borderBottom: isExpanded ? '1px solid var(--color-border)' : 'none',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer',
                                textAlign: 'left',
                                userSelect: 'none',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                                <span
                                  style={{
                                    width: '24px',
                                    height: '24px',
                                    minWidth: '24px',
                                    minHeight: '24px',
                                    flexShrink: 0,
                                    borderRadius: '50%',
                                    background: 'var(--color-brand-accent)',
                                    color: '#fff',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  {node.step}
                                </span>
                                <div style={{ minWidth: 0 }}>
                                  <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                                    Step {node.step}: {node.prompt || 'Untitled Prompt'}
                                  </span>
                                  <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginLeft: '8px' }}>
                                    ({node.pillar_focus})
                                  </span>
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRemoveStep(stepIdx)
                                  }}
                                  title="Delete Step"
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--color-danger)',
                                    cursor: activeScenario.nodes.length <= 1 ? 'not-allowed' : 'pointer',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    opacity: activeScenario.nodes.length <= 1 ? 0.4 : 0.8,
                                  }}
                                  disabled={activeScenario.nodes.length <= 1}
                                >
                                  <Trash2 size={15} />
                                </button>
                                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                              </div>
                            </div>

                            {/* Accordion Content */}
                            {isExpanded && (
                              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {/* Context */}
                                {node.context !== undefined && (
                                  <div>
                                    <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                                      Step Context / Situation Setup
                                    </label>
                                    <textarea
                                      rows={2}
                                      value={node.context}
                                      onChange={(e) => handleStepFieldChange(stepIdx, 'context', e.target.value)}
                                      style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        border: '1px solid var(--color-border)',
                                        background: 'var(--color-bg-card)',
                                        color: 'var(--color-text-primary)',
                                        fontSize: '13px',
                                      }}
                                    />
                                  </div>
                                )}

                                {/* Prompt */}
                                <div>
                                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                                    Scenario Decision Prompt
                                  </label>
                                  <input
                                    type="text"
                                    value={node.prompt}
                                    onChange={(e) => handleStepFieldChange(stepIdx, 'prompt', e.target.value)}
                                    style={{
                                      width: '100%',
                                      padding: '8px 12px',
                                      borderRadius: '6px',
                                      border: '1px solid var(--color-border)',
                                      background: 'var(--color-bg-card)',
                                      color: 'var(--color-text-primary)',
                                      fontSize: '13px',
                                    }}
                                  />
                                </div>

                                {/* Options & Vectors */}
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-text-primary)', margin: 0 }}>
                                      Decision Options & Vector Score Weights
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => handleAddOption(stepIdx)}
                                      className="btn-secondary"
                                      style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '6px 10px', minHeight: '34px' }}
                                    >
                                      <Plus size={13} /> Add Option
                                    </button>
                                  </div>

                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {node.options.map((opt, optIdx) => (
                                      <div
                                        key={opt.id}
                                        style={{
                                          border: '1px dashed var(--color-border)',
                                          borderRadius: '8px',
                                          padding: '12px',
                                          background: 'rgba(255, 115, 0, 0.02)',
                                        }}
                                      >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                          <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-brand-accent)' }}>
                                            Option {opt.id}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveOption(stepIdx, optIdx)}
                                            title="Delete Option"
                                            style={{
                                              background: 'transparent',
                                              border: 'none',
                                              color: 'var(--color-danger)',
                                              cursor: node.options.length <= 2 ? 'not-allowed' : 'pointer',
                                              padding: '4px',
                                              display: 'flex',
                                              alignItems: 'center',
                                              opacity: node.options.length <= 2 ? 0.4 : 0.8,
                                            }}
                                            disabled={node.options.length <= 2}
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                          <input
                                            type="text"
                                            placeholder="Option text description"
                                            value={opt.text}
                                            onChange={(e) => handleOptionFieldChange(stepIdx, optIdx, 'text', e.target.value)}
                                            style={{
                                              width: '100%',
                                              padding: '8px 10px',
                                              borderRadius: '6px',
                                              border: '1px solid var(--color-border)',
                                              background: 'var(--color-bg-card)',
                                              color: 'var(--color-text-primary)',
                                              fontSize: '13px',
                                            }}
                                          />

                                          <input
                                            type="text"
                                            placeholder="Outcome narrative (next context for following step)"
                                            value={opt.next_context}
                                            onChange={(e) => handleOptionFieldChange(stepIdx, optIdx, 'next_context', e.target.value)}
                                            style={{
                                              width: '100%',
                                              padding: '8px 10px',
                                              borderRadius: '6px',
                                              border: '1px solid var(--color-border)',
                                              background: 'var(--color-bg-card)',
                                              color: 'var(--color-text-secondary)',
                                              fontSize: '12px',
                                            }}
                                          />

                                          {/* Vector Score Weights Grid */}
                                          <div style={{ marginTop: '6px' }}>
                                            <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>
                                              Scoring Vector Weights (0 = None, 1 = Moderate, 2 = High)
                                            </span>
                                            <div className="vector-grid">
                                              {VECTOR_KEYS.map(({ key, label }) => {
                                                const currentWeight = opt.vectors[key] ?? 0
                                                return (
                                                  <div
                                                    key={key}
                                                    style={{
                                                      display: 'flex',
                                                      justifyContent: 'space-between',
                                                      alignItems: 'center',
                                                      background: 'var(--color-bg-card)',
                                                      border: '1px solid var(--color-border)',
                                                      borderRadius: '6px',
                                                      padding: '6px 10px',
                                                      minHeight: '36px',
                                                    }}
                                                  >
                                                    <span style={{ fontSize: '11px', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }} title={label}>
                                                      {label}
                                                    </span>
                                                    <select
                                                      value={currentWeight}
                                                      onChange={(e) => handleVectorScoreChange(stepIdx, optIdx, key, Number(e.target.value))}
                                                      style={{
                                                        fontSize: '12px',
                                                        fontWeight: '700',
                                                        padding: '2px 6px',
                                                        minHeight: '28px',
                                                        borderRadius: '4px',
                                                        border: '1px solid var(--color-border)',
                                                        background: 'var(--color-bg-app)',
                                                        color: currentWeight > 0 ? 'var(--color-brand-accent)' : 'var(--color-text-secondary)',
                                                        cursor: 'pointer',
                                                      }}
                                                    >
                                                      <option value={0}>0</option>
                                                      <option value={1}>+1</option>
                                                      <option value={2}>+2</option>
                                                    </select>
                                                  </div>
                                                )
                                              })}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          {/* Action Bar */}
          <div
            className="settings-row"
            style={{
              paddingTop: '16px',
              borderTop: '1px solid var(--color-border)',
            }}
          >
            <button
              type="button"
              onClick={handleReset}
              disabled={resetting || saving}
              className="btn-secondary mobile-full-width"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '13px',
                padding: '10px 16px',
                minHeight: '44px',
                color: 'var(--color-danger)',
                borderColor: 'rgba(244, 67, 54, 0.3)',
              }}
            >
              <RotateCcw size={14} />
              {resetting ? 'Resetting...' : 'Reset to System Defaults'}
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || resetting}
              className="btn-primary mobile-full-width"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '13px',
                padding: '10px 20px',
                minHeight: '44px',
              }}
            >
              <Save size={15} />
              {saving ? 'Saving Changes...' : 'Save Template Changes'}
            </button>
          </div>
        </div>
      )}
    </>
  )}
</div>
)
}
