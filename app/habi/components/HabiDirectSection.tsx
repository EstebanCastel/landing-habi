'use client';

import { useState } from 'react';
import { HabiConfiguration, COSTOS_PERCENTAGES } from '../../types/habi';
import AnimatedPrice from './AnimatedPrice';
import DonationSection from './DonationSection';

interface HabiDirectSectionProps {
  configuration: HabiConfiguration;
  setConfiguration: (config: HabiConfiguration) => void;
  currentPrice: number;
  valorMercado: number;
  selectedDonation: string;
  donationAmount: number;
  onDonationChange: (optionId: string, amount: number) => void;
}

export default function HabiDirectSection({
  configuration,
  setConfiguration,
  currentPrice,
  valorMercado,
  selectedDonation,
  donationAmount,
  onDonationChange
}: HabiDirectSectionProps) {
  const [showServicePopup, setShowServicePopup] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleClosePopup = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowServicePopup(false);
      setIsClosing(false);
    }, 800);
  };
  
  // Precio final con donación descontada
  const finalPrice = currentPrice - donationAmount;
  const formatPrice = (price: number) => {
    return `$ ${price.toLocaleString('es-CO')}`;
  };

  const comisionTotal = (valorMercado * COSTOS_PERCENTAGES.comisionTotal) / 100;
  const propertyMensual = (valorMercado * COSTOS_PERCENTAGES.propertyMensual) / 100;
  const costosRemodelacion = (valorMercado * COSTOS_PERCENTAGES.remodelacion) / 100;
  const costosTramites = (valorMercado * COSTOS_PERCENTAGES.tramites) / 100;
  const gananciaHabi = valorMercado * 0.05; // 5% de ganancia

  return (
    <>
      {/* SECCIÓN INICIAL: Así se construye tu oferta */}
      <div className="p-6 bg-white border-b border-gray-200">
        <h3 className="text-xl font-bold mb-2">Así se construye tu oferta</h3>
        <p className="text-sm text-gray-600 mb-6">
          Elige qué quieres que Habi se encargue y cómo prefieres recibir tu dinero.
        </p>

        <div className="space-y-4">
          {/* Comisión */}
          <div className="flex justify-between items-start pb-3 border-b border-gray-100">
            <div className="flex-1">
              <p className="font-medium text-sm mb-2">Comisión Habi</p>
              <p className="text-xs text-gray-600 mb-1">
                Comisión total del <strong>4.4%</strong>.
              </p>
              <p className="text-xs text-gray-500">
                En una venta tradicional pagarías entre 5% y 7%.
              </p>
            </div>
            <div className="text-right ml-4">
              <p className="font-semibold">{formatPrice(comisionTotal)}</p>
              <p className="text-xs text-gray-500">{COSTOS_PERCENTAGES.comisionTotal}%</p>
            </div>
          </div>

          {/* Gastos mensuales del inmueble */}
          <div className="flex justify-between items-start pb-3 border-b border-gray-100">
            <div className="flex-1">
              <p className="font-medium text-sm mb-2">Gastos mensuales del inmueble</p>
              <p className="text-xs text-gray-600 mb-1">
                Administración y servicios del inmueble durante el proceso de venta.
              </p>
              <p className="text-xs text-gray-500">
                Estos gastos existen incluso si vendes por tu cuenta.<br />
                Habi los asume por ti desde el inicio.
              </p>
            </div>
            <div className="text-right ml-4">
              <p className="font-semibold">{formatPrice(propertyMensual)}</p>
              <p className="text-xs text-gray-500">{COSTOS_PERCENTAGES.propertyMensual}%</p>
            </div>
          </div>

          {/* Tarifa de servicio Habi */}
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="font-medium text-sm mb-2">Tarifa de servicio Habi</p>
              <p className="text-xs text-gray-600 mb-2">
                Habi obtiene una ganancia del <strong>5%</strong> sobre el valor de venta del inmueble.
              </p>
              <button
                onClick={() => setShowServicePopup(true)}
                className="text-xs text-purple-600 font-medium hover:text-purple-700 transition"
              >
                Ver más →
              </button>
            </div>
            <div className="text-right ml-4">
              <p className="font-semibold">{formatPrice(gananciaHabi)}</p>
              <p className="text-xs text-gray-500">5%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Popup de Servicio Habi - Estilo Tesla */}
      {showServicePopup && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-400 ease-out ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
          {/* Backdrop con blur */}
          <div 
            className={`absolute inset-0 bg-white/70 backdrop-blur-sm transition-all duration-300 ${isClosing ? 'backdrop-blur-none' : ''}`}
            onClick={handleClosePopup}
          />
          
          {/* Modal */}
          <div 
            className={`relative w-full max-w-4xl bg-white rounded-lg shadow-2xl transition-all duration-400 ease-out ${isClosing ? 'opacity-0 translate-y-8' : 'animate-slide-up'}`}
            style={{ height: '85vh' }}
          >
            {/* Botón cerrar */}
            <button
              onClick={handleClosePopup}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition z-10"
            >
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Contenido vacío - para llenar después */}
            <div className="h-full overflow-y-auto p-8">
              {/* Aquí irá el contenido */}
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN: Trámites */}
      <div className="px-6 py-8 bg-white border-t border-gray-200">
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-2">Trámites y notarías</h3>
          <p className="text-sm text-gray-600 mb-1">
            Costos notariales y de registro asociados a la venta.
          </p>
          <p className="text-sm text-gray-500">
            Costo estimado: {formatPrice(costosTramites)}
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => setConfiguration({ ...configuration, tramites: 'habi' })}
            className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
              configuration.tramites === 'habi'
                ? 'border-purple-200 bg-gradient-to-br from-purple-50 to-transparent'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium">Habi se encarga</span>
              {configuration.tramites === 'habi' && (
                <span className="text-sm text-purple-600">✓</span>
              )}
            </div>
            <p className="text-xs text-gray-600">
              Tú no haces pagos ni trámites adicionales.
            </p>
          </button>

          <button
            onClick={() => setConfiguration({ ...configuration, tramites: 'cliente' })}
            className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
              configuration.tramites === 'cliente'
                ? 'border-purple-200 bg-gradient-to-br from-purple-50 to-transparent'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium">Yo los pago</span>
                <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded font-semibold">
                  +{COSTOS_PERCENTAGES.tramites}%
                </span>
              </div>
              {configuration.tramites === 'cliente' && (
                <span className="text-sm text-purple-600">✓</span>
              )}
            </div>
            <p className="text-xs text-gray-600">
              Obtienes un mayor precio, pero deberás pagarlos directamente.
            </p>
          </button>
        </div>

        {configuration.tramites === 'cliente' && (
          <div className="mt-4 p-3 bg-gray-50 rounded">
            <p className="text-xs font-medium text-gray-900 mb-2">¿Estás seguro?</p>
            <p className="text-xs text-gray-600 mb-2">
              Al elegir esta opción, deberás pagar los costos de trámites, notarías y registros.
            </p>
            <p className="text-xs text-gray-900 font-medium mb-1">Importante:</p>
            <p className="text-xs text-gray-600 mb-2">
              Deberás acercarte a la notaría el día de la escritura para realizar el pago.
            </p>
            <p className="text-xs text-gray-500">
              Costo estimado: $8.000.000 – $15.000.000
            </p>
          </div>
        )}
      </div>

      {/* SECCIÓN: Remodelación */}
      <div className="px-6 py-8 bg-white border-t border-gray-200">
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-2">Estado del inmueble</h3>
          <p className="text-sm text-gray-600 mb-1">
            Mejoras y reparaciones necesarias para su venta.
          </p>
          <p className="text-sm text-gray-500">
            Costo estimado: {formatPrice(costosRemodelacion)}
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => setConfiguration({ ...configuration, remodelacion: 'habi' })}
            className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
              configuration.remodelacion === 'habi'
                ? 'border-purple-200 bg-gradient-to-br from-purple-50 to-transparent'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium">Habi se encarga</span>
              {configuration.remodelacion === 'habi' && (
                <span className="text-sm text-purple-600">✓</span>
              )}
            </div>
            <p className="text-xs text-gray-600">
              Compramos tu inmueble tal como está.
            </p>
          </button>

          <button
            onClick={() => setConfiguration({ ...configuration, remodelacion: 'cliente' })}
            className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
              configuration.remodelacion === 'cliente'
                ? 'border-purple-200 bg-gradient-to-br from-purple-50 to-transparent'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium">Yo las hago</span>
                <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded font-semibold">
                  +{COSTOS_PERCENTAGES.remodelacion}%
                </span>
              </div>
              {configuration.remodelacion === 'cliente' && (
                <span className="text-sm text-purple-600">✓</span>
              )}
            </div>
            <p className="text-xs text-gray-600">
              Obtienes un mayor precio realizando las mejoras recomendadas.
            </p>
          </button>
        </div>

        {configuration.remodelacion === 'cliente' && (
          <div className="mt-4 p-3 bg-gray-50 rounded">
            <p className="text-xs text-gray-600">
              Una vez realices las mejoras recomendadas, podremos avanzar con la compra.
            </p>
          </div>
        )}
      </div>

      {/* Donación */}
      <DonationSection 
        selectedDonation={selectedDonation}
        onDonationChange={onDonationChange}
      />

      {/* CTA Final */}
      <div id="cta-final-section" className="px-6 py-6 bg-white border-t border-gray-200">
        <div className="mb-6">
          {donationAmount > 0 ? (
            <>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Precio base</span>
                <span className="text-sm text-gray-600">{formatPrice(currentPrice)}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-purple-600">Tu donación</span>
                <span className="text-sm text-purple-600">- {formatPrice(donationAmount)}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pt-2 border-t border-gray-200">
                <span className="text-base font-medium">Recibirás</span>
                <span className="text-xl sm:text-2xl font-bold">
                  <AnimatedPrice value={finalPrice} />
                </span>
              </div>
            </>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
              <span className="text-base">Precio estimado de compra</span>
              <span className="text-xl sm:text-2xl font-bold">
                <AnimatedPrice value={currentPrice} />
              </span>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-2">
            Según las opciones que elegiste
          </p>
        </div>

        <button className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition mb-3">
          Continuar con la venta
        </button>

        <button className="w-full bg-white text-purple-600 py-3 rounded-lg font-medium border border-purple-200 hover:bg-purple-50 transition">
          Hablar con mi asesor
        </button>

        <p className="text-xs text-gray-500 text-center mt-6">
          Oferta válida por 3 días calendario.<br />
          Sujeta a verificación técnica y documental del inmueble.
        </p>
      </div>
    </>
  );
}

