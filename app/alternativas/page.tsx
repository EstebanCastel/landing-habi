'use client';

export default function AlternativasPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header limpio */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <a 
            href="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver a tu oferta
          </a>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            ¿Estás considerando vender por tu cuenta?
          </h1>
          <div className="max-w-2xl mx-auto space-y-4">
            <p className="text-xl text-gray-700">
              Vender tu inmueble por tu cuenta es posible.
            </p>
            <p className="text-lg text-gray-600">
              Pero antes de decidir, vale la pena conocer el tiempo, esfuerzo y costos reales que implica hacerlo sin Habi.
            </p>
          </div>
        </div>

        {/* Video Section - Protagonista */}
        <div className="mb-20">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              El costo real de vender por tu cuenta
            </h2>
            <p className="text-lg text-gray-600 mb-2">
              En este video te explicamos el costo de oportunidad de no vender con Habi:
            </p>
            <p className="text-base text-gray-600">
              tiempo en el mercado, negociaciones, visitas, trámites y riesgos que suelen pasar desapercibidos.
            </p>
            <p className="text-sm text-purple-600 font-medium mt-3">
              Duración: 2-3 minutos • Información clara, sin tecnicismos.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
            <video 
              className="w-full aspect-video"
              controls
            >
              <source src="/Costo_De_Oportunidad_De_No_Vender.mp4" type="video/mp4" />
              Tu navegador no soporta la reproducción de videos.
            </video>
          </div>
        </div>

        {/* Guía/Folleto Section */}
        <div className="mb-20 bg-gradient-to-br from-purple-50 to-white rounded-2xl p-8 md:p-12 border border-purple-100">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Guía práctica para vender tu inmueble por tu cuenta
            </h2>
            <p className="text-lg text-gray-700 mb-2">
              Si decides vender por tu cuenta, queremos ayudarte a hacerlo de la mejor forma posible.
            </p>
            <p className="text-base text-gray-600">
              Por eso preparamos una guía con todo lo que necesitas saber para vender más rápido y con menos errores.
            </p>
          </div>

          {/* Incluye */}
          <div className="mb-8 max-w-2xl mx-auto">
            <p className="text-base font-semibold text-gray-900 mb-4">Incluye:</p>
            <ul className="space-y-3">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Checklist paso a paso del proceso de venta</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Costos reales que debes asumir</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Tiempos promedio del mercado</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Consejos para evitar negociaciones fallidas</span>
              </li>
            </ul>
          </div>

          {/* Folleto preview */}
          <div className="mb-8 max-w-md mx-auto">
            <img 
              src="/folleto.svg" 
              alt="Guía para vender" 
              className="w-full h-auto rounded-lg shadow-lg"
            />
          </div>

          {/* CTA Descarga */}
          <div className="text-center">
            <button className="inline-flex items-center gap-3 bg-purple-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-purple-700 transition shadow-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Descargar guía completa (PDF)
            </button>
            <p className="text-sm text-gray-600 mt-3">
              Consejos claros, sin letra pequeña.
            </p>
          </div>
        </div>

        {/* Sección Contraste - Elegante, no agresiva */}
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Con Habi, todo esto lo hacemos por ti
          </h2>
          <p className="text-lg text-gray-700 mb-8 max-w-xl mx-auto">
            Mientras tú sigues con tu vida, nosotros nos encargamos de todo:
          </p>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 max-w-3xl mx-auto mb-8">
            <div className="text-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-gray-700">Sin publicar</p>
            </div>
            <div className="text-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-gray-700">Sin visitas</p>
            </div>
            <div className="text-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-gray-700">Sin negociaciones</p>
            </div>
            <div className="text-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-gray-700">Sin trámites</p>
            </div>
            <div className="text-center col-span-2 md:col-span-1">
              <div className="w-3 h-3 bg-purple-500 rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-gray-700">Sin incertidumbre</p>
            </div>
          </div>

          <p className="text-base text-gray-600">
            Solo una oferta clara, justa y rápida.
          </p>
        </div>

        {/* CTA Final */}
        <div className="text-center py-12">
          <a 
            href="/"
            className="inline-block bg-purple-600 text-white px-16 py-4 rounded-lg text-lg font-medium hover:bg-purple-700 transition shadow-xl"
          >
            Volver a mi oferta
          </a>
          <p className="text-sm text-gray-600 mt-4">
            Tu oferta sigue disponible por tiempo limitado.
          </p>
        </div>
      </div>
    </div>
  );
}
