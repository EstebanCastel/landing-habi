'use client';

import AnimatedPrice from './AnimatedPrice';

interface StickyPriceProps {
  currentPrice: number;
  show: boolean;
  modalidad?: 'habi' | 'inmobiliaria' | 'cuenta_propia';
  precioInmobiliaria?: number;
  precioCuentaPropia?: number;
  donationAmount?: number;
  onHabiClick?: () => void;
  evaluacionInmueble?: number;
}

export default function StickyPrice({ 
  currentPrice, 
  show, 
  modalidad = 'habi',
  precioInmobiliaria = 0,
  precioCuentaPropia = 0,
  donationAmount = 0,
  onHabiClick,
  evaluacionInmueble
}: StickyPriceProps) {
  // Determinar precio y texto según modalidad (ya con donación descontada)
  const getContent = () => {
    switch (modalidad) {
      case 'inmobiliaria':
        return {
          price: (precioInmobiliaria * 0.95) - donationAmount,
          label: donationAmount > 0 ? 'Recibirás (con donación)' : 'Recibirás aproximadamente',
          buttonText: 'Publicar inmueble',
          buttonAction: () => {}
        };
      case 'cuenta_propia':
        return {
          price: precioCuentaPropia,
          label: 'Tu precio de venta',
          buttonText: 'Descargar guía',
          buttonAction: () => {},
          secondaryButton: {
            text: 'Habi me compra',
            action: onHabiClick
          }
        };
      default:
        return {
          // Precio dinámico: cuotas BNPL seleccionadas o precio_comite
          // Se ajusta con trámites/remodelación si esas secciones están activas
          price: currentPrice - donationAmount,
          label: 'Precio estimado de compra',
          buttonText: 'Continuar',
          buttonAction: () => {}
        };
    }
  };

  const content = getContent();

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 md:bottom-0 md:right-0 md:left-auto w-full md:w-[460px] bg-white p-4 transition-all duration-500 ease-in-out ${
        show 
          ? 'translate-y-0 opacity-100' 
          : 'translate-y-full opacity-0 pointer-events-none'
      }`}
      style={{ 
        zIndex: 50,
        boxShadow: show ? '0 -4px 20px rgba(0, 0, 0, 0.15)' : 'none'
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="text-xl sm:text-2xl font-bold">
              <AnimatedPrice value={content.price} />
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">{content.label}</p>
        </div>
        <div className="flex gap-2">
          {modalidad === 'cuenta_propia' && content.secondaryButton && (
            <button 
              onClick={content.secondaryButton.action}
              className="flex-1 sm:flex-none bg-purple-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-purple-700 transition text-sm"
            >
              {content.secondaryButton.text}
            </button>
          )}
          <button 
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-medium transition text-sm ${
              modalidad === 'cuenta_propia' 
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {content.buttonText}
        </button>
        </div>
      </div>
    </div>
  );
}
