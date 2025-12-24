'use client';

import { useState, useEffect, useRef } from 'react';
import HabiHero from './components/HabiHero';
import VisualLeft from './components/VisualLeft';
import ConfiguratorRight from './components/ConfiguratorRight';
import StickyPrice from './components/StickyPrice';
import { HabiConfiguration, PAYMENT_OPTIONS, COSTOS_PERCENTAGES } from '../types/habi';

// Datos de ejemplo - En producción vendrán de HubSpot
const PROPERTY_DATA = {
  valorMercado: 190000000,
  direccion: 'Calle 123 #45-67',
  tipoInmueble: 'Apartamento',
  area: '85 m²'
};

export default function HabiConfigurator() {
  const [showHero, setShowHero] = useState(true);
  const [showStickyPrice, setShowStickyPrice] = useState(true);
  // DEFAULT: precio máximo (9 cuotas, cliente asume remodelación y trámites)
  const [configuration, setConfiguration] = useState<HabiConfiguration>({
    tramites: 'cliente',
    remodelacion: 'cliente',
    formaPago: '9cuotas'
  });

  const configuratorRef = useRef<HTMLDivElement>(null);
  const rightColumnRef = useRef<HTMLDivElement>(null);

  // Calcular precio base final según configuración
  const calculatePrice = () => {
    const { valorMercado } = PROPERTY_DATA;
    let precioBase = valorMercado * 0.782;

    if (configuration.tramites === 'cliente') {
      precioBase += (valorMercado * COSTOS_PERCENTAGES.tramites) / 100;
    }

    if (configuration.remodelacion === 'cliente') {
      precioBase += (valorMercado * COSTOS_PERCENTAGES.remodelacion) / 100;
    }

    const paymentOption = PAYMENT_OPTIONS.find(opt => opt.id === configuration.formaPago);
    if (paymentOption) {
      precioBase = precioBase * (1 + paymentOption.percentage / 100);
    }

    return Math.round(precioBase);
  };

  const calculateMaxPrice = () => {
    const { valorMercado } = PROPERTY_DATA;
    let precioMax = valorMercado * 0.782;
    precioMax += (valorMercado * COSTOS_PERCENTAGES.tramites) / 100;
    precioMax += (valorMercado * COSTOS_PERCENTAGES.remodelacion) / 100;
    precioMax = precioMax * 1.034;
    return Math.round(precioMax);
  };

  const handleStartConfiguration = () => {
    setShowHero(false);
    setTimeout(() => {
      configuratorRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    if (showHero) return;

    const handleScroll = () => {
      if (rightColumnRef.current) {
        const scrollPosition = rightColumnRef.current.scrollTop;
        const scrollHeight = rightColumnRef.current.scrollHeight;
        const clientHeight = rightColumnRef.current.clientHeight;
        
        if (scrollPosition + clientHeight > scrollHeight - 400) {
          setShowStickyPrice(false);
        } else {
          setShowStickyPrice(true);
        }
      }
    };

    const rightColumn = rightColumnRef.current;
    if (rightColumn) {
      rightColumn.addEventListener('scroll', handleScroll);
      handleScroll();
    }

    return () => {
      if (rightColumn) {
        rightColumn.removeEventListener('scroll', handleScroll);
      }
    };
  }, [showHero]);

  const currentPrice = calculatePrice();
  const maxPrice = calculateMaxPrice();

  return (
    <main className="min-h-screen bg-white">
      {showHero && (
        <HabiHero 
          maxPrice={maxPrice}
          propertyData={PROPERTY_DATA}
          onStart={handleStartConfiguration}
        />
      )}
      
      <div ref={configuratorRef} className={`${showHero ? 'hidden' : 'block'}`}>
        <div className="flex">
          <div className="flex-1 sticky top-0 h-screen bg-white">
            <VisualLeft 
              configuration={configuration} 
              currentPrice={currentPrice}
            />
          </div>
          
          <div 
            ref={rightColumnRef}
            className="w-[480px] overflow-y-auto h-screen bg-white relative"
          >
            <ConfiguratorRight
              configuration={configuration}
              setConfiguration={setConfiguration}
              currentPrice={currentPrice}
              valorMercado={PROPERTY_DATA.valorMercado}
            />
            
            <StickyPrice
              currentPrice={currentPrice}
              show={showStickyPrice}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
