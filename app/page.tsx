'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import AnnouncementBar from './habi/components/AnnouncementBar';
import Navbar from './habi/components/Navbar';
import ConfiguratorRight from './habi/components/ConfiguratorRight';
import StickyPrice from './habi/components/StickyPrice';
import AIAssistant from './habi/components/AIAssistant';
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
  // Sección activa: 'property' (imagen), 'comparables' (mapa), 'configurator' (imagen config), 'payment' (imagen cuotas), 'donation' (videos), 'other' (fondo neutro)
  const [activeSection, setActiveSection] = useState<'property' | 'comparables' | 'configurator' | 'payment' | 'donation' | 'other'>('property');
  
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

  // Estado para carrusel de videos en móvil
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const DONATION_VIDEOS = [
    '/DJI_20251210101636_0086_D.webm',
    '/DJI_20251210171250_0012_D.webm',
    '/DJI_20251210221910_0517_D.webm',
    '/DJI_20251210222059_0518_D.webm'
  ];

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

  // Función para determinar qué sección está más visible
  const updateActiveSection = useCallback(() => {
    // Detectar si estamos en desktop
    const isDesktop = window.innerWidth >= 768;
    
    // En móvil, el panel superior está en top: 90px + 200px de altura = 290px
    // El checkpoint debe estar justo debajo del panel
    const checkPoint = isDesktop ? 200 : 300;

    // Buscar el contenedor correcto según el viewport
    // En móvil: buscar elementos visibles (no ocultos por md:hidden)
    // En desktop: buscar dentro del panel derecho scrolleable
    const allPropertyEls = document.querySelectorAll('#property-info-section');
    const allComparablesEls = document.querySelectorAll('#comparables-section');
    const allSaleModalityEls = document.querySelectorAll('#sale-modality-section');
    const allConfiguratorEls = document.querySelectorAll('#configurator-section');
    const allPaymentEls = document.querySelectorAll('#forma-pago-section');
    const allDonationEls = document.querySelectorAll('#donation-section');

    // Función para obtener el elemento visible (el que tiene offsetParent no null)
    const getVisibleElement = (elements: NodeListOf<Element>): Element | null => {
      for (const el of elements) {
        const htmlEl = el as HTMLElement;
        // Un elemento está visible si tiene dimensiones y no está oculto
        if (htmlEl.offsetWidth > 0 && htmlEl.offsetHeight > 0) {
          return el;
        }
      }
      return null;
    };

    const propertyEl = getVisibleElement(allPropertyEls);
    const comparablesEl = getVisibleElement(allComparablesEls);
    const saleModalityEl = getVisibleElement(allSaleModalityEls);
    const configuratorEl = getVisibleElement(allConfiguratorEls);
    const paymentEl = getVisibleElement(allPaymentEls);
    const donationEl = getVisibleElement(allDonationEls);

    // Obtener las posiciones de cada sección
    const propertyRect = propertyEl?.getBoundingClientRect();
    const comparablesRect = comparablesEl?.getBoundingClientRect();
    const saleModalityRect = saleModalityEl?.getBoundingClientRect();
    const configuratorRect = configuratorEl?.getBoundingClientRect();
    const paymentRect = paymentEl?.getBoundingClientRect();
    const donationRect = donationEl?.getBoundingClientRect();

    const viewportHeight = window.innerHeight;
    // Donation se activa cuando está al 50% del viewport desde arriba
    const donationCheckPoint = viewportHeight * 0.5;

    // Primero verificar donation (tiene prioridad si está visible)
    if (donationRect && donationRect.height > 0 && donationRect.top <= donationCheckPoint) {
      setActiveSection('donation');
      return;
    }

    // Crear un array ordenado de secciones con sus posiciones
    const sections: { id: 'property' | 'comparables' | 'configurator' | 'payment' | 'other', top: number }[] = [];
    
    if (propertyRect) sections.push({ id: 'property', top: propertyRect.top });
    if (comparablesRect) sections.push({ id: 'comparables', top: comparablesRect.top });
    // Sale-modality (tabs) - fondo neutro
    if (saleModalityRect) {
      sections.push({ id: 'other', top: saleModalityRect.top });
    }
    // Sección de configuración (Así se construye tu oferta) - imagen
    if (configuratorRect) {
      sections.push({ id: 'configurator', top: configuratorRect.top });
    }
    // Sección de forma de pago
    if (paymentRect) {
      sections.push({ id: 'payment', top: paymentRect.top });
    }

    // Ordenar por top (de menor a mayor = de arriba a abajo en el DOM)
    sections.sort((a, b) => a.top - b.top);

    // La sección activa es la última que tiene su TOP por encima del checkpoint
    let activeId: 'property' | 'comparables' | 'configurator' | 'payment' | 'other' = 'property';
    
    for (const section of sections) {
      if (section.top <= checkPoint) {
        activeId = section.id;
      }
    }
    
    setActiveSection(activeId);
  }, []);

  // Callbacks vacíos para props de ConfiguratorRight (las secciones usan IDs)
  const handleRefCallback = useCallback(() => {}, []);

  // Ref para almacenar el listener del panel derecho
  const rightPanelScrollListenerRef = useRef<(() => void) | null>(null);

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
    // Limpiar listeners anteriores si existen
    if (rightColumnRef.current) {
      if (scrollListenerRef.current) {
        rightColumnRef.current.removeEventListener('scroll', scrollListenerRef.current);
      }
      if (rightPanelScrollListenerRef.current) {
        rightColumnRef.current.removeEventListener('scroll', rightPanelScrollListenerRef.current);
      }
    }

    rightColumnRef.current = node;

    // Si hay un nuevo nodo, agregar los listeners
    if (node) {
      // Listener para StickyPrice
      scrollListenerRef.current = handleStickyScroll;
      node.addEventListener('scroll', handleStickyScroll, { passive: true });
      
      // Listener para detección de sección activa
      rightPanelScrollListenerRef.current = updateActiveSection;
      node.addEventListener('scroll', updateActiveSection, { passive: true });
      
      // Ejecutar inmediatamente para establecer estados iniciales
      handleStickyScroll();
      updateActiveSection();
    }
  }, [handleStickyScroll, updateActiveSection]);

  // También escuchar scroll del window (para móvil) y resize
  useEffect(() => {
    window.addEventListener('scroll', handleStickyScroll, { passive: true });
    window.addEventListener('scroll', updateActiveSection, { passive: true });
    window.addEventListener('resize', handleStickyScroll, { passive: true });
    window.addEventListener('resize', updateActiveSection, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleStickyScroll);
      window.removeEventListener('scroll', updateActiveSection);
      window.removeEventListener('resize', handleStickyScroll);
      window.removeEventListener('resize', updateActiveSection);
    };
  }, [handleStickyScroll, updateActiveSection]);

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
          {/* Fondo neutro por defecto */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-white" />

          {/* Imagen de modalidad seleccionada - sección 'other' (tabs de modalidad) */}
          <div 
            className={`absolute inset-0 transition-opacity duration-500 ${activeSection === 'other' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            <Image
              src={
                modalidadVenta === 'habi' 
                  ? '/Ultrarealistic_lifestyle_editorial_202602021.jpeg'
                  : modalidadVenta === 'inmobiliaria'
                  ? '/Ultrarealistic_lifestyle_editorial_202602021 (7).jpeg'
                  : '/Image_202602031441.jpeg'
              }
              alt={
                modalidadVenta === 'habi' 
                  ? 'Compra directa Habi'
                  : modalidadVenta === 'inmobiliaria'
                  ? 'Inmobiliaria'
                  : 'Venta propia'
              }
              fill
              className="object-cover"
              style={{ objectPosition: 'center 30%' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>

          {/* Imagen de configuración - sección 'configurator' */}
          <div 
            className={`absolute inset-0 transition-opacity duration-500 ${activeSection === 'configurator' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            <Image
              src="/Image_202602031055.jpeg"
              alt="Configuración de tu oferta"
              fill
              className="object-cover"
              style={{ objectPosition: 'center 30%' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>

          {/* Imagen de forma de pago - sección 'payment' */}
          <div 
            className={`absolute inset-0 transition-opacity duration-500 ${activeSection === 'payment' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            <Image
              src="/Ultrarealistic_lifestyle_editorial_202602031 (3).jpeg"
              alt="Forma de pago"
              fill
              className="object-cover"
              style={{ objectPosition: 'center 40%' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
          
          {/* Imagen del inmueble - sección 'property' */}
          <div 
            className={`absolute inset-0 transition-opacity duration-500 ${activeSection === 'property' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            <Image
              src="/Ultrarealistic_lifestyle_editorial_202602021 (8).jpeg"
              alt="Tu inmueble"
              fill
              className="object-cover"
              style={{ objectPosition: 'center 40%' }}
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
          
          {/* Mapa - sección 'comparables' */}
          <div 
            className={`absolute inset-0 transition-opacity duration-500 ${activeSection === 'comparables' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
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

          {/* Carrusel de videos - sección 'donation' (móvil) */}
          <div 
            className={`absolute inset-0 transition-opacity duration-500 ${activeSection === 'donation' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            <div className="relative h-full">
              <video 
                key={currentVideoIndex}
                src={DONATION_VIDEOS[currentVideoIndex]}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              
              {/* Flechas de navegación */}
              <button 
                onClick={() => setCurrentVideoIndex((prev) => (prev === 0 ? DONATION_VIDEOS.length - 1 : prev - 1))}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button 
                onClick={() => setCurrentVideoIndex((prev) => (prev === DONATION_VIDEOS.length - 1 ? 0 : prev + 1))}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Indicadores de posición */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                {DONATION_VIDEOS.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentVideoIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      idx === currentVideoIndex ? 'bg-white' : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </div>
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
            onPropertyRef={handleRefCallback}
            onComparablesRef={handleRefCallback}
            onSaleModalityRef={handleRefCallback}
            onDonationRef={handleRefCallback}
            comparables={comparables}
            selectedComparable={selectedComparable}
            onSelectComparable={setSelectedComparable}
          />
        </div>
      </div>

      {/* === LAYOUT DESKTOP === */}
      <div className="hidden md:flex flex-row flex-1">
        {/* Panel izquierdo - Imagen/Mapa fixed */}
        <div className="flex-1 relative">
          {/* Imagen de modalidad seleccionada (para sección 'other' - tabs de modalidad) */}
          <div 
            className={`
              fixed left-0 top-[90px] bottom-0 right-[480px] z-10
              transition-opacity duration-500
              ${activeSection === 'other' ? 'opacity-100' : 'opacity-0 pointer-events-none'}
            `}
          >
            <Image
              src={
                modalidadVenta === 'habi' 
                  ? '/Ultrarealistic_lifestyle_editorial_202602021.jpeg'
                  : modalidadVenta === 'inmobiliaria'
                  ? '/Ultrarealistic_lifestyle_editorial_202602021 (7).jpeg'
                  : '/Image_202602031441.jpeg'
              }
              alt={
                modalidadVenta === 'habi' 
                  ? 'Compra directa Habi'
                  : modalidadVenta === 'inmobiliaria'
                  ? 'Inmobiliaria'
                  : 'Venta propia'
              }
              fill
              className="object-cover"
              style={{ objectPosition: 'center 30%' }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
          </div>

          {/* Imagen de configuración - sección 'configurator' */}
          <div 
            className={`
              fixed left-0 top-[90px] bottom-0 right-[480px] z-10
              transition-opacity duration-500
              ${activeSection === 'configurator' ? 'opacity-100' : 'opacity-0 pointer-events-none'}
            `}
          >
            <Image
              src="/Image_202602031055.jpeg"
              alt="Configuración de tu oferta"
              fill
              className="object-cover"
              style={{ objectPosition: 'center 30%' }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
          </div>
          
          {/* Imagen del inmueble - sección 'property' */}
          <div 
            className={`
              fixed left-0 top-[90px] bottom-0 right-[480px] z-10
              transition-opacity duration-500
              ${activeSection === 'property' ? 'opacity-100' : 'opacity-0 pointer-events-none'}
            `}
          >
            <Image
              src="/Ultrarealistic_lifestyle_editorial_202602021 (8).jpeg"
              alt="Tu inmueble"
              fill
              className="object-cover"
              style={{ objectPosition: 'center 40%' }}
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
          </div>
          
          {/* Mapa - sección 'comparables' */}
          <div 
            className={`
              fixed left-0 top-[90px] bottom-0 right-[480px] z-10
              transition-opacity duration-500
              ${activeSection === 'comparables' ? 'opacity-100' : 'opacity-0 pointer-events-none'}
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

          {/* Imagen forma de pago - sección 'payment' */}
          <div 
            className={`
              fixed left-0 top-[90px] bottom-0 right-[480px] z-10
              transition-opacity duration-500
              ${activeSection === 'payment' ? 'opacity-100' : 'opacity-0 pointer-events-none'}
            `}
          >
            <Image
              src="/Ultrarealistic_lifestyle_editorial_202602031 (3).jpeg"
              alt="Forma de pago"
              fill
              className="object-cover"
              style={{ objectPosition: 'center 40%' }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
          </div>

          {/* Grid de videos - sección 'donation' (desktop) */}
          <div 
            className={`
              fixed left-0 top-[90px] bottom-0 right-[480px] z-10
              transition-opacity duration-500
              ${activeSection === 'donation' ? 'opacity-100' : 'opacity-0 pointer-events-none'}
            `}
          >
            <div className="grid grid-cols-2 gap-1 h-full p-1">
              {DONATION_VIDEOS.map((videoSrc, idx) => (
                <video 
                  key={idx}
                  src={videoSrc}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover rounded-lg"
                />
              ))}
            </div>
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
            onPropertyRef={handleRefCallback}
            onComparablesRef={handleRefCallback}
            onSaleModalityRef={handleRefCallback}
            onDonationRef={handleRefCallback}
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

      {/* Asistente de IA flotante */}
      <AIAssistant />
    </main>
  );
}
