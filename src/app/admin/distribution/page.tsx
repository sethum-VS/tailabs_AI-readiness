import type { Metadata } from 'next'
import { InviteManager } from '@/components/admin/InviteManager'
import Link from 'next/link'
import Image from 'next/image'
import { LayoutDashboard, Share2 } from 'lucide-react'

import { RestartTourButton } from '@/components/admin/OnboardingTour'

export const metadata: Metadata = {
  title: 'Assessment Distribution | TAI Readiness',
  description: 'Generate and manage tokenized AI readiness assessment links for your teams.',
}

export default function DistributionPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg-app)' }}>
      {/* ─── Top Navigation ─────────────────────────────────────────────────── */}
      <nav
        style={{
          backgroundColor: 'var(--color-bg-card)',
          borderBottom: '1px solid var(--color-border)',
          padding: '0 16px',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <Link href="/admin" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
            <Image
              src="/images/logos/tai-horizontal-primary.png"
              alt="TAI Readiness"
              width={142}
              height={40}
              priority
              style={{ height: '28px', width: 'auto', objectFit: 'contain' }}
            />
          </Link>

          {/* Nav links & actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link
              href="/admin"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                color: 'var(--color-text-secondary)',
                textDecoration: 'none',
                transition: 'background 0.15s ease',
              }}
              className="nav-link"
            >
              <LayoutDashboard size={15} />
              <span className="hide-mobile">Dashboard</span>
            </Link>
            <Link
              href="/admin/distribution"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                color: 'var(--color-brand-accent)',
                textDecoration: 'none',
                background: 'rgba(255, 115, 0, 0.08)',
              }}
            >
              <Share2 size={15} />
              <span className="hide-mobile">Distribution</span>
            </Link>
            <RestartTourButton />
          </div>
        </div>
      </nav>

      {/* ─── Page Content ────────────────────────────────────────────────────── */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 16px' }}>

        {/* Breadcrumb */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '24px',
          }}
        >
          <Link
            href="/admin"
            style={{ fontSize: '13px', color: 'var(--color-text-secondary)', textDecoration: 'none' }}
          >
            Admin
          </Link>
          <span style={{ fontSize: '13px', color: 'var(--color-text-disabled)' }}>/</span>
          <span style={{ fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: '500' }}>
            Distribution
          </span>
        </div>

        <InviteManager />
      </main>
    </div>
  )
}
