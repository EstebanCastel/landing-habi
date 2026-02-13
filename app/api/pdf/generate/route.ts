import { NextRequest, NextResponse } from 'next/server'
import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { getSupabaseAdmin, STORAGE_BUCKET } from '../../../lib/supabase'

export const dynamic = 'force-dynamic'
export const maxDuration = 30 // seconds

// PDF Styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    padding: 0,
  },
  header: {
    backgroundColor: '#7400C2',
    padding: 30,
    paddingBottom: 40,
  },
  headerTitle: {
    color: '#EACDFE',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 4,
  },
  priceSection: {
    backgroundColor: '#F9F0FF',
    margin: 20,
    marginTop: -20,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  priceLabel: {
    color: '#8A00E6',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  priceValue: {
    color: '#8A00E6',
    fontSize: 32,
    fontWeight: 'bold',
  },
  priceTag: {
    color: '#8A00E6',
    fontSize: 10,
    marginTop: 4,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7400C2',
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
  },
  cardLeft: {
    flex: 1,
    backgroundColor: '#F9F0FF',
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLeftPrimary: {
    flex: 1,
    backgroundColor: '#8A00E6',
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardRight: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 4,
  },
  cardCuotas: {
    fontSize: 11,
    color: '#374151',
  },
  cardHighlight: {
    fontSize: 9,
    color: '#8A00E6',
    fontWeight: 'bold',
    marginTop: 4,
  },
  badge: {
    backgroundColor: '#8A00E6',
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
    position: 'absolute',
    top: 6,
    right: 6,
  },
  stepsSection: {
    padding: 20,
    paddingTop: 10,
  },
  stepsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7400C2',
    marginBottom: 12,
    textAlign: 'center',
  },
  stepsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  stepCard: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    border: '1px solid #E5E7EB',
  },
  stepHeader: {
    backgroundColor: '#F3E8FF',
    padding: 10,
    alignItems: 'center',
  },
  stepNumber: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#7400C2',
    textAlign: 'center',
  },
  stepBody: {
    backgroundColor: '#ffffff',
    padding: 10,
  },
  stepText: {
    fontSize: 9,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 1.4,
  },
  footer: {
    backgroundColor: '#7400C2',
    padding: 20,
    alignItems: 'center',
    marginTop: 'auto',
  },
  footerText: {
    color: '#ffffff',
    fontSize: 10,
    textAlign: 'center',
  },
  footerBold: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
})

function formatPrice(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^\d]/g, '')) : value
  if (isNaN(num)) return '$0'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

interface OfferPDFProps {
  precioComite: string
  bnpl3: string
  bnpl6: string
  bnpl9: string
  bnplEnabled: boolean
}

function OfferPDF({ precioComite, bnpl3, bnpl6, bnpl9, bnplEnabled }: OfferPDFProps) {
  const heroPrice = bnplEnabled && Number(bnpl9.replace(/[^\d]/g, '')) > 0 ? bnpl9 : precioComite

  return React.createElement(Document, {},
    React.createElement(Page, { size: 'A4', style: styles.page },
      // Header
      React.createElement(View, { style: styles.header },
        React.createElement(Text, { style: styles.headerTitle }, 'Compramos tu vivienda'),
        React.createElement(Text, { style: styles.headerSubtitle },
          bnplEnabled
            ? 'Elige entre liquidez inmediata o el mejor precio en cuotas.'
            : 'Recibe una oferta directa por tu inmueble.'
        ),
      ),
      // Price section
      React.createElement(View, { style: styles.priceSection },
        React.createElement(Text, { style: styles.priceLabel },
          bnplEnabled ? 'Elige tu modalidad de compra' : 'Tu oferta de compra'
        ),
        React.createElement(Text, { style: styles.priceValue }, formatPrice(heroPrice)),
        React.createElement(Text, { style: styles.priceTag }, 'Precio de compra'),
      ),
      // Product cards (only if BNPL)
      ...(bnplEnabled ? [
        React.createElement(View, { key: 'products', style: styles.content },
          React.createElement(Text, { style: styles.sectionTitle }, 'Opciones de pago'),
          // BNPL 9
          React.createElement(View, { style: styles.card },
            React.createElement(View, { style: styles.cardLeftPrimary },
              React.createElement(Text, { style: { ...styles.cardLabel, color: '#ffffff' } }, 'Precio de compra'),
              React.createElement(Text, { style: { ...styles.cardPrice, color: '#ffffff' } }, formatPrice(bnpl9)),
            ),
            React.createElement(View, { style: styles.cardRight },
              React.createElement(Text, { style: styles.cardCuotas }, `9 cuotas de ${formatPrice(Number(bnpl9.replace(/[^\d]/g, '')) / 9)}`),
              React.createElement(Text, { style: styles.cardHighlight }, 'Mejor precio total'),
            ),
          ),
          // BNPL 6
          React.createElement(View, { style: styles.card },
            React.createElement(View, { style: styles.cardLeft },
              React.createElement(Text, { style: { ...styles.cardLabel, color: '#8A00E6' } }, 'Precio de compra'),
              React.createElement(Text, { style: { ...styles.cardPrice, color: '#8A00E6' } }, formatPrice(bnpl6)),
            ),
            React.createElement(View, { style: styles.cardRight },
              React.createElement(Text, { style: styles.cardCuotas }, `6 cuotas de ${formatPrice(Number(bnpl6.replace(/[^\d]/g, '')) / 6)}`),
              React.createElement(Text, { style: styles.cardHighlight }, 'Equilibrio perfecto'),
            ),
          ),
          // BNPL 3
          React.createElement(View, { style: styles.card },
            React.createElement(View, { style: styles.cardLeft },
              React.createElement(Text, { style: { ...styles.cardLabel, color: '#8A00E6' } }, 'Precio de compra'),
              React.createElement(Text, { style: { ...styles.cardPrice, color: '#8A00E6' } }, formatPrice(bnpl3)),
            ),
            React.createElement(View, { style: styles.cardRight },
              React.createElement(Text, { style: styles.cardCuotas }, `3 cuotas de ${formatPrice(Number(bnpl3.replace(/[^\d]/g, '')) / 3)}`),
              React.createElement(Text, { style: styles.cardHighlight }, 'Pagos rápidos'),
            ),
          ),
          // Contado
          React.createElement(View, { style: styles.card },
            React.createElement(View, { style: styles.cardLeft },
              React.createElement(Text, { style: { ...styles.cardLabel, color: '#8A00E6' } }, 'Precio de compra'),
              React.createElement(Text, { style: { ...styles.cardPrice, color: '#8A00E6' } }, formatPrice(precioComite)),
            ),
            React.createElement(View, { style: styles.cardRight },
              React.createElement(Text, { style: styles.cardCuotas }, 'Te pagamos de inmediato'),
              React.createElement(Text, { style: styles.cardHighlight }, 'Liquidez inmediata'),
            ),
          ),
        ),
      ] : []),
      // Steps
      React.createElement(View, { style: styles.stepsSection },
        React.createElement(Text, { style: styles.stepsTitle }, '¿Cómo funciona?'),
        React.createElement(View, { style: styles.stepsRow },
          React.createElement(View, { style: styles.stepCard },
            React.createElement(View, { style: styles.stepHeader },
              React.createElement(Text, { style: styles.stepNumber }, '1. Solicita tu propuesta'),
            ),
            React.createElement(View, { style: styles.stepBody },
              React.createElement(Text, { style: styles.stepText }, 'Completa nuestro formulario. Te daremos una propuesta en menos de 24 horas.'),
            ),
          ),
          React.createElement(View, { style: styles.stepCard },
            React.createElement(View, { style: styles.stepHeader },
              React.createElement(Text, { style: styles.stepNumber }, '2. Elige tu producto'),
            ),
            React.createElement(View, { style: styles.stepBody },
              React.createElement(Text, { style: styles.stepText }, 'Selecciona el mejor producto: liquidez inmediata o mejor precio en cuotas.'),
            ),
          ),
          React.createElement(View, { style: styles.stepCard },
            React.createElement(View, { style: styles.stepHeader },
              React.createElement(Text, { style: styles.stepNumber }, '3. Cierra y Recibe'),
            ),
            React.createElement(View, { style: styles.stepBody },
              React.createElement(Text, { style: styles.stepText }, 'Firmamos el contrato y recibes tu dinero según el producto elegido.'),
            ),
          ),
        ),
      ),
      // Footer
      React.createElement(View, { style: styles.footer },
        React.createElement(Text, { style: styles.footerBold }, 'habi.co'),
        React.createElement(Text, { style: styles.footerText }, 'Compramos tu vivienda a tu medida'),
      ),
    )
  )
}

/**
 * POST /api/pdf/generate
 * Generates a PDF offer document and uploads it to Supabase Storage
 * Body: { deal_uuid: string }
 * Returns: { url: string } - public URL of the uploaded PDF
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { deal_uuid } = body

    if (!deal_uuid) {
      return NextResponse.json({ error: 'Missing deal_uuid' }, { status: 400 })
    }

    // Fetch deal data from our HubSpot API
    const baseUrl = request.nextUrl.origin
    const hubspotRes = await fetch(`${baseUrl}/api/hubspot?deal_uuid=${deal_uuid}`, {
      signal: AbortSignal.timeout(15000),
    })

    if (!hubspotRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch HubSpot data' }, { status: 502 })
    }

    const hsData = await hubspotRes.json()

    if (hsData.error) {
      return NextResponse.json({ error: hsData.message || 'HubSpot error' }, { status: 502 })
    }

    const bnplEnabled = hsData.negocio_aplica_para_bnpl?.toLowerCase() === '1'
      || hsData.negocio_aplica_para_bnpl?.toLowerCase() === 'si'
      || hsData.negocio_aplica_para_bnpl?.toLowerCase() === 'sí'
      || hsData.negocio_aplica_para_bnpl?.toLowerCase() === 'true'

    // Generate PDF buffer
    const pdfElement = OfferPDF({
      precioComite: hsData.precio_comite || '0',
      bnpl3: hsData.bnpl_3 || '0',
      bnpl6: hsData.bnpl_6 || '0',
      bnpl9: hsData.bnpl_9 || '0',
      bnplEnabled,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(pdfElement as any)

    // Upload to Supabase Storage
    const fileName = `${deal_uuid}.pdf`
    const supabase = getSupabaseAdmin()
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, buffer, {
        contentType: 'application/pdf',
        upsert: true, // overwrite if exists
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload PDF', details: uploadError.message }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName)

    console.log(`[PDF] Generated and uploaded for deal ${deal_uuid}: ${urlData.publicUrl}`)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      deal_uuid,
    })

  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
