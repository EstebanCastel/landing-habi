import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/hubspot/abc-group
 * Writes the A/B/C test group assignment to HubSpot deal property `abc_test_landing_co`
 * Body: { dealId: string, group: 'A' | 'B' | 'C' }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { dealId, group } = body

    if (!dealId || !group) {
      return NextResponse.json(
        { error: 'Missing dealId or group' },
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

    // Update the deal property in HubSpot
    const url = `https://api.hubapi.com/crm/v3/objects/deals/${dealId}`
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          abc_test_landing_co: group
        }
      }),
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`HubSpot PATCH error: ${response.status}`, errorText)
      return NextResponse.json(
        { error: 'Failed to update HubSpot', details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log(`[ABC Test] Deal ${dealId} assigned to group ${group}`)

    return NextResponse.json({
      success: true,
      dealId,
      group,
      hubspotId: data.id
    })

  } catch (error) {
    console.error('Error in abc-group endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
