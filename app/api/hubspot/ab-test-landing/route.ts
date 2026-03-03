import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/hubspot/ab-test-landing
 * Escribe el grupo del A/B test de re-engagement en la propiedad `ab_test_landing` del deal.
 * Body: { deal_uuid: string, group: 'A' | 'B' }
 *
 * Idempotente: si el deal ya tiene un valor en ab_test_landing, lo devuelve sin sobreescribir.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { deal_uuid, group } = body

    if (!deal_uuid || !group) {
      return NextResponse.json({ error: 'Missing deal_uuid or group' }, { status: 400 })
    }

    if (!['A', 'B'].includes(group)) {
      return NextResponse.json({ error: 'Invalid group. Must be A or B' }, { status: 400 })
    }

    const apiKey = process.env.HUBSPOT_ACCESS_TOKEN
    if (!apiKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Buscar el deal por UUID
    const searchRes = await fetch('https://api.hubapi.com/crm/v3/objects/deals/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filterGroups: [{ filters: [{ propertyName: 'deal_uuid', operator: 'EQ', value: deal_uuid }] }],
        properties: ['deal_uuid', 'ab_test_landing'],
        limit: 1,
      }),
      signal: AbortSignal.timeout(10000),
    })

    if (!searchRes.ok) {
      return NextResponse.json({ error: 'Failed to find deal' }, { status: 502 })
    }

    const searchData = await searchRes.json()
    if (!searchData.results || searchData.results.length === 0) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    const deal = searchData.results[0]
    const dealId = deal.id

    // Idempotente: si ya tiene grupo asignado, devolver el existente
    const existingGroup = deal.properties?.ab_test_landing
    if (existingGroup) {
      console.log(`[AB Test Landing] Deal uuid=${deal_uuid} already has group=${existingGroup}`)
      return NextResponse.json({ success: true, group: existingGroup, existing: true })
    }

    // Escribir el grupo en HubSpot
    const patchRes = await fetch(`https://api.hubapi.com/crm/v3/objects/deals/${dealId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ properties: { ab_test_landing: group } }),
      signal: AbortSignal.timeout(10000),
    })

    if (!patchRes.ok) {
      const errorText = await patchRes.text()
      console.error(`[AB Test Landing] HubSpot PATCH error: ${patchRes.status}`, errorText)
      return NextResponse.json({ error: 'Failed to update deal' }, { status: patchRes.status })
    }

    console.log(`[AB Test Landing] Deal uuid=${deal_uuid} assigned to group=${group}`)
    return NextResponse.json({ success: true, group })

  } catch (error) {
    console.error('[AB Test Landing] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
