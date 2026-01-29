'use client';

import DonationSection from './DonationSection';

interface InmobiliariaSectionProps {
  precioInmobiliaria: number;
  setPrecioInmobiliaria: (precio: number) => void;
  valorMercado: number;
  selectedDonation: string;
  donationAmount: number;
  onDonationChange: (optionId: string, amount: number) => void;
}

export default function InmobiliariaSection({
  precioInmobiliaria,
  setPrecioInmobiliaria,
  valorMercado,
  selectedDonation,
  donationAmount,
  onDonationChange
}: InmobiliariaSectionProps) {
  // Precio neto después de comisión y donación
  const precioNeto = precioInmobiliaria * 0.95;
  const precioFinal = precioNeto - donationAmount;
  const formatPrice = (price: number) => {
    return `$ ${price.toLocaleString('es-CO')}`;
  };

  return (
    <div className="px-6 py-8 bg-white">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Inmobiliaria Habi</h3>
        <p className="text-sm text-gray-600">
          Tú eliges el precio. Nosotros lo vendemos con la red más grande de brokers de Colombia.
        </p>
      </div>

      {/* Precio personalizado */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-900 mb-2">
          ¿A qué precio quieres vender?
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
          <input
            type="text"
            value={precioInmobiliaria.toLocaleString('es-CO')}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              setPrecioInmobiliaria(Number(value) || 0);
            }}
            className="w-full pl-8 pr-4 py-3 text-xl font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Valor de mercado estimado: {formatPrice(valorMercado)}
        </p>
      </div>

      {/* Beneficios */}
      <div className="bg-gradient-to-br from-purple-50 to-white p-4 rounded-xl border border-purple-100 mb-6">
        <p className="text-sm font-semibold text-gray-900 mb-3">¿Qué incluye?</p>
        <ul className="space-y-2">
          <li className="flex items-start text-sm text-gray-600">
            <svg className="w-4 h-4 text-purple-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Publicación en los principales portales inmobiliarios
          </li>
          <li className="flex items-start text-sm text-gray-600">
            <svg className="w-4 h-4 text-purple-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Acceso a la red más grande de brokers certificados
          </li>
          <li className="flex items-start text-sm text-gray-600">
            <svg className="w-4 h-4 text-purple-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Fotografía profesional y tour virtual
          </li>
          <li className="flex items-start text-sm text-gray-600">
            <svg className="w-4 h-4 text-purple-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Gestión de visitas y negociación
          </li>
          <li className="flex items-start text-sm text-gray-600">
            <svg className="w-4 h-4 text-purple-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Acompañamiento legal hasta la escritura
          </li>
        </ul>
      </div>

      {/* Comisión */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-gray-900">Comisión por venta exitosa</p>
            <p className="text-xs text-gray-500">Solo pagas si vendemos tu inmueble</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-purple-600">5%</p>
            <p className="text-xs text-gray-500">{formatPrice(precioInmobiliaria * 0.05)}</p>
          </div>
        </div>
      </div>

      {/* Donación */}
      <div className="-mx-6">
        <DonationSection 
          selectedDonation={selectedDonation}
          onDonationChange={onDonationChange}
        />
      </div>

      {/* Resumen */}
      <div id="cta-final-section" className="border-t border-gray-200 pt-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Precio de venta</span>
          <span className="text-sm font-medium">{formatPrice(precioInmobiliaria)}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Comisión (5%)</span>
          <span className="text-sm text-gray-600">- {formatPrice(precioInmobiliaria * 0.05)}</span>
        </div>
        {donationAmount > 0 && (
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-purple-600">Tu donación</span>
            <span className="text-sm text-purple-600">- {formatPrice(donationAmount)}</span>
          </div>
        )}
        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
          <span className="text-base font-medium">Recibirás</span>
          <span className="text-xl font-bold text-purple-600">{formatPrice(precioFinal)}</span>
        </div>
      </div>

      {/* CTAs */}
      <button className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition mb-3">
        Publicar mi inmueble
      </button>
      <button className="w-full bg-white text-purple-600 py-3 rounded-lg font-medium border border-purple-200 hover:bg-purple-50 transition">
        Hablar con un asesor
      </button>
    </div>
  );
}

