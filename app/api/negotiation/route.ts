import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const deal_uuid = request.nextUrl.searchParams.get('deal_uuid')
    if (!deal_uuid) return NextResponse.json({ error: 'Missing deal_uuid' }, { status: 400 })

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('negotiation_sessions')
      .select('*')
      .eq('deal_uuid', deal_uuid)
      .single()

    if (error?.code === 'PGRST116') return NextResponse.json({ session: null })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ session: data })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { deal_uuid, messages, last_habi_offer, agreed, agreed_price } = await request.json()
    if (!deal_uuid) return NextResponse.json({ error: 'Missing deal_uuid' }, { status: 400 })

    const supabase = getSupabaseAdmin()
    const { error } = await supabase
      .from('negotiation_sessions')
      .upsert(
        { deal_uuid, messages, last_habi_offer, agreed, agreed_price, updated_at: new Date().toISOString() },
        { onConflict: 'deal_uuid' }
      )

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
