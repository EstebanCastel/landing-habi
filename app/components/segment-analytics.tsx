'use client';

import Script from 'next/script';

export default function SegmentScript() {
  const writeKey = process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY;

  if (!writeKey) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️ Segment Write Key no configurado. Analytics de Segment deshabilitado.');
    }
    return null;
  }

  return (
    <>
      <Script
        id="segment-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(){var i="analytics",analytics=window[i]=window[i]||[];if(!analytics.initialize)if(analytics.invoked)window.console&&console.error&&console.error("Segment snippet included twice.");else{analytics.invoked=!0;analytics.methods=["trackSubmit","trackClick","trackLink","trackForm","pageview","identify","reset","group","track","ready","alias","debug","page","screen","once","off","on","addSourceMiddleware","addIntegrationMiddleware","setAnonymousId","addDestinationMiddleware","register"];analytics.factory=function(e){return function(){if(window[i].initialized)return window[i][e].apply(window[i],arguments);var n=Array.prototype.slice.call(arguments);if(["track","screen","alias","group","page","identify"].indexOf(e)>-1){var c=document.querySelector("link[rel='canonical']");n.push({__t:"bpc",c:c&&c.getAttribute("href")||void 0,p:location.pathname,u:location.href,s:location.search,t:document.title,r:document.referrer})}n.unshift(e);analytics.push(n);return analytics}};for(var n=0;n<analytics.methods.length;n++){var key=analytics.methods[n];analytics[key]=analytics.factory(key)}analytics.load=function(key,n){var t=document.createElement("script");t.type="text/javascript";t.async=!0;t.setAttribute("data-global-segment-analytics-key",i);t.src="https://cdn.segment.com/analytics.js/v1/" + key + "/analytics.min.js";var r=document.getElementsByTagName("script")[0];r.parentNode.insertBefore(t,r);analytics._loadOptions=n};analytics._writeKey="${writeKey}";analytics.SNIPPET_VERSION="5.2.0";
            analytics.load("${writeKey}");
            analytics.page();
            }}();
            
            ${process.env.NODE_ENV !== 'production' ? `
            console.log('🟣 Segment Analytics inicializado:', '${writeKey}');
            window.analytics.ready(function() {
              console.log('🟣 Segment está listo para recibir eventos');
            });
            ` : ''}
          `,
        }}
      />
    </>
  );
}

// Función para tracking de eventos personalizados en Segment
export const trackSegmentEvent = (eventName: string, properties?: Record<string, unknown>) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔍 [DEV] Segment Event:', { eventName, properties });
  }
  
  if (typeof window !== 'undefined' && window.analytics) {
    window.analytics.track(eventName, properties);
  }
};

// Función para tracking de páginas en Segment
export const trackSegmentPageView = (name?: string, properties?: Record<string, unknown>) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔍 [DEV] Segment Page View:', { name, properties });
  }
  
  if (typeof window !== 'undefined' && window.analytics) {
    window.analytics.page(name, properties);
  }
};

// Función para identificar usuarios en Segment
export const identifySegmentUser = (userId: string, traits?: Record<string, unknown>) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔍 [DEV] Segment Identify:', { userId, traits });
  }
  
  if (typeof window !== 'undefined' && window.analytics) {
    window.analytics.identify(userId, traits);
  }
};

// Declaración de tipos para TypeScript
declare global {
  interface Window {
    analytics: {
      track: (event: string, properties?: Record<string, unknown>) => void;
      page: (name?: string, properties?: Record<string, unknown>) => void;
      identify: (userId: string, traits?: Record<string, unknown>) => void;
      ready: (callback: () => void) => void;
      load: (writeKey: string) => void;
      [key: string]: unknown;
    };
  }
}
