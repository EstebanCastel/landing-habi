'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface InmuebleData {
  latitude: number;
  longitude: number;
  area: string;
  price: number;
}

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

interface ComparablesMapProps {
  inmueble: InmuebleData;
  comparables: Comparable[];
  selectedComparable: Comparable | null;
  onSelectComparable: (comparable: Comparable | null) => void;
}

// Crear iconos personalizados mejorados
const createUserIcon = () => {
  return L.divIcon({
    className: 'custom-marker-user',
    html: `
      <div style="
        position: relative;
        width: 48px;
        height: 48px;
      ">
        <!-- Pulso animado -->
        <div style="
          position: absolute;
          inset: 0;
          background: rgba(124, 58, 237, 0.3);
          border-radius: 50%;
          animation: pulse 2s infinite;
        "></div>
        <!-- Marcador principal -->
        <div style="
          position: absolute;
          inset: 8px;
          background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%);
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M12 2L3 9v11a2 2 0 002 2h4v-7h6v7h4a2 2 0 002-2V9l-9-7z"/>
          </svg>
        </div>
      </div>
      <style>
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
      </style>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -24]
  });
};

const createComparableIcon = (isSelected: boolean = false) => {
  const size = isSelected ? 36 : 28;
  const bgColor = isSelected ? '#7C3AED' : '#FFFFFF';
  const borderColor = isSelected ? '#5B21B6' : '#9CA3AF';
  const iconColor = isSelected ? '#FFFFFF' : '#6B7280';
  
  return L.divIcon({
    className: 'custom-marker-comparable',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${bgColor};
        border: 2px solid ${borderColor};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,${isSelected ? '0.25' : '0.15'});
        cursor: pointer;
        transition: all 0.2s ease;
      ">
        <svg width="${size * 0.45}" height="${size * 0.45}" viewBox="0 0 24 24" fill="${iconColor}">
          <path d="M12 2L3 9v11a2 2 0 002 2h4v-7h6v7h4a2 2 0 002-2V9l-9-7z"/>
        </svg>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
};

export default function ComparablesMap({ 
  inmueble, 
  comparables, 
  selectedComparable, 
  onSelectComparable 
}: ComparablesMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const prevSelectedRef = useRef<string | null>(null);

  const formatPrice = (price: number) => {
    return `$${Math.round(price).toLocaleString('es-CO')}`;
  };

  // Inicializar mapa
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || !inmueble) return;
    const lat = Number(inmueble.latitude);
    const lng = Number(inmueble.longitude);
    if (isNaN(lat) || isNaN(lng)) return;

    const map = L.map(mapRef.current, {
      center: [lat, lng],
      zoom: 16,
      zoomControl: false
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [inmueble.latitude, inmueble.longitude]);

  // Agregar marcadores
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Limpiar marcadores anteriores
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();

    // Agregar marcador del inmueble del usuario
    const userMarker = L.marker([inmueble.latitude, inmueble.longitude], {
      icon: createUserIcon(),
      zIndexOffset: 1000
    }).addTo(map);

    markersRef.current.set('user', userMarker);

    // Agregar marcadores de comparables
    comparables.forEach((comparable) => {
      const isSelected = selectedComparable?.nid === comparable.nid;
      const marker = L.marker([comparable.latitude, comparable.longitude], {
        icon: createComparableIcon(isSelected),
        zIndexOffset: isSelected ? 500 : 0
      }).addTo(map);

      marker.on('click', () => {
        onSelectComparable(isSelected ? null : comparable);
      });

      markersRef.current.set(comparable.nid, marker);
    });

    // Ajustar bounds
    const allPoints = [
      [inmueble.latitude, inmueble.longitude] as [number, number],
      ...comparables.map(c => [c.latitude, c.longitude] as [number, number])
    ];
    
    if (allPoints.length > 1) {
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [inmueble, comparables, selectedComparable, onSelectComparable]);

  // Actualizar iconos cuando cambia la selección
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    comparables.forEach((comparable) => {
      const marker = markersRef.current.get(comparable.nid);
      if (marker) {
        const isSelected = selectedComparable?.nid === comparable.nid;
        marker.setIcon(createComparableIcon(isSelected));
        marker.setZIndexOffset(isSelected ? 500 : 0);
      }
    });

    if (selectedComparable) {
      mapInstanceRef.current.setView(
        [selectedComparable.latitude, selectedComparable.longitude],
        17,
        { animate: true }
      );
      prevSelectedRef.current = selectedComparable.nid;
    } else {
      prevSelectedRef.current = null;
    }
  }, [selectedComparable, comparables]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Popup de información del comparable */}
      {selectedComparable && (
        <>
          {/* Overlay para cerrar en móvil */}
          <div 
            className="absolute inset-0 z-[999] md:hidden"
            onClick={() => onSelectComparable(null)}
          />
          
          {/* Card de información - Muy compacta en móvil, más grande en desktop */}
          <div className="absolute bottom-3 left-4 right-4 md:bottom-4 md:left-4 md:right-auto md:w-80 bg-white rounded-lg md:rounded-xl shadow-xl z-[1000]">
            {/* Botón cerrar */}
            <button 
              onClick={() => onSelectComparable(null)}
              className="absolute -top-2 -right-2 w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-full bg-white shadow-md border border-gray-200 hover:bg-gray-50 transition z-10"
            >
              <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Versión compacta para móvil */}
            <div className="md:hidden p-3">
              {/* Nombre y precio */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 truncate">
                    {selectedComparable.condominium || 'Inmueble comparable'}
                  </p>
                  <p className="text-lg font-bold text-gray-900 mt-0.5">
                    {formatPrice(selectedComparable.lastAskPrice)}
                  </p>
                </div>
                <span className="text-[11px] text-purple-600 font-medium bg-purple-50 px-1.5 py-0.5 rounded flex-shrink-0">
                  {formatPrice(selectedComparable.valormt2)}/m²
                </span>
              </div>
              
              {/* Características en fila */}
              <div className="flex items-center justify-center gap-2 text-[11px] text-gray-600 bg-gray-50 rounded-lg px-2 py-1.5">
                <span>{selectedComparable.area}m²</span>
                <span className="text-gray-300">•</span>
                <span>{selectedComparable.habitaciones} hab.</span>
                <span className="text-gray-300">•</span>
                <span>{selectedComparable.banos} baños</span>
                <span className="text-gray-300">•</span>
                <span>{selectedComparable.yearsOld || '-'} años</span>
              </div>
            </div>

            {/* Versión expandida para desktop */}
            <div className="hidden md:block p-4">
              {/* Header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L3 9v11a2 2 0 002 2h4v-7h6v7h4a2 2 0 002-2V9l-9-7z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 text-sm truncate">
                    {selectedComparable.condominium || 'Inmueble comparable'}
                  </h4>
                  <p className="text-xs text-gray-500 truncate">{selectedComparable.address}</p>
                </div>
              </div>

              {/* Precio */}
              <div className="bg-gradient-to-r from-purple-50 to-white rounded-lg p-3 mb-3">
                <p className="text-xs text-gray-500 mb-0.5">Precio publicado</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(selectedComparable.lastAskPrice)}
                </p>
                <p className="text-sm text-purple-600 font-medium mt-1">
                  {formatPrice(selectedComparable.valormt2)}/m²
                </p>
              </div>

              {/* Características en grid */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-sm font-bold text-gray-900">{selectedComparable.area}</p>
                  <p className="text-[10px] text-gray-500">m²</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-sm font-bold text-gray-900">{selectedComparable.habitaciones}</p>
                  <p className="text-[10px] text-gray-500">Hab.</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-sm font-bold text-gray-900">{selectedComparable.banos}</p>
                  <p className="text-[10px] text-gray-500">Baños</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-sm font-bold text-gray-900">{selectedComparable.yearsOld || '-'}</p>
                  <p className="text-[10px] text-gray-500">Años</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Leyenda - Compacta en móvil, normal en desktop */}
      <div className="absolute top-2 left-2 md:top-3 md:left-3 bg-white/95 backdrop-blur-sm rounded-lg md:rounded-xl p-2 md:p-3 shadow-lg z-[1000] border border-gray-100">
        <div className="flex items-center gap-1.5 md:gap-2.5 md:mb-2.5">
          <div className="w-4 h-4 md:w-5 md:h-5 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
            <svg className="w-2 h-2 md:w-2.5 md:h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L3 9v11a2 2 0 002 2h4v-7h6v7h4a2 2 0 002-2V9l-9-7z"/>
            </svg>
          </div>
          <span className="text-[10px] md:text-xs font-medium text-gray-700">Tu inmueble</span>
          
          {/* Separador solo en móvil (inline) */}
          <span className="text-gray-300 md:hidden">|</span>
          
          {/* Comparables en la misma línea en móvil */}
          <div className="flex items-center gap-1 md:hidden">
            <div className="w-3 h-3 bg-white rounded-full border-2 border-gray-400"></div>
            <span className="text-[10px] text-gray-600">Comp. ({comparables.length})</span>
          </div>
        </div>
        
        {/* Comparables en línea separada solo en desktop */}
        <div className="hidden md:flex items-center gap-2.5">
          <div className="w-4 h-4 bg-white rounded-full border-2 border-gray-400 flex items-center justify-center ml-0.5">
            <svg className="w-2 h-2 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L3 9v11a2 2 0 002 2h4v-7h6v7h4a2 2 0 002-2V9l-9-7z"/>
            </svg>
          </div>
          <span className="text-xs text-gray-600 ml-0.5">Comparables ({comparables.length})</span>
        </div>
      </div>

      {/* Instrucción para móvil cuando no hay selección */}
      {!selectedComparable && (
        <div className="absolute bottom-4 left-4 right-4 md:hidden">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg text-center border border-gray-100">
            <p className="text-xs text-gray-600">
              <span className="font-medium">Toca un marcador</span> para ver detalles del inmueble
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
