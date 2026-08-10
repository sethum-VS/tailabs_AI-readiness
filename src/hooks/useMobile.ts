'use client'

import { useState, useEffect } from 'react'

/**
 * Hook to detect if current screen viewport is mobile width (<= breakpoint px).
 */
export function useIsMobile(breakpoint: number = 640): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= breakpoint)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [breakpoint])

  return isMobile
}
