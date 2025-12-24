'use client';

import AnimatedPrice from './AnimatedPrice';

interface StickyPriceProps {
  currentPrice: number;
  show: boolean;
}

export default function StickyPrice({ currentPrice, show }: StickyPriceProps) {
  return (
    <div
      className={`fixed bottom-4 right-4 w-[472px] bg-white rounded-lg p-4 transition-all duration-500 ease-in-out ${
        show 
          ? 'translate-y-0 opacity-100 shadow-xl' 
          : 'translate-y-full opacity-0 pointer-events-none'
      }`}
      style={{ 
        zIndex: 40,
        boxShadow: show ? '0 10px 40px rgba(0, 0, 0, 0.15)' : 'none'
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold">
              <AnimatedPrice value={currentPrice} />
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Precio estimado de compra</p>
        </div>
        <button className="bg-purple-600 text-white px-8 py-2.5 rounded-lg font-medium hover:bg-purple-700 transition text-sm">
          Continuar
        </button>
      </div>
    </div>
  );
}
