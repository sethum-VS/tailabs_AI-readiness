'use client'

import Image from 'next/image'
import Link from 'next/link'

export function DashboardContentSkeleton() {
  return (
    <div className="w-full flex flex-col gap-xl">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-sm mb-lg">
        <div className="h-8 bg-surface-dim rounded w-64 skeleton-pulse"></div>
        <div className="h-4 bg-surface-dim rounded w-96 max-w-full skeleton-pulse"></div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
        {/* Widget 1 (Circle Skeleton) */}
        <div className="bg-surface-pure border border-border-subtle rounded-xl p-card-padding flex flex-col items-center justify-center shadow-sm">
          <div className="h-6 bg-surface-dim rounded w-32 skeleton-pulse mb-lg self-start"></div>
          <div className="w-48 h-48 rounded-full border-[12px] border-surface-dim skeleton-pulse relative flex items-center justify-center">
            <div className="h-8 bg-surface-dim rounded w-16 skeleton-pulse"></div>
          </div>
          <div className="flex gap-md mt-lg w-full justify-center">
            <div className="h-4 bg-surface-dim rounded w-16 skeleton-pulse"></div>
            <div className="h-4 bg-surface-dim rounded w-16 skeleton-pulse"></div>
          </div>
        </div>

        {/* Widget 2 (Bars Skeleton) */}
        <div className="bg-surface-pure border border-border-subtle rounded-xl p-card-padding flex flex-col shadow-sm md:col-span-2">
          <div className="h-6 bg-surface-dim rounded w-48 skeleton-pulse mb-xl"></div>
          <div className="flex-grow flex items-end justify-around h-48 gap-sm border-b border-l border-surface-dim pb-sm pl-sm">
            <div className="w-12 bg-surface-dim rounded-t h-[30%] skeleton-pulse"></div>
            <div className="w-12 bg-surface-dim rounded-t h-[60%] skeleton-pulse"></div>
            <div className="w-12 bg-surface-dim rounded-t h-[40%] skeleton-pulse"></div>
            <div className="w-12 bg-surface-dim rounded-t h-[80%] skeleton-pulse"></div>
            <div className="w-12 bg-surface-dim rounded-t h-[50%] skeleton-pulse"></div>
            <div className="w-12 bg-surface-dim rounded-t h-[90%] skeleton-pulse"></div>
            <div className="w-12 bg-surface-dim rounded-t h-[20%] skeleton-pulse"></div>
          </div>
          <div className="flex justify-around mt-sm">
            <div className="h-3 bg-surface-dim rounded w-8 skeleton-pulse"></div>
            <div className="h-3 bg-surface-dim rounded w-8 skeleton-pulse"></div>
            <div className="h-3 bg-surface-dim rounded w-8 skeleton-pulse"></div>
            <div className="h-3 bg-surface-dim rounded w-8 skeleton-pulse"></div>
            <div className="h-3 bg-surface-dim rounded w-8 skeleton-pulse"></div>
            <div className="h-3 bg-surface-dim rounded w-8 skeleton-pulse"></div>
            <div className="h-3 bg-surface-dim rounded w-8 skeleton-pulse"></div>
          </div>
        </div>

        {/* Widget 3 (Rows Skeleton) */}
        <div className="bg-surface-pure border border-border-subtle rounded-xl p-card-padding flex flex-col shadow-sm md:col-span-3">
          <div className="h-6 bg-surface-dim rounded w-56 skeleton-pulse mb-xl"></div>
          <div className="flex flex-col gap-md">
            {/* Row 1 */}
            <div className="flex items-center gap-md pb-md border-b border-surface-container-low">
              <div className="w-10 h-10 rounded-full bg-surface-dim skeleton-pulse shrink-0"></div>
              <div className="flex-grow flex flex-col gap-xs">
                <div className="h-4 bg-surface-dim rounded w-1/3 skeleton-pulse"></div>
                <div className="h-3 bg-surface-dim rounded w-1/4 skeleton-pulse"></div>
              </div>
              <div className="h-6 bg-surface-dim rounded w-24 skeleton-pulse"></div>
            </div>
            {/* Row 2 */}
            <div className="flex items-center gap-md pb-md border-b border-surface-container-low">
              <div className="w-10 h-10 rounded-full bg-surface-dim skeleton-pulse shrink-0"></div>
              <div className="flex-grow flex flex-col gap-xs">
                <div className="h-4 bg-surface-dim rounded w-2/5 skeleton-pulse"></div>
                <div className="h-3 bg-surface-dim rounded w-1/3 skeleton-pulse"></div>
              </div>
              <div className="h-6 bg-surface-dim rounded w-20 skeleton-pulse"></div>
            </div>
            {/* Row 3 */}
            <div className="flex items-center gap-md">
              <div className="w-10 h-10 rounded-full bg-surface-dim skeleton-pulse shrink-0"></div>
              <div className="flex-grow flex flex-col gap-xs">
                <div className="h-4 bg-surface-dim rounded w-1/4 skeleton-pulse"></div>
                <div className="h-3 bg-surface-dim rounded w-1/5 skeleton-pulse"></div>
              </div>
              <div className="h-6 bg-surface-dim rounded w-28 skeleton-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="bg-background min-h-screen flex flex-col font-sans">
      {/* TopNavBar */}
      <nav className="bg-surface-pure border-b border-border-subtle w-full sticky top-0 z-50">
        <div className="flex justify-between items-center h-16 px-md w-full max-w-container-max mx-auto md:max-w-7xl">
          {/* Brand Logo */}
          <div className="flex items-center gap-sm">
            <Image
              src="/images/logos/tai-horizontal-primary.png"
              alt="TAI Labs Logo"
              width={142}
              height={40}
              priority
              className="h-8 w-auto object-contain"
              style={{ maxWidth: '150px' }}
            />
          </div>
          {/* Trailing Actions */}
          <div className="flex items-center gap-sm">
            <button className="text-on-surface-variant hover:bg-surface-container-low transition-colors rounded-full p-2 active:scale-95 transition-transform flex items-center justify-center">
              <span className="material-symbols-outlined" data-icon="account_circle">account_circle</span>
            </button>
            <button className="text-on-surface-variant hover:bg-surface-container-low transition-colors rounded-full p-2 active:scale-95 transition-transform flex items-center justify-center">
              <span className="material-symbols-outlined" data-icon="logout">logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-md py-xl flex flex-col gap-xl">
        <DashboardContentSkeleton />
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border-subtle bg-surface px-md py-lg mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-md">
          <div className="flex items-center gap-sm text-label text-text-secondary">
            <span>© 2026</span>
            <Image
              src="/images/logos/tai-horizontal-primary.png"
              alt="TAI Labs"
              width={80}
              height={20}
              className="h-4 w-auto object-contain"
            />
            <span className="text-border-subtle">|</span>
            <span>tai-readiness-v1.0.0</span>
          </div>
          <div className="flex items-center gap-lg">
            <Link href="/" className="text-label text-text-secondary hover:text-text-primary transition-colors cursor-pointer">
              Terms &amp; Conditions
            </Link>
            <Link href="/" className="text-label text-text-secondary hover:text-text-primary transition-colors cursor-pointer">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default DashboardSkeleton
