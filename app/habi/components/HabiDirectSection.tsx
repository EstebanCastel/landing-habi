'use client';

import { useState } from 'react';
import { HabiConfiguration, COSTOS_PERCENTAGES, PAYMENT_OPTIONS } from '../../types/habi';
import DonationSection from './DonationSection';
import PersonalAdvisor from './PersonalAdvisor';
import Modal from './Modal';
import ExpenseCalculator from './calculator/ExpenseCalculator';
import type { HeshCostBreakdown } from '../../api/hesh/route';
import type { HubSpotProperties } from '../../lib/hubspot';
import { analytics } from '../../lib/analytics';

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
  const isAlianza = !isMx && bnplPrices?.quiere_ofertar_alianza?.toLowerCase().trim() === 'si';

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
  
  // Evaluación del inmueble = misma formula que SectionRenderer y HabiDirectSection main
  // base = precio_contado + costos sin utilidad, evaluacion = base / (1 - utilidadPct)
  const precioComiteOriginal = bnplPrices
    ? Number(bnplPrices.precio_comite_original || bnplPrices.precio_comite || 0)
    : 0;
  const isMxSummary = bnplPrices?.country === 'MX';
  const precioContadoSummary = isMxSummary ? precioComiteOriginal : Number(bnplPrices?.precio_comite || 0);
  const costoFinanciacionSummaryBase = costBreakdown ? costBreakdown.tarifaServicio.costoFinanciacion : valorMercado * 0.03;
  const utilidadPctSummaryBase = costBreakdown ? costBreakdown.tarifaServicio.utilidadEsperada : 0.032;
  const baseSummary = costBreakdown && precioContadoSummary > 0
    ? precioContadoSummary + comisionTotal + propertyMensual + costoFinanciacionSummaryBase +
      (costBreakdown.tramites.total) + (costBreakdown.remodelacion.total)
    : valorMercado;
  const evaluacionInmueble = utilidadPctSummaryBase < 1 && baseSummary !== valorMercado
    ? Math.round(baseSummary / (1 - utilidadPctSummaryBase))
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
  
  // Costo de financiacion en PricingSummary (tambien dinamico)
  const costoFinanciacionSummaryHesh = costBreakdown
    ? costBreakdown.tarifaServicio.costoFinanciacion
    : valorMercado * 0.03;
  const utilidadEsperadaSummaryPct = costBreakdown
    ? costBreakdown.tarifaServicio.utilidadEsperada
    : 0.032;
  const bnplDescuentoSummary = (() => {
    if (!bnplPrices || configuration.formaPago === 'contado') return 0;
    const precioBase = Number(bnplPrices.precio_comite || 0);
    if (precioBase === 0) return 0;
    const bnplMap: Record<string, string | undefined> = {
      '3cuotas': bnplPrices.bnpl3,
      '6cuotas': bnplPrices.bnpl6,
      '9cuotas': bnplPrices.bnpl9,
    };
    const precioCuota = Number(bnplMap[configuration.formaPago] || 0);
    return precioCuota > precioBase ? precioCuota - precioBase : 0;
  })();
  const costoFinanciacionSummaryRaw = Math.max(0, costoFinanciacionSummaryHesh - bnplDescuentoSummary);
  const comisionHabiSummaryOriginal = Math.round(evaluacionInmueble * utilidadEsperadaSummaryPct);
  // MX: Comision TuHabi = 1.5% evaluacion + 10,000 MXN
  const comisionHabiSummary = isMxSummary
    ? Math.round(evaluacionInmueble * 0.015 + 10000)
    : (precioComiteOriginal > 0 ? precioComiteOriginal * utilidadEsperadaSummaryPct : valorMercado * utilidadEsperadaSummaryPct);
  const tarifaExtraSummary = isMxSummary
    ? Math.max(0, comisionHabiSummaryOriginal - comisionHabiSummary)
    : 0;
  const costoFinanciacionSummary = costoFinanciacionSummaryRaw + tarifaExtraSummary;
  const financiacionPctSummary = evaluacionInmueble > 0
    ? ((costoFinanciacionSummary / evaluacionInmueble) * 100).toFixed(1)
    : '3.0';
  const comisionHabiPctSummary = evaluacionInmueble > 0
    ? ((comisionHabiSummary / evaluacionInmueble) * 100).toFixed(1)
    : (utilidadEsperadaSummaryPct * 100).toFixed(1);

  return (
    <div id="cta-final-section" className="px-6 py-6 bg-white border-t border-gray-200">
      {/* Toggle de detalles */}
      <button 
        onClick={() => {
          setShowDetails(!showDetails);
          analytics.pricingSummaryToggled(!showDetails, bnplPrices?.country);
        }}
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
            <span className="text-gray-600">Comisiones de venta ({comisionPctSummary}%)</span>
            <span className="text-gray-600">- {formatPrice(comisionTotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Gastos mensuales</span>
            <span className="text-gray-600">- {formatPrice(propertyMensual)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tarifa de servicio ({financiacionPctSummary}%)</span>
            <span className="text-gray-600">- {formatPrice(costoFinanciacionSummary)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Comisión {isMx ? 'TuHabi' : 'Habi'} ({comisionHabiPctSummary}%)</span>
            <span className="text-gray-600">- {formatPrice(comisionHabiSummary)}</span>
          </div>
          {costosTramites > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{isMx ? 'Costos operativos' : 'Trámites y notarías'}</span>
              {isAlianza ? (
                <span className="text-green-600">$0 (incluido)</span>
              ) : (
                <span className="text-gray-600">- {formatPrice(costosTramites)}</span>
              )}
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

      {/* Arras / Primera cuota - Solo para Colombia, no alianza */}
      {!isMx && !isAlianza && (
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
          <p className="text-[10px] text-gray-400 mt-2">
            * Si el inmueble tiene patrimonio de familia con hijo menor de edad, no aplican arras. Se realiza un solo pago al finalizar el proceso.
          </p>
        </div>
      )}

      {/* Alianza: info de pago sin montos */}
      {!isMx && isAlianza && (
        <div className="bg-purple-50 rounded-xl p-4 mb-6 border border-purple-100">
          <p className="font-semibold text-purple-900">Pago de tu inmueble</p>
          <p className="text-xs text-purple-700 mt-1">
            Primero pagamos al banco el saldo de tu hipoteca y luego te pagamos el saldo restante.
          </p>
        </div>
      )}

      {/* Botones */}
      <button 
        onClick={() => {
          analytics.ctaClick('continuar_venta', 'habi_direct_primary', bnplPrices?.country);
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
          analytics.ctaClick('hablar_asesor', 'habi_direct_secondary', bnplPrices?.country);
          if (whatsappAsesor) {
            window.open(whatsappAsesor.startsWith('http') ? whatsappAsesor : `https://wa.me/${whatsappAsesor.replace(/[^\d]/g, '')}`, '_blank');
          }
        }}
        className="w-full bg-white text-purple-600 py-3 rounded-lg font-medium border border-purple-200 hover:bg-purple-50 transition"
      >
        Hablar con mi asesor
      </button>

      <p className="text-xs text-gray-500 text-center mt-6">
        Oferta válida por 24 horas.<br />
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
  const isAlianza = !isMx && bnplPrices?.quiere_ofertar_alianza?.toLowerCase().trim() === 'si';
  
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
  
  const costoFinanciacionHesh = costBreakdown
    ? costBreakdown.tarifaServicio.costoFinanciacion
    : valorMercado * 0.03;
  
  const utilidadEsperadaPct = costBreakdown
    ? costBreakdown.tarifaServicio.utilidadEsperada
    : 0.032;

  const gananciaHabiHesh = costBreakdown
    ? costBreakdown.tarifaServicio.total
    : valorMercado * 0.05;

  // precio_comite_original (se usa para comision Habi y evaluacion)
  const precioComiteOriginalMain = bnplPrices
    ? Number(bnplPrices.precio_comite_original || bnplPrices.precio_comite || 0)
    : 0;

  // Comision Habi (utilidad) se calcula sobre la evaluacion total
  // evaluacion = (base_sin_comisionHabi) / (1 - utilidadPct)
  // comisionHabi = evaluacion * utilidadPct

  // Costo financiacion dinamico: al pagar a cuotas, el % extra sobre precio_comite se descuenta de la tarifa
  const bnplDescuento = (() => {
    if (!bnplPrices || configuration.formaPago === 'contado') return 0;
    const precioBase = Number(bnplPrices.precio_comite || 0);
    if (precioBase === 0) return 0;
    const bnplMap: Record<string, string | undefined> = {
      '3cuotas': bnplPrices.bnpl3,
      '6cuotas': bnplPrices.bnpl6,
      '9cuotas': bnplPrices.bnpl9,
    };
    const precioCuota = Number(bnplMap[configuration.formaPago] || 0);
    return precioCuota > precioBase ? precioCuota - precioBase : 0;
  })();
  const costoFinanciacionDinamico = Math.max(0, costoFinanciacionHesh - bnplDescuento);

  // Periodo estimado de venta en meses (para MX, basado en AMS del HESH)
  const periodoMeses = Math.ceil((costBreakdown?.tarifaServicio.ams || 90) / 30);

  // Evaluacion siempre usa precio de 1 cuota (contado), no cambia con cuotas
  // MX: precio_comite_original (precio base algoritmo)
  // CO: precio_comite (precio de contado / 1 cuota)
  const precioContadoCO = bnplPrices ? Number(bnplPrices.precio_comite || 0) : currentPrice;
  const precioBaseEvaluacion = isMx ? precioComiteOriginalMain : precioContadoCO;
  const baseSinComisionHabi = costBreakdown && precioBaseEvaluacion > 0
    ? precioBaseEvaluacion + comisionTotal + propertyMensual + costoFinanciacionHesh + costosTramites + costosRemodelacion
    : valorMercado;
  
  // Evaluacion = base / (1 - utilidadPct), comisionHabi = evaluacion * utilidadPct
  const evaluacionMain = utilidadEsperadaPct < 1
    ? Math.round(baseSinComisionHabi / (1 - utilidadEsperadaPct))
    : baseSinComisionHabi;
  const comisionHabiOriginal = evaluacionMain - baseSinComisionHabi;

  // Delta de negociacion: si currentPrice > precioBase, la comision Habi se reduce
  const deltaNegociacion = currentPrice - precioBaseEvaluacion;
  
  // MX: Comision TuHabi = 1.5% evaluacion + 10,000 MXN. Diferencia va a tarifa de servicio.
  // CO: comision original - delta negociacion (puede ser negativa)
  const comisionHabiUtilidad = isMx
    ? Math.round(evaluacionMain * 0.015 + 10000)
    : comisionHabiOriginal - deltaNegociacion;
  const comisionHabiNegativa = !isMx && comisionHabiUtilidad < 0;
  const tarifaServicioExtra = isMx
    ? Math.max(0, comisionHabiOriginal - comisionHabiUtilidad)
    : 0;
  const costoFinanciacionDisplay = costoFinanciacionDinamico + tarifaServicioExtra;

  // Costos fijos (sin comision Habi ni financiacion)
  const hayComercialMain = bnplPrices?.bnpl_1_comercial_raw != null;
  const costosFijosMain = comisionTotal + propertyMensual + costosTramites + costosRemodelacion;
  const gananciaHabi = hayComercialMain && costBreakdown
    ? Math.max(0, evaluacionMain - currentPrice - costosFijosMain - comisionHabiUtilidad)
    : costoFinanciacionHesh;

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
  const financiacionPct = evaluacionMain > 0
    ? ((costoFinanciacionDisplay / evaluacionMain) * 100).toFixed(1)
    : '3.0';
  const comisionHabiPct = evaluacionMain > 0
    ? ((comisionHabiUtilidad / evaluacionMain) * 100).toFixed(1)
    : (utilidadEsperadaPct * 100).toFixed(1);

  return (
    <>
      {/* SECCIÓN INICIAL: Así se construye tu oferta */}
      <div id="configurator-section" className="p-6 bg-white border-b border-gray-200">
        <h3 className="text-xl font-bold mb-2">Así se construye tu oferta</h3>
        <p className="text-sm text-gray-600 mb-6">
          Conoce los gastos asociados a tu inmueble. En {isMx ? 'TuHabi' : 'Habi'} queremos ser transparentes contigo en cada paso del proceso.
        </p>

        <div className="space-y-4">
          {/* Comisiones de venta (Brokers) */}
          <div className="flex justify-between items-start pb-3 border-b border-gray-100">
            <div className="flex-1">
              <p className="font-medium text-sm mb-2">Comisiones de venta</p>
              <p className="text-xs text-gray-600 mb-1">
                Comisiones de intermediación para vender tu inmueble ({comisionPct}%).
              </p>
              <p className="text-xs text-gray-500">
                En una venta tradicional pagarías entre 3% y 5%.
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
              {isMx ? (
                <>
                  <p className="text-xs text-gray-600 mb-1">
                    Monto total correspondiente al periodo estimado de venta ({periodoMeses} meses).
                  </p>
                  <p className="text-xs text-gray-500 mb-2">
                    Este cobro se realiza por adelantado y refleja los gastos que asumirías durante ese tiempo.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs text-gray-600 mb-1">
                    Administración y servicios del inmueble durante el proceso de venta.
                  </p>
                  <p className="text-xs text-gray-500 mb-2">
                    Estos gastos existen incluso si vendes por tu cuenta.<br />
                    {isMx ? 'TuHabi' : 'Habi'} se encarga desde {isAlianza ? 'la entrega del inmueble' : 'el momento de la escritura'}.
                  </p>
                  <button
                    onClick={() => { setShowExpenseCalculator(true); analytics.calculatorOpened(bnplPrices?.country); }}
                    className="text-xs text-purple-600 font-medium hover:text-purple-700 transition"
                  >
                    Ver más →
                  </button>
                </>
              )}
            </div>
            <div className="text-right ml-4">
              <p className="font-semibold">{formatPrice(propertyMensual)}</p>
              <p className="text-xs text-gray-500">{propertyPct}%</p>
            </div>
          </div>

          {/* Tarifa de servicio (costos operativos) */}
          <div className="flex justify-between items-start pb-3 border-b border-gray-100">
            <div className="flex-1">
              <p className="font-medium text-sm mb-2">Tarifa de servicio</p>
              {isAlianza ? (
                <p className="text-xs text-gray-600 mb-1">
                  Incluye trámites bancarios, levantamiento de gravámenes y todos los costos operativos asociados al proceso de compra y venta.
                </p>
              ) : (
                <p className="text-xs text-gray-600 mb-1">
                  Costos operativos asociados al proceso de compra y venta del inmueble.
                </p>
              )}
            </div>
            <div className="text-right ml-4">
              <p className="font-semibold">{formatPrice(isAlianza ? costoFinanciacionDisplay + costosTramites : costoFinanciacionDisplay)}</p>
              <p className="text-xs text-gray-500">{isAlianza
                ? (evaluacionMain > 0 ? (((costoFinanciacionDisplay + costosTramites) / evaluacionMain) * 100).toFixed(1) : financiacionPct)
                : financiacionPct}%</p>
            </div>
          </div>

          {/* Comisión Habi (utilidad) */}
          <div className="flex justify-between items-start pb-3 border-b border-gray-100">
            <div className="flex-1">
              <p className="font-medium text-sm mb-2">Comisión {isMx ? 'TuHabi' : 'Habi'}</p>
              <p className="text-xs text-gray-600 mb-1">
                {isMx
                  ? <>Comisión del <strong>1.5%</strong> + servicios profesionales.</>
                  : comisionHabiNegativa
                    ? <>{isMx ? 'TuHabi' : 'Habi'} asume el riesgo de mercado para facilitar la compra de tu inmueble, cediendo su margen de ganancia ante la incertidumbre de venta.</>
                    : <>Ganancia de {isMx ? 'TuHabi' : 'Habi'} del <strong>{comisionHabiPct}%</strong> por la compra de tu inmueble.</>
                }
              </p>
            </div>
            <div className="text-right ml-4">
              {comisionHabiNegativa ? (
                <>
                  <p className="font-semibold text-red-600">{formatPrice(comisionHabiUtilidad)}</p>
                  <p className="text-xs text-red-400">{comisionHabiPct}%</p>
                </>
              ) : (
                <>
                  <p className="font-semibold">{formatPrice(comisionHabiUtilidad)}</p>
                  <p className="text-xs text-gray-500">{comisionHabiPct}%</p>
                </>
              )}
            </div>
          </div>

          {/* Trámites y notarías / Costos operativos */}
          <div className="flex justify-between items-start pb-3 border-b border-gray-100">
            <div className="flex-1">
              <p className="font-medium text-sm mb-2">
                {isMx ? 'Costos operativos' : 'Trámites y notarías'}
              </p>
              {isAlianza ? (
                <>
                  <p className="text-xs text-green-600 font-medium mb-1">
                    Te estás ahorrando {formatPrice(costosTramites)} en costos de trámites y notarías.
                  </p>
                  <p className="text-xs text-gray-500">
                    Gastos legales y notariales que Habi asume por ti gracias a nuestras alianzas.
                  </p>
                </>
              ) : (
                <p className="text-xs text-gray-600 mb-1">
                  {isMx
                    ? 'Gastos operativos asociados al proceso de compra del inmueble.'
                    : 'Gastos legales y notariales asociados a la compraventa del inmueble.'}
                </p>
              )}
            </div>
            <div className="text-right ml-4">
              {isAlianza ? (
                <>
                  <p className="font-semibold text-green-600">$0</p>
                  <p className="text-xs text-green-500 line-through">{formatPrice(costosTramites)}</p>
                </>
              ) : (
                <>
                  <p className="font-semibold">{formatPrice(costosTramites)}</p>
                  <p className="text-xs text-gray-500">{tramitesPct}%</p>
                </>
              )}
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
                onClick={() => { setConfiguration({ ...configuration, tramites: 'habi' }); analytics.costToggleChanged('tramites', 'habi', bnplPrices?.country); }}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                  configuration.tramites === 'habi'
                    ? 'border-purple-200 bg-gradient-to-br from-purple-50 to-transparent'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{isMx ? 'TuHabi' : 'Habi'} se encarga</span>
                  {configuration.tramites === 'habi' && (
                    <span className="text-sm text-purple-600">✓</span>
                  )}
                </div>
                <p className="text-xs text-gray-600">
                  Tú no haces pagos ni trámites adicionales.
                </p>
              </button>

              <button
                onClick={() => { setConfiguration({ ...configuration, tramites: 'cliente' }); analytics.costToggleChanged('tramites', 'cliente', bnplPrices?.country); }}
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
                onClick={() => { setConfiguration({ ...configuration, remodelacion: 'habi' }); analytics.costToggleChanged('remodelacion', 'habi', bnplPrices?.country); }}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                  configuration.remodelacion === 'habi'
                    ? 'border-purple-200 bg-gradient-to-br from-purple-50 to-transparent'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{isMx ? 'TuHabi' : 'Habi'} se encarga</span>
                  {configuration.remodelacion === 'habi' && (
                    <span className="text-sm text-purple-600">✓</span>
                  )}
                </div>
                <p className="text-xs text-gray-600">
                  Compramos tu inmueble tal como está.
                </p>
              </button>

              <button
                onClick={() => { setConfiguration({ ...configuration, remodelacion: 'cliente' }); analytics.costToggleChanged('remodelacion', 'cliente', bnplPrices?.country); }}
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
      <PersonalAdvisor whatsappAsesor={whatsappAsesor} country={bnplPrices?.country} />

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
            country={bnplPrices?.country}
          />
        </div>
      </Modal>
    </>
  );
}

