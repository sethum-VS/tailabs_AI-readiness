import Link from 'next/link'

export function GlobalFooter() {
  return (
    <footer
      style={{
        backgroundColor: 'var(--color-bg-card)',
        borderTop: '1px solid var(--color-border)',
        padding: '12px 24px',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        {/* Left: Copyright + version */}
        <span
          style={{
            fontSize: '12px',
            color: 'var(--color-text-secondary)',
            fontFamily: 'var(--font-family)',
          }}
        >
          © 2026 | TAI Labs |{' '}
          <span style={{ color: 'var(--color-text-disabled)' }}>
            tai-readiness-v1.0.0
          </span>
        </span>

        {/* Right: Legal links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link
            href="/legal/terms"
            style={{
              fontSize: '12px',
              color: 'var(--color-text-secondary)',
              textDecoration: 'none',
              fontFamily: 'var(--font-family)',
            }}
            className="footer-link"
          >
            Terms &amp; Conditions
          </Link>
          <span style={{ color: 'var(--color-border)', fontSize: '12px' }}>|</span>
          <Link
            href="/legal/privacy"
            style={{
              fontSize: '12px',
              color: 'var(--color-text-secondary)',
              textDecoration: 'none',
              fontFamily: 'var(--font-family)',
            }}
            className="footer-link"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  )
}
