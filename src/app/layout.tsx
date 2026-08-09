import type { Metadata } from 'next'
import './globals.css'
import { GlobalFooter } from '@/components/layout/GlobalFooter'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'TAI Readiness Baseline Tool | Tailabs',
  description:
    'Enterprise AI readiness assessment platform. Measure, benchmark, and accelerate your team\'s AI adoption maturity across 5 critical pillars.',
  keywords: ['AI readiness', 'enterprise AI', 'Tailabs', 'assessment', 'upskilling'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-bg-app)' }}>
        <div className="flex-1">
          {children}
        </div>
        <GlobalFooter />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
            },
          }}
        />
      </body>
    </html>
  )
}
