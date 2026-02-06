'use client';

/**
 * ConfiguratorRight - Wrapper component for backward compatibility
 * 
 * This component is now a thin wrapper around SectionRenderer.
 * It loads the sections configuration from JSON and passes all props
 * to the SectionRenderer for dynamic rendering.
 * 
 * To change section order or add/remove sections, edit:
 * app/config/sections.json
 */

import SectionRenderer from './SectionRenderer';
import sectionsConfig from '../../config/sections.json';
import { HabiConfiguration } from '../../types/habi';
import type { LandingConfig } from '../../config/componentsRegistry';

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

interface ConfiguratorRightProps {
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
}

export default function ConfiguratorRight(props: ConfiguratorRightProps) {
  const landingConfig = sectionsConfig as LandingConfig;
  
  return (
    <SectionRenderer
      sections={landingConfig.sections}
      {...props}
    />
  );
}
