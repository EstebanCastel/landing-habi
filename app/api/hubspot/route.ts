import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIp, isValidUUID, sanitizeUUID } from '@/app/lib/rate-limiter'

// Marcar esta ruta como dinámica
export const dynamic = 'force-dynamic'

// Mensaje de error cuando no se pueden obtener los datos
const ERROR_MESSAGE = {
  error: true,
  message: "Tuvimos un problema al obtener los precios. Por favor, contacta con tu asesor para más información."
}

// Pipeline HubSpot → mercado
// Los IDs pueden variar; agregar todos los que correspondan a cada país
const PIPELINES_MX = [
  '731899270', // Sellers - Market Maker MX (NUEVO) - internal value
  '10867264',  // ID observado en API
  '638550350', // Pipeline MX adicional observado en API
]
const PIPELINES_CO = [
  '798578615', // Sellers - Market Maker CO (NUEVO) - internal value
]

function pipelineToCountry(pipeline: string | undefined | null): 'CO' | 'MX' {
  const p = String(pipeline ?? '').trim()
  if (PIPELINES_MX.includes(p)) return 'MX'
  if (PIPELINES_CO.includes(p)) return 'CO'
  return 'CO' // default
}

/**
 * Convierte un número de HubSpot (con decimales) a entero
 * Ejemplo: "584866367.68400" -> "584866367"
 */
function parseHubSpotNumber(value: string | undefined | null): string | null {
  if (!value) return null
  
  // Convertir a número y redondear para quitar decimales
  const num = parseFloat(value)
  if (isNaN(num)) return null
  
  // Retornar como string sin decimales
  return Math.round(num).toString()
}

/**
 * Busca un deal por UUID usando la API de búsqueda
 */
async function searchDealByUuid(dealUuid: string, apiKey: string) {
  const url = 'https://api.hubapi.com/crm/v3/objects/deals/search'
  
  const searchBody = {
    filterGroups: [
      {
        filters: [
          {
            propertyName: 'deal_uuid',
            operator: 'EQ',
            value: dealUuid
          }
        ]
      }
    ],
    properties: ['bnpl_3', 'bnpl_6', 'bnpl_9', 'precio_comite', 'whatsapp_asesor', 'deal_uuid', 'bnpl_1__comercial_', 'bnpl_3__comercial_', 'bnpl_6__comercial_', 'bnpl_9__comercial_', 'valor_subsidiado', 'valor_subsidiado_extraordinario', 'subsidio_aprobado_lider', 'subsidio_aprobado_director', 'nombre_del_conjunto', 'area_construida', 'direccion', 'numero_habitaciones', 'numero_de_banos', 'tipo_inmueble_id', 'negocio_aplica_para_bnpl_', 'razon_de_venta_usuario_gabi_mx', 'pipeline', 'oferta_final_prestamo_mx_calculada', 'valor_negociado', 'final_final_aprobado_bo_prestamo_mx_calculo', 'valor_reparaciones', 'quiere_ofertar_alianza', 'precio_maximo_prestamo', 'precio_intermedio'],
    limit: 1
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(searchBody),
    signal: AbortSignal.timeout(10000),
    cache: 'no-store'
  })
  
  if (!response.ok) {
    console.error(`HubSpot API error: ${response.status} ${response.statusText}`)
    return null
  }

  const data = await response.json()
  
  if (!data.results || data.results.length === 0) {
    return null
  }
  
  return {
    id: data.results[0].id,
    properties: data.results[0].properties || {}
  }
}

/**
 * Obtiene un deal directamente por su ID
 */
async function getDealById(dealId: string, apiKey: string) {
  const url = `https://api.hubapi.com/crm/v3/objects/deals/${dealId}`
  
  const params = new URLSearchParams({
    properties: 'bnpl_3,bnpl_6,bnpl_9,precio_comite,whatsapp_asesor,deal_uuid,dealname,bnpl_1__comercial_,bnpl_3__comercial_,bnpl_6__comercial_,bnpl_9__comercial_,valor_subsidiado,valor_subsidiado_extraordinario,subsidio_aprobado_lider,subsidio_aprobado_director,nombre_del_conjunto,area_construida,direccion,numero_habitaciones,numero_de_banos,tipo_inmueble_id,negocio_aplica_para_bnpl_,razon_de_venta_usuario_gabi_mx,pipeline,oferta_final_prestamo_mx_calculada,valor_negociado,final_final_aprobado_bo_prestamo_mx_calculo,valor_reparaciones,quiere_ofertar_alianza,precio_maximo_prestamo,precio_intermedio'
  })
  
  const response = await fetch(`${url}?${params}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(10000),
    cache: 'no-store'
  })
  
  if (!response.ok) {
    console.error(`HubSpot API error: ${response.status} ${response.statusText}`)
    return null
  }

  const data = await response.json()
  return {
    id: data.id || dealId,
    properties: data.properties || {}
  }
}

export async function GET(request: NextRequest) {
  try {
    // 1. Rate Limiting
    const clientIp = getClientIp(request)
    const rateLimitResult = checkRateLimit(clientIp)
    
    const headers = {
      'X-RateLimit-Limit': '30',
      'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
    }
    
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for IP: ${clientIp}`)
      return NextResponse.json(
        { 
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        },
        { status: 429, headers }
      )
    }

    // 2. Validar parámetros
    const { searchParams } = request.nextUrl
    const dealUuid = searchParams.get('deal_uuid')
    const dealId = searchParams.get('deal_id')
    
    if (!dealUuid && !dealId) {
      return NextResponse.json(
        { error: 'deal_uuid or deal_id is required' },
        { status: 400, headers }
      )
    }

    // 3. Validar UUID (acepta cualquier formato para busqueda por deal_uuid en HubSpot)
    const useAsDealId = dealId;
    const useAsDealUuid = dealUuid;

    // 4. Verificar token
    const apiKey = process.env.HUBSPOT_ACCESS_TOKEN
    
    if (!apiKey) {
      console.warn('HUBSPOT_ACCESS_TOKEN not configured')
      return NextResponse.json(ERROR_MESSAGE, { headers, status: 503 })
    }
    
    // 5. Obtener datos de HubSpot
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let dealResult: { id: string; properties: Record<string, any> } | null = null
    
    if (useAsDealId) {
      dealResult = await getDealById(useAsDealId, apiKey)
    }
    
    if (!dealResult && useAsDealUuid) {
      dealResult = await searchDealByUuid(useAsDealUuid.trim(), apiKey)
    }
    
    // 6. Deal no encontrado
    if (!dealResult) {
      console.warn(`Deal not found - UUID: ${dealUuid}, ID: ${dealId}`)
      return NextResponse.json(ERROR_MESSAGE, { headers, status: 404 })
    }
    
    const { id: hubspotDealId, properties } = dealResult
    
    // 7. Parsear propiedades
    const bnpl3BaseValue = parseHubSpotNumber(properties.bnpl_3)
    const bnpl6BaseValue = parseHubSpotNumber(properties.bnpl_6)
    const bnpl9BaseValue = parseHubSpotNumber(properties.bnpl_9)
    const precioComiteValue = parseHubSpotNumber(properties.precio_comite)
    
    const bnpl1ComercialValue = parseHubSpotNumber(properties.bnpl_1__comercial_)
    const bnpl3ComercialValue = parseHubSpotNumber(properties.bnpl_3__comercial_)
    const bnpl6ComercialValue = parseHubSpotNumber(properties.bnpl_6__comercial_)
    const bnpl9ComercialValue = parseHubSpotNumber(properties.bnpl_9__comercial_)
    const valorSubsidiadoValue = parseHubSpotNumber(properties.valor_subsidiado)
    const valorSubsidiadoExtraValue = parseHubSpotNumber(properties.valor_subsidiado_extraordinario)
    
    // Lógica de negocio BNPL con límite máximo basado en subsidios aprobados
    let bnpl1Value: string
    let bnpl3Value: string
    let bnpl6Value: string
    let bnpl9Value: string
    
    const bnpl1ComercialNum = bnpl1ComercialValue ? Number(bnpl1ComercialValue) : null
    const bnpl3ComercialNum = bnpl3ComercialValue ? Number(bnpl3ComercialValue) : null
    const bnpl6ComercialNum = bnpl6ComercialValue ? Number(bnpl6ComercialValue) : null
    const bnpl9ComercialNum = bnpl9ComercialValue ? Number(bnpl9ComercialValue) : null
    const precioComiteNum = precioComiteValue ? Number(precioComiteValue) : 0
    const valorSubsidiadoNum = valorSubsidiadoValue ? Number(valorSubsidiadoValue) : 0
    const valorSubsidiadoExtraNum = valorSubsidiadoExtraValue ? Number(valorSubsidiadoExtraValue) : 0
    const bnpl3BaseNum = bnpl3BaseValue ? Number(bnpl3BaseValue) : 0
    const bnpl6BaseNum = bnpl6BaseValue ? Number(bnpl6BaseValue) : 0
    const bnpl9BaseNum = bnpl9BaseValue ? Number(bnpl9BaseValue) : 0
    
    const porcentajeCrecimiento3 = precioComiteNum > 0 ? (bnpl3BaseNum - precioComiteNum) / precioComiteNum : 0
    const porcentajeCrecimiento6 = precioComiteNum > 0 ? (bnpl6BaseNum - precioComiteNum) / precioComiteNum : 0
    const porcentajeCrecimiento9 = precioComiteNum > 0 ? (bnpl9BaseNum - precioComiteNum) / precioComiteNum : 0
    
    const incremento1a3 = bnpl3BaseNum > 0 && precioComiteNum > 0 ? bnpl3BaseNum / precioComiteNum : 1
    const incremento3a6 = bnpl6BaseNum > 0 && bnpl3BaseNum > 0 ? bnpl6BaseNum / bnpl3BaseNum : 1
    const incremento6a9 = bnpl9BaseNum > 0 && bnpl6BaseNum > 0 ? bnpl9BaseNum / bnpl6BaseNum : 1
    
    // Límite máximo BNPL1 = precio_comite + subsidios aprobados
    const subsidioLider = (properties.subsidio_aprobado_lider?.toLowerCase().trim() === 'si') ? valorSubsidiadoNum : 0
    const subsidioDirector = (properties.subsidio_aprobado_director?.toLowerCase().trim() === 'si') ? valorSubsidiadoExtraNum : 0
    const limiteMaximoBnpl1 = precioComiteNum + subsidioLider + subsidioDirector
    
    // Los límites de 3/6/9 cuotas escalan proporcionalmente al crecimiento base
    const limiteMaximoBnpl3 = Math.round(limiteMaximoBnpl1 * (1 + porcentajeCrecimiento3))
    const limiteMaximoBnpl6 = Math.round(limiteMaximoBnpl1 * (1 + porcentajeCrecimiento6))
    const limiteMaximoBnpl9 = Math.round(limiteMaximoBnpl1 * (1 + porcentajeCrecimiento9))
    
    const hayAlgunValorComercial = bnpl1ComercialNum || bnpl3ComercialNum || bnpl6ComercialNum || bnpl9ComercialNum
    
    if (!hayAlgunValorComercial) {
      bnpl1Value = precioComiteValue || "0"
      bnpl3Value = bnpl3BaseValue || "0"
      bnpl6Value = bnpl6BaseValue || "0"
      bnpl9Value = bnpl9BaseValue || "0"
    } else {
      // BNPL1
      if (bnpl1ComercialNum && bnpl1ComercialNum > 0 && bnpl1ComercialNum <= limiteMaximoBnpl1) {
        bnpl1Value = bnpl1ComercialValue!
      } else if (bnpl1ComercialNum && bnpl1ComercialNum > limiteMaximoBnpl1) {
        bnpl1Value = limiteMaximoBnpl1.toString()
      } else {
        bnpl1Value = precioComiteValue || "0"
      }
      
      const valorBnpl1Final = Number(bnpl1Value)
      
      // BNPL3
      let valorBnpl3Final: number
      if (bnpl3ComercialNum && bnpl3ComercialNum > 0) {
        if (bnpl3ComercialNum <= limiteMaximoBnpl3) {
          valorBnpl3Final = bnpl3ComercialNum
          bnpl3Value = bnpl3ComercialValue!
        } else {
          valorBnpl3Final = limiteMaximoBnpl3
          bnpl3Value = limiteMaximoBnpl3.toString()
        }
      } else {
        valorBnpl3Final = Math.round(valorBnpl1Final * incremento1a3)
        valorBnpl3Final = Math.min(valorBnpl3Final, limiteMaximoBnpl3)
        bnpl3Value = valorBnpl3Final.toString()
      }
      
      // BNPL6
      let valorBnpl6Final: number
      if (bnpl6ComercialNum && bnpl6ComercialNum > 0) {
        if (bnpl6ComercialNum <= limiteMaximoBnpl6) {
          valorBnpl6Final = bnpl6ComercialNum
          bnpl6Value = bnpl6ComercialValue!
        } else {
          valorBnpl6Final = limiteMaximoBnpl6
          bnpl6Value = limiteMaximoBnpl6.toString()
        }
      } else {
        valorBnpl6Final = Math.round(valorBnpl3Final * incremento3a6)
        valorBnpl6Final = Math.min(valorBnpl6Final, limiteMaximoBnpl6)
        bnpl6Value = valorBnpl6Final.toString()
      }
      
      // BNPL9
      if (bnpl9ComercialNum && bnpl9ComercialNum > 0) {
        if (bnpl9ComercialNum <= limiteMaximoBnpl9) {
          bnpl9Value = bnpl9ComercialValue!
        } else {
          bnpl9Value = limiteMaximoBnpl9.toString()
        }
      } else {
        let valorBnpl9Final = Math.round(valorBnpl6Final * incremento6a9)
        valorBnpl9Final = Math.min(valorBnpl9Final, limiteMaximoBnpl9)
        bnpl9Value = valorBnpl9Final.toString()
      }
    }
    
    // Validación final de seguridad
    if (Number(bnpl1Value) > limiteMaximoBnpl1) bnpl1Value = limiteMaximoBnpl1.toString()
    if (Number(bnpl3Value) > limiteMaximoBnpl3) bnpl3Value = limiteMaximoBnpl3.toString()
    if (Number(bnpl6Value) > limiteMaximoBnpl6) bnpl6Value = limiteMaximoBnpl6.toString()
    if (Number(bnpl9Value) > limiteMaximoBnpl9) bnpl9Value = limiteMaximoBnpl9.toString()
    
    // Mapper pipeline → país (CO / MX)
    const pipeline = properties.pipeline ?? null
    const country = pipelineToCountry(pipeline)
    console.log(`[HubSpot] pipeline=${pipeline}, country=${country}, oferta_final_prestamo_mx_calculada=${properties.oferta_final_prestamo_mx_calculada}`)
    
    let precioComiteFinal = bnpl1Value
    let bnpl3Final = bnpl3Value
    let bnpl6Final = bnpl6Value
    let bnpl9Final = bnpl9Value
    let negocioAplicaBnpl = properties.negocio_aplica_para_bnpl_ || null
    
    // Variable para saber si hubo negociación comercial (CO o MX)
    let comercialRaw: string | null = bnpl1ComercialValue || null
    // precio_comite_original: siempre el precio base del comité (sin negociación)
    let precioComiteOriginal: string | null = precioComiteValue || null
    
    if (country === 'MX') {
      // México: no tiene pago a cuotas
      const ofertaBaseMx = parseHubSpotNumber(properties.oferta_final_prestamo_mx_calculada)
      const valorNegociado = parseHubSpotNumber(properties.valor_negociado)
      const topeAprobadoMx = parseHubSpotNumber(properties.final_final_aprobado_bo_prestamo_mx_calculo)
      
      // Precio base MX (equivalente a precio_comite en CO)
      const ofertaBaseMxNum = ofertaBaseMx ? Number(ofertaBaseMx) : 0
      const valorNegociadoNum = valorNegociado ? Number(valorNegociado) : 0
      const topeAprobadoMxNum = topeAprobadoMx ? Number(topeAprobadoMx) : 0
      
      // El precio_comite_original para MX es oferta_final_prestamo_mx_calculada
      precioComiteOriginal = ofertaBaseMx || null
      
      // Jerarquía de precio MX:
      // 1. final_final_aprobado_bo_prestamo_mx_calculo (tope máximo, si existe)
      // 2. valor_negociado (negociado, capado al tope)
      // 3. oferta_final_prestamo_mx_calculada (precio base)
      if (topeAprobadoMxNum > 0) {
        // Tope aprobado existe: usar como precio final
        // valor_negociado debe ser <= tope aprobado
        if (valorNegociadoNum > 0 && valorNegociadoNum <= topeAprobadoMxNum) {
          precioComiteFinal = valorNegociado!
          comercialRaw = valorNegociado
        } else if (valorNegociadoNum > topeAprobadoMxNum) {
          // Capear al tope
          precioComiteFinal = topeAprobadoMx!
          comercialRaw = valorNegociado
        } else {
          // No hay valor_negociado, usar tope aprobado
          precioComiteFinal = topeAprobadoMx!
          comercialRaw = null // no hubo negociación real, usar HESH
        }
      } else if (valorNegociadoNum > 0) {
        // No hay tope aprobado, pero sí hay valor_negociado
        // valor_negociado debe ser <= oferta_final_prestamo_mx_calculada
        if (valorNegociadoNum <= ofertaBaseMxNum) {
          precioComiteFinal = valorNegociado!
          comercialRaw = valorNegociado
        } else {
          // Capear al precio base
          precioComiteFinal = ofertaBaseMx || bnpl1Value
          comercialRaw = valorNegociado
        }
      } else {
        // Sin negociación: precio base
        precioComiteFinal = ofertaBaseMx || bnpl1Value
        comercialRaw = null
      }
      
      bnpl3Final = '0'
      bnpl6Final = '0'
      bnpl9Final = '0'
      negocioAplicaBnpl = 'no' // para que no se renderice la sección de cuotas
    }
    
    const result = {
      nid: hubspotDealId,
      pipeline: pipeline,
      country,
      bnpl3: bnpl3Final,
      bnpl6: bnpl6Final,
      bnpl9: bnpl9Final,
      precio_comite: precioComiteFinal,
      precio_comite_original: precioComiteOriginal, // precio base sin negociación (CO: precio_comite, MX: oferta_final_prestamo_mx_calculada)
      bnpl_1_comercial_raw: comercialRaw, // valor crudo para saber si el comercial negocio (CO: bnpl_1_comercial, MX: valor_negociado)
      whatsapp_asesor: properties.whatsapp_asesor,
      nombre_del_conjunto: properties.nombre_del_conjunto || null,
      area_construida: properties.area_construida || null,
      direccion: properties.direccion || null,
      numero_habitaciones: properties.numero_habitaciones || null,
      numero_de_banos: properties.numero_de_banos || null,
      tipo_inmueble_id: properties.tipo_inmueble_id || null,
      negocio_aplica_para_bnpl: negocioAplicaBnpl,
      razon_de_venta: properties.razon_de_venta_usuario_gabi_mx || null,
      valor_subsidiado: valorSubsidiadoValue || null,
      valor_subsidiado_extraordinario: parseHubSpotNumber(properties.valor_subsidiado_extraordinario) || null,
      subsidio_aprobado_lider: properties.subsidio_aprobado_lider || null,
      subsidio_aprobado_director: properties.subsidio_aprobado_director || null,
      valor_reparaciones: parseHubSpotNumber(properties.valor_reparaciones) || null,
      quiere_ofertar_alianza: properties.quiere_ofertar_alianza || null,
      precio_maximo_prestamo: parseHubSpotNumber(properties.precio_maximo_prestamo) || null,
      precio_intermedio: parseHubSpotNumber(properties.precio_intermedio) || null,
    }
    
    return NextResponse.json(result, { headers })
    
  } catch (error) {
    console.error('Error en endpoint de HubSpot:', error)
    return NextResponse.json(ERROR_MESSAGE, { 
      status: 500,
      headers: { 'X-Error': 'Internal server error' }
    })
  }
}
