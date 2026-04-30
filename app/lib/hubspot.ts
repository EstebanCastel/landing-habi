// Mercado según pipeline de HubSpot
export type HubSpotCountry = 'CO' | 'MX'

// Tipos para las propiedades de HubSpot
export interface HubSpotProperties {
  nid: string
  pipeline?: string | null
  country?: HubSpotCountry
  bnpl3: string
  bnpl6: string
  bnpl9: string
  precio_comite: string
  precio_comite_original?: string | null // precio del comité sin negociación comercial
  bnpl_1_comercial_raw?: string | null // valor crudo de bnpl_1__comercial_ (null si no existía)
  whatsapp_asesor?: string
  nombre_del_conjunto?: string | null
  area_construida?: string | null
  direccion?: string | null
  numero_habitaciones?: string | null
  v_o_num_hab_confirmadas?: string | null
  numero_de_banos?: string | null
  tipo_inmueble_id?: string | null
  negocio_aplica_para_bnpl?: string | null
  razon_de_venta?: string | null
  valor_subsidiado?: string | null
  valor_subsidiado_extraordinario?: string | null
  subsidio_aprobado_lider?: string | null
  subsidio_aprobado_director?: string | null
  valor_reparaciones?: string | null
  quiere_ofertar_alianza?: string | null
  precio_maximo_prestamo?: string | null
  precio_intermedio?: string | null
  ab_test_landing?: 'A' | 'B' | null
  abc_test_landing_co?: string | null
  no_recibio_oferta?: string | null
  area_metropolitana?: string | null // internal value (ej: "1" = Valle de Aburra)
  error?: boolean
  message?: string
}

// Porcentaje extra que se suma al precio cuando el cliente paga sus propios tramites
// (solo aplica para BNPL en Valle de Aburra)
export const TRAMITES_CLIENTE_BNPL_BONUS_PCT = 0.8

/**
 * Determina si el negocio cumple las condiciones para ofrecer la opcion de
 * "Yo pago mis tramites" con bonificacion del +0.8% sobre la cuota seleccionada.
 *
 * Condiciones:
 * - BNPL habilitado (negocio_aplica_para_bnpl con valor afirmativo)
 * - HubSpot area_metropolitana = "1" (Valle de Aburra)
 * - Pais = CO (BNPL no aplica en MX)
 * - No esta en flujo alianza (alianza no tiene BNPL)
 */
export function isTramitesClienteBnplEligible(
  bnplPrices?: HubSpotProperties | null
): boolean {
  if (!bnplPrices) return false
  if (bnplPrices.country === 'MX') return false

  const isAlianza = bnplPrices.quiere_ofertar_alianza?.toLowerCase().trim() === 'si'
  if (isAlianza) return false

  const negocio = bnplPrices.negocio_aplica_para_bnpl?.toLowerCase().trim()
  const hasBnpl = !!negocio && !['no', 'false', 'null', ''].includes(negocio)
  if (!hasBnpl) return false

  const area = bnplPrices.area_metropolitana?.toString().trim().toLowerCase()
  return area === '1' || area === 'valle de aburra' || area === 'valle de aburrá'
}

// Función para obtener las propiedades de HubSpot por deal_uuid
// Devuelve un objeto con error: true en caso de fallo (no lanza excepciones)
export async function getHubSpotProperties(dealUuid: string): Promise<HubSpotProperties | null> {
  try {
    const url = `/api/hubspot?deal_uuid=${dealUuid}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      console.warn('[HubSpot] Endpoint respondió con error:', response.status, response.statusText)
      return null
    }

    const data = await response.json()
    
    if (!data || typeof data !== 'object') {
      console.warn('[HubSpot] Datos inválidos recibidos del endpoint')
      return null
    }
    
    if (data.error) {
      console.warn('[HubSpot] API respondió con error:', data.message)
      return null
    }
    
    return data as HubSpotProperties
    
  } catch (error) {
    console.warn('[HubSpot] No se pudo conectar al endpoint:', (error as Error).message)
    return null
  }
}
