'use client'

import { useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import { TokenValidator, type TokenContext } from '@/components/assessment/TokenValidator'
import { QuestionnaireWizard } from '@/components/assessment/QuestionnaireWizard'

function AssessmentEntryContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [tokenContext, setTokenContext] = useState<TokenContext | null>(null)
  const [validationFailed, setValidationFailed] = useState(false)

  if (validationFailed) return null // TokenValidator renders its own error UI

  if (!tokenContext) {
    return (
      <TokenValidator
        token={token}
        onValid={(ctx) => setTokenContext(ctx)}
        onInvalid={() => setValidationFailed(true)}
      />
    )
  }

  return <QuestionnaireWizard tokenContext={tokenContext} token={token} />
}

export default function EvalInvitePage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--color-bg-app)',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '3px solid var(--color-border)',
                borderTopColor: 'var(--color-brand-accent)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 16px',
              }}
            />
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Loading assessment…</p>
          </div>
        </div>
      }
    >
      <AssessmentEntryContent />
    </Suspense>
  )
}
