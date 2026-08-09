'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { BarChart3, ShieldCheck, TrendingUp, Eye, EyeOff } from 'lucide-react'

// ─── Fingerprint helper ─────────────────────────────────────────────────────

function getOrCreateGuestId(): string {
  const STORAGE_KEY = 'tai_guest_fingerprint'
  const existing = localStorage.getItem(STORAGE_KEY)
  if (existing) return existing

  // Build a deterministic fingerprint from browser properties
  const raw = [
    navigator.userAgent,
    String(screen.width),
    String(screen.height),
    navigator.language,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    Math.random().toString(36).slice(2), // random salt to ensure uniqueness
  ].join('|')

  // Simple hash (FNV-1a inspired)
  let hash = 2166136261
  for (let i = 0; i < raw.length; i++) {
    hash ^= raw.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  const guestId = 'guest_' + Math.abs(hash).toString(16) + '_' + Date.now().toString(36)
  localStorage.setItem(STORAGE_KEY, guestId)
  return guestId
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)

  // Auto-login if already has a cookie (middleware would redirect anyway, but
  // this avoids a flash of the login screen on fast revisits)
  useEffect(() => {
    // If middleware redirected us here, the cookie is gone — nothing to do
  }, [])

  async function handleGuestLogin() {
    setLoading(true)
    setError(null)
    try {
      const guestId = getOrCreateGuestId()
      const res = await fetch('/api/auth/guest-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Login failed')
      router.push('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Demo mode — redirect to guest login
    handleGuestLogin()
  }

  return (
    <div
      style={{
        height: '100vh',
        width: '100%',
        display: 'flex',
        overflow: 'hidden',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        backgroundColor: '#f7f9fc',
      }}
    >
      {/* ── Left Panel (60%) ─────────────────────────────────────────────── */}
      <div
        className="left-panel"
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          width: '60%',
          height: '100%',
          backgroundColor: '#ffffff',
          padding: '32px',
          overflow: 'hidden',
          justifyContent: 'space-between',
          borderRight: '1px solid #E0E0E0',
        }}
      >
        {/* Decorative gradient blobs */}
        <div style={{
          position: 'absolute', top: '-80px', right: '-80px',
          width: '400px', height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,115,0,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-100px', left: '-60px',
          width: '350px', height: '350px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,115,0,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 10 }}>
          <Image
            src="/images/logos/tai-horizontal-primary.png"
            alt="TAI Labs"
            width={142}
            height={40}
            priority
            style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
          />
        </div>

        {/* Center Content */}
        <div style={{ zIndex: 10, maxWidth: '500px', marginTop: '80px' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#222228',
            marginBottom: '16px',
            lineHeight: '1.2',
          }}>
            Enterprise AI Readiness Platform
          </h1>
          <p style={{ fontSize: '16px', color: '#666666', marginBottom: '32px', lineHeight: '1.6' }}>
            Measure, analyze, and upskill your workforce for the AI era.
          </p>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { Icon: BarChart3, text: 'Baseline AI Assessments' },
              { Icon: ShieldCheck, text: 'Privacy-Preserving Analytics' },
              { Icon: TrendingUp, text: 'Actionable Upskilling Pathways' },
            ].map(({ Icon, text }) => (
              <li key={text} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  width: '36px', height: '36px', borderRadius: '8px',
                  background: 'rgba(255,115,0,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#FF7300', flexShrink: 0,
                }}>
                  <Icon size={18} />
                </span>
                <span style={{ fontSize: '15px', color: '#444444', fontWeight: '500' }}>{text}</span>
              </li>
            ))}
          </ul>

          {/* Demo badge */}
          <div style={{
            marginTop: '40px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'rgba(255,115,0,0.06)',
            border: '1px solid rgba(255,115,0,0.2)',
            borderRadius: '100px',
            fontSize: '13px',
            color: '#FF7300',
            fontWeight: '500',
          }}>
            <span style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background: '#FF7300',
              boxShadow: '0 0 0 2px rgba(255,115,0,0.25)',
            }} />
            Demo Mode — No account required
          </div>
        </div>

        {/* Spacer */}
        <div />
      </div>

      {/* ── Right Panel (40%) ────────────────────────────────────────────── */}
      <div style={{
        width: '40%',
        height: '100%',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px',
        overflowY: 'auto',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.04)',
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>

          {/* Heading */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#222228', margin: '0 0 6px' }}>
              Admin Login
            </h2>
            <p style={{ fontSize: '14px', color: '#666666', margin: 0 }}>
              Demo mode — no account needed.{' '}
              <span style={{ color: '#FF7300' }}>Just click Continue.</span>
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: '12px 16px',
              background: 'rgba(244,67,54,0.06)',
              border: '1px solid rgba(244,67,54,0.3)',
              borderRadius: '8px',
              color: '#c62828',
              fontSize: '13px',
              marginBottom: '16px',
            }}>
              {error}
            </div>
          )}

          {/* SSO Buttons (visual only — Demo mode) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
            <SSOButton
              onClick={handleGuestLogin}
              disabled={loading}
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              }
              label="CONTINUE WITH GOOGLE"
            />
            <SSOButton
              onClick={handleGuestLogin}
              disabled={loading}
              icon={
                <svg width="20" height="20" viewBox="0 0 23 23">
                  <path d="M1 1h10v10H1z" fill="#f35325" />
                  <path d="M12 1h10v10H12z" fill="#81bc06" />
                  <path d="M1 12h10v10H1z" fill="#05a6f0" />
                  <path d="M12 12h10v10H12z" fill="#ffba08" />
                </svg>
              }
              label="CONTINUE WITH MICROSOFT"
            />
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ flex: 1, height: '1px', background: '#BDBDBD' }} />
            <span style={{ fontSize: '12px', color: '#666666', fontWeight: '500', letterSpacing: '0.06em' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: '#BDBDBD' }} />
          </div>

          {/* Email/Password form */}
          <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#222228', marginBottom: '6px' }}>
                Work Email
              </label>
              <input
                type="email"
                placeholder="admin@enterprise.com"
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 14px',
                  border: `1px solid ${emailFocused ? '#FF7300' : '#BDBDBD'}`,
                  borderRadius: '4px',
                  fontSize: '15px',
                  color: '#222228',
                  outline: 'none',
                  backgroundColor: '#ffffff',
                  boxShadow: emailFocused ? '0 0 0 2px rgba(255,115,0,0.12)' : 'none',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#222228', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 42px 10px 14px',
                    border: `1px solid ${passwordFocused ? '#FF7300' : '#BDBDBD'}`,
                    borderRadius: '4px',
                    fontSize: '15px',
                    color: '#222228',
                    outline: 'none',
                    backgroundColor: '#ffffff',
                    boxShadow: passwordFocused ? '0 0 0 2px rgba(255,115,0,0.12)' : 'none',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#888888',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  style={{ width: '15px', height: '15px', accentColor: '#FF7300', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '13px', color: '#666666' }}>Remember me</span>
              </label>
              <button
                type="button"
                style={{ fontSize: '13px', color: '#FF7300', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Forgot your password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '11px 16px',
                background: loading ? '#FFB57F' : '#FF7300',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '600',
                letterSpacing: '0.04em',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
                marginTop: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: '16px', height: '16px',
                    border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: '#ffffff',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.7s linear infinite',
                  }} />
                  Signing in...
                </>
              ) : 'SIGN IN'}
            </button>
          </form>

          {/* Footer */}
          <div style={{
            marginTop: '48px',
            textAlign: 'center',
            fontSize: '12px',
            color: '#999999',
          }}>
            <div style={{ marginBottom: '6px' }}>© 2026 TAI Readiness Baseline Tool.</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
              <a href="/" style={{ color: '#999999', textDecoration: 'none' }}>Privacy</a>
              <a href="/" style={{ color: '#999999', textDecoration: 'none' }}>Terms</a>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive + spin animation */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .left-panel { display: none !important; }
        }
      `}</style>
    </div>
  )
}

// ─── SSO Button ───────────────────────────────────────────────────────────────

interface SSOButtonProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
}

function SSOButton({ icon, label, onClick, disabled }: SSOButtonProps) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        padding: '10px 16px',
        border: '1px solid #BDBDBD',
        borderRadius: '4px',
        fontSize: '13px',
        fontWeight: '600',
        letterSpacing: '0.04em',
        color: '#222228',
        background: hovered ? '#f5f5f5' : '#ffffff',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.15s',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {icon}
      {label}
    </button>
  )
}
