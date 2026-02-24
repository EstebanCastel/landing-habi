import { NextRequest, NextResponse } from 'next/server'
import { BigQuery } from '@google-cloud/bigquery'

// Headers CORS
const headers = {
  'Content-Type': 'application/json',
  'Cache-Control': 'public, max-age=300, s-maxage=600', // Cache 5 min
}

/**
 * Inicializa el cliente de BigQuery.
 * Soporta:
 * 1. GOOGLE_APPLICATION_CREDENTIALS (ruta a archivo JSON de service account)
 * 2. GOOGLE_CLOUD_CREDENTIALS (JSON de service account como string en env var)
 * 3. Application Default Credentials (gcloud auth application-default login)
 */
function getBigQueryClient(): BigQuery {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'sellers-main-prod'
  
  // Intentar credenciales principales
  const credentialsJson = process.env.GOOGLE_CLOUD_CREDENTIALS
  if (credentialsJson) {
    try {
      const credentials = JSON.parse(credentialsJson)
      return new BigQuery({ projectId, credentials })
    } catch (e) {
      console.error('Error parsing GOOGLE_CLOUD_CREDENTIALS:', e)
    }
  }
  
  // Fallback: credenciales alternativas
  const fallbackJson = process.env.GOOGLE_CLOUD_CREDENTIALS_FALLBACK
  if (fallbackJson) {
    try {
      const credentials = JSON.parse(fallbackJson)
      return new BigQuery({ projectId, credentials })
    } catch (e) {
      console.error('Error parsing GOOGLE_CLOUD_CREDENTIALS_FALLBACK:', e)
    }
  }
  
  return new BigQuery({ projectId })
}

/**
 * Query para obtener comparables de BigQuery - COLOMBIA
 */
const COMPARABLES_QUERY_CO = `
WITH ranked AS (
  SELECT 
    ni.nid,
    pc.comparable,
    pc.original_data,
    pc.flag_portal_pricing,
    hp.agente,
    ROW_NUMBER() OVER (PARTITION BY ni.nid ORDER BY DATETIME(pc.fecha) DESC) as comp_rank_date
  FROM \`papyrus-data.habi_db.tabla_historico_pricing_comparable_v2\` pc
  LEFT JOIN \`papyrus-data.habi_db.tabla_historico_pricing_v2\` hp ON hp.id = pc.historico_pricing_id
  LEFT JOIN \`papyrus-data.habi_db.tabla_negocio_inmueble\` ni ON ni.inmueble_id = hp.inmueble_id
  WHERE ni.nid = @nid
    AND flag_portal_pricing IN (70, 71, 72)
)
SELECT * FROM ranked WHERE comp_rank_date = 1 LIMIT 1
`

/**
 * Query para obtener comparables de BigQuery - MEXICO
 */
const COMPARABLES_QUERY_MX = `
WITH ranked AS (
  SELECT
    ni.nid,
    pc.comparable,
    pc.original_data,
    pc.portal_pricing_flag,
    hp.agent,
    ROW_NUMBER() OVER (
        PARTITION BY ni.id
        ORDER BY DATETIME(pc.created_at) DESC
    ) AS comp_rank_date
  FROM \`papyrus-data-mx.habi_wh_priority.habi_pricing_history_pricing_comparable_v2\` pc
  LEFT JOIN \`papyrus-data-mx.habi_wh_priority.habi_db_history_pricing\` hp
      ON hp.id = pc.history_pricing_id
  LEFT JOIN \`papyrus-data-mx.habi_wh_priority.habi_db_property_deal\` ni
      ON ni.property_id = hp.property_id
  WHERE CAST(ni.nid AS STRING) = @nid
    AND pc.portal_pricing_flag IN (70, 71, 72)
)
SELECT * FROM ranked WHERE comp_rank_date = 1 LIMIT 1
`

/**
 * Transforma los datos de BQ al formato que espera el frontend - COLOMBIA
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformComparablesCO(comparableJson: any): any[] {
  if (!comparableJson) return []
  
  // El JSON de BQ tiene formato { "field": { "0": value, "1": value, ... } }
  const keys = Object.keys(comparableJson.nid || comparableJson.area || {})
  
  // Deduplicar por nid
  const uniqueMap = new Map<string, Record<string, unknown>>()
  
  keys.forEach((key) => {
    const nid = String(comparableJson.nid?.[key] || key)
    if (uniqueMap.has(nid)) return
    
    const area = String(comparableJson.area?.[key] || '')
    const banos = String(comparableJson.banos?.[key] || '0')
    const garajes = String(comparableJson.garajes?.[key] || comparableJson.garage?.[key] || '0')
    const habitaciones = '-' // No disponible en los datos de comparables de BQ
    
    // Construir features string
    const features = `${area}m² ・ ${habitaciones} Hab. ・ ${banos} Baños ・ ${garajes} Est.`
    
    // Determinar nivel de confianza
    let confidenceLevel = 'media_confianza'
    if (comparableJson.high_confidence?.[key] === 1 || comparableJson.high_confidence?.[key] === '1') {
      confidenceLevel = 'alta_confianza'
    } else if (comparableJson.low_confidence?.[key] === 1 || comparableJson.low_confidence?.[key] === '1') {
      confidenceLevel = 'baja_confianza'
    }
    
    // Determinar categoría basado en idconjunto
    // Los primeros N items suelen ser del mismo conjunto, los siguientes de la zona
    // Usamos un heurístico basado en la posición
    const totalItems = keys.length
    const idx = parseInt(key)
    const category = idx < totalItems / 2 ? 'conjunto' : 'zona'
    
    uniqueMap.set(nid, {
      id: key,
      nid: nid,
      latitude: parseFloat(String(comparableJson.latitud?.[key] || comparableJson.latitude?.[key] || '0')),
      longitude: parseFloat(String(comparableJson.longitud?.[key] || comparableJson.longitude?.[key] || '0')),
      area: area,
      lastAskPrice: parseFloat(String(comparableJson.last_ask_price?.[key] || comparableJson.last_ask_price_original?.[key] || '0')),
      valormt2: parseFloat(String(comparableJson.valormt2?.[key] || '0')),
      features: features,
      address: comparableJson.direccion_homologada?.[key] || comparableJson.address?.[key] || '',
      condominium: comparableJson.condominium?.[key] || null,
      floorNum: String(comparableJson.num_piso?.[key] || comparableJson.floor_num?.[key] || ''),
      yearsOld: String(comparableJson.anos_antiguedad?.[key] || comparableJson.vetustez?.[key] || comparableJson.years_old?.[key] || ''),
      banos: banos,
      garage: garajes,
      habitaciones: habitaciones,
      confidenceLevel: confidenceLevel,
      category: category,
      // Campos extra de BQ
      nombre: comparableJson.nombre_o_inmobiliaria?.[key] || comparableJson.name?.[key] || null,
      telefono: comparableJson.telefono?.[key] || comparableJson.phone?.[key] || null,
      fechaCreacion: comparableJson.fecha_creacion?.[key] || comparableJson.date_create?.[key] || null,
    })
  })
  
  return Array.from(uniqueMap.values())
}

/**
 * Transforma los datos de BQ al formato que espera el frontend - MEXICO
 * Campos MX: area, banos, garage, address, latitude, longitude, room_num, years_old, 
 *            last_ask_price, norm_price, norm_price_m2, price_per_m2, property_type,
 *            comparable_id, confidence_levels, comparable_category, features, name, phone, date_create
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformComparablesMX(comparableJson: any): any[] {
  if (!comparableJson) return []
  
  // El JSON de BQ MX tiene formato { "field": { "0": value, "1": value, ... } }
  // Los nombres de campos varían entre flags (70/71/72):
  // - Flag 72: id, built_area, parking, bathroom, norm_price_m2, etc.
  // - Flag 70: comparable_id, area, garage, banos, price_per_m2, etc.
  const keys = Object.keys(
    comparableJson.id || comparableJson.comparable_id || 
    comparableJson.built_area || comparableJson.area || 
    comparableJson.address || {}
  )
  
  if (keys.length === 0) return []
  
  // Deduplicar por id/comparable_id
  const uniqueMap = new Map<string, Record<string, unknown>>()
  
  keys.forEach((key) => {
    const comparableId = String(
      comparableJson.comparable_id?.[key] || comparableJson.id?.[key] || key
    )
    if (uniqueMap.has(comparableId)) return
    
    // Área: built_area (flag 72) o area (flag 70)
    const area = String(comparableJson.built_area?.[key] || comparableJson.area?.[key] || '')
    // Baños: bathroom (flag 72) o banos (flag 70)
    const banos = String(comparableJson.bathroom?.[key] || comparableJson.banos?.[key] || '0')
    // Garajes: parking (flag 72) o garage (flag 70)
    const garajes = String(comparableJson.parking?.[key] || comparableJson.garage?.[key] || '0')
    // Habitaciones: room_num (flag 70) - flag 72 no siempre lo tiene
    const habitaciones = String(comparableJson.room_num?.[key] || '-')
    
    // Features construidos o generar
    const features = comparableJson.features?.[key] || `${area}m² ・ ${habitaciones} Hab. ・ ${banos} Baños ・ ${garajes} Est.`
    
    // Nivel de confianza
    const confidenceLevel = comparableJson.confidence_levels?.[key] || 'media_confianza'
    
    // Categoría
    const category = comparableJson.comparable_category?.[key] || 'zona'
    
    // Precio: norm_price_m2 o price_per_m2
    const valormt2 = parseFloat(String(
      comparableJson.norm_price_m2?.[key] || comparableJson.price_per_m2?.[key] || '0'
    ))
    
    uniqueMap.set(comparableId, {
      id: key,
      nid: comparableId,
      latitude: parseFloat(String(comparableJson.latitude?.[key] || '0')),
      longitude: parseFloat(String(comparableJson.longitude?.[key] || '0')),
      area: area,
      lastAskPrice: parseFloat(String(comparableJson.last_ask_price?.[key] || comparableJson.norm_price?.[key] || '0')),
      valormt2: valormt2,
      features: features,
      address: comparableJson.address?.[key] || comparableJson.full_address?.[key] || '',
      condominium: null,
      floorNum: String(comparableJson.floor_num?.[key] || ''),
      yearsOld: String(comparableJson.years_old?.[key] || ''),
      banos: banos,
      garage: garajes,
      habitaciones: habitaciones,
      confidenceLevel: confidenceLevel,
      category: category,
      propertyType: comparableJson.property_type?.[key] || comparableJson.property_type_id?.[key] || null,
      // Campos extra de BQ
      nombre: comparableJson.name?.[key] || null,
      telefono: comparableJson.phone?.[key] || null,
      fechaCreacion: comparableJson.date_create?.[key] || null,
    })
  })
  
  return Array.from(uniqueMap.values())
}

/**
 * Extrae el primer valor de un campo que puede ser:
 * - Un valor directo (string/number): "19.86" o 19.86
 * - Un objeto pandas-like: {"0": "19.86"} 
 * Retorna el valor como string, o el fallback
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractFirstValue(field: any, fallback: string = ''): string {
  if (field == null) return fallback
  if (typeof field === 'string' || typeof field === 'number') return String(field)
  if (typeof field === 'object') {
    // Formato pandas: {"0": "value", "1": "value2", ...}
    const keys = Object.keys(field)
    if (keys.length > 0) {
      const val = field[keys[0]]
      if (val == null || val === 'None' || val === 'nan') return fallback
      return String(val)
    }
  }
  return fallback
}

/**
 * Transforma original_data de BQ al formato InmuebleData del frontend
 * Soporta tanto formato CO (valores directos) como MX (formato pandas {"field": {"0": "value"}})
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformInmueble(originalData: any): any {
  if (!originalData) return null
  
  const lat = parseFloat(extractFirstValue(originalData.latitud || originalData.latitude, '0'))
  const lng = parseFloat(extractFirstValue(originalData.longitud || originalData.longitude, '0'))
  
  return {
    nid: extractFirstValue(originalData.nid),
    area: extractFirstValue(originalData.area),
    garage: extractFirstValue(originalData.garajes ?? originalData.garage, '0'),
    bathroom: extractFirstValue(originalData.banos ?? originalData.bath ?? originalData.bathroom, '0'),
    latitude: isNaN(lat) ? 0 : lat,
    longitude: isNaN(lng) ? 0 : lng,
    floor_num: extractFirstValue(originalData.num_piso || originalData.floor_num),
    years_old: extractFirstValue(originalData.anos_antiguedad || originalData.vetustez || originalData.years_old),
    last_ask_price: parseFloat(extractFirstValue(originalData.last_ask_price, '0')),
    property_type_id: extractFirstValue(originalData.tipo_inmueble_id || originalData.property_type_id, '1'),
    habitaciones: extractFirstValue(originalData.num_habitaciones),
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const nid = searchParams.get('nid')
    const country = searchParams.get('country')?.toUpperCase() || 'CO'
    
    if (!nid) {
      return NextResponse.json(
        { error: 'nid parameter is required' },
        { status: 400, headers }
      )
    }
    
    // Validar que nid sea numérico
    if (!/^\d+$/.test(nid)) {
      return NextResponse.json(
        { error: 'nid must be a numeric value' },
        { status: 400, headers }
      )
    }
    
    const client = getBigQueryClient()
    
    // Seleccionar query según país
    const query = country === 'MX' ? COMPARABLES_QUERY_MX : COMPARABLES_QUERY_CO
    
    console.log(`[Comparables] Fetching for nid=${nid}, country=${country}`)
    console.log(`[Comparables] Query project: ${country === 'MX' ? 'papyrus-data-mx' : 'papyrus-data'}`)
    
    // MX: nid como string (CAST en query), CO: nid como int
    const params = country === 'MX' ? { nid: nid } : { nid: parseInt(nid) }
    
    console.log(`[Comparables] Executing BigQuery with params:`, JSON.stringify(params))
    const startTime = Date.now()
    
    const queryResult = await client.query({
      query,
      params,
      location: 'US',
    })
    const rows = queryResult[0]
    
    console.log(`[Comparables] BigQuery completed in ${Date.now() - startTime}ms, rows: ${rows?.length ?? 0}`)
    
    if (!rows || rows.length === 0) {
      console.log(`[Comparables] No results found for nid=${nid}`)
      return NextResponse.json(
        { error: 'No comparables found for this nid', comparables: [], inmueble: null, country },
        { status: 200, headers }
      )
    }
    
    const row = rows[0]
    console.log(`[Comparables] Found row with nid=${row.nid}`)
    
    // Parsear el JSON de comparables
    let comparableData
    try {
      comparableData = typeof row.comparable === 'string' 
        ? JSON.parse(row.comparable) 
        : row.comparable
      console.log(`[Comparables] Data keys: ${Object.keys(comparableData || {}).slice(0, 10).join(', ')}`)
    } catch (e) {
      console.error('Error parsing comparable JSON:', e)
      return NextResponse.json(
        { error: 'Error parsing comparable data', comparables: [], inmueble: null, country },
        { status: 200, headers }
      )
    }
    
    // Parsear original_data para los datos del inmueble
    let originalData
    try {
      originalData = typeof row.original_data === 'string'
        ? JSON.parse(row.original_data)
        : row.original_data
    } catch (e) {
      console.error('Error parsing original_data JSON:', e)
      originalData = null
    }
    
    // Usar transformación según país
    const comparables = country === 'MX' 
      ? transformComparablesMX(comparableData)
      : transformComparablesCO(comparableData)
    const inmueble = transformInmueble(originalData)
    
    console.log(`[Comparables] Transformed ${comparables.length} comparables`)
    
    return NextResponse.json({
      nid: row.nid,
      comparables,
      inmueble,
      flag_portal_pricing: row.portal_pricing_flag || row.flag_portal_pricing,
      agente: row.agent || row.agente,
      country,
    }, { headers })
    
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : ''
    console.error(`[Comparables] ERROR: ${errorMsg}`)
    console.error(`[Comparables] Stack: ${errorStack}`)
    return NextResponse.json(
      { error: 'Internal server error fetching comparables', details: errorMsg },
      { status: 500, headers }
    )
  }
}
