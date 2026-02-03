'use client';

import { useState } from 'react';
import { HabiConfiguration, COSTOS_PERCENTAGES, PAYMENT_OPTIONS } from '../../types/habi';
import AnimatedPrice from './AnimatedPrice';
import DonationSection from './DonationSection';
import PersonalAdvisor from './PersonalAdvisor';
import Modal from './Modal';

interface HabiDirectSectionProps {
  configuration: HabiConfiguration;
  setConfiguration: (config: HabiConfiguration) => void;
  currentPrice: number;
  valorMercado: number;
  selectedDonation: string;
  donationAmount: number;
  onDonationChange: (optionId: string, amount: number) => void;
  onDonationRef?: (ref: HTMLDivElement | null) => void;
}

// Componente de resumen de precio estilo Tesla
function PricingSummary({ 
  currentPrice, 
  finalPrice, 
  donationAmount, 
  configuration, 
  valorMercado,
  formatPrice 
}: { 
  currentPrice: number;
  finalPrice: number;
  donationAmount: number;
  configuration: HabiConfiguration;
  valorMercado: number;
  formatPrice: (price: number) => string;
}) {
  const [showDetails, setShowDetails] = useState(false);

  // Calcular las arras según forma de pago
  const getArras = () => {
    const precioFinal = donationAmount > 0 ? finalPrice : currentPrice;
    switch (configuration.formaPago) {
      case 'contado':
        return precioFinal * 0.10; // 10% de arras
      case '3cuotas':
        return precioFinal / 3; // 1/3 del valor
      case '6cuotas':
        return precioFinal / 6; // 1/6 del valor
      case '9cuotas':
        return precioFinal / 9; // 1/9 del valor
      default:
        return precioFinal * 0.10;
    }
  };

  const arras = getArras();
  const paymentOption = PAYMENT_OPTIONS.find(opt => opt.id === configuration.formaPago);
  const numCuotas = configuration.formaPago === 'contado' ? 1 : parseInt(configuration.formaPago);

  // Costos para el desglose
  const comisionTotal = (valorMercado * COSTOS_PERCENTAGES.comisionTotal) / 100;
  const propertyMensual = (valorMercado * COSTOS_PERCENTAGES.propertyMensual) / 100;
  const gananciaHabi = valorMercado * 0.05;
  const costosTramites = configuration.tramites === 'habi' ? (valorMercado * COSTOS_PERCENTAGES.tramites) / 100 : 0;
  const costosRemodelacion = configuration.remodelacion === 'habi' ? (valorMercado * COSTOS_PERCENTAGES.remodelacion) / 100 : 0;
  const bonificacionPago = paymentOption ? (currentPrice * paymentOption.percentage) / 100 : 0;

  return (
    <div id="cta-final-section" className="px-6 py-6 bg-white border-t border-gray-200">
      {/* Toggle de detalles */}
      <button 
        onClick={() => setShowDetails(!showDetails)}
        className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
      >
        <span>{showDetails ? 'Ocultar detalles' : 'Ver detalles de precio'}</span>
        <svg 
          className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Desglose expandible */}
      {showDetails && (
        <div className="mb-6 pb-6 border-b border-gray-200 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Valor de mercado</span>
            <span className="text-gray-900">{formatPrice(valorMercado)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Comisión Habi (4.4%)</span>
            <span className="text-gray-600">- {formatPrice(comisionTotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Gastos mensuales</span>
            <span className="text-gray-600">- {formatPrice(propertyMensual)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tarifa de servicio (5%)</span>
            <span className="text-gray-600">- {formatPrice(gananciaHabi)}</span>
          </div>
          {costosTramites > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Trámites y notarías</span>
              <span className="text-gray-600">- {formatPrice(costosTramites)}</span>
            </div>
          )}
          {costosRemodelacion > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Reparaciones</span>
              <span className="text-gray-600">- {formatPrice(costosRemodelacion)}</span>
            </div>
          )}
          {bonificacionPago > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Bonificación por cuotas (+{paymentOption?.percentage}%)</span>
              <span className="text-green-600">+ {formatPrice(bonificacionPago)}</span>
            </div>
          )}
          {configuration.tramites === 'cliente' && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Trámites (los pagas tú)</span>
              <span className="text-green-600">+ {formatPrice((valorMercado * COSTOS_PERCENTAGES.tramites) / 100)}</span>
            </div>
          )}
          {configuration.remodelacion === 'cliente' && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Reparaciones (las haces tú)</span>
              <span className="text-green-600">+ {formatPrice((valorMercado * COSTOS_PERCENTAGES.remodelacion) / 100)}</span>
            </div>
          )}
          {donationAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-purple-600">Tu donación</span>
              <span className="text-purple-600">- {formatPrice(donationAmount)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-gray-100">
            <span className="font-medium text-gray-900">Precio estimado</span>
            <span className="font-bold text-gray-900">{formatPrice(donationAmount > 0 ? finalPrice : currentPrice)}</span>
          </div>
        </div>
      )}

      {/* Precio principal */}
      <div className="text-center mb-6">
        <p className="text-sm text-gray-500 mb-1">Precio estimado de compra</p>
        <p className="text-3xl font-bold text-gray-900">
          {formatPrice(donationAmount > 0 ? finalPrice : currentPrice)}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {donationAmount > 0 ? 'Incluye tu donación' : 'Según las opciones seleccionadas'}
        </p>
      </div>

      {/* Arras */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-semibold text-gray-900">Arras al firmar</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {configuration.formaPago === 'contado' 
                ? 'Primer pago (10% del valor)' 
                : `Primera cuota de ${numCuotas}`
              }
            </p>
          </div>
          <p className="text-xl font-bold text-gray-900">{formatPrice(arras)}</p>
        </div>
      </div>

      {/* Botones */}
      <button className="w-full bg-purple-600 text-white py-4 rounded-lg font-medium hover:bg-purple-700 transition mb-3">
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
  );
}

export default function HabiDirectSection({
  configuration,
  setConfiguration,
  currentPrice,
  valorMercado,
  selectedDonation,
  donationAmount,
  onDonationChange,
  onDonationRef
}: HabiDirectSectionProps) {
  const [showServicePopup, setShowServicePopup] = useState(false);
  
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
      <div id="configurator-section" className="p-6 bg-white border-b border-gray-200">
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
      <Modal
        isOpen={showServicePopup}
        onClose={() => setShowServicePopup(false)}
      >
        <div className="px-6 py-8">
          {/* Header sticky */}
          <div className="sticky top-0 z-10 bg-white pt-10 pb-4 px-6 -mx-6 rounded-t-2xl">
            <h2 className="text-3xl font-bold text-gray-900">Tarifa de servicio Habi</h2>
            <p className="text-gray-600 mt-2">Conoce cómo se distribuye nuestra ganancia</p>
          </div>

          {/* Contenido */}
          <div className="space-y-8 mt-6">
            {/* Sección: Qué incluye */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4">¿Qué incluye el 5%?</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">Evaluación y diagnóstico</p>
                    <p className="text-sm text-gray-600">Análisis completo del estado de tu inmueble</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">Gestión de documentos</p>
                    <p className="text-sm text-gray-600">Revisión y preparación de toda la documentación legal</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">Coordinación del proceso</p>
                    <p className="text-sm text-gray-600">Acompañamiento desde la oferta hasta la escrituración</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">Garantía de pago</p>
                    <p className="text-sm text-gray-600">Transferencia segura y en los tiempos acordados</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección: Comparación */}
            <div>
              <h3 className="text-xl font-bold mb-4">Comparado con el mercado</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-purple-50 rounded-2xl p-5 text-center">
                  <p className="text-3xl font-bold text-purple-600">5%</p>
                  <p className="text-sm text-gray-600 mt-1">Tarifa Habi</p>
                </div>
                <div className="bg-gray-100 rounded-2xl p-5 text-center">
                  <p className="text-3xl font-bold text-gray-400">7-10%</p>
                  <p className="text-sm text-gray-600 mt-1">Comisión tradicional</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-4 text-center">
                Ahorras hasta un 5% comparado con una venta tradicional con inmobiliaria
              </p>
            </div>

            {/* Sección: Transparencia */}
            <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-6 border border-purple-100">
              <h3 className="text-xl font-bold mb-2">100% transparente</h3>
              <p className="text-gray-600">
                No hay costos ocultos. El 5% es todo lo que Habi cobra por su servicio. 
                Otros costos como notaría y trámites se muestran por separado y puedes elegir quién los asume.
              </p>
            </div>
          </div>
        </div>
      </Modal>

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

      {/* Asesor Personal */}
      <PersonalAdvisor />

      {/* Donación */}
      <DonationSection 
        selectedDonation={selectedDonation}
        donationAmount={donationAmount}
        onDonationChange={onDonationChange}
        onSectionRef={onDonationRef}
      />

      {/* CTA Final - Estilo Tesla */}
      <PricingSummary 
        currentPrice={currentPrice}
        finalPrice={finalPrice}
        donationAmount={donationAmount}
        configuration={configuration}
        valorMercado={valorMercado}
        formatPrice={formatPrice}
      />
    </>
  );
}

