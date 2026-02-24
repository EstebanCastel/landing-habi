import { NextRequest, NextResponse } from 'next/server'
import { BigQuery } from '@google-cloud/bigquery'

const headers = {
  'Content-Type': 'application/json',
  'Cache-Control': 'public, max-age=300, s-maxage=600',
}

function getBigQueryClient(): BigQuery {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'sellers-main-prod'
  const credentialsJson = process.env.GOOGLE_CLOUD_CREDENTIALS
  if (credentialsJson) {
    try {
      const credentials = JSON.parse(credentialsJson)
      return new BigQuery({ projectId, credentials })
    } catch (e) {
      console.error('Error parsing GOOGLE_CLOUD_CREDENTIALS:', e)
    }
  }
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

// Query para Colombia
const HESH_QUERY_CO = `
SELECT 
  nid,
  ask_price_final,
  precio_compra_final,
  precio_manual_comite,
  utilidad_compra,
  unit
FROM \`papyrus-data.habi_wh_hesh.production_hesh\`
WHERE nid = @nid
ORDER BY fecha_ejecucion_hesh DESC
LIMIT 1
`

// Query para México - misma estructura que CO, datos en campo unit
const HESH_QUERY_MX = `
SELECT *
FROM \`papyrus-data-mx.habi_wh_hesh.production_hesh\`
WHERE nid = @nid
ORDER BY fecha_ejecucion_hesh DESC
LIMIT 1
`

/**
 * Parsea el campo `unit` que viene como string de dict Python.
 * Convierte comillas simples → dobles, None → null, nan → null, etc.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parsePythonDict(raw: string): Record<string, any> | null {
  if (!raw) return null
  
  try {
    const jsonStr = raw
      // Reemplazar None → null
      .replace(/\bNone\b/g, 'null')
      // Reemplazar nan → null
      .replace(/\bnan\b/g, 'null')
      // Reemplazar True/False → true/false
      .replace(/\bTrue\b/g, 'true')
      .replace(/\bFalse\b/g, 'false')
      // Reemplazar comillas simples por dobles (excepto dentro de valores ya con dobles)
      .replace(/'/g, '"')
    
    return JSON.parse(jsonStr)
  } catch (e) {
    console.error('Error parsing Python dict:', e)
    // Intentar un parse más agresivo
    try {
      // A veces hay tuples () en Python, convertir a arrays []
      const jsonStr = raw
        .replace(/\bNone\b/g, 'null')
        .replace(/\bnan\b/g, 'null')
        .replace(/\bTrue\b/g, 'true')
        .replace(/\bFalse\b/g, 'false')
        .replace(/'/g, '"')
        .replace(/\(/g, '[')
        .replace(/\)/g, ']')
      return JSON.parse(jsonStr)
    } catch (e2) {
      console.error('Error in fallback parse:', e2)
      return null
    }
  }
}

/**
 * Estructura de costos categorizada para el frontend
 */
export interface HeshCostBreakdown {
  // Precio de venta (ask_price_final)
  askPrice: number
  // Precio de compra final
  precioCompra: number
  // Precio manual del comité  
  precioComite: number
  // Costos totales
  costosTotales: number
  
  // CATEGORÍA 1: Comisión Habi
  comision: {
    total: number
    comisionInterna: number
    comisionExterna: number
    comisionCompra: number
  }
  
  // CATEGORÍA 2: Gastos mensuales del inmueble
  gastosMensuales: {
    total: number
    mantenimiento: number
    serviciosPublicos: number
    administracion: number
  }
  
  // CATEGORÍA 3: Tarifa de servicio Habi (utilidad + financiación)
  tarifaServicio: {
    total: number
    utilidadEsperada: number // porcentaje (e.g. 0.025 = 2.5%)
    costoFinanciacion: number
    tasaFinanciacion: number
    inversionInicial: number
    ams: number // días promedio de venta
    holdFin: number // días con financiación
  }
  
  // CATEGORÍA 4: Trámites y notarías
  tramites: {
    total: number
    predial: number
    notariaVendedor: number
    notariadoRegistroComprar: number
    estudiosTramites: number
    notariadoRegistroVender: number
    ica: number
    castigosTramites: number
  }
  
  // CATEGORÍA 5: Remodelaciones
  remodelacion: {
    total: number
    pintura: number
    mejoras: number
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildCostBreakdown(unit: Record<string, any>, row: Record<string, any>): HeshCostBreakdown {
  const n = (val: unknown): number => {
    if (val === null || val === undefined) return 0
    const num = Number(val)
    return isNaN(num) ? 0 : num
  }
  
  const comisionInterna = n(unit.comision_interna_venta)
  const comisionExterna = n(unit.comision_externa_venta)
  const comisionCompra = n(unit.comision_compra)
  
  const mantenimiento = n(unit.mantenimiento_ams)
  const serviciosPublicos = n(unit.servicios_publicos_tot)
  const administracion = n(unit.tot_admin)
  
  const costoFinanciacion = n(unit.costo_financiacion)
  const utilidadEsperada = n(unit.utilidad_esperada)
  
  const predial = n(unit.predial)
  const notariaVendedor = n(unit.notaria_vendedor)
  const notariadoRegistroComprar = n(unit.notariado_registro_comprar)
  const estudiosTramites = n(unit.estudios_tramites)
  const notariadoRegistroVender = n(unit.notariado_registro_vender)
  const ica = n(unit.ica)
  
  // Castigos tramites puede ser un objeto anidado
  let castigosTramites = 0
  if (unit.castigos_tramites && typeof unit.castigos_tramites === 'object') {
    castigosTramites = n(unit.castigos_tramites.total_castigos)
  }
  
  const pintura = n(unit.pintura)
  const mejoras = n(unit.mejoras)
  
  return {
    askPrice: n(row.ask_price_final),
    precioCompra: n(row.precio_compra_final),
    precioComite: n(row.precio_manual_comite),
    costosTotales: n(unit.costos_totales),
    
    comision: {
      total: comisionInterna + comisionExterna + comisionCompra,
      comisionInterna,
      comisionExterna,
      comisionCompra,
    },
    
    gastosMensuales: {
      total: mantenimiento + serviciosPublicos + administracion,
      mantenimiento,
      serviciosPublicos,
      administracion,
    },
    
    tarifaServicio: {
      total: costoFinanciacion,
      utilidadEsperada,
      costoFinanciacion,
      tasaFinanciacion: n(unit.tasa_financiacion),
      inversionInicial: n(unit.inversion_inicial),
      ams: n(unit.ams),
      holdFin: n(unit.hold_fin),
    },
    
    tramites: {
      total: predial + notariaVendedor + notariadoRegistroComprar + estudiosTramites + notariadoRegistroVender + ica + castigosTramites,
      predial,
      notariaVendedor,
      notariadoRegistroComprar,
      estudiosTramites,
      notariadoRegistroVender,
      ica,
      castigosTramites,
    },
    
    remodelacion: {
      total: pintura + mejoras,
      pintura,
      mejoras,
    },
  }
}

/**
 * Build cost breakdown para México
 * El campo `unit` contiene toda la data, incluyendo costos_fijos y costos_variables anidados
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildCostBreakdownMX(unit: Record<string, any>, row: Record<string, any>): HeshCostBreakdown {
  const n = (val: unknown): number => {
    if (val === null || val === undefined) return 0
    const num = Number(val)
    return isNaN(num) ? 0 : num
  }
  
  // costos_fijos y costos_variables son objetos anidados dentro de unit
  const costosFijos = unit.costos_fijos || {}
  const costosVariables = unit.costos_variables || {}
  const castigosTramites = unit.castigos_tramites || {}
  
  // Comisiones (de costos_fijos)
  const comisionCompra = n(costosFijos.comision_compra)
  const comisionInterna = n(costosFijos.comision_interna_venta)
  const comisionExterna = n(costosFijos.comision_externa_venta)
  
  // Gastos mensuales (de costos_variables)
  const predial = n(costosVariables.predial)
  const serviciosPublicos = n(costosVariables.servicios_publicos)
  const aseo = n(costosVariables.aseo)
  const mantenimiento = n(costosVariables.mantenimiento)
  const administracion = n(costosFijos.pagos_administracion)
  
  // Tarifa servicio / financiación
  const costoFinanciacion = n(costosVariables.costo_financiacion)
  const tasaFinanciacion = n(costosVariables.tasa)
  const utilidadEsperada = n(unit.utilidad_compra) // ~2% para MX
  
  // Trámites (de costos_fijos)
  const clg = n(costosFijos.clg)
  const noAdeudo = n(costosFijos.no_adeudo)
  const folioReal = n(costosFijos.folio_real)
  const honorariosComision = n(costosFijos.honorarios_comision)
  const isr = n(costosFijos.isr)
  const operativos = n(costosFijos.operativos)
  const avaluo = n(costosFijos.avaluo)
  const hipotecaInfonavit = n(costosFijos.hipoteca_infonavit)
  const hipotecaBancaria = n(costosFijos.hipoteca_bancaria)
  const fiduciarios = n(costosFijos.fiduciarios)
  const aperturaExpediente = n(costosFijos.apertura_expediente)
  const inscripcionCredito = n(costosFijos.inscripcion_credito)
  const conclusionAsiento = n(costosFijos.conclusion_asiento)
  
  // Remodelación (campos de unit)
  const pintura = n(unit.pintura)
  const mejoras = n(unit.mejoras)
  const costosRemo = n(unit.costos_remo)
  
  // Totales de trámites MX
  const totalTramites = clg + noAdeudo + folioReal + honorariosComision + isr + 
    operativos + avaluo + hipotecaInfonavit + hipotecaBancaria + 
    fiduciarios + aperturaExpediente + inscripcionCredito + conclusionAsiento
  
  // Castigos
  const totalCastigos = n(castigosTramites.total_castigos)
  
  // Precios de unit o row
  const precioCompra = n(unit.precio_compra) || n(row.precio_compra_final)
  const precioVenta = n(unit.precio_venta) || n(row.ask_price_final)
  
  return {
    askPrice: precioVenta,
    precioCompra: precioCompra,
    precioComite: n(row.precio_manual_comite) || precioCompra,
    costosTotales: n(costosFijos.costos_fijos) + n(costosVariables.costos_variables) + costosRemo,
    
    comision: {
      total: comisionCompra + comisionInterna + comisionExterna,
      comisionInterna,
      comisionExterna,
      comisionCompra,
    },
    
    gastosMensuales: {
      total: predial + serviciosPublicos + mantenimiento + administracion, // aseo movido a remodelación
      mantenimiento,
      serviciosPublicos,
      administracion: administracion + predial,
    },
    
    tarifaServicio: {
      total: costoFinanciacion + (precioCompra * utilidadEsperada),
      utilidadEsperada,
      costoFinanciacion,
      tasaFinanciacion,
      inversionInicial: precioCompra,
      ams: n(unit.ams),
      holdFin: n(unit.holding_financiero),
    },
    
    tramites: {
      total: totalTramites,
      predial: 0, // En MX predial va en gastos mensuales
      notariaVendedor: honorariosComision,
      notariadoRegistroComprar: aperturaExpediente + inscripcionCredito,
      estudiosTramites: clg + avaluo + operativos,
      notariadoRegistroVender: folioReal + conclusionAsiento,
      ica: isr,
      castigosTramites: totalCastigos,
    },
    
    remodelacion: {
      total: (costosRemo > 0 ? costosRemo : (pintura + mejoras)) + aseo, // aseo sumado aquí
      pintura,
      mejoras: mejoras + aseo,
    },
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const nid = searchParams.get('nid')
    const country = searchParams.get('country')?.toUpperCase() || 'CO'
    
    if (!nid) {
      return NextResponse.json({ error: 'nid parameter is required' }, { status: 400, headers })
    }
    
    if (!/^\d+$/.test(nid)) {
      return NextResponse.json({ error: 'nid must be a numeric value' }, { status: 400, headers })
    }
    
    const client = getBigQueryClient()
    
    // Seleccionar query según país
    const query = country === 'MX' ? HESH_QUERY_MX : HESH_QUERY_CO
    
    const [rows] = await client.query({
      query,
      params: { nid: parseInt(nid) },
      location: 'US',
    })
    
    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: 'No HESH data found for this nid', costBreakdown: null },
        { status: 200, headers }
      )
    }
    
    const row = rows[0]
    
    // Para México, parsear unit y usar el parser específico
    if (country === 'MX') {
      const unitStr = typeof row.unit === 'string' ? row.unit : JSON.stringify(row.unit)
      const unit = parsePythonDict(unitStr)
      
      if (!unit) {
        return NextResponse.json(
          { error: 'Error parsing HESH MX unit data', costBreakdown: null },
          { status: 200, headers }
        )
      }
      
      const costBreakdown = buildCostBreakdownMX(unit, row)
      return NextResponse.json({ costBreakdown, country: 'MX' }, { headers })
    }
    
    // Para Colombia, parsear el campo unit (Python dict string)
    const unitStr = typeof row.unit === 'string' ? row.unit : JSON.stringify(row.unit)
    const unit = parsePythonDict(unitStr)
    
    if (!unit) {
      return NextResponse.json(
        { error: 'Error parsing HESH unit data', costBreakdown: null },
        { status: 200, headers }
      )
    }
    
    const costBreakdown = buildCostBreakdown(unit, row)
    
    return NextResponse.json({ costBreakdown, country: 'CO' }, { headers })
    
  } catch (error) {
    console.error('BigQuery HESH error:', error)
    return NextResponse.json(
      { error: 'Internal server error fetching HESH data', details: String(error) },
      { status: 500, headers }
    )
  }
}
