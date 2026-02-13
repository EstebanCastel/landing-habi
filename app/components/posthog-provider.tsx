'use client'

import { Suspense, useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import posthog from 'posthog-js'

function initPostHog() {
  if (typeof window === 'undefined') return
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return

  if (!posthog.__loaded) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: '/ingest',
      ui_host: 'https://us.posthog.com',
      autocapture: true,
      capture_pageview: false,
      capture_pageleave: true,
      persistence: 'localStorage+cookie',
      disable_session_recording: false,
      session_recording: {
        maskAllInputs: false,
        maskTextSelector: undefined,
      },
      loaded: (ph) => {
        // Force start session recording after init
        ph.startSessionRecording()
        if (process.env.NODE_ENV !== 'production') {
          console.log('[PostHog] Initialized and recording started. distinct_id:', ph.get_distinct_id())
        }
      },
    })
  }

  return posthog
}

function PostHogPageview() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!pathname || !posthog.__loaded) return
    posthog.capture('$pageview')
  }, [pathname, searchParams])

  return null
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog()
  }, [])

  return (
    <>
      <Suspense fallback={null}>
        <PostHogPageview />
      </Suspense>
      {children}
    </>
  )
}

export { posthog }
export default PostHogProvider
