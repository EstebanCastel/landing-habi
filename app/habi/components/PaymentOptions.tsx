'use client';

import { useState } from 'react';
import { HabiConfiguration, PAYMENT_OPTIONS, COSTOS_PERCENTAGES } from '../../types/habi';
import LiquidityCalculator from './LiquidityCalculator';

interface PaymentOptionsProps {
  configuration: HabiConfiguration;
  setConfiguration: (config: HabiConfiguration) => void;
  valorMercado: number;
}

export default function PaymentOptions({ configuration, setConfiguration, valorMercado }: PaymentOptionsProps) {
  const [showLiquidityCalculator, setShowLiquidityCalculator] = useState(false);

  const formatPrice = (price: number) => {
    return `$ ${price.toLocaleString('es-CO')}`;
  };

  // Calcular la oferta Habi para pasar a la calculadora
  const calculateHabiOffer = () => {
    let precioBase = valorMercado * 0.782;
    if (configuration.tramites === 'cliente') {
      precioBase += (valorMercado * COSTOS_PERCENTAGES.tramites) / 100;
    }
    if (configuration.remodelacion === 'cliente') {
      precioBase += (valorMercado * COSTOS_PERCENTAGES.remodelacion) / 100;
    }
    return precioBase;
  };

  // Si está mostrando la calculadora de liquidez
  if (showLiquidityCalculator) {
    return (
      <LiquidityCalculator 
        valorMercado={valorMercado}
        ofertaHabi={calculateHabiOffer()}
        onClose={() => setShowLiquidityCalculator(false)}
      />
    );
  }

  return (
    <div id="forma-pago-section" className="px-6 py-8 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold mb-2">Forma de pago</h3>
          <p className="text-sm text-gray-600">
            Entre más flexibilidad elijas, mayor será el precio total que recibes.
          </p>
        </div>
        <button
          onClick={() => setShowLiquidityCalculator(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors border border-purple-200"
          title="Simulador de liquidez"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span>Simular</span>
        </button>
      </div>

      <div className="space-y-3">
        {PAYMENT_OPTIONS.map((option) => {
          // Calcular precio base SIN forma de pago
          let precioBase = valorMercado * 0.782;
          if (configuration.tramites === 'cliente') {
            precioBase += (valorMercado * COSTOS_PERCENTAGES.tramites) / 100;
          }
          if (configuration.remodelacion === 'cliente') {
            precioBase += (valorMercado * COSTOS_PERCENTAGES.remodelacion) / 100;
          }
          
          // Aplicar porcentaje de esta forma de pago específica
          const priceWithOption = precioBase * (1 + option.percentage / 100);
          const isSelected = configuration.formaPago === option.id;
          const isRecommended = option.id === '9cuotas';
          
          return (
            <button
              key={option.id}
              onClick={() => setConfiguration({ ...configuration, formaPago: option.id })}
              className={`w-full text-left p-4 rounded-lg border transition-all ${
                isSelected
                  ? 'border-purple-300 bg-gradient-to-br from-purple-50 to-transparent'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              } ${isRecommended && !isSelected ? 'ring-1 ring-purple-300' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{option.label}</span>
                  {option.percentage > 0 && (
                    <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded font-semibold">
                      +{option.percentage}%
                    </span>
                  )}
                </div>
                {isSelected && (
                  <span className="text-sm text-purple-600">✓</span>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <span className="text-sm text-gray-600">{option.description}</span>
                <span className="text-lg font-bold">
                  {formatPrice(Math.round(priceWithOption))}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

