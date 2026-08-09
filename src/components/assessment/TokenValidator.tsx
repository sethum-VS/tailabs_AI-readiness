'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, RefreshCw, ShieldX, Clock } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface TokenValidatorProps {
  token: string
  onValid: (context: TokenContext) => void
  onInvalid?: () => void
}

export interface TokenContext {
  invite_id: string
  team_id: string
  team_name: string
  organization_name: string
  status: string
  title: string
}

type ValidationState = 'loading' | 'valid' | 'invalid' | 'expired' | 'error'

export function TokenValidator({ token, onValid, onInvalid }: TokenValidatorProps) {
  const [state, setState] = useState<ValidationState>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setState('invalid')
      setErrorMessage('No assessment token provided.')
      onInvalid?.()
      return
    }

    const validate = async () => {
      try {
        const res = await fetch(`/api/invites/validate?token=${encodeURIComponent(token)}`)
        const data = await res.json()

        if (data.valid) {
          setState('valid')
          onValid({
            invite_id: data.invite_id,
            team_id: data.team_id,
            team_name: data.team_name,
            organization_name: data.organization_name,
            status: data.status,
            title: data.title,
          })
        } else if (res.status === 410) {
          setState('expired')
          setErrorMessage(data.error || 'This assessment link has expired.')
          onInvalid?.()
        } else {
          setState('invalid')
          setErrorMessage(data.error || 'This assessment link is invalid.')
          onInvalid?.()
        }
      } catch {
        setState('error')
        setErrorMessage('Unable to verify your assessment link. Please check your connection.')
        onInvalid?.()
      }
    }

    validate()
  }, [token, onValid, onInvalid])

  if (state === 'valid') return null

  const configs = {
    loading: {
      icon: <RefreshCw size={32} color="var(--color-brand-accent)" className="animate-spin" />,
      title: 'Verifying your link…',
      description: 'Please wait while we validate your assessment token.',
      bg: 'rgba(255, 115, 0, 0.06)',
      border: 'rgba(255, 115, 0, 0.2)',
    },
    expired: {
      icon: <Clock size={32} color="var(--color-warning)" />,
      title: 'Link Has Expired',
      description: 'This assessment link expired 14 days after it was generated. Please request a new link from your administrator.',
      bg: 'rgba(255, 152, 0, 0.06)',
      border: 'rgba(255, 152, 0, 0.2)',
    },
    invalid: {
      icon: <ShieldX size={32} color="var(--color-danger)" />,
      title: 'Invalid Assessment Link',
      description: errorMessage || 'This link is not valid. Please ensure you copied the full URL correctly.',
      bg: 'rgba(244, 67, 54, 0.06)',
      border: 'rgba(244, 67, 54, 0.2)',
    },
    error: {
      icon: <AlertCircle size={32} color="var(--color-danger)" />,
      title: 'Connection Error',
      description: errorMessage || 'Failed to verify your link. Please try again.',
      bg: 'rgba(244, 67, 54, 0.06)',
      border: 'rgba(244, 67, 54, 0.2)',
    },
  }

  const config = configs[state]

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-bg-app)',
        padding: '24px',
      }}
    >
      <div
        style={{
          maxWidth: '480px',
          width: '100%',
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '48px 40px',
          textAlign: 'center',
          boxShadow: '0px 4px 24px rgba(0,0,0,0.06)',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px' }}>
          <Image
            src="/images/logos/tai-horizontal-primary.png"
            alt="TAI Readiness"
            width={160}
            height={44}
            priority
            style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
          />
        </div>

        {/* Icon */}
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: config.bg,
            border: `1px solid ${config.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          {config.icon}
        </div>

        <h1
          style={{
            fontSize: '20px',
            fontWeight: '600',
            color: 'var(--color-text-primary)',
            margin: '0 0 12px',
          }}
        >
          {config.title}
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: 'var(--color-text-secondary)',
            lineHeight: '1.6',
            margin: '0 0 32px',
          }}
        >
          {config.description}
        </p>

        {state === 'error' && (
          <button
            className="btn-primary"
            onClick={() => window.location.reload()}
            style={{ width: '100%' }}
          >
            Try Again
          </button>
        )}

        {(state === 'invalid' || state === 'expired') && (
          <Link href="/" style={{ textDecoration: 'none' }}>
            <button className="btn-secondary" style={{ width: '100%' }}>
              Return to Home
            </button>
          </Link>
        )}
      </div>
    </div>
  )
}
