'use client';

import { HabiConfiguration, PAYMENT_OPTIONS, COSTOS_PERCENTAGES } from '../../types/habi';
import type { HubSpotProperties } from '../../lib/hubspot';

interface PaymentOptionsProps {
  configuration: HabiConfiguration;
  setConfiguration: (config: HabiConfiguration) => void;
  valorMercado: number;
  bnplPrices?: HubSpotProperties | null;
}

export default function PaymentOptions({ configuration, setConfiguration, valorMercado, bnplPrices }: PaymentOptionsProps) {
  const formatPrice = (price: number) => {
    return `$ ${price.toLocaleString('es-CO')}`;
  };

  // Mapear las opciones de pago a precios reales de BNPL si están disponibles
  const getBnplPrice = (optionId: string): number | null => {
    if (!bnplPrices) return null;
    
    const priceMap: Record<string, string | undefined> = {
      'contado': bnplPrices.precio_comite,
      '3cuotas': bnplPrices.bnpl3,
      '6cuotas': bnplPrices.bnpl6,
      '9cuotas': bnplPrices.bnpl9,
    };
    
    const priceStr = priceMap[optionId];
    if (!priceStr) return null;
    
    const price = Number(priceStr.replace(/[^\d]/g, ''));
    return isNaN(price) ? null : price;
  };

  // Calcular porcentaje de diferencia entre un precio BNPL y el precio_comite base
  const getBnplPercentage = (optionId: string): string | null => {
    if (!bnplPrices) return null;
    
    const price = getBnplPrice(optionId);
    const basePrice = getBnplPrice('contado');
    
    if (!price || !basePrice || basePrice === 0) return null;
    
    const diff = ((price - basePrice) / basePrice) * 100;
    if (diff === 0) return 'BASE';
    return `+${diff.toFixed(1)}%`;
  };

  return (
    <div id="forma-pago-section" className="px-6 py-8 bg-white border-b border-gray-200">
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-2">Forma de pago</h3>
        <p className="text-sm text-gray-600">
          Entre más flexibilidad elijas, mayor será el precio total que recibes.
        </p>
      </div>

      <div className="space-y-3">
        {PAYMENT_OPTIONS.map((option) => {
          // Si hay precios BNPL de HubSpot, usarlos directamente
          const bnplPrice = getBnplPrice(option.id);
          const bnplPercentage = getBnplPercentage(option.id);
          
          let displayPrice: number;
          let displayBadge: string | undefined;
          
          if (bnplPrice !== null) {
            displayPrice = bnplPrice;
            displayBadge = bnplPercentage || option.badge;
          } else {
            let precioBase = valorMercado * 0.782;
            if (configuration.tramites === 'cliente') {
              precioBase += (valorMercado * COSTOS_PERCENTAGES.tramites) / 100;
            }
            if (configuration.remodelacion === 'cliente') {
              precioBase += (valorMercado * COSTOS_PERCENTAGES.remodelacion) / 100;
            }
            displayPrice = precioBase * (1 + option.percentage / 100);
            displayBadge = option.badge;
          }
          
          // Calcular valor de cada cuota mensual
          const numCuotas = option.id === 'contado' ? 1 : parseInt(option.id);
          const valorCuota = numCuotas > 1 ? Math.round(displayPrice / numCuotas) : null;
          
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
                  {displayBadge && (
                    <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded font-semibold">
                      {displayBadge}
                    </span>
                  )}
                </div>
                {isSelected && (
                  <span className="text-sm text-purple-600">✓</span>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <div>
                  <span className="text-sm text-gray-600">{option.description}</span>
                  {valorCuota && (
                    <p className="text-xs text-purple-600 mt-0.5">
                      {formatPrice(valorCuota)} / cuota
                    </p>
                  )}
                </div>
                <span className="text-lg font-bold">
                  {formatPrice(Math.round(displayPrice))}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
