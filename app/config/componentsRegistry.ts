import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

// Importación dinámica de componentes para mejor performance
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const componentsRegistry: Record<string, ComponentType<any>> = {
  PropertyInfo: dynamic(() => import('../habi/components/PropertyInfo')),
  ComparablesSection: dynamic(() => import('../habi/components/ComparablesSection')),
  SaleModality: dynamic(() => import('../habi/components/SaleModality')),
  PaymentOptions: dynamic(() => import('../habi/components/PaymentOptions')),
  LiquiditySection: dynamic(() => import('../habi/components/LiquiditySection')),
  HabiDirectSection: dynamic(() => import('../habi/components/HabiDirectSection')),
  InmobiliariaSection: dynamic(() => import('../habi/components/InmobiliariaSection')),
  SellByYourselfSection: dynamic(() => import('../habi/components/SellByYourselfSection')),
  PersonalAdvisor: dynamic(() => import('../habi/components/PersonalAdvisor')),
};

// Tipos para la configuración de secciones
export interface SectionConfig {
  id: string;
  component: string;
  panelImage?: string;
  panelImages?: Record<string, string>;
  panelType: 'image' | 'map' | 'dynamic-modality' | 'videos' | 'none';
  panelImagePosition?: string;
  refName?: string;
  dependsOn?: Record<string, string>;
  enabled: boolean;
  // Configuraciones específicas de componentes
  availableModalities?: ('habi' | 'inmobiliaria' | 'cuenta_propia')[];
  showCostToggles?: boolean;
  showDonation?: boolean;
}

export interface LandingConfig {
  sections: SectionConfig[];
  showChatbot?: boolean;
  donationVideos: string[];
}

// Función helper para obtener el componente desde el registro
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getComponent(componentName: string): ComponentType<any> | null {
  return componentsRegistry[componentName] || null;
}

// Función para filtrar secciones habilitadas y que cumplen dependencias
export function getVisibleSections(
  sections: SectionConfig[],
  state: Record<string, string>
): SectionConfig[] {
  return sections.filter((section) => {
    if (!section.enabled) return false;
    
    if (section.dependsOn) {
      return Object.entries(section.dependsOn).every(([key, value]) => {
        return state[key] === value;
      });
    }
    
    return true;
  });
}
