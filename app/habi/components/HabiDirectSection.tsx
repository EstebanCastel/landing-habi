'use client';

import { useState } from 'react';
import { HabiConfiguration, COSTOS_PERCENTAGES, PAYMENT_OPTIONS } from '../../types/habi';
import DonationSection from './DonationSection';
import PersonalAdvisor from './PersonalAdvisor';
import Modal from './Modal';
import ExpenseCalculator from './calculator/ExpenseCalculator';
import type { HeshCostBreakdown } from '../../api/hesh/route';
import type { HubSpotProperties } from '../../lib/hubspot';

interface HabiDirectSectionProps {
  configuration: HabiConfiguration;
  setConfiguration: (config: HabiConfiguration) => void;
  currentPrice: number;
  valorMercado: number;
  selectedDonation: string;
  donationAmount: number;
  onDonationChange: (optionId: string, amount: number) => void;
  onDonationRef?: (ref: HTMLDivElement | null) => void;
  whatsappAsesor?: string;
  costBreakdown?: HeshCostBreakdown | null;
  showCostToggles?: boolean;
  showDonation?: boolean;
  bnplPrices?: HubSpotProperties | null;
}

// Componente de resumen de precio estilo Tesla
function PricingSummary({ 
  currentPrice, 
  finalPrice, 
  donationAmount, 
  configuration, 
  valorMercado,
  formatPrice,
  whatsappAsesor,
  costBreakdown,
  bnplPrices
}: { 
  currentPrice: number;
  finalPrice: number;
  donationAmount: number;
  configuration: HabiConfiguration;
  valorMercado: number;
  formatPrice: (price: number) => string;
  whatsappAsesor?: string;
  costBreakdown?: HeshCostBreakdown;
  bnplPrices?: HubSpotProperties | null;
}) {
  const [showDetails, setShowDetails] = useState(false);

  // Determinar si hay BNPL disponible (cuotas)
  const hasBnpl = bnplPrices
    ? Number(bnplPrices.bnpl3 || 0) > 0 || Number(bnplPrices.bnpl6 || 0) > 0 || Number(bnplPrices.bnpl9 || 0) > 0
    : false;
  
  // Detectar si es México (no tiene arras)
  const isMx = bnplPrices?.country === 'MX';

  // Calcular las arras según forma de pago
  const getArras = () => {
    const precioFinal = donationAmount > 0 ? finalPrice : currentPrice;
    if (!hasBnpl) {
      // Sin BNPL: arras = 10% del precio_comite
      return precioFinal * 0.10;
    }
    switch (configuration.formaPago) {
      case 'contado':
        return precioFinal * 0.10;
      case '3cuotas':
        return precioFinal / 3;
      case '6cuotas':
        return precioFinal / 6;
      case '9cuotas':
        return precioFinal / 9;
      default:
        return precioFinal * 0.10;
    }
  };

  const arras = getArras();
  const paymentOption = PAYMENT_OPTIONS.find(opt => opt.id === configuration.formaPago);
  const numCuotas = configuration.formaPago === 'contado' ? 1 : parseInt(configuration.formaPago);

  // Costos fijos - usar HESH si disponible (estos NUNCA cambian)
  const comisionTotal = costBreakdown
    ? costBreakdown.comision.total
    : (valorMercado * COSTOS_PERCENTAGES.comisionTotal) / 100;
  const propertyMensual = costBreakdown
    ? costBreakdown.gastosMensuales.total
    : (valorMercado * COSTOS_PERCENTAGES.propertyMensual) / 100;
  const gananciaHabiHesh = costBreakdown
    ? costBreakdown.tarifaServicio.total
    : valorMercado * 0.05;
  const costosTramites = configuration.tramites === 'habi' 
    ? (costBreakdown ? costBreakdown.tramites.total : (valorMercado * COSTOS_PERCENTAGES.tramites) / 100)
    : 0;
  const costosRemodelacion = configuration.remodelacion === 'habi' 
    ? (costBreakdown ? costBreakdown.remodelacion.total : (valorMercado * COSTOS_PERCENTAGES.remodelacion) / 100)
    : 0;
  // Solo mostrar bonificación si tiene BNPL y está en cuotas (no contado)
  const bonificacionPago = (hasBnpl && paymentOption && configuration.formaPago !== 'contado')
    ? (currentPrice * paymentOption.percentage) / 100
    : 0;
  
  // Evaluación del inmueble = precio_comite_ORIGINAL + TODOS los costos HESH (constante)
  // Siempre usa el precio del comité original (no el negociado) para la evaluación
  const precioComiteOriginal = bnplPrices
    ? Number(bnplPrices.precio_comite_original || bnplPrices.precio_comite || 0)
    : 0;
  const evaluacionInmueble = costBreakdown && precioComiteOriginal > 0
    ? precioComiteOriginal + comisionTotal + propertyMensual + gananciaHabiHesh +
      (costBreakdown.tramites.total) + (costBreakdown.remodelacion.total)
    : valorMercado;

  // Tarifa de servicio: condicional según si el comercial negoció
  // Si bnpl_1_comercial_raw existe → recalcular como residual
  // Si no existe → usar valor HESH fijo
  const hayComercial = bnplPrices?.bnpl_1_comercial_raw != null;
  const costosFijos = comisionTotal + propertyMensual +
    (costBreakdown ? costBreakdown.tramites.total : (valorMercado * COSTOS_PERCENTAGES.tramites) / 100) +
    (costBreakdown ? costBreakdown.remodelacion.total : (valorMercado * COSTOS_PERCENTAGES.remodelacion) / 100);
  
  const gananciaHabi = hayComercial && costBreakdown
    ? Math.max(0, evaluacionInmueble - currentPrice - costosFijos)
    : gananciaHabiHesh;

  const comisionPctSummary = evaluacionInmueble > 0
    ? ((comisionTotal / evaluacionInmueble) * 100).toFixed(1)
    : COSTOS_PERCENTAGES.comisionTotal.toString();
  const utilidadPctSummary = evaluacionInmueble > 0 && hayComercial && costBreakdown
    ? ((gananciaHabi / evaluacionInmueble) * 100).toFixed(1)
    : (costBreakdown ? (costBreakdown.tarifaServicio.utilidadEsperada * 100).toFixed(1) : '5');

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
            <span className="text-gray-900">{formatPrice(evaluacionInmueble)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Comisión Habi ({comisionPctSummary}%)</span>
            <span className="text-gray-600">- {formatPrice(comisionTotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Gastos mensuales</span>
            <span className="text-gray-600">- {formatPrice(propertyMensual)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tarifa de servicio ({utilidadPctSummary}%)</span>
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

      {/* Arras / Primera cuota - Solo para Colombia */}
      {!isMx && (
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-gray-900">
                {hasBnpl && configuration.formaPago !== 'contado'
                  ? 'Pago primera cuota al escriturar'
                  : 'Arras al firmar'
                }
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {hasBnpl && configuration.formaPago !== 'contado'
                  ? `Recibirás ${numCuotas} pagos iguales`
                  : 'Primer pago (10% del valor)'
                }
              </p>
            </div>
            <p className="text-xl font-bold text-gray-900">{formatPrice(arras)}</p>
          </div>
        </div>
      )}

      {/* Botones */}
      <button 
        onClick={() => {
          if (whatsappAsesor) {
            window.open(whatsappAsesor.startsWith('http') ? whatsappAsesor : `https://wa.me/${whatsappAsesor.replace(/[^\d]/g, '')}`, '_blank');
          }
        }}
        className="w-full bg-purple-600 text-white py-4 rounded-lg font-medium hover:bg-purple-700 transition mb-3"
      >
        Continuar con la venta
      </button>

      <button 
        onClick={() => {
          if (whatsappAsesor) {
            window.open(whatsappAsesor.startsWith('http') ? whatsappAsesor : `https://wa.me/${whatsappAsesor.replace(/[^\d]/g, '')}`, '_blank');
          }
        }}
        className="w-full bg-white text-purple-600 py-3 rounded-lg font-medium border border-purple-200 hover:bg-purple-50 transition"
      >
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
  onDonationRef,
  whatsappAsesor,
  costBreakdown,
  showCostToggles = false,
  showDonation = true,
  bnplPrices,
}: HabiDirectSectionProps) {
  const [showExpenseCalculator, setShowExpenseCalculator] = useState(false);
  const isMx = bnplPrices?.country === 'MX';
  
  // Precio final con donación descontada
  const finalPrice = currentPrice - donationAmount;
  const formatPrice = (price: number) => {
    return `$ ${Math.round(price).toLocaleString('es-CO')}`;
  };

  // Costos fijos de HESH (nunca cambian)
  const comisionTotal = costBreakdown
    ? costBreakdown.comision.total
    : (valorMercado * COSTOS_PERCENTAGES.comisionTotal) / 100;
  
  const propertyMensual = costBreakdown
    ? costBreakdown.gastosMensuales.total
    : (valorMercado * COSTOS_PERCENTAGES.propertyMensual) / 100;
  
  const costosRemodelacion = costBreakdown
    ? costBreakdown.remodelacion.total
    : (valorMercado * COSTOS_PERCENTAGES.remodelacion) / 100;
  
  const costosTramites = costBreakdown
    ? costBreakdown.tramites.total
    : (valorMercado * COSTOS_PERCENTAGES.tramites) / 100;
  
  const gananciaHabiHesh = costBreakdown
    ? costBreakdown.tarifaServicio.total
    : valorMercado * 0.05;

  // Evaluación del inmueble (constante) = precio_comite_ORIGINAL + todos los costos HESH
  const precioComiteOriginalMain = bnplPrices
    ? Number(bnplPrices.precio_comite_original || bnplPrices.precio_comite || 0)
    : 0;
  const evaluacionMain = costBreakdown && precioComiteOriginalMain > 0
    ? precioComiteOriginalMain + comisionTotal + propertyMensual + gananciaHabiHesh + costosTramites + costosRemodelacion
    : valorMercado;

  // Tarifa de servicio: residual si el comercial negoció, fija si no
  const hayComercialMain = bnplPrices?.bnpl_1_comercial_raw != null;
  const costosFijosMain = comisionTotal + propertyMensual + costosTramites + costosRemodelacion;
  const gananciaHabi = hayComercialMain && costBreakdown
    ? Math.max(0, evaluacionMain - currentPrice - costosFijosMain)
    : gananciaHabiHesh;

  // Calcular porcentajes reales
  const askPrice = costBreakdown?.askPrice || valorMercado;
  const comisionPct = costBreakdown
    ? ((costBreakdown.comision.total / askPrice) * 100).toFixed(1)
    : COSTOS_PERCENTAGES.comisionTotal.toString();
  const propertyPct = costBreakdown
    ? ((costBreakdown.gastosMensuales.total / askPrice) * 100).toFixed(1)
    : COSTOS_PERCENTAGES.propertyMensual.toString();
  const remodelacionPct = costBreakdown
    ? ((costBreakdown.remodelacion.total / askPrice) * 100).toFixed(1)
    : COSTOS_PERCENTAGES.remodelacion.toString();
  const tramitesPct = costBreakdown
    ? ((costBreakdown.tramites.total / askPrice) * 100).toFixed(1)
    : COSTOS_PERCENTAGES.tramites.toString();
  const utilidadPct = evaluacionMain > 0 && hayComercialMain && costBreakdown
    ? ((gananciaHabi / evaluacionMain) * 100).toFixed(1)
    : (costBreakdown ? (costBreakdown.tarifaServicio.utilidadEsperada * 100).toFixed(1) : '5');

  return (
    <>
      {/* SECCIÓN INICIAL: Así se construye tu oferta */}
      <div id="configurator-section" className="p-6 bg-white border-b border-gray-200">
        <h3 className="text-xl font-bold mb-2">Así se construye tu oferta</h3>
        <p className="text-sm text-gray-600 mb-6">
          Elige qué quieres que {isMx ? 'Tu Habi' : 'Habi'} se encargue y cómo prefieres recibir tu dinero.
        </p>

        <div className="space-y-4">
          {/* Comisión */}
          <div className="flex justify-between items-start pb-3 border-b border-gray-100">
            <div className="flex-1">
              <p className="font-medium text-sm mb-2">Comisión {isMx ? 'Tu Habi' : 'Habi'}</p>
              <p className="text-xs text-gray-600 mb-1">
                Comisión total del <strong>{comisionPct}%</strong>.
              </p>
              <p className="text-xs text-gray-500">
                En una venta tradicional pagarías entre 5% y 7%.
              </p>
            </div>
            <div className="text-right ml-4">
              <p className="font-semibold">{formatPrice(comisionTotal)}</p>
              <p className="text-xs text-gray-500">{comisionPct}%</p>
            </div>
          </div>

          {/* Gastos mensuales del inmueble */}
          <div className="flex justify-between items-start pb-3 border-b border-gray-100">
            <div className="flex-1">
              <p className="font-medium text-sm mb-2">Gastos mensuales del inmueble</p>
              <p className="text-xs text-gray-600 mb-1">
                Administración y servicios del inmueble durante el proceso de venta.
              </p>
              <p className="text-xs text-gray-500 mb-2">
                Estos gastos existen incluso si vendes por tu cuenta.<br />
                {isMx ? 'Tu Habi' : 'Habi'} los asume por ti desde el inicio.
              </p>
              {!isMx && (
                <button
                  onClick={() => setShowExpenseCalculator(true)}
                  className="text-xs text-purple-600 font-medium hover:text-purple-700 transition"
                >
                  Ver más →
                </button>
              )}
            </div>
            <div className="text-right ml-4">
              <p className="font-semibold">{formatPrice(propertyMensual)}</p>
              <p className="text-xs text-gray-500">{propertyPct}%</p>
            </div>
          </div>

          {/* Tarifa de servicio Habi */}
          <div className="flex justify-between items-start pb-3 border-b border-gray-100">
            <div className="flex-1">
              <p className="font-medium text-sm mb-2">Tarifa de servicio {isMx ? 'Tu Habi' : 'Habi'}</p>
              <p className="text-xs text-gray-600 mb-1">
                {isMx ? 'Tu Habi' : 'Habi'} obtiene una ganancia del <strong>{utilidadPct}%</strong> sobre el valor de venta del inmueble.
              </p>
            </div>
            <div className="text-right ml-4">
              <p className="font-semibold">{formatPrice(gananciaHabi)}</p>
              <p className="text-xs text-gray-500">{utilidadPct}%</p>
            </div>
          </div>

          {/* Trámites y notarías - Informativo */}
          <div className="flex justify-between items-start pb-3 border-b border-gray-100">
            <div className="flex-1">
              <p className="font-medium text-sm mb-2">Trámites y notarías</p>
              <p className="text-xs text-gray-600 mb-1">
                Gastos legales y notariales asociados a la compraventa del inmueble.
              </p>
            </div>
            <div className="text-right ml-4">
              <p className="font-semibold">{formatPrice(costosTramites)}</p>
              <p className="text-xs text-gray-500">{tramitesPct}%</p>
            </div>
          </div>

          {/* Estado del inmueble (Remodelaciones) - Informativo */}
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="font-medium text-sm mb-2">Estado del inmueble</p>
              <p className="text-xs text-gray-600 mb-1">
                Costo estimado de remodelaciones y mejoras recomendadas para la venta.
              </p>
            </div>
            <div className="text-right ml-4">
              <p className="font-semibold">{formatPrice(costosRemodelacion)}</p>
              <p className="text-xs text-gray-500">{remodelacionPct}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================
         SECCIONES DE TOGGLE: Trámites y Remodelación
         Controlado desde sections.json → showCostToggles: true/false
         Cuando están activas, el usuario puede elegir "Yo los pago"
         para obtener un mayor precio de compra.
         ================================================================ */}
      {showCostToggles && (
        <>
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
                  <span className="font-medium">{isMx ? 'Tu Habi' : 'Habi'} se encarga</span>
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
                      +{tramitesPct}%
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
                  Costo estimado: {formatPrice(costosTramites)}
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
                  <span className="font-medium">{isMx ? 'Tu Habi' : 'Habi'} se encarga</span>
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
                      +{remodelacionPct}%
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
        </>
      )}

      {/* Asesor Personal */}
      <PersonalAdvisor whatsappAsesor={whatsappAsesor} />

      {/* Donación */}
      {showDonation && (
        <DonationSection 
          selectedDonation={selectedDonation}
          donationAmount={donationAmount}
          onDonationChange={onDonationChange}
          onSectionRef={onDonationRef}
        />
      )}

      {/* CTA Final - Estilo Tesla */}
      <PricingSummary 
        currentPrice={currentPrice}
        finalPrice={finalPrice}
        donationAmount={donationAmount}
        configuration={configuration}
        valorMercado={valorMercado}
        formatPrice={formatPrice}
        whatsappAsesor={whatsappAsesor}
        costBreakdown={costBreakdown || undefined}
        bnplPrices={bnplPrices}
      />

      {/* Modal de Calculadora de Gastos */}
      <Modal
        isOpen={showExpenseCalculator}
        onClose={() => setShowExpenseCalculator(false)}
      >
        <div className="max-h-[85vh] overflow-y-auto">
          <ExpenseCalculator 
            initialPropertyValue={valorMercado}
            habiOfferValue={currentPrice}
            bnpl9Value={bnplPrices?.bnpl9 ? Number(bnplPrices.bnpl9) : 0}
          />
        </div>
      </Modal>
    </>
  );
}

