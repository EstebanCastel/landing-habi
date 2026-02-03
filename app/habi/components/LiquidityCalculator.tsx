'use client';

import { useState, useMemo } from 'react';

// Datos de créditos de consumo en México
const CREDIT_OPTIONS = [
  { institution: 'BBVA', product: 'Crédito de Nómina', minRate: 25, maxRate: 38, catMin: 35, catMax: 48 },
  { institution: 'BBVA', product: 'TDC Platinum', minRate: 32, maxRate: 40, cat: 50.3 },
  { institution: 'Santander', product: 'Crédito Personal', minRate: 30, maxRate: 45, catMin: 45, catMax: 62 },
  { institution: 'Santander', product: 'TDC LikeU', minRate: 45, maxRate: 60, cat: 78 },
  { institution: 'Citibanamex', product: 'Crédito Personal', minRate: 22, maxRate: 42, catMin: 33, catMax: 55 },
  { institution: 'Citibanamex', product: 'TDC Simplicity', minRate: 55, maxRate: 70, cat: 85 },
  { institution: 'HSBC', product: 'TDC 2Now', rate: 45.6, cat: 91.3 },
  { institution: 'Banorte', product: 'Crédito de Nómina', minRate: 35, maxRate: 44, catMin: 58, catMax: 63 },
  { institution: 'Nu (Nubank)', product: 'Tarjeta de Crédito', rate: 90.7, cat: 142 },
  { institution: 'Banco Azteca', product: 'Crédito al Consumo', minRate: 50, maxRate: 90, catMin: 100, catMax: 150 },
];

interface LiquidityCalculatorProps {
  valorMercado: number;
  ofertaHabi: number;
  onClose: () => void;
}

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

export default function LiquidityCalculator({ valorMercado, ofertaHabi, onClose }: LiquidityCalculatorProps) {
  const [amountNeeded, setAmountNeeded] = useState<number>(ofertaHabi * 0.3);
  const [selectedCredit, setSelectedCredit] = useState<number>(0);
  const [loanTermMonths, setLoanTermMonths] = useState<number>(24);
  const [showTable, setShowTable] = useState(false);
  
  const formatPrice = (price: number) => {
    return `$${price.toLocaleString('es-CO')}`;
  };

  const formatPercent = (percent: number) => {
    return `${percent.toFixed(1)}%`;
  };

  // Cálculos
  const calculations = useMemo(() => {
    const credit = CREDIT_OPTIONS[selectedCredit];
    const avgRate = credit.rate || ((credit.minRate || 0) + (credit.maxRate || 0)) / 2;
    const monthlyRate = avgRate / 100 / 12;
    
    const monthlyPayment = amountNeeded * (monthlyRate * Math.pow(1 + monthlyRate, loanTermMonths)) / 
                          (Math.pow(1 + monthlyRate, loanTermMonths) - 1);
    
    const totalPayment = monthlyPayment * loanTermMonths;
    const totalInterest = totalPayment - amountNeeded;
    
    const habiCost = valorMercado - ofertaHabi;
    const creditCost = totalInterest;
    const savings = creditCost - habiCost;
    
    return {
      avgRate,
      monthlyPayment,
      totalPayment,
      totalInterest,
      habiCost,
      creditCost,
      savings
    };
  }, [amountNeeded, selectedCredit, loanTermMonths, valorMercado, ofertaHabi]);

  return (
    <div id="forma-pago-section" className="bg-white">
      {/* Header estilo calculadora */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Simulador de Liquidez</span>
        </div>
        <button 
          onClick={onClose}
          className="text-purple-600 hover:text-purple-800 text-sm font-semibold transition-colors"
        >
          Volver a cuotas
        </button>
      </div>

      {/* Contenido principal */}
      <div className="p-6">
        {/* Sección izquierda - Inputs */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">¿Necesitas liquidez inmediata?</h2>
          <p className="text-sm text-gray-600 mb-6">
            Compara el costo real de solicitar un crédito vs vender tu inmueble con Habi.
          </p>

          {/* Card de inputs */}
          <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-xl p-5">
            {/* Monto necesario */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-semibold text-gray-700">
                  ¿Cuánto dinero necesitas?
                </label>
                <HelpIcon title="Indica el monto de liquidez que necesitas obtener." />
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={`$ ${amountNeeded.toLocaleString('es-CO')}`}
                  onChange={(e) => {
                    const value = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                    setAmountNeeded(Math.min(value, ofertaHabi));
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-lg font-semibold text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
                />
              </div>
              <input
                type="range"
                min={1000000}
                max={ofertaHabi}
                step={1000000}
                value={amountNeeded}
                onChange={(e) => setAmountNeeded(parseInt(e.target.value))}
                className="w-full mt-3 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>$1M</span>
                <span>{formatPrice(ofertaHabi)}</span>
              </div>
            </div>

            {/* Plazo */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-semibold text-gray-700">
                  Plazo del crédito
                </label>
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
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-semibold text-gray-700">
                  Tipo de crédito
                </label>
                <HelpIcon title="Selecciona el tipo de crédito o tarjeta que usarías." />
              </div>
              <select
                value={selectedCredit}
                onChange={(e) => setSelectedCredit(parseInt(e.target.value))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all bg-white"
              >
                {CREDIT_OPTIONS.map((credit, index) => (
                  <option key={index} value={index}>
                    {credit.institution} - {credit.product} ({credit.rate ? `${credit.rate}%` : `${credit.minRate}% - ${credit.maxRate}%`})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Comparación lado a lado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Crédito de Consumo */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs uppercase tracking-widest font-bold text-gray-500">Crédito de Consumo</h4>
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
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
                <span className="font-semibold text-gray-900">{formatPercent(calculations.avgRate)} anual</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Pago mensual</span>
                <span className="font-semibold text-gray-900">{formatPrice(Math.round(calculations.monthlyPayment))}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Total a pagar</span>
                <span className="font-bold text-gray-900">{formatPrice(Math.round(calculations.totalPayment))}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm font-semibold text-red-600">Intereses totales</span>
                <span className="font-bold text-red-600 text-lg">{formatPrice(Math.round(calculations.totalInterest))}</span>
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
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
                <span className="font-bold text-purple-600 text-lg">{formatPrice(Math.round(calculations.habiCost))}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Resultado */}
        <div className={`rounded-xl p-6 text-center ${
          calculations.savings > 0 
            ? 'bg-gradient-to-br from-purple-100 to-purple-50 border-2 border-purple-300' 
            : 'bg-gray-50 border border-gray-200'
        }`}>
          <p className="text-xs uppercase tracking-widest font-semibold text-gray-500 mb-2">
            {calculations.savings > 0 ? 'Con Habi te ahorras' : 'Diferencia'}
          </p>
          <p className={`text-4xl font-black mb-2 ${calculations.savings > 0 ? 'text-purple-700' : 'text-gray-800'}`}>
            {formatPrice(Math.abs(Math.round(calculations.savings)))}
          </p>
          <p className="text-sm text-gray-600">
            {calculations.savings > 0 
              ? `en comparación con pagar intereses durante ${loanTermMonths} meses`
              : calculations.savings < 0 ? 'a favor del crédito' : 'sin diferencia'
            }
          </p>
        </div>

        {/* Tabla de referencia colapsable */}
        <div className="mt-6">
          <button
            onClick={() => setShowTable(!showTable)}
            className="text-sm text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-2 transition-colors"
          >
            <svg className={`w-4 h-4 transition-transform ${showTable ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            Ver tabla de tasas de referencia
          </button>
          
          {showTable && (
            <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Institución</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Producto</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Tasa Interés</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">CAT</th>
                  </tr>
                </thead>
                <tbody>
                  {CREDIT_OPTIONS.map((credit, index) => (
                    <tr key={index} className={`border-b border-gray-100 ${selectedCredit === index ? 'bg-purple-50' : ''}`}>
                      <td className="px-4 py-3 font-medium text-gray-900">{credit.institution}</td>
                      <td className="px-4 py-3 text-gray-600">{credit.product}</td>
                      <td className="px-4 py-3 text-right text-gray-900">
                        {credit.rate ? `${credit.rate}%` : `${credit.minRate}% - ${credit.maxRate}%`}
                      </td>
                      <td className="px-4 py-3 text-right text-red-600 font-semibold">
                        {credit.cat ? `${credit.cat}%` : `${credit.catMin}% - ${credit.catMax}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-gray-400 mt-6">
          * Las tasas de interés y CAT son aproximadas y pueden variar según el perfil crediticio. 
          Este simulador es solo para fines ilustrativos y no constituye una oferta de crédito.
        </p>
      </div>
    </div>
  );
}
