import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/hubspot/abc-group
 * Writes the A/B/C test group assignment to HubSpot deal property `abc_test_landing_co`
 * Body: { deal_uuid: string, group: 'A' | 'B' | 'C' }
 * 
 * SECURITY: Frontend only sends deal_uuid (public). 
 * The numeric HubSpot dealId is resolved server-side and never exposed to the client.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { deal_uuid, group } = body

    if (!deal_uuid || !group) {
      return NextResponse.json(
        { error: 'Missing deal_uuid or group' },
        { status: 400 }
      )
    }

    if (!['A', 'B', 'C'].includes(group)) {
      return NextResponse.json(
        { error: 'Invalid group. Must be A, B, or C' },
        { status: 400 }
      )
    }

    const apiKey = process.env.HUBSPOT_ACCESS_TOKEN
    if (!apiKey) {
      console.error('HUBSPOT_ACCESS_TOKEN not configured')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Step 1: Search for the deal by UUID (server-side lookup)
    const searchRes = await fetch('https://api.hubapi.com/crm/v3/objects/deals/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filterGroups: [{
          filters: [{
            propertyName: 'deal_uuid',
            operator: 'EQ',
            value: deal_uuid,
          }],
        }],
        properties: ['deal_uuid'],
        limit: 1,
      }),
      signal: AbortSignal.timeout(10000),
    })

    if (!searchRes.ok) {
      console.error(`HubSpot search error: ${searchRes.status}`)
      return NextResponse.json({ error: 'Failed to find deal' }, { status: 502 })
    }

    const searchData = await searchRes.json()
    if (!searchData.results || searchData.results.length === 0) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    const dealId = searchData.results[0].id

    // Step 2: Update the deal property
    const patchRes = await fetch(`https://api.hubapi.com/crm/v3/objects/deals/${dealId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          abc_test_landing_co: group,
        },
      }),
      signal: AbortSignal.timeout(10000),
    })

    if (!patchRes.ok) {
      const errorText = await patchRes.text()
      console.error(`HubSpot PATCH error: ${patchRes.status}`, errorText)
      return NextResponse.json({ error: 'Failed to update deal' }, { status: patchRes.status })
    }

    console.log(`[ABC Test] Deal uuid=${deal_uuid} assigned to group ${group}`)

    return NextResponse.json({
      success: true,
      group,
    })

  } catch (error) {
    console.error('Error in abc-group endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
