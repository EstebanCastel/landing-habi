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

    // MX: 48 horas, CO: 24 horas
    const country = request.nextUrl.searchParams.get('country') || 'CO'
    const countdownHours = country === 'MX' ? 48 : 24
    const countdownMs = countdownHours * 60 * 60 * 1000

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
      const expiresAt = new Date(startedAt.getTime() + countdownMs)
      return NextResponse.json({
        started_at: startedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
    }

    // Create new countdown
    const now = new Date()
    const expiresAt = new Date(now.getTime() + countdownMs)

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

/**
 * POST /api/countdown
 * Resets the countdown for a deal (used when offer was re-sent via email).
 * Body: { deal_uuid: string }
 * Always resets to 48 hours.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const dealUuid = body.deal_uuid

    if (!dealUuid) {
      return NextResponse.json({ error: 'Missing deal_uuid' }, { status: 400 })
    }

    const countdownHours = 48
    const countdownMs = countdownHours * 60 * 60 * 1000
    const supabase = getSupabaseAdmin()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + countdownMs)

    // Check if countdown exists
    const { data: existing, error: selectError } = await supabase
      .from('offer_countdown')
      .select('started_at')
      .eq('deal_uuid', dealUuid)
      .single()

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('Supabase select error:', selectError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (existing) {
      // Update started_at to now (reset countdown)
      const { error: updateError } = await supabase
        .from('offer_countdown')
        .update({ started_at: now.toISOString() })
        .eq('deal_uuid', dealUuid)

      if (updateError) {
        console.error('Supabase update error:', updateError)
        return NextResponse.json({ error: 'Failed to reset countdown' }, { status: 500 })
      }
    } else {
      // Create new countdown
      const { error: insertError } = await supabase
        .from('offer_countdown')
        .insert({ deal_uuid: dealUuid, started_at: now.toISOString() })

      if (insertError) {
        console.error('Supabase insert error:', insertError)
        return NextResponse.json({ error: 'Failed to create countdown' }, { status: 500 })
      }
    }

    return NextResponse.json({
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      reset: true,
    })

  } catch (error) {
    console.error('Error in countdown reset endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
