'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void
  threshold?: number
  disabled?: boolean
}

export function usePullToRefresh({
  onRefresh,
  threshold = 70,
  disabled = false,
}: UsePullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState<number>(0)
  const [isPulling, setIsPulling] = useState<boolean>(false)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)

  const startYRef = useRef<number>(0)
  const isPullingRef = useRef<boolean>(false)
  const isRefreshingRef = useRef<boolean>(false)

  useEffect(() => {
    isRefreshingRef.current = isRefreshing
  }, [isRefreshing])

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshingRef.current) return
    // Only pull to refresh when scrolled at top of page
    if (window.scrollY <= 2) {
      startYRef.current = e.touches[0].clientY
      isPullingRef.current = true
      setIsPulling(true)
    }
  }, [disabled])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPullingRef.current || disabled || isRefreshingRef.current) return

    const currentY = e.touches[0].clientY
    const diff = currentY - startYRef.current

    // Dragging down at the top of scroll
    if (diff > 0 && window.scrollY <= 2) {
      // Resistance calculation
      const distance = Math.min(diff * 0.45, 120)
      setPullDistance(distance)
    } else {
      setPullDistance(0)
    }
  }, [disabled])

  const handleTouchEnd = useCallback(async () => {
    if (!isPullingRef.current) return
    isPullingRef.current = false
    setIsPulling(false)

    setPullDistance((currentDistance) => {
      if (currentDistance >= threshold && !isRefreshingRef.current) {
        setIsRefreshing(true)
        // Execute refresh
        Promise.resolve(onRefresh()).finally(() => {
          setTimeout(() => {
            setIsRefreshing(false)
            setPullDistance(0)
          }, 400)
        })
        return threshold * 0.7
      }
      return 0
    })
  }, [onRefresh, threshold])

  useEffect(() => {
    if (disabled) return

    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchend', handleTouchEnd)
    window.addEventListener('touchcancel', handleTouchEnd)

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [disabled, handleTouchStart, handleTouchMove, handleTouchEnd])

  return {
    pullDistance,
    isPulling,
    isRefreshing,
    threshold,
  }
}
