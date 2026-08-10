'use client'

import React from 'react'
import { RefreshCw, ArrowDown } from 'lucide-react'

interface PullToRefreshIndicatorProps {
  pullDistance: number
  isRefreshing: boolean
  threshold?: number
}

export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  threshold = 70,
}: PullToRefreshIndicatorProps) {
  if (pullDistance <= 0 && !isRefreshing) return null

  const progress = Math.min(pullDistance / threshold, 1)
  const isReady = pullDistance >= threshold

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: `${Math.max(pullDistance, isRefreshing ? 54 : 0)}px`,
        maxHeight: '70px',
        overflow: 'hidden',
        background: 'var(--color-bg-card)',
        borderBottom: pullDistance > 0 || isRefreshing ? '1px solid var(--color-border)' : 'none',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        transition: isRefreshing || pullDistance === 0 ? 'height 0.25s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          borderRadius: '20px',
          background: 'rgba(255, 115, 0, 0.08)',
          border: '1px solid rgba(255, 115, 0, 0.2)',
          fontSize: '13px',
          fontWeight: '500',
          color: 'var(--color-brand-accent)',
          opacity: Math.max(progress, isRefreshing ? 1 : 0),
          transform: `scale(${0.8 + Math.min(progress * 0.2, 0.2)})`,
          transition: 'transform 0.15s ease, opacity 0.15s ease',
        }}
      >
        {isRefreshing ? (
          <>
            <RefreshCw size={15} className="animate-spin" />
            <span>Refreshing dashboard...</span>
          </>
        ) : (
          <>
            <ArrowDown
              size={15}
              style={{
                transform: `rotate(${isReady ? 180 : progress * 180}deg)`,
                transition: 'transform 0.2s ease',
              }}
            />
            <span>{isReady ? 'Release to refresh' : 'Pull down to refresh'}</span>
          </>
        )}
      </div>
    </div>
  )
}
