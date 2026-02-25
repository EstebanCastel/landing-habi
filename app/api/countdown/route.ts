import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET /api/countdown?deal_uuid=xxx
 * Returns the countdown start time for a deal. Creates one if it doesn't exist.
 * Response: { started_at: string (ISO), expires_at: string (ISO) }
 */
export async function GET(request: NextRequest) {
  try {
    const dealUuid = request.nextUrl.searchParams.get('deal_uuid')
    if (!dealUuid) {
      return NextResponse.json({ error: 'Missing deal_uuid' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Check if countdown already exists
    const { data: existing, error: selectError } = await supabase
      .from('offer_countdown')
      .select('started_at')
      .eq('deal_uuid', dealUuid)
      .single()

    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is fine
      console.error('Supabase select error:', selectError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (existing) {
      const startedAt = new Date(existing.started_at)
      const expiresAt = new Date(startedAt.getTime() + 24 * 60 * 60 * 1000)
      return NextResponse.json({
        started_at: startedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
    }

    // Create new countdown
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    const { error: insertError } = await supabase
      .from('offer_countdown')
      .insert({ deal_uuid: dealUuid, started_at: now.toISOString() })

    if (insertError) {
      console.error('Supabase insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create countdown' }, { status: 500 })
    }

    return NextResponse.json({
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    })

  } catch (error) {
    console.error('Error in countdown endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
