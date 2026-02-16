"use client"

import { Montserrat } from "next/font/google"
import Image from "next/image"
import { useState, useEffect } from "react"
import type { HubSpotProperties } from "../lib/hubspot"
import OfferCountdown from "../habi/components/OfferCountdown"
import { analytics, initScrollTracking, initPageTimeTracking } from "../lib/analytics"

const montserrat = Montserrat({ subsets: ["latin"] })

function formatPrice(price: string | number): string {
  const numPrice = typeof price === 'string' ? parseFloat(price.replace(/[^\d]/g, '')) : price
  if (isNaN(numPrice)) return '$0'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numPrice)
}

interface LandingBProps {
  properties: HubSpotProperties
  dealUuid: string
}

export default function LandingB({ properties, dealUuid }: LandingBProps) {
  const [_forceUpdate] = useState(0)

  // Analytics tracking for landing A
  useEffect(() => {
    const country = properties.country || 'CO';
    analytics.pageView(`offer_landing_a_${dealUuid}`, { dealUuid, country });
    const cleanupScroll = initScrollTracking(country);
    const cleanupTime = initPageTimeTracking(country);
    return () => {
      if (cleanupScroll) cleanupScroll();
      if (cleanupTime) cleanupTime();
    };
  }, [dealUuid, properties.country]);

  // Determinar si BNPL esta habilitado
  const bnplEnabled = properties.negocio_aplica_para_bnpl?.toLowerCase() === '1' 
    || properties.negocio_aplica_para_bnpl?.toLowerCase() === 'si'
    || properties.negocio_aplica_para_bnpl?.toLowerCase() === 'sí'
    || properties.negocio_aplica_para_bnpl?.toLowerCase() === 'true'

  // Precio principal: si hay BNPL usar bnpl9, sino precio_comite
  const precioComite = properties.precio_comite || '0'
  const bnpl3 = properties.bnpl3 || '0'
  const bnpl6 = properties.bnpl6 || '0'
  const bnpl9 = properties.bnpl9 || '0'
  
  // Precio hero: si BNPL habilitado y hay bnpl9 > 0, mostrar bnpl9; sino precio_comite
  const heroPrice = bnplEnabled && Number(bnpl9.replace(/[^\d]/g, '')) > 0
    ? bnpl9
    : precioComite

  const calculatePercentageDifference = (currentPrice: string, basePrice: string): number => {
    const current = Number(currentPrice.replace(/[^\d]/g, ''))
    const base = Number(basePrice.replace(/[^\d]/g, ''))
    if (base === 0) return 0
    return ((current - base) / base) * 100
  }

  const handleWhatsAppRedirect = (action: 'propuesta' | 'visita') => {
    const whatsappUrl = properties.whatsapp_asesor
    if (!whatsappUrl) return

    let finalUrl = whatsappUrl
    if (!whatsappUrl.startsWith('http')) {
      const cleanNumber = whatsappUrl.replace(/[^\d+]/g, '')
      finalUrl = `https://wa.me/${cleanNumber.replace('+', '')}`
    }

    const messages = {
      propuesta: '¡Hola! Me interesa solicitar una propuesta de compra para mi propiedad.',
      visita: '¡Hola! Me gustaría agendar una visita a sus oficinas.'
    }

    const message = encodeURIComponent(messages[action])
    const separator = finalUrl.includes('?') ? '&' : '?'
    window.open(`${finalUrl}${separator}text=${message}`, '_blank')
  }

  const handleDownloadPDF = () => {
    window.print()
  }

  return (
    <div key={`${dealUuid}-${_forceUpdate}`} className="min-h-screen bg-gray-50">
      {/* Countdown */}
      <div className="sticky top-0 z-50">
        <OfferCountdown dealUuid={dealUuid} />
      </div>

      {/* Hero Section */}
      <div className="relative px-4 sm:px-6 print-hero-section">
        <div
          className="rounded-[1.5rem] sm:rounded-[3rem] mx-auto mt-4 sm:mt-8 overflow-hidden max-w-6xl print-hero-container"
          style={{ background: "linear-gradient(90deg, #7400C2 0%, #430070 100%)" }}
        >
          <div className="relative flex flex-col xl:flex-row xl:items-start xl:justify-between px-4 sm:px-8 py-8 sm:py-12 lg:py-16 min-h-[400px]">
            <div className="flex-1 max-w-2xl z-10 text-center xl:text-left mb-6 xl:mb-0 print-hero-text">
              <h1 className={`${montserrat.className} text-3xl sm:text-4xl lg:text-5xl xl:text-5xl mb-4 sm:mb-6 leading-tight print-hero-title`}>
                <span className="text-white font-bold block">Compramos tu vivienda</span>
                <span className="block font-black text-4xl sm:text-5xl lg:text-6xl xl:text-6xl mt-2 print-hero-subtitle" style={{ color: "#EACDFE" }}>
                  a tu medida
                </span>
              </h1>
              <div className="text-white text-sm sm:text-base space-y-2 max-w-lg mx-auto xl:mx-0 print-hero-description">
                {bnplEnabled ? (
                  <>
                    <p>Elige entre liquidez inmediata o el mejor precio en cuotas.</p>
                    <p>Tú decides qué producto se adapta mejor a tus necesidades.</p>
                  </>
                ) : (
                  <>
                    <p>Recibe una oferta directa por tu inmueble.</p>
                    <p>Sin publicar, sin visitas de extraños, sin negociaciones eternas.</p>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-center xl:justify-end xl:items-end xl:absolute xl:right-0 xl:bottom-0 xl:top-10 print-hero-image">
              <Image 
                src="/logo/imagen.svg" 
                alt="Habi - Compramos tu vivienda a tu medida" 
                width={400} 
                height={300} 
                priority
                className="object-contain object-bottom w-64 h-48 sm:w-80 sm:h-60 md:w-96 md:h-72 xl:w-[570px] xl:h-[400px] print-hero-img"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Product Selection Section - Hero Price */}
      <div className="max-w-xl mx-auto px-4 sm:px-6 -mt-4 sm:-mt-8 relative z-20 print-price-section">
        <div className="rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
          <div className="text-center p-4 sm:p-6 lg:p-8" style={{ backgroundColor: "#F9F0FF" }}>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6 print-price-title" style={{ color: "#8A00E6" }}>
              {bnplEnabled ? 'Elige tu modalidad de compra' : 'Tu oferta de compra'}
            </h2>
            <div className="mb-4">
              <p className="text-sm sm:text-base mb-2 sm:mb-3 print-price-label" style={{ color: "#8A00E6" }}>
                Precio de compra
              </p>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold print-price-value" style={{ color: "#8A00E6" }}>
                {formatPrice(heroPrice)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="py-6 sm:py-8 lg:py-12 print-gap-space"></div>

      {/* Product Details Section - Solo si BNPL habilitado */}
      {bnplEnabled && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-12 print-products-section">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-center lg:items-start print-products-container">
            {/* Left Card - Vertical */}
            <div 
              className="w-full max-w-sm lg:max-w-none lg:w-96 mx-auto lg:mx-0 rounded-[1.5rem] sm:rounded-[2rem] lg:rounded-[2.5rem] text-white flex flex-col relative overflow-hidden h-auto sm:h-[400px] lg:h-[755px] print-card-vertical"
              style={{ backgroundColor: "#7400C2" }}
            >
              <div className="flex justify-center">
                <div className="w-full sm:w-80 p-4 sm:p-6 pb-4 sm:pb-0 text-center lg:text-left print-vertical-card-content">
                  <h2 className={`${montserrat.className} text-2xl sm:text-3xl lg:text-4xl mb-4 sm:mb-6 leading-tight print-vertical-card-title`}>
                    <span className="block font-bold">Elige un</span>
                    <span className="block font-bold">producto</span>
                    <span className="block font-black text-3xl sm:text-4xl lg:text-5xl mt-2 print-vertical-card-subtitle" style={{ color: "#EACDFE" }}>
                      a tu medida
                    </span>
                  </h2>
                  <p className="text-white text-sm sm:text-base mb-4 sm:mb-6 print-vertical-card-text">
                    La flexibilidad de nuestros productos te permite tomar la decisión ideal para ti.
                  </p>
                </div>
              </div>
              <div className="mt-auto hidden sm:block">
                <Image 
                  src="/logo/imagen2.svg" 
                  alt="Productos financieros" 
                  width={320} 
                  height={180} 
                  loading="lazy"
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>

            {/* Right Cards */}
            <div className="flex-1 flex flex-col gap-4 sm:gap-6 w-full max-w-2xl mx-auto lg:mx-0 print-cards-list">
              {/* Info */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border-l-4 border-purple-500 mb-2">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <h3 className="font-semibold text-gray-800 text-sm sm:text-base">¿Sabías que la diferencia es mínima?</h3>
                </div>
                <p className="text-gray-600 text-xs sm:text-sm">
                  Por solo un <strong className="text-purple-600">1-3% adicional</strong> puedes obtener el mejor precio. 
                  La decisión perfecta entre <strong>liquidez inmediata</strong> y <strong>máximo valor</strong>.
                </p>
              </div>

              {/* Card BNPL9 */}
              <div className="rounded-xl sm:rounded-2xl shadow-md border border-purple-100 flex flex-col sm:flex-row items-stretch overflow-hidden hover:border-2 transition-all duration-200 hover:border-[#8A00E6] relative">
                <div className="absolute top-2 right-2 text-white text-xs font-bold px-2 py-1 rounded-full z-10" style={{ backgroundColor: "#8A00E6" }}>
                  +{calculatePercentageDifference(bnpl9, precioComite).toFixed(1)}%
                </div>
                <div className="flex-1 p-4 sm:p-6 text-center text-white" style={{ backgroundColor: "#8A00E6" }}>
                  <p className="text-sm sm:text-base mb-2 sm:mb-3">Precio de compra</p>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">{formatPrice(bnpl9)}</p>
                </div>
                <div className="flex-1 bg-white p-4 sm:p-6 flex flex-col justify-center">
                  <p className="text-gray-600 text-sm sm:text-base text-center sm:text-left">
                    Te pagamos en <strong className="text-gray-800">9 cuotas</strong>
                  </p>
                  <p className="text-gray-600 text-sm sm:text-base text-center sm:text-left">
                    de <strong className="text-gray-800">{formatPrice(Number(bnpl9.replace(/[^\d]/g, '')) / 9)}</strong>
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-1 mt-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" style={{ color: "#8A00E6" }}>
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-xs sm:text-sm font-medium" style={{ color: "#8A00E6" }}>Mejor precio total</p>
                  </div>
                </div>
              </div>

              <div className="my-2 sm:my-3"><div className="w-full h-px bg-gray-200"></div></div>

              {/* Card BNPL6 */}
              <div className="rounded-xl sm:rounded-2xl shadow-md border border-purple-100 flex flex-col sm:flex-row items-stretch overflow-hidden hover:border-2 transition-all duration-200 hover:border-[#8A00E6] relative">
                <div className="absolute top-2 right-2 text-white text-xs font-bold px-2 py-1 rounded-full z-10" style={{ backgroundColor: "#8A00E6" }}>
                  +{calculatePercentageDifference(bnpl6, precioComite).toFixed(1)}%
                </div>
                <div className="flex-1 p-4 sm:p-6 text-center" style={{ backgroundColor: "#F9F0FF", color: "#8A00E6" }}>
                  <p className="text-sm sm:text-base mb-2 sm:mb-3">Precio de compra</p>
                  <p className="text-2xl sm:text-3xl font-bold">{formatPrice(bnpl6)}</p>
                </div>
                <div className="flex-1 bg-white p-4 sm:p-6 flex flex-col justify-center">
                  <p className="text-gray-600 text-sm sm:text-base text-center sm:text-left">
                    Te pagamos en <strong className="text-gray-800">6 cuotas</strong>
                  </p>
                  <p className="text-gray-600 text-sm sm:text-base text-center sm:text-left">
                    de <strong className="text-gray-800">{formatPrice(Number(bnpl6.replace(/[^\d]/g, '')) / 6)}</strong>
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-1 mt-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" style={{ color: "#8A00E6" }}>
                      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.263 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-xs sm:text-sm font-medium" style={{ color: "#8A00E6" }}>Equilibrio perfecto</p>
                  </div>
                </div>
              </div>

              {/* Card BNPL3 */}
              <div className="rounded-xl sm:rounded-2xl shadow-md border border-purple-100 flex flex-col sm:flex-row items-stretch overflow-hidden hover:border-2 transition-all duration-200 hover:border-[#8A00E6] relative">
                <div className="absolute top-2 right-2 text-white text-xs font-bold px-2 py-1 rounded-full z-10" style={{ backgroundColor: "#8A00E6" }}>
                  +{calculatePercentageDifference(bnpl3, precioComite).toFixed(1)}%
                </div>
                <div className="flex-1 p-4 sm:p-6 text-center" style={{ backgroundColor: "#F9F0FF", color: "#8A00E6" }}>
                  <p className="text-sm sm:text-base mb-2 sm:mb-3">Precio de compra</p>
                  <p className="text-2xl sm:text-3xl font-bold">{formatPrice(bnpl3)}</p>
                </div>
                <div className="flex-1 bg-white p-4 sm:p-6 flex flex-col justify-center">
                  <p className="text-gray-600 text-sm sm:text-base text-center sm:text-left">
                    Te pagamos en <strong className="text-gray-800">3 cuotas</strong>
                  </p>
                  <p className="text-gray-600 text-sm sm:text-base text-center sm:text-left">
                    de <strong className="text-gray-800">{formatPrice(Number(bnpl3.replace(/[^\d]/g, '')) / 3)}</strong>
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-1 mt-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" style={{ color: "#8A00E6" }}>
                      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                    <p className="text-xs sm:text-sm font-medium" style={{ color: "#8A00E6" }}>Pagos rápidos</p>
                  </div>
                </div>
              </div>

              {/* Card Precio Comite */}
              <div className="rounded-xl sm:rounded-2xl shadow-md border border-purple-100 flex flex-col sm:flex-row items-stretch overflow-hidden hover:border-2 transition-all duration-200 hover:border-[#8A00E6] relative">
                <div className="absolute top-2 right-2 text-white text-xs font-bold px-2 py-1 rounded-full z-10" style={{ backgroundColor: "#8A00E6" }}>
                  BASE
                </div>
                <div className="flex-1 p-4 sm:p-6 text-center" style={{ backgroundColor: "#F9F0FF", color: "#8A00E6" }}>
                  <p className="text-sm sm:text-base mb-2 sm:mb-3">Precio de compra</p>
                  <p className="text-2xl sm:text-3xl font-bold">{formatPrice(precioComite)}</p>
                </div>
                <div className="flex-1 bg-white p-4 sm:p-6 flex flex-col justify-center">
                  <p className="text-gray-600 text-sm sm:text-base text-center sm:text-left">
                    <strong className="text-gray-800">Te pagamos de inmediato</strong>
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-1 mt-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" style={{ color: "#8A00E6" }}>
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                    </svg>
                    <p className="text-xs sm:text-sm font-medium" style={{ color: "#8A00E6" }}>Liquidez inmediata</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* How It Works Section */}
      <div className="bg-white py-12 sm:py-16 lg:py-20 px-4 sm:px-6 print-page-break print-how-it-works">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className={`${montserrat.className} text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black mb-4 sm:mb-6`}
                style={{ color: "#7400C2" }}>
              ¿Cómo funciona?
            </h2>
            <p className="text-gray-600 text-base sm:text-lg lg:text-xl max-w-2xl mx-auto px-4">
              En 3 simples pasos, la decisión es tuya:
            </p>
          </div>

          <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16 lg:mb-20">
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-2 pointer-events-none -translate-y-1/2 z-0"
                 style={{ backgroundColor: "#DAA7FB" }}></div>
            {/* Step 1 */}
            <div className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg relative z-10 flex flex-col">
              <div className="bg-purple-50 p-6 sm:p-8 text-center flex-1 flex items-center justify-center">
                <span className={`${montserrat.className} text-xl sm:text-2xl lg:text-3xl font-bold block`}
                      style={{ color: "#7400C2" }}>
                  1. Solicita tu propuesta de compra
                </span>
              </div>
              <div className="bg-white p-6 sm:p-8 text-center flex-1 flex items-center justify-center">
                <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                  Completa nuestro formulario con los datos de tu propiedad. Te daremos una propuesta de compra en menos de 24 horas.
                </p>
              </div>
            </div>
            {/* Step 2 */}
            <div className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg relative z-10 flex flex-col">
              <div className="bg-purple-50 p-6 sm:p-8 text-center flex-1 flex items-center justify-center">
                <span className={`${montserrat.className} text-xl sm:text-2xl lg:text-3xl font-bold block`}
                      style={{ color: "#7400C2" }}>
                  2. Elige tu producto
                </span>
              </div>
              <div className="bg-white p-6 sm:p-8 text-center flex-1 flex items-center justify-center">
                <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                  Selecciona el mejor producto para ti: desde liquidez inmediata hasta el mejor precio en cuotas.
                </p>
              </div>
            </div>
            {/* Step 3 */}
            <div className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg relative z-10 flex flex-col">
              <div className="bg-purple-50 p-6 sm:p-8 text-center flex-1 flex items-center justify-center">
                <span className={`${montserrat.className} text-xl sm:text-2xl lg:text-3xl font-bold block`}
                      style={{ color: "#7400C2" }}>
                  3. Cierra y Recibe
                </span>
              </div>
              <div className="bg-white p-6 sm:p-8 text-center flex-1 flex items-center justify-center">
                <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                  Firmamos el contrato y recibes tu dinero en los tiempos estipulados en la promesa de compraventa según el producto elegido.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visit Section */}
      <div className="bg-white py-8 sm:py-12 lg:py-16 px-4 sm:px-6 print-visit-section">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-[1.5rem] sm:rounded-[2rem] lg:rounded-[4rem] overflow-hidden"
               style={{ background: "linear-gradient(135deg, #7400C2 0%, #430070 100%)" }}>
            <div className="flex flex-col lg:flex-row items-stretch">
              <div className="flex-1 p-6 sm:p-8 lg:p-12 xl:p-16 text-white text-center lg:text-left">
                <h2 className={`${montserrat.className} mb-6 sm:mb-8`}>
                  <span className="block text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black mb-2 sm:mb-4" style={{ color: "#EACDFE" }}>
                    Síentete como en casa,
                  </span>
                  <span className="block text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold">
                    agenda una visita a
                  </span>
                  <span className="block text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold">
                    nuestras oficinas
                  </span>
                </h2>
                <p className="text-white text-sm sm:text-base mb-6 sm:mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0">
                  Recuerda que puedes buscarnos y agendar una visita en persona a nuestras oficinas, sabemos que es muy importante poder arreglar detalles frente a frente.
                </p>
                <button 
                  onClick={() => handleWhatsAppRedirect('visita')}
                  className="bg-white hover:bg-gray-100 text-purple-700 font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Agendar visita
                </button>
              </div>
              <div className="flex-1 relative h-64 sm:h-80 lg:h-auto">
                <Image 
                  src="/logo/imagen3.png?v=2" 
                  alt="Visita nuestras oficinas" 
                  width={500} 
                  height={400} 
                  loading="lazy"
                  className="absolute top-0 right-0 bottom-0 w-auto h-full object-cover"
                  style={{ objectPosition: "40% center" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-white py-12 sm:py-16 lg:py-20 px-4 sm:px-6 print-page-break">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className={`${montserrat.className} text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black mb-4 sm:mb-6`}
                style={{ color: "#7400C2" }}>
              <span className="font-medium">Procesos efectivos,</span> <span className="block sm:inline">pagos seguros</span>
            </h2>
            <p className="text-gray-600 text-base sm:text-lg lg:text-xl max-w-5xl mx-auto px-4">
              En Habi, preferimos que nuestros clientes hablen por nosotros. ¡Gracias por su confianza!
            </p>
          </div>

          <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-2 pointer-events-none -translate-y-1/2 z-0"
                 style={{ backgroundColor: "#DAA7FB" }}></div>
            {[
              { name: 'Felipe y Natalia', img: '/logo/cliente1.png', subtitle: 'Invirtieron en la vivienda de sus sueños', quote: '"Calificamos a Habi con 10/10 por la tranquilidad, y eficiencia del proceso, nos hicieron sentir como parte de una familia al acompañarnos en cada paso"' },
              { name: 'Carlos Rincón', img: '/logo/cliente2.png', subtitle: 'Vendió su apartamento en Suba', quote: '"Mi experiencia con Habi fue un 9/10, estuvieron de mi lado siempre"' },
              { name: 'Martha Lucía Roa', img: '/logo/cliente3.png', subtitle: 'Encontró su hogar ideal', quote: '"Los califico con 9/10 por su disposición, fue un hermoso proceso y respondieron a todas nuestras preguntas"' },
            ].map((t) => (
              <div key={t.name} className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg relative z-10">
                <div className="bg-purple-50 p-4 sm:p-6 text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-full overflow-hidden">
                    <img src={t.img} alt={t.name} className="w-full h-full object-cover" />
                  </div>
                  <h3 className={`${montserrat.className} text-lg sm:text-xl lg:text-2xl font-bold mb-1 sm:mb-2`}
                      style={{ color: "#7400C2" }}>
                    {t.name}
                  </h3>
                  <p className="text-gray-600 text-xs sm:text-sm font-medium">{t.subtitle}</p>
                </div>
                <div className="bg-white p-4 sm:p-6 text-center">
                  <p className="text-gray-700 text-sm sm:text-base leading-relaxed">{t.quote}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating PDF button - oculto temporalmente */}
    </div>
  )
}
