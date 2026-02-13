import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin, STORAGE_BUCKET } from '../../../lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET /api/pdf/url?deal_uuid=xxx
 * Returns the public URL of a previously generated PDF for a deal
 */
export async function GET(request: NextRequest) {
  try {
    const dealUuid = request.nextUrl.searchParams.get('deal_uuid')

    if (!dealUuid) {
      return NextResponse.json({ error: 'Missing deal_uuid parameter' }, { status: 400 })
    }

    const fileName = `${dealUuid}.pdf`

    const supabase = getSupabaseAdmin()

    // Check if the file exists by trying to get its metadata
    const { data: fileList, error: listError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list('', { search: fileName })

    if (listError) {
      console.error('Supabase list error:', listError)
      return NextResponse.json({ error: 'Storage error', details: listError.message }, { status: 500 })
    }

    const fileExists = fileList?.some(f => f.name === fileName)

    if (!fileExists) {
      return NextResponse.json({
        error: 'PDF not found',
        message: `No PDF has been generated for deal ${dealUuid}. Call POST /api/pdf/generate first.`,
      }, { status: 404 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      deal_uuid: dealUuid,
    })

  } catch (error) {
    console.error('Error getting PDF URL:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
