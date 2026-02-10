import { trackEvent } from '../components/google-analytics'
import { trackSegmentEvent } from '../components/segment-analytics'

// Función helper para enviar eventos a ambas plataformas (GA + Segment)
const trackToBoth = (
  eventName: string, 
  gaParams: { category: string; label?: string; value?: number },
  segmentProperties?: Record<string, unknown>
) => {
  trackEvent(eventName, gaParams.category, gaParams.label, gaParams.value);
  trackSegmentEvent(eventName, {
    category: gaParams.category,
    label: gaParams.label,
    value: gaParams.value,
    ...segmentProperties
  });
};

/**
 * Eventos de analytics para la landing de propuesta de compra Habi
 * Cada evento incluye country (CO/MX) y un nombre descriptivo de la sección
 */
export const analytics = {
  // ─── Navegación / Páginas ─────────────────────────
  pageView: (pageName: string, props?: { dealUuid?: string; country?: string }) => {
    trackToBoth('page_view_landing', { category: 'navigation', label: pageName }, {
      page_name: pageName,
      deal_uuid: props?.dealUuid,
      country: props?.country,
    })
  },

  // ─── Carga de datos ──────────────────────────────
  hubspotLoaded: (dealUuid: string, country: string) => {
    trackToBoth('hubspot_loaded', { category: 'data', label: `${country}_${dealUuid}` }, {
      deal_uuid: dealUuid,
      country,
    })
  },

  hubspotError: (dealUuid: string, errorMsg: string) => {
    trackToBoth('hubspot_error', { category: 'error', label: dealUuid }, {
      deal_uuid: dealUuid,
      error_message: errorMsg,
    })
  },

  dataLoaded: (source: 'hesh' | 'comparables', country: string, nid: string) => {
    trackToBoth(`data_loaded_${source}`, { category: 'data', label: `${country}_${nid}` }, {
      data_source: source,
      country,
      nid,
    })
  },

  // ─── Secciones visibles ──────────────────────────
  sectionViewed: (sectionName: string, country?: string) => {
    trackToBoth(`section_viewed_${sectionName}`, { category: 'engagement', label: sectionName }, {
      section_name: sectionName,
      country,
    })
  },

  // ─── Pago a cuotas ───────────────────────────────
  paymentOptionSelected: (option: string, price: number, country?: string) => {
    trackToBoth('payment_option_selected', { category: 'engagement_payment', label: option, value: price }, {
      payment_option: option,
      price,
      country,
    })
  },

  // ─── Costos (tramites / remodelación) ────────────
  costToggleChanged: (costType: 'tramites' | 'remodelacion', value: 'habi' | 'cliente', country?: string) => {
    trackToBoth(`cost_toggle_${costType}`, { category: 'engagement_costs', label: `${costType}_${value}` }, {
      cost_type: costType,
      selected_value: value,
      country,
    })
  },

  // ─── Resumen de precios (expandir/colapsar) ──────
  pricingSummaryToggled: (expanded: boolean, country?: string) => {
    trackToBoth('pricing_summary_toggled', { category: 'engagement_pricing', label: expanded ? 'expanded' : 'collapsed' }, {
      expanded,
      country,
    })
  },

  // ─── Comparables ─────────────────────────────────
  comparableSelected: (comparableId: string, country?: string) => {
    trackToBoth('comparable_selected', { category: 'engagement_comparables', label: comparableId }, {
      comparable_id: comparableId,
      country,
    })
  },

  // ─── Contacto / WhatsApp ─────────────────────────
  whatsappClick: (location: string, country?: string) => {
    trackToBoth('whatsapp_click', { category: 'conversion', label: `${location}_${country || 'unknown'}` }, {
      click_location: location,
      country,
    })
  },

  // ─── CTA (Continuar con la venta, etc.) ──────────
  ctaClick: (ctaName: string, location: string, country?: string) => {
    trackToBoth(`cta_${ctaName}`, { category: 'conversion', label: `${location}_${country || 'unknown'}` }, {
      cta_name: ctaName,
      cta_location: location,
      country,
    })
  },

  // ─── Calculadora de gastos ───────────────────────
  calculatorOpened: (country?: string) => {
    trackToBoth('calculator_opened', { category: 'engagement_calculator', label: 'expense_calculator' }, {
      calculator_type: 'expense_calculator',
      country,
    })
  },

  calculatorFieldFilled: (fieldName: string, country?: string) => {
    trackToBoth('calculator_field_filled', { category: 'engagement_calculator', label: fieldName }, {
      field_name: fieldName,
      country,
    })
  },

  calculatorResultsViewed: (totalExpenses?: number, country?: string) => {
    trackToBoth('calculator_results_viewed', { category: 'engagement_calculator', label: 'expense_calculator', value: totalExpenses }, {
      calculator_type: 'expense_calculator',
      total_expenses: totalExpenses,
      country,
    })
  },

  calculatorReset: (country?: string) => {
    trackToBoth('calculator_reset', { category: 'engagement_calculator', label: 'expense_calculator' }, {
      calculator_type: 'expense_calculator',
      country,
    })
  },

  // ─── Modalidad de venta ──────────────────────────
  saleModalitySelected: (modality: string, country?: string) => {
    trackToBoth('sale_modality_selected', { category: 'engagement_modality', label: `${modality}_${country || 'unknown'}` }, {
      modality,
      country,
    })
  },

  // ─── Liquidez ────────────────────────────────────
  liquidityAmountChanged: (amount: number, country?: string) => {
    trackToBoth('liquidity_amount_changed', { category: 'engagement_liquidity', value: amount }, {
      amount_needed: amount,
      country,
    })
  },

  // ─── Scroll depth ────────────────────────────────
  scrollDepth: (percentage: number, country?: string) => {
    trackToBoth(`scroll_${percentage}`, { category: 'engagement_scroll', label: `${percentage}%`, value: percentage }, {
      scroll_percentage: percentage,
      country,
    })
  },

  // ─── Tiempo en página ────────────────────────────
  timeOnPage: (seconds: number, country?: string) => {
    trackToBoth('time_on_page', { category: 'engagement', value: seconds }, {
      seconds_on_page: seconds,
      country,
    })
  },

  // ─── Errores ─────────────────────────────────────
  errorOccurred: (errorType: string, errorMessage: string) => {
    trackToBoth('error_landing', { category: 'error', label: `${errorType}_${errorMessage}` }, {
      error_type: errorType,
      error_message: errorMessage,
    })
  },
}

// ─── Tracking automático de tiempo en página ───────
export const initPageTimeTracking = (country?: string) => {
  if (typeof window !== 'undefined') {
    const startTime = Date.now()
    
    const trackTimeOnPage = () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000)
      if (timeSpent > 10) {
        analytics.timeOnPage(timeSpent, country)
      }
    }

    window.addEventListener('beforeunload', trackTimeOnPage)
    
    return () => {
      window.removeEventListener('beforeunload', trackTimeOnPage)
    }
  }
}

// ─── Tracking automático de scroll depth ───────────
export const initScrollTracking = (country?: string) => {
  if (typeof window !== 'undefined') {
    let maxScroll = 0
    const milestones = [25, 50, 75, 90, 100]
    const trackedMilestones = new Set<number>()

    const handleScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      )
      
      maxScroll = Math.max(maxScroll, scrollPercent)
      
      milestones.forEach(milestone => {
        if (maxScroll >= milestone && !trackedMilestones.has(milestone)) {
          analytics.scrollDepth(milestone, country)
          trackedMilestones.add(milestone)
        }
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }
}
