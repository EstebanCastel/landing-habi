'use client';

import { HabiConfiguration } from '../../types/habi';
import { TRAMITES_CLIENTE_BNPL_BONUS_PCT, type HubSpotProperties } from '../../lib/hubspot';
import { analytics } from '../../lib/analytics';

interface TramitesClienteBnplSectionProps {
  configuration: HabiConfiguration;
  setConfiguration: (config: HabiConfiguration) => void;
  bnplPrices?: HubSpotProperties | null;
}

export default function TramitesClienteBnplSection({
  configuration,
  setConfiguration,
  bnplPrices,
}: TramitesClienteBnplSectionProps) {
  const isSelected = configuration.tramites === 'cliente';

  return (
    <div className="px-6 py-8 bg-white border-t border-gray-200">
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-2">Trámites y notarías</h3>
        <p className="text-sm text-gray-600">
          Elige quién se encarga de los gastos legales y notariales asociados a la compraventa.
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => {
            setConfiguration({ ...configuration, tramites: 'habi' });
            analytics.costToggleChanged('tramites', 'habi', bnplPrices?.country);
          }}
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
          onClick={() => {
            setConfiguration({ ...configuration, tramites: 'cliente' });
            analytics.costToggleChanged('tramites', 'cliente', bnplPrices?.country);
          }}
          className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
            isSelected
              ? 'border-purple-200 bg-gradient-to-br from-purple-50 to-transparent'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium">Yo pago mis trámites</span>
              <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded font-semibold">
                +{TRAMITES_CLIENTE_BNPL_BONUS_PCT}%
              </span>
            </div>
            {isSelected && (
              <span className="text-sm text-purple-600">✓</span>
            )}
          </div>
          <p className="text-xs text-gray-600">
            Tienes que acercarte el día de la escritura a realizar los pagos correspondientes.
          </p>
        </button>
      </div>
    </div>
  );
}
