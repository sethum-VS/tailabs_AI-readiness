'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  BarChart3,
  ShieldCheck,
  TrendingUp,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Zap,
  CheckCircle2,
  Lock,
  Building2,
  ChevronRight,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { LoginSkeleton } from '@/components/login/LoginSkeleton'

// ─── Fingerprint helper ─────────────────────────────────────────────────────

function getOrCreateGuestId(): string {
  const STORAGE_KEY = 'tai_guest_fingerprint'
  if (typeof window === 'undefined') return ''
  const existing = localStorage.getItem(STORAGE_KEY)
  if (existing) return existing

  const raw = [
    navigator.userAgent,
    String(screen.width),
    String(screen.height),
    navigator.language,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    Math.random().toString(36).slice(2),
  ].join('|')

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
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ssoLoading, setSsoLoading] = useState<'google' | 'microsoft' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)

  // Default values for effortless entry if unchanged
  const [email, setEmail] = useState('admin')
  const [password, setPassword] = useState('admin')

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <LoginSkeleton />
  }

  async function handleLogin(provider?: 'google' | 'microsoft', forceDemo?: boolean) {
    if (provider) {
      setSsoLoading(provider)
    } else {
      setLoading(true)
    }
    setError(null)
    try {
      const isDemoLogin = forceDemo || email.trim().toLowerCase() === 'demo' || email.trim().toLowerCase() === 'demo@enterprise.com'
      const guestId = isDemoLogin ? 'demo' : getOrCreateGuestId()
      
      const res = await fetch('/api/auth/guest-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Authentication failed')
      
      if (isDemoLogin || json.isDemo) {
        localStorage.setItem('tai_onboarding_completed', 'true')
        sessionStorage.removeItem('tai_tour_step_index')
      }
      
      router.push('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
      setSsoLoading(null)
    }
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    handleLogin()
  }

  function handleForgotPassword() {
    setShowForgotModal(true)
  }

  return (
    <div className="login-wrapper">
      {/* ── Left Hero Panel ─────────────────────────────────────────────── */}
      <div className="left-hero-panel">
        <div className="hero-mesh-background" />

        {/* Brand Header */}
        <div className="brand-header">
          <Image
            src="/images/logos/tai-horizontal-primary-converted.png"
            alt="TAI Labs Logo"
            width={160}
            height={44}
            priority
            style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
          />
          <span className="enterprise-tag font-semibold">ENTERPRISE</span>
        </div>

        {/* Hero Content */}
        <div className="hero-content">
          <div className="badge-pill">
            <Sparkles size={13} className="badge-icon" />
            <span>Workforce AI Intelligence</span>
          </div>

          <h1 className="hero-heading">
            Enterprise AI Readiness Platform
          </h1>
          <p className="hero-subtitle">
            Benchmark organizational AI maturity, identify capabilities gaps, and deliver targeted upskilling across 5 core readiness pillars.
          </p>


          <ul className="features-list">
            {[
              { Icon: BarChart3, title: 'Baseline AI Assessments', desc: 'Real-time capability evaluation & multi-department gap analysis' },
              { Icon: ShieldCheck, title: 'Privacy-Preserving Architecture', desc: 'Enterprise-grade security with zero raw operational data exposure' },
              { Icon: TrendingUp, title: 'Actionable Upskilling Pathways', desc: 'Tailored learning curricula designed for role-specific growth' },
            ].map(({ Icon, title, desc }) => (
              <li key={title} className="feature-item">
                <div className="feature-icon-wrapper">
                  <Icon size={18} />
                </div>
                <div>
                  <div className="feature-title">{title}</div>
                  <div className="feature-desc">{desc}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Hero Footer */}
        <div className="hero-footer">
          <span>© 2026 TAI Labs Inc. • Enterprise Readiness Standard</span>
        </div>
      </div>

      {/* ── Right Login Form Panel ────────────────────────────────────────────── */}
      <div className="right-form-panel">
        <div className="form-container">
          
          {/* Mobile Logo Header */}
          <div className="mobile-logo-header">
            <Image
              src="/images/logos/tai-horizontal-primary-converted.png"
              alt="TAI Labs Logo"
              width={140}
              height={38}
              priority
              style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
            />
          </div>

          {/* Form Header */}
          <div className="form-header">
            <h2 className="form-title">Admin Sign In</h2>
            <p className="form-subtitle">
              Sign in to access your organization&apos;s AI readiness dashboard or explore system capabilities.
            </p>
          </div>

          {/* Quick Seed Data Access Card */}
          <div style={{
            padding: '14px 16px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(255, 115, 0, 0.08) 0%, rgba(255, 138, 43, 0.04) 100%)',
            border: '1px solid rgba(255, 115, 0, 0.25)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: '#e66800' }}>
                <Sparkles size={14} />
                <span>Showcase Seed Data</span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Explore 7 teams, 67+ evaluations & upskilling recommendations.
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setEmail('demo')
                setPassword('demo')
                handleLogin(undefined, true)
              }}
              disabled={loading}
              style={{
                height: '34px',
                padding: '0 12px',
                borderRadius: '6px',
                background: '#ff7300',
                color: '#ffffff',
                border: 'none',
                fontSize: '12px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 2px 6px rgba(255, 115, 0, 0.3)',
                transition: 'all 0.15s ease'
              }}
            >
              <span>Demo</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="error-banner" role="alert">
              <Info size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* SSO Options */}
          <div className="sso-group">
            <button
              type="button"
              onClick={() => handleLogin('google')}
              disabled={loading || ssoLoading !== null}
              className="sso-button"
            >
              {ssoLoading === 'google' ? (
                <span className="button-spinner dark" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              <span>Continue with Google Workspace</span>
            </button>

            <button
              type="button"
              onClick={() => handleLogin('microsoft')}
              disabled={loading || ssoLoading !== null}
              className="sso-button"
            >
              {ssoLoading === 'microsoft' ? (
                <span className="button-spinner dark" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 23 23" aria-hidden="true">
                  <path d="M1 1h10v10H1z" fill="#f35325" />
                  <path d="M12 1h10v10H12z" fill="#81bc06" />
                  <path d="M1 12h10v10H1z" fill="#05a6f0" />
                  <path d="M12 12h10v10H12z" fill="#ffba08" />
                </svg>
              )}
              <span>Continue with Microsoft Entra</span>
            </button>
          </div>

          {/* Divider */}
          <div className="divider-row">
            <div className="divider-line" />
            <span className="divider-text">OR WORK EMAIL</span>
            <div className="divider-line" />
          </div>

          {/* Credentials Form */}
          <form onSubmit={handleFormSubmit} className="login-form">
            <div className="input-group">
              <label htmlFor="email-input" className="input-label">
                Work Email Address
              </label>
              <input
                id="email-input"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin"
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                className={`text-input ${emailFocused ? 'focused' : ''}`}
                autoComplete="username"
              />
            </div>

            <div className="input-group">
              <label htmlFor="password-input" className="input-label">
                Password
              </label>
              <div className="password-input-wrapper">
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  className={`text-input password-input ${passwordFocused ? 'focused' : ''}`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="password-toggle-btn"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="form-meta-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  defaultChecked
                  className="checkbox-input"
                />
                <span className="checkbox-text">Keep me signed in</span>
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="forgot-link"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || ssoLoading !== null}
              className="submit-btn"
            >
              {loading ? (
                <>
                  <span className="button-spinner light" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Form Footer */}
          <div className="page-footer">
            <p>© 2026 TAI Readiness Baseline Tool</p>
            <div className="footer-links">
              <Link href="/" className="footer-link">Terms of Service</Link>
              <span className="footer-dot">•</span>
              <Link href="/" className="footer-link">Privacy Policy</Link>
              <span className="footer-dot">•</span>
              <Link href="/" className="footer-link">Security Statement</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Dialog open={showForgotModal} onOpenChange={setShowForgotModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Admin Password</DialogTitle>
            <DialogDescription>
              Enter your corporate email address to receive password reset instructions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Work Email</label>
              <input
                type="email"
                placeholder="admin@enterprise.com"
                defaultValue={email || 'admin@enterprise.com'}
                className="w-full h-11 px-3 border border-slate-300 rounded-md text-sm outline-none focus:border-orange-500"
              />
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800 flex items-start gap-2">
              <Info size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <span>If SSO is enforced for your domain, you will be redirected to your identity provider.</span>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="btn-secondary text-xs h-9 px-4"
              onClick={() => setShowForgotModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary text-xs h-9 px-4"
              onClick={() => {
                setShowForgotModal(false)
                toast.success('Reset link sent', {
                  description: 'Check your email inbox for password recovery steps.',
                })
              }}
            >
              Send Reset Link
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Scoped Styling & Media Queries ────────────────────────────────────── */}
      <style jsx>{`
        .login-wrapper {
          min-height: 100vh;
          width: 100%;
          display: flex;
          background-color: #f8fafc;
          font-family: var(--font-family, 'Inter', system-ui, -apple-system, sans-serif);
          color: #0f172a;
          overflow-x: hidden;
        }

        /* ── Left Hero Panel ── */
        .left-hero-panel {
          position: relative;
          width: 52%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: linear-gradient(145deg, #090d16 0%, #0f172a 50%, #1e293b 100%);
          padding: 56px 64px;
          color: #ffffff;
          overflow: hidden;
        }

        .hero-mesh-background {
          position: absolute;
          inset: 0;
          background-image: 
            radial-gradient(circle at 85% 15%, rgba(255, 115, 0, 0.12) 0%, transparent 40%),
            radial-gradient(circle at 15% 85%, rgba(59, 130, 246, 0.10) 0%, transparent 45%);
          pointer-events: none;
        }

        .brand-header {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .enterprise-tag {
          font-size: 10px;
          letter-spacing: 0.1em;
          color: #ff8a2b;
          background: rgba(255, 115, 0, 0.12);
          border: 1px solid rgba(255, 115, 0, 0.25);
          padding: 2px 8px;
          border-radius: 4px;
        }

        .hero-content {
          position: relative;
          z-index: 10;
          max-width: 520px;
          margin: 32px 0;
        }

        .badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: rgba(255, 115, 0, 0.12);
          border: 1px solid rgba(255, 115, 0, 0.28);
          border-radius: 100px;
          font-size: 13px;
          font-weight: 500;
          color: #ff8a2b;
          margin-bottom: 20px;
        }

        .hero-heading {
          font-size: 38px;
          font-weight: 700;
          line-height: 1.2;
          letter-spacing: -0.025em;
          color: #ffffff;
          margin-bottom: 16px;
          text-wrap: balance;
        }

        .hero-subtitle {
          font-size: 15px;
          line-height: 1.6;
          color: #94a3b8;
          margin-bottom: 28px;
        }


        .features-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .feature-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }

        .feature-icon-wrapper {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(255, 115, 0, 0.1);
          border: 1px solid rgba(255, 115, 0, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ff7300;
          flex-shrink: 0;
        }

        .feature-title {
          font-size: 14px;
          font-weight: 600;
          color: #f1f5f9;
          margin-bottom: 2px;
        }

        .feature-desc {
          font-size: 12.5px;
          color: #94a3b8;
          line-height: 1.4;
        }

        .hero-footer {
          position: relative;
          z-index: 10;
          font-size: 12.5px;
          color: #64748b;
        }

        /* ── Right Form Panel ── */
        .right-form-panel {
          width: 48%;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 40px 32px;
          background-color: #ffffff;
        }

        .form-container {
          width: 100%;
          max-width: 400px;
          display: flex;
          flex-direction: column;
        }

        .mobile-logo-header {
          display: none;
          margin-bottom: 24px;
        }

        .form-header {
          margin-bottom: 28px;
        }

        .form-title {
          font-size: 26px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.02em;
          margin: 0 0 8px 0;
        }

        .form-subtitle {
          font-size: 14px;
          color: #64748b;
          margin: 0;
          line-height: 1.5;
        }

        .error-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          color: #dc2626;
          font-size: 13px;
          margin-bottom: 20px;
        }

        .sso-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 22px;
        }

        .sso-button {
          width: 100%;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 0 16px;
          background-color: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 13.5px;
          font-weight: 500;
          color: #334155;
          cursor: pointer;
          transition: all 0.15s ease-in-out;
        }

        .sso-button:hover:not(:disabled) {
          background-color: #f8fafc;
          border-color: #94a3b8;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
        }

        .divider-row {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 22px;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background-color: #e2e8f0;
        }

        .divider-text {
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
          letter-spacing: 0.06em;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .input-label {
          font-size: 13px;
          font-weight: 600;
          color: #334155;
        }

        .text-input {
          width: 100%;
          height: 44px;
          padding: 0 14px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 14px;
          color: #0f172a;
          background-color: #ffffff;
          outline: none;
          transition: all 0.15s ease-in-out;
          box-sizing: border-box;
        }

        .text-input:hover:not(:focus) {
          border-color: #94a3b8;
        }

        .text-input.focused {
          border-color: #ff7300;
          box-shadow: 0 0 0 3px rgba(255, 115, 0, 0.15);
        }

        .password-input-wrapper {
          position: relative;
          width: 100%;
        }

        .password-input {
          padding-right: 44px;
        }

        .password-toggle-btn {
          position: absolute;
          right: 4px;
          top: 50%;
          transform: translateY(-50%);
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          border-radius: 6px;
          color: #64748b;
          cursor: pointer;
          transition: color 0.15s, background-color 0.15s;
        }

        .password-toggle-btn:hover {
          color: #0f172a;
          background-color: #f1f5f9;
        }

        .form-meta-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 24px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          user-select: none;
        }

        .checkbox-input {
          width: 16px;
          height: 16px;
          accent-color: #ff7300;
          cursor: pointer;
        }

        .checkbox-text {
          font-size: 13px;
          color: #475569;
        }

        .forgot-link {
          font-size: 13px;
          font-weight: 500;
          color: #ff7300;
          background: transparent;
          border: none;
          padding: 4px;
          cursor: pointer;
          transition: opacity 0.15s;
        }

        .forgot-link:hover {
          opacity: 0.85;
          text-decoration: underline;
        }

        .submit-btn {
          width: 100%;
          height: 46px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background-color: #ff7300;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease-in-out;
          box-shadow: 0 4px 12px rgba(255, 115, 0, 0.25);
          margin-top: 4px;
        }

        .submit-btn:hover:not(:disabled) {
          background-color: #e66800;
          box-shadow: 0 6px 16px rgba(255, 115, 0, 0.35);
          transform: translateY(-1px);
        }

        .submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .button-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid;
          border-radius: 50%;
          display: inline-block;
          animation: spin 0.7s linear infinite;
        }

        .button-spinner.light {
          border-color: rgba(255, 255, 255, 0.3);
          border-top-color: #ffffff;
        }

        .button-spinner.dark {
          border-color: rgba(0, 0, 0, 0.1);
          border-top-color: #0f172a;
        }

        .page-footer {
          margin-top: 36px;
          text-align: center;
          font-size: 12px;
          color: #94a3b8;
        }

        .page-footer p {
          margin: 0 0 6px 0;
        }

        .footer-links {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .footer-link {
          color: #64748b;
          text-decoration: none;
          transition: color 0.15s;
        }

        .footer-link:hover {
          color: #0f172a;
        }

        .footer-dot {
          color: #cbd5e1;
        }

        /* ── Responsive Breakpoints ── */
        @media (max-width: 1024px) {
          .left-hero-panel {
            padding: 40px 32px;
          }
          .hero-heading {
            font-size: 32px;
          }
        }

        @media (max-width: 768px) {
          .left-hero-panel {
            display: none;
          }
          .right-form-panel {
            width: 100%;
            padding: 32px 20px;
          }
          .mobile-logo-header {
            display: flex;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  )
}
