'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

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

interface ComparablesSectionProps {
  onVisibilityChange?: (isVisible: boolean) => void;
  comparables: Comparable[];
  selectedComparable: Comparable | null;
  onSelectComparable: (comparable: Comparable | null) => void;
  ofertaHabi?: number; // Precio de oferta que Habi hace al cliente
}

const ITEMS_PER_PAGE = 4;

export default function ComparablesSection({ 
  onVisibilityChange,
  comparables,
  selectedComparable,
  onSelectComparable,
  ofertaHabi = 0
}: ComparablesSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const lastVisibleRef = useRef<boolean>(false);
  const hasScrolledRef = useRef<boolean>(false);
  const onVisibilityChangeRef = useRef(onVisibilityChange);
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const scrollHandlerRef = useRef<(() => void) | null>(null);
  
  // Estado para paginación
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.ceil(comparables.length / ITEMS_PER_PAGE);

  // Mantener la referencia actualizada
  useEffect(() => {
    onVisibilityChangeRef.current = onVisibilityChange;
  }, [onVisibilityChange]);

  // Función para verificar visibilidad
  const checkVisibility = useCallback(() => {
    if (!sectionRef.current || !onVisibilityChangeRef.current) return;
    
    if (!hasScrolledRef.current) {
      return;
    }

    const section = sectionRef.current;
    const sectionRect = section.getBoundingClientRect();
    
    const viewportHeight = window.innerHeight;
    const viewportTop = 100;
    const viewportBottom = viewportHeight;

    const sectionTop = sectionRect.top;
    const sectionBottom = sectionRect.bottom;
    const sectionHeight = sectionRect.height;

    const visibleTop = Math.max(sectionTop, viewportTop);
    const visibleBottom = Math.min(sectionBottom, viewportBottom);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);
    const visiblePercentage = sectionHeight > 0 ? visibleHeight / sectionHeight : 0;

    const isVisible = visiblePercentage >= 0.25;

    if (lastVisibleRef.current !== isVisible) {
      lastVisibleRef.current = isVisible;
      onVisibilityChangeRef.current(isVisible);
    }
  }, []);

  // Manejo del scroll
  useEffect(() => {
    if (!onVisibilityChangeRef.current) return;

    onVisibilityChangeRef.current(false);
    lastVisibleRef.current = false;
    hasScrolledRef.current = false;

    const handleScroll = () => {
      hasScrolledRef.current = true;
      requestAnimationFrame(checkVisibility);
    };

    scrollHandlerRef.current = handleScroll;

    const setupListeners = () => {
      if (sectionRef.current) {
        let parent = sectionRef.current.parentElement;
        while (parent) {
          const style = window.getComputedStyle(parent);
          if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
            scrollContainerRef.current = parent;
            break;
          }
          parent = parent.parentElement;
        }
      }
      
      window.addEventListener('scroll', handleScroll, { passive: true });
      
      if (scrollContainerRef.current) {
        scrollContainerRef.current.addEventListener('scroll', handleScroll, { passive: true });
      }
      
      window.addEventListener('resize', checkVisibility, { passive: true });
    };

    const timeoutId = setTimeout(setupListeners, 100);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', handleScroll);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('resize', checkVisibility);
      if (onVisibilityChangeRef.current) {
        onVisibilityChangeRef.current(false);
      }
    };
  }, [checkVisibility]);

  // Calcular estadísticas
  const stats = {
    count: comparables.length,
    avgPrice: comparables.length > 0 
      ? comparables.reduce((sum, c) => sum + c.lastAskPrice, 0) / comparables.length 
      : 0,
    minPrice: comparables.length > 0 
      ? Math.min(...comparables.map(c => c.lastAskPrice)) 
      : 0,
    maxPrice: comparables.length > 0 
      ? Math.max(...comparables.map(c => c.lastAskPrice)) 
      : 0,
    avgPricePerM2: comparables.length > 0 
      ? comparables.reduce((sum, c) => sum + c.valormt2, 0) / comparables.length 
      : 0
  };

  const formatPrice = (price: number) => {
    return `$${Math.round(price).toLocaleString('es-CO')}`;
  };

  // Calcular posición del indicador de oferta en el rango
  const getOfertaPosition = () => {
    if (!ofertaHabi || stats.maxPrice === stats.minPrice) return 50;
    const range = stats.maxPrice - stats.minPrice;
    const position = ((ofertaHabi - stats.minPrice) / range) * 100;
    return Math.max(5, Math.min(95, position)); // Limitar entre 5% y 95%
  };

  // Ordenar comparables de menor a mayor precio
  const sortedComparables = [...comparables].sort((a, b) => a.lastAskPrice - b.lastAskPrice);
  
  // Obtener comparables de la página actual (ya ordenados)
  const getCurrentPageItems = () => {
    const start = currentPage * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return sortedComparables.slice(start, end);
  };

  // Loading state
  if (comparables.length === 0) {
    return (
      <div className="p-6 bg-white border-b border-gray-200">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={sectionRef} id="comparables-section" className="p-6 bg-white border-b border-gray-200">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold">Análisis de mercado</h3>
      </div>
      <p className="text-sm text-gray-600 mb-6">
        {stats.count} inmuebles similares en tu zona
      </p>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-4 bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-100">
          <p className="text-xs text-gray-500 mb-1">Precio promedio</p>
          <p className="text-lg font-bold text-gray-900">{formatPrice(stats.avgPrice)}</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Precio / m²</p>
          <p className="text-lg font-bold text-gray-900">{formatPrice(stats.avgPricePerM2)}</p>
        </div>
      </div>

      {/* Rango de precios con indicador de oferta */}
      <div className="mb-6">
        <p className="text-xs text-gray-500 mb-15">Rango de precios en la zona</p>
        
        <div className="relative">
          {/* Barra de fondo */}
          <div className="h-2.5 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-300 to-purple-500 rounded-full"
              style={{ width: '100%' }}
            />
          </div>
          
          {/* Indicador de oferta Habi con tooltip */}
          {ofertaHabi > 0 && (
            <div 
              className="absolute top-1/2 -translate-y-1/2"
              style={{ left: `${getOfertaPosition()}%` }}
            >
              <div className="relative">
                {/* Punto del indicador */}
                <div className="w-4 h-4 bg-purple-600 rounded-full border-2 border-white shadow-lg -ml-2"></div>
                {/* Tooltip con precio */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap">
                  <div className="bg-purple-600 text-white text-[11px] font-semibold px-2 py-1 rounded-md shadow-lg">
                    Tu oferta
                    <div className="text-[10px] font-normal opacity-90">{formatPrice(ofertaHabi)}</div>
                  </div>
                  <div className="w-1.5 h-1.5 bg-purple-600 rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-0.5"></div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-gray-500">{formatPrice(stats.minPrice)}</span>
          <span className="text-xs text-gray-500">{formatPrice(stats.maxPrice)}</span>
        </div>
      </div>

      {/* Lista de comparables con paginación */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-500 font-medium">Inmuebles comparables</p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition ${
                  currentPage === 0 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-xs text-gray-500 min-w-[40px] text-center">
                {currentPage + 1} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage === totalPages - 1}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition ${
                  currentPage === totalPages - 1 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
        
        {getCurrentPageItems().map((comparable) => (
          <button
            key={comparable.nid}
            onClick={() => onSelectComparable(
              selectedComparable?.nid === comparable.nid ? null : comparable
            )}
            className={`w-full p-3 rounded-xl border text-left transition-all ${
              selectedComparable?.nid === comparable.nid
                ? 'border-purple-300 bg-purple-50'
                : 'border-gray-100 bg-gray-50 hover:border-gray-200'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {comparable.condominium || comparable.address}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {comparable.area}m² • {comparable.habitaciones} hab. • {comparable.banos} baños
                </p>
              </div>
              <div className="text-right ml-3">
                <p className="text-sm font-bold text-gray-900">
                  {formatPrice(comparable.lastAskPrice)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatPrice(comparable.valormt2)}/m²
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Indicador de puntos para paginación móvil */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-1.5 mt-4">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentPage(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentPage 
                  ? 'bg-purple-600 w-4' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
