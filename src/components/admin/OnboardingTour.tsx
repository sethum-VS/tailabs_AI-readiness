'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Sparkles, ChevronRight, ChevronLeft, CheckCircle2, X } from 'lucide-react'

export interface TourStep {
  id: string
  title: string
  description: string
  path: string
  tab?: 'overview' | 'departments' | 'settings'
  targetId?: string
  actionLabel?: string
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome_btn',
    title: 'Generate First Assessment Link',
    description: 'Welcome to TAI Readiness! Start your organization evaluation by generating your first team assessment link or adjusting your settings first.',
    path: '/admin',
    tab: 'overview',
    targetId: 'generate-first-link-btn',
    actionLabel: 'Adjust Settings',
  },
  {
    id: 'settings_org',
    title: 'Set Organization Name',
    description: 'Customize your company name. This name will appear on all team assessment magic links and executive reports.',
    path: '/admin',
    tab: 'settings',
    targetId: 'org-name-setting',
    actionLabel: 'Next Setting',
  },
  {
    id: 'settings_config',
    title: 'Configure Assessment Defaults',
    description: 'Set your default team seat targets and the link validity duration before magic links expire.',
    path: '/admin',
    tab: 'settings',
    targetId: 'assessment-config-setting',
    actionLabel: 'Generate Link',
  },
  {
    id: 'generate_link',
    title: 'Create Team Link',
    description: 'Choose a team (e.g., Engineering, Sales) and generate your tokenized magic link to send to team members.',
    path: '/admin/distribution',
    targetId: 'generate-link-cta',
    actionLabel: 'Finish Tour',
  },
]

const LOCAL_STORAGE_KEY = 'tai_onboarding_completed'
const SESSION_STEP_KEY = 'tai_tour_step_index'

interface OnboardingTourProps {
  activeTab?: 'overview' | 'departments' | 'settings'
  onSelectTab?: (tab: 'overview' | 'departments' | 'settings') => void
  onOpenGenerateDialog?: () => void
}

export function OnboardingTour({ activeTab, onSelectTab, onOpenGenerateDialog }: OnboardingTourProps) {
  const router = useRouter()
  const pathname = usePathname()

  const [currentStepIndex, setCurrentStepIndex] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const previousTargetRef = useRef<HTMLElement | null>(null)

  // Initialize tour state on mount
  useEffect(() => {
    setMounted(true)
    const completed = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (completed === 'true') {
      setCurrentStepIndex(null)
      return
    }

    const savedStep = sessionStorage.getItem(SESSION_STEP_KEY)
    if (savedStep !== null && !isNaN(Number(savedStep))) {
      setCurrentStepIndex(Number(savedStep))
    } else {
      setCurrentStepIndex(0)
    }
  }, [])

  // Sync step index changes with sessionStorage
  const updateStepIndex = (newIndex: number | null) => {
    setCurrentStepIndex(newIndex)
    if (newIndex !== null) {
      sessionStorage.setItem(SESSION_STEP_KEY, String(newIndex))
    } else {
      sessionStorage.removeItem(SESSION_STEP_KEY)
    }
  }

  const currentStep = currentStepIndex !== null ? TOUR_STEPS[currentStepIndex] : null

  // Restore target styling & elevate active target above backdrop
  const updateTargetElement = useCallback((targetEl: HTMLElement | null) => {
    if (previousTargetRef.current && previousTargetRef.current !== targetEl) {
      previousTargetRef.current.style.position = ''
      previousTargetRef.current.style.zIndex = ''
      previousTargetRef.current.style.boxShadow = ''
      previousTargetRef.current = null
    }

    if (targetEl) {
      const computedPos = window.getComputedStyle(targetEl).position
      if (computedPos === 'static') {
        targetEl.style.position = 'relative'
      }
      targetEl.style.zIndex = '9991'
      targetEl.style.boxShadow = '0 0 24px rgba(255, 115, 0, 0.4)'
      targetEl.style.transition = 'all 0.3s ease'
      previousTargetRef.current = targetEl
    }
  }, [])

  // Position calculation for highlight box
  const updateTargetRect = useCallback(() => {
    if (!currentStep?.targetId) {
      setTargetRect(null)
      updateTargetElement(null)
      return
    }
    const el = document.getElementById(currentStep.targetId)
    if (el) {
      const rect = el.getBoundingClientRect()
      setTargetRect(rect)
      updateTargetElement(el)
    } else {
      setTargetRect(null)
      updateTargetElement(null)
    }
  }, [currentStep, updateTargetElement])

  // Lifecycle & Route sync handler
  useEffect(() => {
    if (currentStepIndex === null) return

    // Check if tour is already completed
    if (localStorage.getItem(LOCAL_STORAGE_KEY) === 'true') {
      setCurrentStepIndex(null)
      return
    }

    // Smart route & step alignment
    if (pathname === '/admin/distribution' && currentStepIndex < 3) {
      // User navigated to Distribution page -> advance tour to Step 4 (Distribution step)
      updateStepIndex(3)
      return
    }

    const step = TOUR_STEPS[currentStepIndex]
    if (step) {
      // Only push route if explicitly on a step that expects another route
      if (pathname !== step.path && pathname === '/admin' && step.path === '/admin/distribution') {
        router.push(step.path)
      }

      // Tab switching on /admin
      if (step.tab && onSelectTab && activeTab !== step.tab) {
        onSelectTab(step.tab)
      }

      // Trigger generate link dialog if on step 4
      if (step.id === 'generate_link' && onOpenGenerateDialog) {
        const timer = setTimeout(() => {
          onOpenGenerateDialog()
        }, 400)
        return () => clearTimeout(timer)
      }
    }

    const timer = setTimeout(updateTargetRect, 250)
    window.addEventListener('resize', updateTargetRect)
    window.addEventListener('scroll', updateTargetRect, true)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', updateTargetRect)
      window.removeEventListener('scroll', updateTargetRect, true)
    }
  }, [currentStepIndex, pathname, activeTab, onSelectTab, onOpenGenerateDialog, router, updateTargetRect])

  // Intercept click on "Generate First Assessment Link" button to transition step to Step 4
  useEffect(() => {
    if (currentStepIndex !== 0) return
    const btn = document.getElementById('generate-first-link-btn')
    if (!btn) return

    const handleBtnClick = () => {
      updateStepIndex(3) // Advance directly to Distribution step
    }

    btn.addEventListener('click', handleBtnClick)
    return () => {
      btn.removeEventListener('click', handleBtnClick)
    }
  }, [currentStepIndex])

  // Cleanup elevated z-index on unmount
  useEffect(() => {
    return () => {
      if (previousTargetRef.current) {
        previousTargetRef.current.style.position = ''
        previousTargetRef.current.style.zIndex = ''
        previousTargetRef.current.style.boxShadow = ''
      }
    }
  }, [])

  if (!mounted || currentStepIndex === null || !currentStep) {
    return null
  }

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      updateStepIndex(currentStepIndex + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      updateStepIndex(currentStepIndex - 1)
    }
  }

  const handleComplete = () => {
    if (previousTargetRef.current) {
      previousTargetRef.current.style.position = ''
      previousTargetRef.current.style.zIndex = ''
      previousTargetRef.current.style.boxShadow = ''
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, 'true')
    sessionStorage.removeItem(SESSION_STEP_KEY)
    setCurrentStepIndex(null)
  }

  // Calculate Popover Position to NEVER overlap target box
  let popoverStyles: React.CSSProperties = {
    position: 'fixed',
    zIndex: 9999,
    maxWidth: '460px',
    width: 'calc(100vw - 32px)',
    backgroundColor: 'var(--color-bg-card)',
    border: '1px solid var(--color-brand-accent)',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(255, 115, 0, 0.2)',
    color: 'var(--color-text-primary)',
    fontFamily: 'var(--font-family)',
    transition: 'all 0.3s ease',
  }

  if (targetRect) {
    const isTargetTopHalf = targetRect.top < window.innerHeight / 2
    if (isTargetTopHalf) {
      // Place popover below target box
      popoverStyles.top = `${Math.min(targetRect.bottom + 20, window.innerHeight - 280)}px`
      popoverStyles.left = '50%'
      popoverStyles.transform = 'translateX(-50%)'
    } else {
      // Place popover above target box
      popoverStyles.bottom = `${Math.min(window.innerHeight - targetRect.top + 20, window.innerHeight - 280)}px`
      popoverStyles.left = '50%'
      popoverStyles.transform = 'translateX(-50%)'
    }
  } else {
    // Default center placement
    popoverStyles.top = '50%'
    popoverStyles.left = '50%'
    popoverStyles.transform = 'translate(-50%, -50%)'
  }

  return (
    <>
      {/* Dark Spotlight Overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9990,
          backgroundColor: 'rgba(10, 15, 29, 0.75)',
          backdropFilter: 'blur(4px)',
          transition: 'all 0.3s ease',
          pointerEvents: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Target Spotlight Highlight Ring */}
      {targetRect && (
        <div
          style={{
            position: 'fixed',
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            borderRadius: '12px',
            border: '2px solid var(--color-brand-accent)',
            boxShadow: '0 0 0 4px rgba(255, 115, 0, 0.25), 0 0 25px rgba(255, 115, 0, 0.5)',
            zIndex: 9992,
            transition: 'all 0.25s ease-out',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Floating Tour Modal Card */}
      <div style={popoverStyles}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'rgba(255, 115, 0, 0.15)',
                color: 'var(--color-brand-accent)',
                fontSize: '13px',
                fontWeight: '700',
              }}
            >
              {currentStepIndex + 1}
            </span>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-brand-accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Quick Setup Tour ({currentStepIndex + 1}/{TOUR_STEPS.length})
            </span>
          </div>

          <button
            onClick={handleComplete}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-disabled)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Skip Tour"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 8px', color: 'var(--color-text-primary)' }}>
          {currentStep.title}
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: '0 0 20px', lineHeight: '1.6' }}>
          {currentStep.description}
        </p>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {TOUR_STEPS.map((step, idx) => (
              <div
                key={step.id}
                style={{
                  width: idx === currentStepIndex ? '20px' : '6px',
                  height: '6px',
                  borderRadius: '3px',
                  background: idx === currentStepIndex ? 'var(--color-brand-accent)' : 'var(--color-border)',
                  transition: 'all 0.2s ease',
                }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {currentStepIndex > 0 && (
              <button
                className="btn-secondary"
                onClick={handlePrev}
                style={{ padding: '8px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <ChevronLeft size={14} /> Back
              </button>
            )}
            <button
              className="btn-primary"
              onClick={handleNext}
              style={{ padding: '8px 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {currentStep.actionLabel || (currentStepIndex === TOUR_STEPS.length - 1 ? 'Finish' : 'Next')}
              {currentStepIndex === TOUR_STEPS.length - 1 ? <CheckCircle2 size={14} /> : <ChevronRight size={14} />}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export function RestartTourButton() {
  const handleRestart = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY)
    sessionStorage.removeItem(SESSION_STEP_KEY)
    window.location.reload()
  }

  return (
    <button
      onClick={handleRestart}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '600',
        color: 'var(--color-brand-accent)',
        background: 'rgba(255, 115, 0, 0.08)',
        border: '1px solid rgba(255, 115, 0, 0.2)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
      title="Restart Getting Started Tour"
    >
      <Sparkles size={14} />
      <span>Quick Tour</span>
    </button>
  )
}
