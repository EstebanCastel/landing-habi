'use client';

import { HabiConfiguration } from '../../types/habi';
import PropertyInfo from './PropertyInfo';
import ComparablesSection from './ComparablesSection';
import SaleModality from './SaleModality';
import PaymentOptions from './PaymentOptions';
import HabiDirectSection from './HabiDirectSection';
import InmobiliariaSection from './InmobiliariaSection';
import SellByYourselfSection from './SellByYourselfSection';

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
  // Comparables y mapa
  onComparablesVisibility?: (isVisible: boolean) => void;
  comparables: Comparable[];
  selectedComparable: Comparable | null;
  onSelectComparable: (comparable: Comparable | null) => void;
}

export default function ConfiguratorRight({
  configuration,
  setConfiguration,
  currentPrice,
  valorMercado,
  propertyData,
  modalidadVenta,
  setModalidadVenta,
  precioInmobiliaria,
  setPrecioInmobiliaria,
  precioCuentaPropia,
  setPrecioCuentaPropia,
  selectedDonation,
  donationAmount,
  onDonationChange,
  onComparablesVisibility,
  comparables,
  selectedComparable,
  onSelectComparable
}: ConfiguratorRightProps) {
  return (
    <div className="pb-24">
      {/* Información del inmueble */}
      <PropertyInfo propertyData={propertyData} />

      {/* Análisis de mercado con mapa */}
      <ComparablesSection 
        onVisibilityChange={onComparablesVisibility}
        comparables={comparables}
        selectedComparable={selectedComparable}
        onSelectComparable={onSelectComparable}
        ofertaHabi={currentPrice}
      />

      {/* Modalidad de venta */}
      <SaleModality 
        modalidadVenta={modalidadVenta} 
        setModalidadVenta={setModalidadVenta} 
      />

      {/* Forma de pago - Solo para Habi te compra */}
      {modalidadVenta === 'habi' && (
        <PaymentOptions 
          configuration={configuration}
          setConfiguration={setConfiguration}
          valorMercado={valorMercado}
        />
      )}

      {/* Contenido de Habi te compra */}
      {modalidadVenta === 'habi' && (
        <HabiDirectSection
          configuration={configuration}
          setConfiguration={setConfiguration}
          currentPrice={currentPrice}
          valorMercado={valorMercado}
          selectedDonation={selectedDonation}
          donationAmount={donationAmount}
          onDonationChange={onDonationChange}
        />
      )}

      {/* Contenido de Inmobiliaria */}
      {modalidadVenta === 'inmobiliaria' && (
        <InmobiliariaSection
          precioInmobiliaria={precioInmobiliaria}
          setPrecioInmobiliaria={setPrecioInmobiliaria}
          valorMercado={valorMercado}
          selectedDonation={selectedDonation}
          donationAmount={donationAmount}
          onDonationChange={onDonationChange}
        />
      )}

      {/* Contenido de Vender por mi cuenta */}
      {modalidadVenta === 'cuenta_propia' && (
        <SellByYourselfSection
          precioCuentaPropia={precioCuentaPropia}
          setPrecioCuentaPropia={setPrecioCuentaPropia}
          valorMercado={valorMercado}
          setModalidadVenta={setModalidadVenta}
          selectedDonation={selectedDonation}
          onDonationChange={onDonationChange}
        />
      )}
    </div>
  );
}
