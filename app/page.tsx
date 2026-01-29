'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import AnnouncementBar from './habi/components/AnnouncementBar';
import Navbar from './habi/components/Navbar';
import ConfiguratorRight from './habi/components/ConfiguratorRight';
import StickyPrice from './habi/components/StickyPrice';
import { HabiConfiguration, PAYMENT_OPTIONS, COSTOS_PERCENTAGES } from './types/habi';

// Importar el mapa dinámicamente para evitar SSR issues con Leaflet
const ComparablesMap = dynamic(() => import('./habi/components/ComparablesMap'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center">
      <span className="text-gray-400">Cargando mapa...</span>
    </div>
  )
});

// Datos de ejemplo - En producción vendrán de HubSpot
const PROPERTY_DATA = {
  valorMercado: 190000000,
  direccion: 'Calle 123 #45-67',
  tipoInmueble: 'Apartamento',
  area: '85 m²',
  conjunto: 'Conjunto Residencial Los Pinos',
  habitaciones: 3,
  banos: 2,
  fechaExpiracion: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
};

interface Comparable {
  id: string;
  nid: string;
  latitude: number;
  longitude: number;
  area: string;
  lastAskPrice: number;
  valormt2: number;
  features: string;
  address: string;
  condominium: string | null;
  floorNum: string;
  yearsOld: string;
  banos: string;
  garage: string;
  habitaciones: string;
  confidenceLevel: string;
  category: string;
}

interface InmuebleData {
  latitude: number;
  longitude: number;
  area: string;
  last_ask_price: number;
}

export default function Home() {
  const [showStickyPrice, setShowStickyPrice] = useState(true);
  const [showMap, setShowMap] = useState(false);
  
  // Datos del mapa
  const [inmueble, setInmueble] = useState<InmuebleData | null>(null);
  const [comparables, setComparables] = useState<Comparable[]>([]);
  const [selectedComparable, setSelectedComparable] = useState<Comparable | null>(null);
  
  // Configuración de la oferta
  const [configuration, setConfiguration] = useState<HabiConfiguration>({
    tramites: 'cliente',
    remodelacion: 'cliente',
    formaPago: '9cuotas'
  });

  // Estados para modalidad de venta
  const [modalidadVenta, setModalidadVenta] = useState<'habi' | 'inmobiliaria' | 'cuenta_propia'>('habi');
  const [precioInmobiliaria, setPrecioInmobiliaria] = useState(PROPERTY_DATA.valorMercado);
  const [precioCuentaPropia, setPrecioCuentaPropia] = useState(PROPERTY_DATA.valorMercado);

  // Estado de donación
  const [selectedDonation, setSelectedDonation] = useState('');
  const [donationAmount, setDonationAmount] = useState(0);

  // Ref para el panel derecho en desktop
  const rightColumnRef = useRef<HTMLDivElement | null>(null);
  const scrollListenerRef = useRef<(() => void) | null>(null);

  const handleDonationChange = (optionId: string, amount: number) => {
    if (selectedDonation === optionId) {
      setSelectedDonation('');
      setDonationAmount(0);
    } else {
      setSelectedDonation(optionId);
      setDonationAmount(amount);
    }
  };

  // Cargar datos del mapa
  useEffect(() => {
    const loadData = async () => {
      try {
        const [inmuebleRes, comparablesRes] = await Promise.all([
          fetch('/inmueble.json'),
          fetch('/comparables.json')
        ]);
        
        const inmuebleData = await inmuebleRes.json();
        const comparablesData = await comparablesRes.json();

        setInmueble(inmuebleData);

        const keys = Object.keys(comparablesData.nid);
        const uniqueComparables = new Map<string, Comparable>();
        
        keys.forEach((key) => {
          const nid = comparablesData.nid[key];
          if (!uniqueComparables.has(nid)) {
            // Extraer habitaciones del campo features (ej: "52m² ・ 3 Hab. ・ 1 Baños ・ 0 Est.")
            const features = comparablesData.features[key] || '';
            const habMatch = features.match(/(\d+)\s*Hab/i);
            const habitaciones = habMatch ? habMatch[1] : '-';
            
            uniqueComparables.set(nid, {
              id: key,
              nid: nid,
              latitude: parseFloat(comparablesData.latitude[key]),
              longitude: parseFloat(comparablesData.longitude[key]),
              area: comparablesData.area[key],
              lastAskPrice: parseFloat(comparablesData.last_ask_price[key]),
              valormt2: parseFloat(comparablesData.valormt2[key]),
              features: comparablesData.features[key],
              address: comparablesData.address[key],
              condominium: comparablesData.condominium[key],
              floorNum: comparablesData.floor_num[key],
              yearsOld: comparablesData.years_old[key],
              banos: comparablesData.banos[key],
              garage: comparablesData.garage[key],
              habitaciones: habitaciones,
              confidenceLevel: comparablesData.confidence_levels[key],
              category: comparablesData.comparable_category[key]
            });
          }
        });

        setComparables(Array.from(uniqueComparables.values()));
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  // Calcular precio según configuración
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

  // Callback para cuando la sección de comparables cambia visibilidad
  const handleComparablesVisibility = useCallback((isVisible: boolean) => {
    setShowMap(isVisible);
  }, []);

  // Función para manejar el scroll del StickyPrice
  const handleStickyScroll = useCallback(() => {
    let ctaVisible = false;
    
    // Verificar si estamos en desktop (≥768px) y el panel está visible
    const isDesktop = window.innerWidth >= 768;
    
    if (isDesktop && rightColumnRef.current) {
      // En desktop, buscar el CTA dentro del panel derecho específicamente
      const ctaFinalSection = rightColumnRef.current.querySelector('#cta-final-section');
      if (ctaFinalSection) {
        const ctaRect = ctaFinalSection.getBoundingClientRect();
        const panelRect = rightColumnRef.current.getBoundingClientRect();
        // El CTA es visible si su top está dentro del área visible del panel
        // (considerando un margen para el sticky price de ~100px)
        ctaVisible = ctaRect.top < panelRect.bottom - 100;
      }
    } else {
      // En móvil, buscar el CTA visible en el layout móvil
      const mobileLayout = document.querySelector('.md\\:hidden');
      const ctaFinalSection = mobileLayout?.querySelector('#cta-final-section') 
        || document.querySelector('#cta-final-section');
      if (ctaFinalSection) {
        const ctaRect = ctaFinalSection.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        ctaVisible = ctaRect.top < windowHeight - 120;
      }
    }
    
    setShowStickyPrice(!ctaVisible);
  }, []);

  // Callback ref para el panel derecho - se ejecuta cuando el elemento está en el DOM
  const setRightColumnRef = useCallback((node: HTMLDivElement | null) => {
    // Limpiar listener anterior si existe
    if (scrollListenerRef.current && rightColumnRef.current) {
      rightColumnRef.current.removeEventListener('scroll', scrollListenerRef.current);
    }

    rightColumnRef.current = node;

    // Si hay un nuevo nodo, agregar el listener
    if (node) {
      scrollListenerRef.current = handleStickyScroll;
      node.addEventListener('scroll', handleStickyScroll, { passive: true });
      // Ejecutar inmediatamente para establecer estado inicial
      handleStickyScroll();
    }
  }, [handleStickyScroll]);

  // También escuchar scroll del window (para móvil) y resize
  useEffect(() => {
    window.addEventListener('scroll', handleStickyScroll, { passive: true });
    window.addEventListener('resize', handleStickyScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleStickyScroll);
      window.removeEventListener('resize', handleStickyScroll);
    };
  }, [handleStickyScroll]);

  const currentPrice = calculatePrice();

  // Altura del header en móvil (AnnouncementBar + Navbar)
  const mobileHeaderHeight = 90;

  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* Header sticky - AnnouncementBar + Navbar */}
      <div className="sticky top-0 z-50">
        <AnnouncementBar fechaExpiracion={PROPERTY_DATA.fechaExpiracion} />
        <Navbar />
      </div>

      {/* === LAYOUT MÓVIL === */}
      <div className="md:hidden flex flex-col flex-1">
        {/* Panel superior FIJO en móvil - debajo del header */}
        <div 
          className="sticky bg-white z-40 border-b border-gray-100"
          style={{ 
            top: `${mobileHeaderHeight}px`,
            height: '200px'
          }}
        >
          {/* Fondo blanco por defecto */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white" />
          
          {/* Mapa cuando está en la sección de comparables */}
          <div 
            className={`absolute inset-0 transition-opacity duration-500 ${showMap ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            {inmueble && comparables.length > 0 && (
              <ComparablesMap
                inmueble={{
                  latitude: inmueble.latitude,
                  longitude: inmueble.longitude,
                  area: inmueble.area,
                  price: inmueble.last_ask_price
                }}
                comparables={comparables}
                selectedComparable={selectedComparable}
                onSelectComparable={setSelectedComparable}
              />
            )}
          </div>
          
          {/* Contenido por defecto cuando no hay mapa */}
          <div 
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${showMap ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          >
            {/* Espacio en blanco o contenido personalizado */}
          </div>
        </div>

        {/* Configurador scrolleable en móvil */}
        <div className="flex-1 bg-white pb-24">
          <ConfiguratorRight
            configuration={configuration}
            setConfiguration={setConfiguration}
            currentPrice={currentPrice}
            valorMercado={PROPERTY_DATA.valorMercado}
            propertyData={{
              direccion: PROPERTY_DATA.direccion,
              tipoInmueble: PROPERTY_DATA.tipoInmueble,
              area: PROPERTY_DATA.area,
              conjunto: PROPERTY_DATA.conjunto,
              habitaciones: PROPERTY_DATA.habitaciones,
              banos: PROPERTY_DATA.banos
            }}
            modalidadVenta={modalidadVenta}
            setModalidadVenta={setModalidadVenta}
            precioInmobiliaria={precioInmobiliaria}
            setPrecioInmobiliaria={setPrecioInmobiliaria}
            precioCuentaPropia={precioCuentaPropia}
            setPrecioCuentaPropia={setPrecioCuentaPropia}
            selectedDonation={selectedDonation}
            donationAmount={donationAmount}
            onDonationChange={handleDonationChange}
            onComparablesVisibility={handleComparablesVisibility}
            comparables={comparables}
            selectedComparable={selectedComparable}
            onSelectComparable={setSelectedComparable}
          />
        </div>
      </div>

      {/* === LAYOUT DESKTOP === */}
      <div className="hidden md:flex flex-row flex-1">
        {/* Panel izquierdo - Mapa fixed */}
        <div className="flex-1 relative">
          <div 
            className={`
              fixed left-0 top-[90px] bottom-0 right-[480px] z-10
              transition-opacity duration-500
              ${showMap ? 'opacity-100' : 'opacity-0 pointer-events-none'}
            `}
          >
            {inmueble && comparables.length > 0 && (
              <ComparablesMap
                inmueble={{
                  latitude: inmueble.latitude,
                  longitude: inmueble.longitude,
                  area: inmueble.area,
                  price: inmueble.last_ask_price
                }}
                comparables={comparables}
                selectedComparable={selectedComparable}
                onSelectComparable={setSelectedComparable}
              />
            )}
          </div>
        </div>
        
        {/* Panel derecho - Configurador scrolleable */}
        <div 
          ref={setRightColumnRef}
          className="w-[480px] overflow-y-auto max-h-[calc(100vh-90px)] bg-white relative flex-shrink-0 pb-24"
        >
          <ConfiguratorRight
            configuration={configuration}
            setConfiguration={setConfiguration}
            currentPrice={currentPrice}
            valorMercado={PROPERTY_DATA.valorMercado}
            propertyData={{
              direccion: PROPERTY_DATA.direccion,
              tipoInmueble: PROPERTY_DATA.tipoInmueble,
              area: PROPERTY_DATA.area,
              conjunto: PROPERTY_DATA.conjunto,
              habitaciones: PROPERTY_DATA.habitaciones,
              banos: PROPERTY_DATA.banos
            }}
            modalidadVenta={modalidadVenta}
            setModalidadVenta={setModalidadVenta}
            precioInmobiliaria={precioInmobiliaria}
            setPrecioInmobiliaria={setPrecioInmobiliaria}
            precioCuentaPropia={precioCuentaPropia}
            setPrecioCuentaPropia={setPrecioCuentaPropia}
            selectedDonation={selectedDonation}
            donationAmount={donationAmount}
            onDonationChange={handleDonationChange}
            onComparablesVisibility={handleComparablesVisibility}
            comparables={comparables}
            selectedComparable={selectedComparable}
            onSelectComparable={setSelectedComparable}
          />
        </div>
      </div>

      {/* StickyPrice - ÚNICO, fuera de los layouts, el componente maneja su propio posicionamiento responsive */}
      <StickyPrice
        currentPrice={currentPrice}
        show={showStickyPrice && modalidadVenta !== 'cuenta_propia'}
        modalidad={modalidadVenta}
        precioInmobiliaria={precioInmobiliaria}
        precioCuentaPropia={precioCuentaPropia}
        donationAmount={donationAmount}
        onHabiClick={() => setModalidadVenta('habi')}
      />
    </main>
  );
}
