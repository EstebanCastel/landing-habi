'use client';

import Image from 'next/image';
import { HabiConfiguration } from '../../types/habi';

interface VisualLeftProps {
  configuration: HabiConfiguration;
  currentPrice: number;
}

export default function VisualLeft({ configuration, currentPrice }: VisualLeftProps) {
  return (
    <div className="h-full bg-white flex items-center justify-center p-8 relative">
      <div className="relative w-full max-w-4xl">
        {/* Imagen principal de la casa */}
        <div className="animate-float">
          <Image
            src="/casa.svg"
            alt="Tu casa"
            width={1200}
            height={900}
            className="w-full h-auto object-contain"
            priority
          />
        </div>
        
        <style jsx>{`
          @keyframes float {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-8px);
            }
          }
          
          @keyframes floatSubtle {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-5px);
            }
          }
          
          .animate-float {
            animation: float 4s ease-in-out infinite;
          }
          
          .animate-float-subtle {
            animation: floatSubtle 4s ease-in-out infinite;
          }
        `}</style>

        {/* Card de Trámites - Justo arriba de la card de remodelación */}
        <div className="absolute -top-16 right-32 animate-float-subtle">
          <div className="relative w-96 h-20">
            {/* Card Cliente asume trámites */}
            <div 
              className={`absolute inset-0 flex bg-gradient-to-r from-purple-50 to-white border border-purple-200 rounded-lg px-3 py-1 shadow-lg items-center space-x-2.5 transition-all duration-700 ease-in-out ${
                configuration.tramites === 'cliente' 
                  ? 'opacity-100 scale-100 z-10' 
                  : 'opacity-0 scale-95 z-0'
              }`}
            >
              <div className="flex-shrink-0">
                <Image
                  src="/tutramites.svg"
                  alt="Tú pagas los trámites"
                  width={64}
                  height={64}
                  className="w-16 h-16"
                />
              </div>
              <div>
                <p className="text-base font-medium text-gray-900 whitespace-nowrap">
                  Tú pagas los trámites
                </p>
              </div>
            </div>
            
            {/* Card Habi asume trámites */}
            <div 
              className={`absolute inset-0 flex bg-gradient-to-r from-purple-50 to-white border border-purple-200 rounded-lg px-3 py-1 shadow-lg items-center space-x-2.5 transition-all duration-700 ease-in-out ${
                configuration.tramites === 'habi' 
                  ? 'opacity-100 scale-100 z-10' 
                  : 'opacity-0 scale-95 z-0'
              }`}
            >
              <div className="flex-shrink-0">
                <Image
                  src="/tramiteshabi.svg"
                  alt="Habi se encarga de los trámites"
                  width={64}
                  height={64}
                  className="w-16 h-16"
                />
              </div>
              <div>
                <p className="text-base font-medium text-gray-900 whitespace-nowrap">
                  Habi se encarga de los trámites
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card de Remodelación - Arriba a la derecha de la casa */}
        <div className="absolute top-6 right-24 animate-float-subtle">
          <div className="relative w-80 h-20">
            {/* Card Cliente */}
            <div 
              className={`absolute inset-0 flex bg-gradient-to-r from-purple-50 to-white border border-purple-200 rounded-lg px-3 py-1 shadow-lg items-center space-x-2.5 transition-all duration-700 ease-in-out ${
                configuration.remodelacion === 'cliente' 
                  ? 'opacity-100 scale-100 z-10' 
                  : 'opacity-0 scale-95 z-0'
              }`}
            >
              <div className="flex-shrink-0">
                <Image
                  src="/remo.svg"
                  alt="Remodelación"
                  width={64}
                  height={64}
                  className="w-16 h-16"
                />
              </div>
              <div>
                <p className="text-base font-medium text-gray-900 whitespace-nowrap">
                  Tú asumes la remodelación
                </p>
              </div>
            </div>
            
            {/* Card Habi */}
            <div 
              className={`absolute inset-0 flex bg-gradient-to-r from-purple-50 to-white border border-purple-200 rounded-lg px-3 py-1 shadow-lg items-center space-x-2.5 transition-all duration-700 ease-in-out ${
                configuration.remodelacion === 'habi' 
                  ? 'opacity-100 scale-100 z-10' 
                  : 'opacity-0 scale-95 z-0'
              }`}
            >
              <div className="flex-shrink-0">
                <Image
                  src="/habiremo.svg"
                  alt="Habi asume la remodelación"
                  width={64}
                  height={64}
                  className="w-16 h-16"
                />
              </div>
              <div>
                <p className="text-base font-medium text-gray-900 whitespace-nowrap">
                  Habi asume la remodelación
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
