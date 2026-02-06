'use client';

import Image from 'next/image';

interface NavbarProps {
  /** Mercado activo según pipeline de HubSpot (CO = Colombia, MX = México). Por defecto CO. */
  activeCountry?: 'CO' | 'MX';
}

export default function Navbar({ activeCountry = 'CO' }: NavbarProps) {
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
        
        {/* Country: CO | MX — el activo según pipeline en negrilla */}
        <div className="flex items-center gap-2 text-sm">
          <span className={activeCountry === 'CO' ? 'font-bold text-gray-900' : 'text-gray-400'}>
            CO
          </span>
          <span className="text-gray-300">|</span>
          <span className={activeCountry === 'MX' ? 'font-bold text-gray-900' : 'text-gray-400'}>
            MX
          </span>
        </div>
      </div>
    </nav>
  );
}

