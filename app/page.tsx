'use client';

import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import posthog from 'posthog-js';
import { useSearchParams, usePathname } from 'next/navigation';
import OfferCountdown from './habi/components/OfferCountdown';
import Navbar from './habi/components/Navbar';
import SectionRenderer from './habi/components/SectionRenderer';
import StickyPrice from './habi/components/StickyPrice';
import AIAssistant from './habi/components/AIAssistant';
import LandingB from './landing-b/LandingB';
import { HabiConfiguration, PAYMENT_OPTIONS, COSTOS_PERCENTAGES } from './types/habi';
import { getHubSpotProperties, type HubSpotProperties } from './lib/hubspot';
import { analytics, initScrollTracking, initPageTimeTracking } from './lib/analytics';
import type { HeshCostBreakdown } from './api/hesh/route';
import GoogleAnalytics from './components/google-analytics';
import SegmentScript from './components/segment-analytics';
import PageViewTracker from './components/page-view-tracker';
import sectionsConfig from './config/sections.json';
import type { LandingConfig } from './config/componentsRegistry';

// Importar el mapa dinámicamente para evitar SSR issues con Leaflet
const ComparablesMap = dynamic(() => import('./habi/components/ComparablesMap'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center">
      <span className="text-gray-400">Cargando mapa...</span>
    </div>
  )
});

// Datos de la propiedad - valorMercado se actualizará con datos de HubSpot
const DEFAULT_PROPERTY_DATA = {
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

// Regex para detectar UUID en el pathname
const UUID_REGEX = /^\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

function HomeContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  // Detectar deal_uuid desde query param (?deal_uuid=...) o desde el path (/uuid)
  const dealUuidFromQuery = searchParams.get('deal_uuid')?.trim() ?? null;
  const pathMatch = pathname.match(UUID_REGEX);
  const dealUuidFromPath = pathMatch ? pathMatch[1] : null;
  const dealUuid = dealUuidFromQuery || dealUuidFromPath;
  
  // Soporte para nid directo (?nid=...) — permite consultar BigQuery sin depender de HubSpot
  // Uso: http://localhost:3000?nid=46452147125 (para desarrollo/testing)
  const directNid = searchParams.get('nid')?.trim() ?? null;

  const [isLoading, setIsLoading] = useState(true);
  const [hubspotLoading, setHubspotLoading] = useState(!!dealUuid);
  const [hubspotFailed, setHubspotFailed] = useState(false);
  const [bnplPrices, setBnplPrices] = useState<HubSpotProperties | null>(null);
  
  // A/B/C Test state (PostHog Feature Flag)
  const [abcGroup, setAbcGroup] = useState<string | null>(null);
  const [abcGroupWritten, setAbcGroupWritten] = useState(false);
  const [showStickyPrice, setShowStickyPrice] = useState(true);
  // Sección activa: 'property' (imagen), 'comparables' (mapa), 'configurator' (imagen config), 'payment' (imagen cuotas), 'donation' (videos), 'other' (fondo neutro)
  const [activeSection, setActiveSection] = useState<'property' | 'comparables' | 'configurator' | 'payment' | 'donation' | 'other'>('property');
  
  // Datos del mapa
  const [inmueble, setInmueble] = useState<InmuebleData | null>(null);
  const [comparables, setComparables] = useState<Comparable[]>([]);
  const [selectedComparable, setSelectedComparable] = useState<Comparable | null>(null);
  
  // Datos de costos HESH (desglose real)
  const [costBreakdown, setCostBreakdown] = useState<HeshCostBreakdown | null>(null);

  const mapComparables = useMemo(() => {
    return comparables;
  }, [comparables, bnplPrices?.country]);
  
  // Configuración de la oferta
  // tramites/remodelacion default 'habi' = Habi se encarga (secciones de toggle deshabilitadas por ahora)
  const [configuration, setConfiguration] = useState<HabiConfiguration>({
    tramites: 'habi',
    remodelacion: 'habi',
    formaPago: '9cuotas'
  });

  // Mapear tipo_inmueble_id a nombre legible
  const getTipoInmueble = (tipoId: string | null | undefined): string => {
    if (!tipoId) return DEFAULT_PROPERTY_DATA.tipoInmueble;
    const tipos: Record<string, string> = {
      '1': 'Apartamento',
      '2': 'Casa',
      '3': 'Oficina',
      '4': 'Local',
      '5': 'Lote',
      '6': 'Finca',
      '7': 'Bodega',
    };
    return tipos[tipoId] || tipoId;
  };

  // Datos dinámicos basados en HubSpot (con fallback a datos por defecto)
  const PROPERTY_DATA = {
    ...DEFAULT_PROPERTY_DATA,
    valorMercado: bnplPrices
      ? (Number(bnplPrices.bnpl9 || 0) > 0
        ? Number(bnplPrices.bnpl9)
        : Number(bnplPrices.precio_comite || DEFAULT_PROPERTY_DATA.valorMercado))
      : DEFAULT_PROPERTY_DATA.valorMercado,
    conjunto: bnplPrices?.nombre_del_conjunto || DEFAULT_PROPERTY_DATA.conjunto,
    area: bnplPrices?.area_construida ? `${bnplPrices.area_construida} m²` : DEFAULT_PROPERTY_DATA.area,
    direccion: bnplPrices?.direccion || DEFAULT_PROPERTY_DATA.direccion,
    habitaciones: bnplPrices?.numero_habitaciones ? Number(bnplPrices.numero_habitaciones) : DEFAULT_PROPERTY_DATA.habitaciones,
    banos: bnplPrices?.numero_de_banos ? Number(bnplPrices.numero_de_banos) : DEFAULT_PROPERTY_DATA.banos,
    tipoInmueble: getTipoInmueble(bnplPrices?.tipo_inmueble_id),
  };

  // Estados para modalidad de venta
  const [modalidadVenta, setModalidadVenta] = useState<'habi' | 'inmobiliaria' | 'cuenta_propia'>('habi');
  const [precioInmobiliaria, setPrecioInmobiliaria] = useState(PROPERTY_DATA.valorMercado);
  const [precioCuentaPropia, setPrecioCuentaPropia] = useState(PROPERTY_DATA.valorMercado);

  // Cargar datos de HubSpot si hay deal_uuid
  useEffect(() => {
    if (!dealUuid) {
      setHubspotLoading(false);
      return;
    }

    const loadHubSpotData = async () => {
      setHubspotLoading(true);
      const data = await getHubSpotProperties(dealUuid);
      if (data) {
        setBnplPrices(data);
        // Actualizar precios basados en HubSpot
        const bnbl9Num = Number(data.bnpl9 || 0);
        const valorMercado = bnbl9Num > 0 ? bnbl9Num : Number(data.precio_comite || DEFAULT_PROPERTY_DATA.valorMercado);
        setPrecioInmobiliaria(valorMercado);
        setPrecioCuentaPropia(valorMercado);
        // Analytics: HubSpot cargado exitosamente
        analytics.hubspotLoaded(dealUuid, data.country || 'CO');
      } else {
        // HubSpot falló o no devolvió datos
        setHubspotFailed(true);
        analytics.hubspotError(dealUuid, 'no_data_returned');
      }
      setHubspotLoading(false);
    };

    loadHubSpotData();

    // Timeout de seguridad (15 segundos)
    const timeout = setTimeout(() => {
      setHubspotLoading(false);
    }, 15000);

    return () => clearTimeout(timeout);
  }, [dealUuid]);

  // A/B/C Test: Deterministic hash assignment (consistent per UUID)
  // Uses the same principle as PostHog feature flags: hash(uuid) -> group
  // This avoids client-side PostHog flag loading issues
  useEffect(() => {
    if (!dealUuid || !bnplPrices) return;
    
    // Solo aplicar A/B/C test para Colombia
    const isCO = bnplPrices.country === 'CO' || !bnplPrices.country;
    if (!isCO) {
      setAbcGroup('C'); // MX siempre landing modular
      return;
    }

    // Deterministic hash: same UUID always returns the same group
    const hashUuid = (uuid: string): number => {
      let hash = 0;
      for (let i = 0; i < uuid.length; i++) {
        const char = uuid.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32-bit integer
      }
      return Math.abs(hash);
    };

    const groups: ('A' | 'B')[] = ['A', 'B'];
    const group = groups[hashUuid(dealUuid) % 2];
    
    console.log(`[AB Test] Deal ${dealUuid} -> hash ${hashUuid(dealUuid)} -> group: ${group}`);
    setAbcGroup(group);

    // Track assignment in PostHog for analytics
    try {
      posthog.identify(dealUuid);
      posthog.capture('ab_test_assigned', {
        group,
        deal_uuid: dealUuid,
        country: 'CO',
      });
    } catch (e) {
      console.warn('[ABC Test] PostHog tracking failed:', e);
    }
  }, [dealUuid, bnplPrices]);

  // Write ABC group to HubSpot (once)
  useEffect(() => {
    if (!abcGroup || abcGroupWritten || !dealUuid) return;
    
    const writeGroup = async () => {
      try {
        const res = await fetch('/api/hubspot/abc-group', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deal_uuid: dealUuid,
            group: abcGroup,
          }),
        });
        if (res.ok) {
          setAbcGroupWritten(true);
          console.log(`[ABC Test] Group ${abcGroup} written to HubSpot`);
        }
      } catch (err) {
        console.error('[ABC Test] Failed to write group to HubSpot:', err);
      }
    };
    writeGroup();
  }, [abcGroup, abcGroupWritten, dealUuid]);

  // Ajustar formaPago a 'contado' si BNPL no está disponible
  useEffect(() => {
    if (!bnplPrices) return;
    
    // Verificar si BNPL está disponible
    const negocioAplicaBnpl = bnplPrices.negocio_aplica_para_bnpl?.toLowerCase().trim();
    const hasBnpl = negocioAplicaBnpl && !['no', 'false', 'null'].includes(negocioAplicaBnpl);
    
    // Si BNPL no está disponible y formaPago no es 'contado', cambiar a 'contado'
    if (!hasBnpl && configuration.formaPago !== 'contado') {
      setConfiguration(prev => ({ ...prev, formaPago: 'contado' }));
    }
  }, [bnplPrices, configuration.formaPago]);

  // Actualizar título de página y favicon según país (CO = Habi, MX = TuHabi)
  useEffect(() => {
    if (!bnplPrices) return;
    const isMx = bnplPrices.country === 'MX';
    
    document.title = isMx ? 'TuHabi | Vende tu inmueble' : 'Habi | Vende tu inmueble';
    
    // Actualizar favicon
    const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
    if (link) {
      link.href = isMx ? '/tuhabi.svg' : '/Logo-1200x1200.png';
    }
  }, [bnplPrices?.country]);

  // ─── Analytics: pageview, scroll depth, tiempo en página (ONLY for group C) ───
  useEffect(() => {
    // Track analytics for both groups A and B

    const country = bnplPrices?.country ?? 'CO';
    analytics.pageView(dealUuid ? `offer_${dealUuid}` : 'home', { dealUuid: dealUuid || undefined, country });

    const cleanupScroll = initScrollTracking(country);
    const cleanupPageTime = initPageTimeTracking(country);

    // Enable PostHog session recording for group B (modular landing)
    if (abcGroup === 'B') {
      try { posthog.startSessionRecording(); } catch { /* ignore if not available */ }
    }

    return () => {
      if (cleanupScroll) cleanupScroll();
      if (cleanupPageTime) cleanupPageTime();
    };
  }, [dealUuid, bnplPrices?.country, abcGroup]);

  // Estado de donación
  const [selectedDonation, setSelectedDonation] = useState('');
  const [donationAmount, setDonationAmount] = useState(0);

  // Cargar configuración de secciones
  const landingConfig = sectionsConfig as LandingConfig;

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

  // Cargar datos del mapa y comparables desde BigQuery
  // Ya no hay fallback a datos estáticos - si falla, simplemente no se muestran comparables
  useEffect(() => {
    const loadFromBigQuery = async (nid: string) => {
      try {
        // Cargar comparables y HESH en paralelo
        const [comparablesRes, heshRes] = await Promise.all([
          fetch(`/api/comparables?nid=${nid}`),
          fetch(`/api/hesh?nid=${nid}`),
        ]);
        
        if (comparablesRes.ok) {
          const data = await comparablesRes.json();
          
          if (data.inmueble) {
            setInmueble(data.inmueble);
          }
          
          if (data.comparables && data.comparables.length > 0) {
            setComparables(data.comparables);
            analytics.dataLoaded('comparables', 'CO', nid);
          }
        }
        
        // Cargar HESH cost breakdown
        if (heshRes.ok) {
          const heshData = await heshRes.json();
          if (heshData.costBreakdown) {
            // Sumar valor_reparaciones de HubSpot a remodelacion
            const valorReparaciones = Number(bnplPrices?.valor_reparaciones || 0);
            if (valorReparaciones > 0) {
              heshData.costBreakdown.remodelacion.total += valorReparaciones;
              heshData.costBreakdown.remodelacion.mejoras += valorReparaciones;
            }
            setCostBreakdown(heshData.costBreakdown);
            analytics.dataLoaded('hesh', 'CO', nid);
          }
        }
        
        setTimeout(() => setIsLoading(false), 800);
      } catch (error) {
        console.error('Error loading from BigQuery:', error);
        setIsLoading(false);
      }
    };

    // Función para cargar HESH y Comparables para MX
    const loadDataMX = async (nid: string) => {
      console.log('[MX] Loading data for nid:', nid);
      try {
        // Cargar HESH y Comparables en paralelo
        const [heshRes, comparablesRes] = await Promise.all([
          fetch(`/api/hesh?nid=${nid}&country=MX`),
          fetch(`/api/comparables?nid=${nid}&country=MX`)
        ]);
        
        // Procesar HESH
        if (heshRes.ok) {
          const heshData = await heshRes.json();
          console.log('[MX HESH] costBreakdown received:', heshData.costBreakdown ? 'yes' : 'no');
          if (heshData.costBreakdown) {
            // Sumar valor_reparaciones de HubSpot a remodelacion
            const valorReparaciones = Number(bnplPrices?.valor_reparaciones || 0);
            if (valorReparaciones > 0) {
              heshData.costBreakdown.remodelacion.total += valorReparaciones;
              heshData.costBreakdown.remodelacion.mejoras += valorReparaciones;
            }
            setCostBreakdown(heshData.costBreakdown);
            analytics.dataLoaded('hesh', 'MX', nid);
          }
        }
        
        // Procesar Comparables
        if (comparablesRes.ok) {
          const comparablesData = await comparablesRes.json();
          console.log('[MX Comparables] count:', comparablesData.comparables?.length || 0);
          if (comparablesData.comparables && comparablesData.comparables.length > 0) {
            setComparables(comparablesData.comparables);
            analytics.dataLoaded('comparables', 'MX', nid);
          }
          if (comparablesData.inmueble) {
            setInmueble(comparablesData.inmueble);
          }
        }
      } catch (error) {
        console.error('Error loading MX data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const country = bnplPrices?.country ?? 'CO';
    
    // MX: cargar HESH y Comparables con queries específicas para México
    if (country === 'MX') {
      const nid = directNid || bnplPrices?.nid;
      if (nid) {
        loadDataMX(nid);
      } else {
        setCostBreakdown(null);
        setComparables([]);
        setInmueble(null);
        setIsLoading(false);
      }
      return;
    }

    // CO: Prioridad: 1) nid directo por URL, 2) nid de HubSpot
    // Ya no hay fallback a datos estáticos - si no hay datos válidos, se muestra página de error
    if (directNid) {
      loadFromBigQuery(directNid);
    } else if (bnplPrices?.nid) {
      loadFromBigQuery(bnplPrices.nid);
    } else {
      // Sin nid disponible, terminar carga
      setIsLoading(false);
    }
  }, [directNid, bnplPrices?.nid, bnplPrices?.country]);

  // Calcular precio según configuración
  // Si hay datos de HubSpot, usar los valores BNPL directos; si no, calcular con fórmula
  const calculatePrice = () => {
    if (bnplPrices) {
      // Con datos de HubSpot: usar el valor BNPL correspondiente a la forma de pago seleccionada
      const bnplMap: Record<string, string | undefined> = {
        'contado': bnplPrices.precio_comite,
        '3cuotas': bnplPrices.bnpl3,
        '6cuotas': bnplPrices.bnpl6,
        '9cuotas': bnplPrices.bnpl9,
      };
      const value = bnplMap[configuration.formaPago];
      // Si el valor BNPL es 0 o no existe, usar precio_comite como fallback
      const numValue = Number(value || 0);
      let price = Math.round(numValue > 0 ? numValue : Number(bnplPrices.precio_comite || 0));
      
      // Si el usuario elige pagar trámites, sumar el costo real de trámites
      if (configuration.tramites === 'cliente' && costBreakdown) {
        price += Math.round(costBreakdown.tramites.total);
      }
      // Si el usuario elige hacer remodelaciones, sumar ese costo
      if (configuration.remodelacion === 'cliente' && costBreakdown) {
        price += Math.round(costBreakdown.remodelacion.total);
      }
      
      return price;
    }

    // Sin datos de HubSpot: calcular con fórmula
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

  // Loading screen (datos del mapa o HubSpot)
  if (isLoading || hubspotLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
          {hubspotLoading && (
            <p className="text-sm text-gray-500">Cargando tu propuesta personalizada...</p>
          )}
        </div>
      </div>
    );
  }

  // Si no hay deal_uuid o hubo error al cargar datos de HubSpot, mostrar pantalla de acceso no válido
  if (!dealUuid || hubspotFailed) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <svg className="w-24 h-24 mx-auto text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Acceso no válido</h1>
          <p className="text-gray-600 mb-6">
            Para acceder a tu propuesta personalizada, necesitas un enlace único proporcionado por tu asesor de Habi.
          </p>
          <p className="text-sm text-gray-500">
            Si tienes un enlace, por favor úsalo para acceder a tu propuesta de compra.
          </p>
        </div>
      </div>
    );
  }

  // A/B Test: A = landing basica, B = landing modular (Colombia only)
  if (bnplPrices && abcGroup === 'A') {
    return (
      <>
        <GoogleAnalytics />
        <SegmentScript />
        <Suspense fallback={null}>
          <PageViewTracker />
        </Suspense>
        <LandingB properties={bnplPrices} dealUuid={dealUuid} />
      </>
    );
  }

  // Waiting for AB group assignment (show loading briefly) - CO or undefined country
  if (bnplPrices && !abcGroup && (bnplPrices.country === 'CO' || !bnplPrices.country)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Group B (or MX): Render the modular landing (current)
  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* Analytics only for Group C */}
      <GoogleAnalytics />
      <SegmentScript />
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
      {/* Header sticky - Countdown + Navbar */}
      <div className="sticky top-0 z-50">
        <OfferCountdown dealUuid={dealUuid} />
        <Navbar activeCountry={bnplPrices?.country ?? 'CO'} />
      </div>

      {/* === LAYOUT MÓVIL === */}
      <div className="md:hidden flex flex-col flex-1">
        {/* Panel superior FIJO en móvil - debajo del header */}
        <div 
          className="sticky bg-white z-40 border-b border-gray-100"
          style={{ 
            top: `${mobileHeaderHeight}px`,
            height: '220px'
          }}
        >
          {/* Casa SVG - para todas las secciones excepto comparables */}
          <div 
            className={`absolute inset-0 transition-opacity duration-500 bg-white flex items-center justify-center ${activeSection !== 'comparables' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            <Image
              src="/casa.svg"
              alt="Tu inmueble"
              width={500}
              height={500}
              className="w-40 h-40 sm:w-48 sm:h-48 object-contain scale-150"
              priority
            />
          </div>

          {/* Mapa - sección 'comparables' */}
          <div 
            className={`absolute inset-0 transition-opacity duration-500 ${activeSection === 'comparables' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            {inmueble && mapComparables.length > 0 && (
              <ComparablesMap
                inmueble={{
                  latitude: inmueble.latitude,
                  longitude: inmueble.longitude,
                  area: inmueble.area,
                  price: inmueble.last_ask_price
                }}
                comparables={mapComparables}
                selectedComparable={selectedComparable}
                onSelectComparable={setSelectedComparable}
              />
            )}
          </div>

          
        </div>

        {/* Configurador scrolleable en móvil */}
        <div className="flex-1 bg-white pb-24">
          <SectionRenderer
            sections={landingConfig.sections}
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
            bnplPrices={bnplPrices}
            whatsappAsesor={bnplPrices?.whatsapp_asesor}
            costBreakdown={costBreakdown}
          />
        </div>
      </div>

      {/* === LAYOUT DESKTOP === */}
      <div className="hidden md:flex flex-row flex-1">
        {/* Panel izquierdo - Imagen/Mapa fixed */}
        <div className="flex-1 relative">
          {/* Casa SVG - para todas las secciones excepto comparables */}
          <div 
            className={`
              fixed left-0 top-[90px] bottom-0 right-[480px] z-10
              transition-opacity duration-500
              ${activeSection !== 'comparables' ? 'opacity-100' : 'opacity-0 pointer-events-none'}
            `}
          >
            <div className="w-full h-full bg-white flex items-center justify-center">
              <Image
                src="/casa.svg"
                alt="Tu inmueble"
                width={800}
                height={800}
                className="w-[32rem] h-[32rem] lg:w-[40rem] lg:h-[40rem] xl:w-[48rem] xl:h-[48rem] object-contain"
                priority
              />
            </div>
          </div>
          
          {/* Mapa - sección 'comparables' */}
          <div 
            className={`
              fixed left-0 top-[90px] bottom-0 right-[480px] z-10
              transition-opacity duration-500
              ${activeSection === 'comparables' ? 'opacity-100' : 'opacity-0 pointer-events-none'}
            `}
          >
            {inmueble && mapComparables.length > 0 && (
              <ComparablesMap
                inmueble={{
                  latitude: inmueble.latitude,
                  longitude: inmueble.longitude,
                  area: inmueble.area,
                  price: inmueble.last_ask_price
                }}
                comparables={mapComparables}
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
          <SectionRenderer
            sections={landingConfig.sections}
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
            bnplPrices={bnplPrices}
            whatsappAsesor={bnplPrices?.whatsapp_asesor}
            costBreakdown={costBreakdown}
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
        evaluacionInmueble={costBreakdown ? Math.round(costBreakdown.askPrice) : undefined}
        whatsappAsesor={bnplPrices?.whatsapp_asesor}
        country={bnplPrices?.country}
      />

      {/* Asistente de IA flotante */}
      {landingConfig.showChatbot !== false && <AIAssistant />}
    </main>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <HomeContent />
    </Suspense>
  );
}
