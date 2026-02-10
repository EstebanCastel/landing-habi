'use client'

import Script from 'next/script'

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

export default function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️ Google Analytics Measurement ID no configurado')
    }
    return null
  }
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_title: document.title,
            page_location: window.location.href,
            debug_mode: ${process.env.NODE_ENV !== 'production'},
            send_page_view: true
          });
          
          ${process.env.NODE_ENV !== 'production' ? `console.log('🟢 Google Analytics inicializado:', '${GA_MEASUREMENT_ID}');` : ''}
          
          ${process.env.NODE_ENV !== 'production' ? `
          const originalGtag = window.gtag;
          window.gtag = function() {
            console.log('📊 GA Event:', arguments);
            return originalGtag.apply(this, arguments);
          };
          ` : ''}
        `}
      </Script>
    </>
  )
}

// Función para tracking de eventos personalizados
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔍 [DEV] GA Event:', { action, category, label, value })
  }
  
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// Función para tracking de páginas
export const trackPageView = (url: string, title?: string) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔍 [DEV] GA Page View:', { url, title })
  }
  
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
      page_title: title,
    })
  }
}

// Declaración de tipos para TypeScript
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void
    dataLayer: unknown[]
  }
}
