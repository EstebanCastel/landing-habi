'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { trackPageView } from './google-analytics'

/**
 * Componente que trackea automáticamente cada cambio de ruta en Google Analytics
 * Soluciona el problema de que Next.js App Router no dispara pageviews en navegaciones SPA
 */
export default function PageViewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
    trackPageView(url, document.title)
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('📊 PageView tracked:', url)
    }
  }, [pathname, searchParams])

  return null
}
