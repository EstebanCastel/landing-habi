'use client';

import { useState, useMemo } from 'react';
import { HabiConfiguration, COSTOS_PERCENTAGES } from '../../types/habi';

// Tipos de crédito genéricos (sin nombres de instituciones)
const CREDIT_OPTIONS = [
  { product: 'Crédito de Nómina', minRate: 25, maxRate: 44 },
  { product: 'Crédito Personal', minRate: 22, maxRate: 45 },
  { product: 'Crédito de Consumo', minRate: 30, maxRate: 50 },
  { product: 'Tarjeta de Crédito', minRate: 45, maxRate: 90 },
  { product: 'Crédito de Libre Inversión', minRate: 28, maxRate: 48 },
];

// Componente de icono de ayuda
function HelpIcon({ title }: { title: string }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold cursor-pointer hover:bg-purple-700 transition-all"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        ?
      </div>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-xs w-48 text-center z-50 mb-2 shadow-lg">
          {title}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}

interface LiquiditySectionProps {
  configuration: HabiConfiguration;
  valorMercado: number;
}

export default function LiquiditySection({ configuration, valorMercado }: LiquiditySectionProps) {
  // Calcular la oferta Habi
  const ofertaHabi = useMemo(() => {
    let precioBase = valorMercado * 0.782;
    if (configuration.tramites === 'cliente') {
      precioBase += (valorMercado * COSTOS_PERCENTAGES.tramites) / 100;
    }
    if (configuration.remodelacion === 'cliente') {
      precioBase += (valorMercado * COSTOS_PERCENTAGES.remodelacion) / 100;
    }
    return precioBase;
  }, [valorMercado, configuration]);

  const [amountNeeded, setAmountNeeded] = useState<number>(0);
  const [selectedCredit, setSelectedCredit] = useState<number>(0);
  const [loanTermMonths, setLoanTermMonths] = useState<number>(24);
  const [customRate, setCustomRate] = useState<string>(''); // Tasa personalizada (opcional)

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString('es-CO')}`;
  };

  const formatPercent = (percent: number) => {
    return `${percent.toFixed(1)}%`;
  };

  // Cálculos
  const calculations = useMemo(() => {
    const credit = CREDIT_OPTIONS[selectedCredit];
    
    // Si hay tasa personalizada, usarla; sino, usar el promedio del rango
    const rateToUse = customRate && parseFloat(customRate) > 0 
      ? parseFloat(customRate) 
      : (credit.minRate + credit.maxRate) / 2;
    
    const monthlyRate = rateToUse / 100 / 12;

    const monthlyPayment =
      amountNeeded *
      (monthlyRate * Math.pow(1 + monthlyRate, loanTermMonths)) /
      (Math.pow(1 + monthlyRate, loanTermMonths) - 1);

    const totalPayment = monthlyPayment * loanTermMonths;
    const totalInterest = totalPayment - amountNeeded;

    const habiCost = valorMercado - ofertaHabi;
    const creditCost = totalInterest;
    const savings = creditCost - habiCost;

    return {
      rateUsed: rateToUse,
      monthlyPayment,
      totalPayment,
      totalInterest,
      habiCost,
      creditCost,
      savings,
    };
  }, [amountNeeded, selectedCredit, loanTermMonths, valorMercado, ofertaHabi, customRate]);

  return (
    <div id="liquidity-section" className="bg-white border-b border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Simulador de Liquidez</h3>
          <p className="text-sm text-gray-500">Compara créditos vs vender con Habi</p>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="p-6">
        {/* Descripción */}
        <div className="mb-6">
          <h4 className="text-base font-semibold text-gray-900 mb-2">¿Necesitas liquidez inmediata?</h4>
          <p className="text-sm text-gray-600">
            Compara el costo real de solicitar un crédito vs vender tu inmueble con Habi.
          </p>
        </div>

        {/* Card de inputs */}
        <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-xl p-5 mb-6">
          {/* Monto necesario */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-semibold text-gray-700">¿Cuánto dinero necesitas?</label>
              <HelpIcon title="Indica el monto de liquidez que necesitas obtener." />
            </div>
            <div className="relative">
              <input
                type="text"
                value={amountNeeded > 0 ? `$ ${amountNeeded.toLocaleString('es-CO')}` : ''}
                placeholder="Ej: $10.000.000"
                onChange={(e) => {
                  const value = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                  setAmountNeeded(Math.min(value, ofertaHabi));
                }}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-lg font-semibold text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all placeholder:text-gray-400 placeholder:font-normal"
              />
            </div>
          </div>

          {/* Plazo */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-semibold text-gray-700">Plazo del crédito</label>
              <HelpIcon title="El tiempo en meses para pagar el crédito." />
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={6}
                max={60}
                step={6}
                value={loanTermMonths}
                onChange={(e) => setLoanTermMonths(parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <span className="text-lg font-bold text-purple-600 min-w-[80px] text-right">
                {loanTermMonths} meses
              </span>
            </div>
          </div>

          {/* Tipo de crédito */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-semibold text-gray-700">Tipo de crédito</label>
              <HelpIcon title="Selecciona el tipo de crédito que usarías." />
            </div>
            <select
              value={selectedCredit}
              onChange={(e) => {
                setSelectedCredit(parseInt(e.target.value));
                setCustomRate(''); // Limpiar tasa personalizada al cambiar de tipo
              }}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all bg-white"
            >
              {CREDIT_OPTIONS.map((credit, index) => (
                <option key={index} value={index}>
                  {credit.product} ({credit.minRate}% - {credit.maxRate}%)
                </option>
              ))}
            </select>
          </div>

          {/* Tasa exacta (opcional) */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-semibold text-gray-700">Tu tasa exacta</label>
              <span className="text-xs text-gray-400">(opcional)</span>
              <HelpIcon title="Si conoces tu tasa exacta, ingrésala aquí para un cálculo más preciso. Si no, usaremos el promedio del rango." />
            </div>
            <div className="relative">
              <input
                type="text"
                value={customRate}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9.]/g, '');
                  if (value === '' || (parseFloat(value) >= 0 && parseFloat(value) <= 150)) {
                    setCustomRate(value);
                  }
                }}
                placeholder={`Promedio: ${((CREDIT_OPTIONS[selectedCredit].minRate + CREDIT_OPTIONS[selectedCredit].maxRate) / 2).toFixed(1)}%`}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all placeholder-gray-400"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">% anual</span>
            </div>
            {!customRate && (
              <p className="text-xs text-gray-400 mt-1">
                Usando el promedio del rango: {formatPercent((CREDIT_OPTIONS[selectedCredit].minRate + CREDIT_OPTIONS[selectedCredit].maxRate) / 2)}
              </p>
            )}
          </div>
        </div>

        {/* Comparación lado a lado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Crédito de Consumo */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs uppercase tracking-widest font-bold text-gray-500">
                Crédito de Consumo
              </h4>
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Monto solicitado</span>
                <span className="font-semibold text-gray-900">{formatPrice(amountNeeded)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Tasa de interés</span>
                <span className="font-semibold text-gray-900">{formatPercent(calculations.rateUsed)} anual</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Pago mensual</span>
                <span className="font-semibold text-gray-900">
                  {formatPrice(Math.round(calculations.monthlyPayment))}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Total a pagar</span>
                <span className="font-bold text-gray-900">
                  {formatPrice(Math.round(calculations.totalPayment))}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm font-semibold text-red-600">Intereses totales</span>
                <span className="font-bold text-red-600 text-lg">
                  {formatPrice(Math.round(calculations.totalInterest))}
                </span>
              </div>
            </div>
          </div>

          {/* Vender con Habi */}
          <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-5 relative">
            <div className="absolute -top-3 right-4">
              <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                Recomendado
              </span>
            </div>

            <div className="flex items-center justify-between mb-4 mt-1">
              <h4 className="text-xs uppercase tracking-widest font-bold text-purple-700">Vender con Habi</h4>
              <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-purple-200">
                <span className="text-sm text-gray-600">Valor de mercado</span>
                <span className="font-semibold text-gray-900">{formatPrice(valorMercado)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-purple-200">
                <span className="text-sm text-gray-600">Oferta Habi</span>
                <span className="font-semibold text-purple-700">{formatPrice(ofertaHabi)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-purple-200">
                <span className="text-sm text-gray-600">Recibes en</span>
                <span className="font-semibold text-green-600">7-15 días</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-purple-200">
                <span className="text-sm text-gray-600">Total que recibes</span>
                <span className="font-bold text-purple-700">{formatPrice(ofertaHabi)}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm font-semibold text-purple-600">Descuento vs mercado</span>
                <span className="font-bold text-purple-600 text-lg">
                  {formatPrice(Math.round(calculations.habiCost))}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Resultado */}
        <div
          className={`rounded-xl p-6 text-center ${
            calculations.savings > 0
              ? 'bg-gradient-to-br from-purple-100 to-purple-50 border-2 border-purple-300'
              : 'bg-gray-50 border border-gray-200'
          }`}
        >
          <p className="text-xs uppercase tracking-widest font-semibold text-gray-500 mb-2">
            {calculations.savings > 0 ? 'Con Habi te ahorras' : 'Diferencia'}
          </p>
          <p className={`text-4xl font-black mb-2 ${calculations.savings > 0 ? 'text-purple-700' : 'text-gray-800'}`}>
            {formatPrice(Math.abs(Math.round(calculations.savings)))}
          </p>
          <p className="text-sm text-gray-600">
            {calculations.savings > 0
              ? `en comparación con pagar intereses durante ${loanTermMonths} meses`
              : calculations.savings < 0
              ? 'a favor del crédito'
              : 'sin diferencia'}
          </p>
        </div>
      </div>
    </div>
  );
}
