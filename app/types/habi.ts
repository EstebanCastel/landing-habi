// Tipos para el configurador de oferta de Habi

export interface HabiConfiguration {
  tramites: 'habi' | 'cliente'; // Quién paga los trámites
  remodelacion: 'habi' | 'cliente'; // Quién hace la remodelación
  formaPago: 'contado' | '3cuotas' | '6cuotas' | '9cuotas';
}

export interface PricingBreakdown {
  valorMercado: number;
  precioBase: number; // Precio de contado sin opciones
  costosRemodelacion: number; // 3%
  costosTramites: number; // 4%
  propertyMensual: number; // 0.8% (5 meses)
  comisionTotal: number; // 4.4% (seller + buyer + broker)
  costoFinanciero: number;
  utilidadNeta: number; // 5%
}

export interface PaymentOption {
  id: 'contado' | '3cuotas' | '6cuotas' | '9cuotas';
  label: string;
  percentage: number; // 0%, +0.8%, +2.1%, +3.4%
  description: string;
  badge?: string;
  recommended?: boolean;
}

export const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: '9cuotas',
    label: 'Te pagamos en 9 cuotas',
    percentage: 3.4,
    description: 'Mejor precio total • Más flexibilidad',
    badge: '+3.4%',
    recommended: true
  },
  {
    id: '6cuotas',
    label: 'Te pagamos en 6 cuotas',
    percentage: 2.1,
    description: 'Equilibrio perfecto',
    badge: '+2.1%'
  },
  {
    id: '3cuotas',
    label: 'Te pagamos en 3 cuotas',
    percentage: 0.8,
    description: 'Pagos más rápidos',
    badge: '+0.8%'
  },
  {
    id: 'contado',
    label: 'Pago inmediato',
    percentage: 0,
    description: 'Liquidez inmediata',
    badge: 'BASE'
  }
];

// Porcentajes de costos
export const COSTOS_PERCENTAGES = {
  remodelacion: 3.0, // 3%
  tramites: 4.0, // 4%
  propertyMensual: 0.8, // 0.8%
  comisionTotal: 4.4, // 4.4%
  utilidadNeta: 5.0 // 5%
};

