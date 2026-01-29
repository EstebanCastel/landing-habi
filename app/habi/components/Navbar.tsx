'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function Navbar() {
  const [country, setCountry] = useState<'COL' | 'MX'>('COL');

  return (
    <nav className="bg-white py-2 px-3 md:py-3 md:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Image
          src="/habilogo.jpg"
          alt="Habi"
          width={80}
          height={32}
          className="h-8 w-auto"
        />
        
        {/* Country Selector */}
        <div className="flex items-center gap-2 text-sm">
          <button 
            onClick={() => setCountry('COL')}
            className={country === 'COL' ? 'font-bold text-gray-900' : 'text-gray-400'}
          >
            COL
          </button>
          <span className="text-gray-300">|</span>
          <button 
            onClick={() => setCountry('MX')}
            className={country === 'MX' ? 'font-bold text-gray-900' : 'text-gray-400'}
          >
            MX
          </button>
        </div>
      </div>
    </nav>
  );
}

