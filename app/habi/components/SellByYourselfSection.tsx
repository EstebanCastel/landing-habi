'use client';

import DonationSection from './DonationSection';
import PersonalAdvisor from './PersonalAdvisor';

type Modalidad = 'habi' | 'inmobiliaria' | 'cuenta_propia';

interface SellByYourselfSectionProps {
  precioCuentaPropia: number;
  setPrecioCuentaPropia: (precio: number) => void;
  valorMercado: number;
  setModalidadVenta: (modalidad: Modalidad) => void;
  selectedDonation: string;
  donationAmount: number;
  onDonationChange: (optionId: string, amount: number) => void;
  onDonationRef?: (ref: HTMLDivElement | null) => void;
}

export default function SellByYourselfSection({
  precioCuentaPropia,
  setPrecioCuentaPropia,
  valorMercado,
  setModalidadVenta,
  selectedDonation,
  donationAmount,
  onDonationChange,
  onDonationRef
}: SellByYourselfSectionProps) {
  const formatPrice = (price: number) => {
    return `$ ${price.toLocaleString('es-CO')}`;
  };

  return (
    <div id="configurator-section" className="bg-white">
      {/* Asesor Personal */}
      <PersonalAdvisor />

      {/* Donación */}
      <DonationSection 
        selectedDonation={selectedDonation}
        donationAmount={donationAmount}
        onDonationChange={onDonationChange}
        onSectionRef={onDonationRef}
      />

      {/* Precio de venta */}
      <div className="px-6 py-6">
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-900 mb-2">
          ¿A qué precio planeas vender?
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
          <input
            type="text"
            value={precioCuentaPropia.toLocaleString('es-CO')}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              setPrecioCuentaPropia(Number(value) || 0);
            }}
            className="w-full pl-8 pr-4 py-3 text-xl font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Valor de mercado estimado: {formatPrice(valorMercado)}
        </p>
      </div>

      {/* SECCIÓN 1: Costo de oportunidad */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 mb-1">El costo de vender por tu cuenta</p>
            <p className="text-xs text-gray-600">
              Tiempo promedio de venta: 6-12 meses. Costos ocultos: publicidad, visitas, negociaciones fallidas, y trámites legales.
            </p>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: Asesoría comercial */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 mb-1">Asesoría comercial gratuita</p>
            <p className="text-xs text-gray-600 mb-2">
              ¿Tienes dudas? Habla con uno de nuestros asesores sin ningún compromiso.
            </p>
            <button className="text-xs text-purple-600 font-medium hover:underline">
              Iniciar chat →
            </button>
          </div>
        </div>
      </div>

      {/* SECCIÓN 3: Guía descargable */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 mb-1">Guía para vender tu inmueble</p>
            <p className="text-xs text-gray-600 mb-2">
              Checklist completo, costos reales, tiempos del mercado y consejos de expertos.
            </p>
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div id="cta-final-section">
        <button className="w-full inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition mb-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Descargar guía gratuita
        </button>

        <button 
          onClick={() => setModalidadVenta('habi')}
          className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition"
        >
          Quiero que Habi me compre
        </button>
      </div>
      </div>
    </div>
  );
}

