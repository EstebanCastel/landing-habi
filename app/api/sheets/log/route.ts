import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

export const dynamic = 'force-dynamic'

function getAuth() {
  const credsRaw = process.env.GOOGLE_SHEETS_CREDENTIALS
  if (!credsRaw) throw new Error('GOOGLE_SHEETS_CREDENTIALS not set')

  let creds: Record<string, string>
  try {
    creds = JSON.parse(credsRaw)
  } catch {
    // Try stripping surrounding quotes
    creds = JSON.parse(credsRaw.replace(/^['"]|['"]$/g, ''))
  }

  return new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fullUrl, params } = body as {
      fullUrl: string
      params: Record<string, string>
    }

    if (!fullUrl || !params || params.channel !== 'whatsapp') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const sheetId = process.env.GOOGLE_SHEETS_ID
    if (!sheetId) {
      console.error('GOOGLE_SHEETS_ID not set')
      return NextResponse.json({ error: 'Sheets not configured' }, { status: 503 })
    }

    const auth = getAuth()
    const sheets = google.sheets({ version: 'v4', auth })

    const sheetName = 'LOGS'

    // 1. Read existing headers from row 1
    let existingHeaders: string[] = []
    try {
      const headerRes = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `${sheetName}!1:1`,
      })
      existingHeaders = (headerRes.data.values?.[0] as string[]) || []
    } catch {
      // Sheet might be empty, that's ok
    }

    // 2. Build the row data — fixed columns + dynamic query params
    const timestamp = new Date().toISOString()
    const urlObj = new URL(fullUrl, 'https://ofertas.habi.co')
    const basePath = urlObj.pathname

    // Fixed columns that always go first
    const fixedColumns: Record<string, string> = {
      timestamp,
      base_url: `${urlObj.origin}${basePath}`,
      full_url: fullUrl,
    }

    // All query params as dynamic columns
    const allData: Record<string, string> = { ...fixedColumns, ...params }

    // 3. Determine headers: merge existing + any new keys
    const allKeys = Object.keys(allData)
    const newKeys = allKeys.filter((k) => !existingHeaders.includes(k))
    const finalHeaders = [...existingHeaders, ...newKeys]

    // 4. If headers changed, write them
    if (newKeys.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `${sheetName}!1:1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [finalHeaders] },
      })
    }

    // If no headers existed at all, we just wrote them above
    // 5. Build row in header order
    const row = finalHeaders.map((h) => allData[h] ?? '')

    // 6. Append row
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${sheetName}!A:A`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [row] },
    })

    return NextResponse.json({ success: true, columns: finalHeaders.length })
  } catch (error) {
    console.error('Error writing to Google Sheets:', error)
    return NextResponse.json({ error: 'Failed to write to sheet' }, { status: 500 })
  }
}
