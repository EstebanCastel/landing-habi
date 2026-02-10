'use client';

import { useMemo, useEffect, useRef, useCallback } from 'react';
import { getComponent, getVisibleSections, SectionConfig } from '../../config/componentsRegistry';
import { HabiConfiguration } from '../../types/habi';
import type { HubSpotProperties } from '../../lib/hubspot';
import type { HeshCostBreakdown } from '../../api/hesh/route';
import { analytics } from '../../lib/analytics';

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

interface SectionRendererProps {
  sections: SectionConfig[];
  // Props que se pasan a los componentes
  configuration: HabiConfiguration;
  setConfiguration: (config: HabiConfiguration) => void;
  currentPrice: number;
  valorMercado: number;
  propertyData: {
    direccion: string;
    tipoInmueble: string;
    area: string;
    conjunto: string;
    habitaciones: number;
    banos: number;
  };
  modalidadVenta: 'habi' | 'inmobiliaria' | 'cuenta_propia';
  setModalidadVenta: (modalidad: 'habi' | 'inmobiliaria' | 'cuenta_propia') => void;
  precioInmobiliaria: number;
  setPrecioInmobiliaria: (precio: number) => void;
  precioCuentaPropia: number;
  setPrecioCuentaPropia: (precio: number) => void;
  // Donación
  selectedDonation: string;
  donationAmount: number;
  onDonationChange: (optionId: string, amount: number) => void;
  // Refs para detectar visibilidad de secciones
  onPropertyRef?: (ref: HTMLDivElement | null) => void;
  onComparablesRef?: (ref: HTMLDivElement | null) => void;
  onSaleModalityRef?: (ref: HTMLDivElement | null) => void;
  onDonationRef?: (ref: HTMLDivElement | null) => void;
  // Comparables y mapa
  comparables: Comparable[];
  selectedComparable: Comparable | null;
  onSelectComparable: (comparable: Comparable | null) => void;
  // HubSpot BNPL
  bnplPrices?: HubSpotProperties | null;
  whatsappAsesor?: string;
  // HESH cost breakdown
  costBreakdown?: HeshCostBreakdown | null;
}

// Mapeo de refNames a las funciones de callback
const getRefCallback = (
  refName: string | undefined,
  props: SectionRendererProps
): ((ref: HTMLDivElement | null) => void) | undefined => {
  if (!refName) return undefined;
  
  const refMap: Record<string, ((ref: HTMLDivElement | null) => void) | undefined> = {
    property: props.onPropertyRef,
    comparables: props.onComparablesRef,
    saleModality: props.onSaleModalityRef,
    donation: props.onDonationRef,
  };
  
  return refMap[refName];
};

// Props específicas para cada componente
const getComponentProps = (
  section: SectionConfig,
  props: SectionRendererProps
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, any> => {
  const refCallback = getRefCallback(section.refName, props);
  
  switch (section.component) {
    case 'PropertyInfo':
      return {
        propertyData: props.propertyData,
        onSectionRef: refCallback,
      };
      
    case 'ComparablesSection': {
      // Evaluación = precio_comite_ORIGINAL (HubSpot) + todos los costos del desglose HESH
      let evaluacion = props.currentPrice;
      if (props.bnplPrices && props.costBreakdown) {
        const precioComiteOrig = Number(props.bnplPrices.precio_comite_original || props.bnplPrices.precio_comite || 0);
        const totalCostos =
          props.costBreakdown.comision.total +
          props.costBreakdown.gastosMensuales.total +
          props.costBreakdown.tarifaServicio.total +
          props.costBreakdown.tramites.total +
          props.costBreakdown.remodelacion.total;
        evaluacion = Math.round(precioComiteOrig + totalCostos);
      }
      return {
        onSectionRef: refCallback,
        comparables: props.comparables,
        selectedComparable: props.selectedComparable,
        onSelectComparable: props.onSelectComparable,
        ofertaHabi: evaluacion,
        country: props.bnplPrices?.country,
      };
    }
      
    case 'SaleModality':
      return {
        modalidadVenta: props.modalidadVenta,
        setModalidadVenta: props.setModalidadVenta,
        onSectionRef: refCallback,
        availableModalities: section.availableModalities,
        country: props.bnplPrices?.country,
      };
      
    case 'PersonalAdvisor':
      return {
        whatsappAsesor: props.whatsappAsesor,
      };
      
    case 'PaymentOptions':
      return {
        configuration: props.configuration,
        setConfiguration: props.setConfiguration,
        valorMercado: props.valorMercado,
        bnplPrices: props.bnplPrices,
      };
      
    case 'LiquiditySection':
      return {
        configuration: props.configuration,
        valorMercado: props.valorMercado,
        currentPrice: props.currentPrice,
        costBreakdown: props.costBreakdown,
        bnplPrices: props.bnplPrices,
      };
      
    case 'HabiDirectSection':
      return {
        configuration: props.configuration,
        setConfiguration: props.setConfiguration,
        currentPrice: props.currentPrice,
        valorMercado: props.valorMercado,
        selectedDonation: props.selectedDonation,
        donationAmount: props.donationAmount,
        onDonationChange: props.onDonationChange,
        onDonationRef: refCallback,
        whatsappAsesor: props.whatsappAsesor,
        costBreakdown: props.costBreakdown,
        showCostToggles: section.showCostToggles ?? false,
        showDonation: section.showDonation ?? true,
        bnplPrices: props.bnplPrices,
      };
      
    case 'InmobiliariaSection':
      return {
        precioInmobiliaria: props.precioInmobiliaria,
        setPrecioInmobiliaria: props.setPrecioInmobiliaria,
        valorMercado: props.valorMercado,
        selectedDonation: props.selectedDonation,
        donationAmount: props.donationAmount,
        onDonationChange: props.onDonationChange,
        onDonationRef: refCallback,
        whatsappAsesor: props.whatsappAsesor,
      };
      
    case 'SellByYourselfSection':
      return {
        precioCuentaPropia: props.precioCuentaPropia,
        setPrecioCuentaPropia: props.setPrecioCuentaPropia,
        valorMercado: props.valorMercado,
        setModalidadVenta: props.setModalidadVenta,
        selectedDonation: props.selectedDonation,
        donationAmount: props.donationAmount,
        onDonationChange: props.onDonationChange,
        onDonationRef: refCallback,
      };
      
    default:
      return {};
  }
};

export default function SectionRenderer(props: SectionRendererProps) {
  const { sections, modalidadVenta, bnplPrices } = props;
  
  // Determinar si BNPL está habilitado
  // México no tiene pago a cuotas → nunca mostrar sección de cuotas
  // Colombia: según negocio_aplica_para_bnpl (Si/No, true/false)
  // Si negocio_aplica_para_bnpl es null/undefined → no mostrar cuotas
  const isMx = bnplPrices?.country === 'MX';
  const negocioAplicaBnpl = bnplPrices?.negocio_aplica_para_bnpl?.toLowerCase().trim();
  const bnplEnabled = isMx
    ? 'false'
    : negocioAplicaBnpl && !['no', 'false', 'null'].includes(negocioAplicaBnpl)
      ? 'true'
      : 'false'; // null o "no"/"false" → no mostrar cuotas
  
  // Determinar si razón de venta es "Liquidez" (nombre interno "2")
  // Si es "2" o "Liquidez" → mostrar sección de liquidez
  const razonVentaLiquidez = bnplPrices?.razon_de_venta
    ? ['2', 'liquidez'].includes(bnplPrices.razon_de_venta.toLowerCase().trim())
      ? 'true'
      : 'false'
    : 'false'; // Default: no mostrar si no hay dato
  
  // Filtrar secciones visibles basándose en dependencias
  const visibleSections = useMemo(() => {
    return getVisibleSections(sections, { modalidadVenta, bnplEnabled, razonVentaLiquidez });
  }, [sections, modalidadVenta, bnplEnabled, razonVentaLiquidez]);
  
  // ─── Analytics: trackear secciones visibles en viewport ───
  const trackedSectionsRef = useRef<Set<string>>(new Set());
  const country = bnplPrices?.country ?? 'CO';

  const sectionRefCallback = useCallback((node: HTMLDivElement | null, sectionId: string) => {
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !trackedSectionsRef.current.has(sectionId)) {
          trackedSectionsRef.current.add(sectionId);
          analytics.sectionViewed(sectionId, country);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(node);
  }, [country]);

  // Reset tracked sections cuando cambia el deal
  useEffect(() => {
    trackedSectionsRef.current.clear();
  }, [props.bnplPrices?.nid]);

  return (
    <div className="pb-24">
      {visibleSections.map((section) => {
        const Component = getComponent(section.component);
        
        if (!Component) {
          console.warn(`Component "${section.component}" not found in registry`);
          return null;
        }
        
        const componentProps = getComponentProps(section, props);
        
        return (
          <div key={section.id} ref={(node) => sectionRefCallback(node, section.id)} data-section={section.id} data-country={country}>
            <Component {...componentProps} />
          </div>
        );
      })}
    </div>
  );
}

// Export helper para obtener la configuración de panel basándose en la sección activa
export function getPanelConfig(
  sections: SectionConfig[],
  activeSection: string,
  modalidadVenta: 'habi' | 'inmobiliaria' | 'cuenta_propia'
): { type: string; image?: string; position?: string } | null {
  // Mapear activeSection a refName
  const refNameMap: Record<string, string> = {
    property: 'property',
    comparables: 'comparables',
    other: 'saleModality',
    configurator: 'donation',
    payment: 'payment-options',
    donation: 'donation',
  };
  
  const targetRefName = refNameMap[activeSection];
  
  // Buscar la sección correspondiente
  const section = sections.find((s) => {
    if (activeSection === 'other') {
      return s.id === 'sale-modality';
    }
    if (activeSection === 'payment') {
      return s.id === 'payment-options';
    }
    if (activeSection === 'configurator') {
      // Para configurator, buscar la sección activa según modalidad
      if (modalidadVenta === 'habi') return s.id === 'habi-direct';
      if (modalidadVenta === 'inmobiliaria') return s.id === 'inmobiliaria';
      if (modalidadVenta === 'cuenta_propia') return s.id === 'sell-by-yourself';
    }
    return s.refName === targetRefName;
  });
  
  if (!section) return null;
  
  // Para panelType dynamic-modality, obtener la imagen según modalidad
  if (section.panelType === 'dynamic-modality' && section.panelImages) {
    return {
      type: 'image',
      image: section.panelImages[modalidadVenta],
      position: section.panelImagePosition,
    };
  }
  
  return {
    type: section.panelType,
    image: section.panelImage,
    position: section.panelImagePosition,
  };
}
