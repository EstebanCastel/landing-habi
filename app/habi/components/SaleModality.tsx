'use client';

import { useState, useRef, useEffect } from 'react';
import Modal from './Modal';

type Modalidad = 'habi' | 'inmobiliaria' | 'cuenta_propia';
type ModalView = 'features' | 'compare';

interface SaleModalityProps {
  modalidadVenta: Modalidad;
  setModalidadVenta: (modalidad: Modalidad) => void;
  onSectionRef?: (ref: HTMLDivElement | null) => void;
}

const TABS = [
  { 
    id: 'habi' as Modalidad, 
    label: 'Habi te compra',
    badge: 'Recomendado',
    badgeStyle: 'bg-purple-100 text-purple-700',
    title: 'Venta directa a Habi',
    description: 'Te compramos tu inmueble directamente. Sin publicar, sin visitas de extraños, sin negociaciones eternas. Recibe tu dinero en días, no en meses.',
    icon: (
      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  },
  { 
    id: 'inmobiliaria' as Modalidad, 
    label: 'Inmobiliaria',
    badge: '5% comisión',
    badgeStyle: 'bg-gray-100 text-gray-600',
    title: 'Vendemos por ti',
    description: 'Tú eliges el precio de venta. Nosotros nos encargamos de todo: publicación en portales, fotografía profesional, visitas, negociación y cierre.',
    icon: (
      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  { 
    id: 'cuenta_propia' as Modalidad, 
    label: 'Por mi cuenta',
    badge: 'Sin comisión',
    badgeStyle: 'bg-green-100 text-green-700',
    title: 'Tú tienes el control',
    description: 'Maneja todo el proceso de venta de forma independiente. Te damos una guía completa con todo lo que necesitas saber para vender exitosamente.',
    icon: (
      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )
  },
];

// Datos de comparación estilo Tesla
const COMPARISON_OPTIONS = [
  {
    id: 'habi' as Modalidad,
    title: 'Compra directa',
    subtitle: 'Venta inmediata',
    highlight: '7-15 días',
    highlightLabel: 'Tiempo de venta',
    tagline: 'Liquidez inmediata',
  },
  {
    id: 'inmobiliaria' as Modalidad,
    title: 'Inmobiliaria',
    subtitle: 'Vendemos por ti',
    highlight: '3-6 meses',
    highlightLabel: 'Tiempo de venta',
    tagline: 'Mejor precio del mercado',
  },
  {
    id: 'cuenta_propia' as Modalidad,
    title: 'Venta propia',
    subtitle: 'Tú vendes',
    highlight: '6-12 meses',
    highlightLabel: 'Tiempo de venta',
    tagline: 'Sin comisiones',
  },
];

const COMPARISON_ROWS = [
  {
    category: 'Costos',
    features: [
      {
        name: 'Comisión',
        values: { habi: '4.4%', inmobiliaria: '5%', cuenta_propia: '0%' },
        highlights: { habi: false, inmobiliaria: false, cuenta_propia: true },
      },
    ],
  },
  {
    category: 'Proceso de venta',
    features: [
      {
        name: 'Visitas de extraños',
        values: { habi: 'No', inmobiliaria: 'Sí', cuenta_propia: 'Sí' },
        highlights: { habi: true, inmobiliaria: false, cuenta_propia: false },
      },
      {
        name: 'Negociaciones',
        values: { habi: 'Ninguna', inmobiliaria: 'Nosotros negociamos', cuenta_propia: 'Tú negocías' },
        highlights: { habi: true, inmobiliaria: true, cuenta_propia: false },
      },
      {
        name: 'Trámites y papeleo',
        values: { habi: 'Habi se encarga', inmobiliaria: 'Incluidos', cuenta_propia: 'Tú los haces' },
        highlights: { habi: true, inmobiliaria: true, cuenta_propia: false },
      },
    ],
  },
  {
    category: 'Servicios',
    features: [
      {
        name: 'Fotografía profesional',
        values: { habi: 'No aplica', inmobiliaria: 'Incluida', cuenta_propia: 'Por tu cuenta' },
        highlights: { habi: false, inmobiliaria: true, cuenta_propia: false },
      },
      {
        name: 'Publicación en portales',
        values: { habi: 'No aplica', inmobiliaria: 'Incluida', cuenta_propia: 'Por tu cuenta' },
        highlights: { habi: false, inmobiliaria: true, cuenta_propia: false },
      },
      {
        name: 'Remodelaciones',
        values: { habi: 'Opcionales', inmobiliaria: '-', cuenta_propia: '-' },
        highlights: { habi: true, inmobiliaria: false, cuenta_propia: false },
      },
    ],
  },
  {
    category: 'Extras',
    features: [
      {
        name: 'Guía de venta',
        values: { habi: '-', inmobiliaria: '-', cuenta_propia: 'Incluida' },
        highlights: { habi: false, inmobiliaria: false, cuenta_propia: true },
      },
      {
        name: 'Letrero Se Vende',
        values: { habi: '-', inmobiliaria: '-', cuenta_propia: 'Incluido' },
        highlights: { habi: false, inmobiliaria: false, cuenta_propia: true },
      },
    ],
  },
];

// Contenido visual para el modal estilo Tesla
const MODAL_CONTENT = {
  habi: {
    title: 'Compra directa',
    subtitle: 'Liquidez inmediata para ti.',
    cardImage: '/Ultrarealistic_lifestyle_editorial_202602021.jpeg',
    sections: [
      {
        type: 'hero',
        title: '',
        description: '',
        mediaPlaceholder: 'hero-compra-directa',
        image: '/Ultrarealistic_lifestyle_editorial_202602021.jpeg',
        aspectRatio: '21/9'
      },
      {
        type: 'feature',
        title: 'Nos encargamos de todo',
        description: 'Trámites, papeleo, notaría... todo lo manejamos nosotros para que tú no tengas que preocuparte por nada.',
        mediaPlaceholder: 'tramites',
        video: '/Generate_a_short_202602021207_nnojh.mp4',
        aspectRatio: '16/9'
      },
      {
        type: 'feature',
        title: 'Recibe tu dinero en días, no en meses',
        description: 'Te compramos tu inmueble directamente. Sin publicar, sin visitas de extraños, sin negociaciones eternas.',
        mediaPlaceholder: 'liquidez',
        image: '/Ultrarealistic_lifestyle_editorial_202602021 (4).jpeg'
      },
      {
        type: 'feature',
        title: 'Remodelaciones incluidas',
        description: 'Si tu inmueble necesita reparaciones o mejoras, nosotros nos hacemos cargo. Tú solo recibe tu dinero.',
        mediaPlaceholder: 'remodelaciones',
        image: '/Ultrarealistic_lifestyle_editorial_202602021 (6).jpeg'
      }
    ]
  },
  inmobiliaria: {
    title: 'Inmobiliaria',
    subtitle: 'Máximo precio con nuestra ayuda.',
    cardImage: '/Ultrarealistic_lifestyle_editorial_202602021 (7).jpeg',
    sections: [
      {
        type: 'hero',
        title: '',
        description: '',
        mediaPlaceholder: 'hero-inmobiliaria',
        image: '/Ultrarealistic_lifestyle_editorial_202602021 (7).jpeg',
        aspectRatio: '21/9'
      },
      {
        type: 'feature',
        title: 'Fotografía y marketing profesional',
        description: 'Presentamos tu inmueble de la mejor manera. Fotografías profesionales, recorridos virtuales y publicación en los mejores portales.',
        mediaPlaceholder: 'fotografia',
        video: '/Create_a_short_202602031101_mwhzt.mp4'
      },
      {
        type: 'feature',
        title: 'La red más grande de Colombia',
        description: 'Te ayudamos a encontrar el cliente ideal con nuestra red de más de 2,000 brokers inmobiliarios certificados, la más grande del país.',
        mediaPlaceholder: 'negociacion',
        image: '/Ultrarealistic_lifestyle_editorial_202602031.jpeg'
      },
      {
        type: 'gallery',
        title: 'Trámites y documentación legal',
        description: 'Nos encargamos de levantar los gravámenes de tu inmueble y te ayudamos a ti y al comprador con todo el papeleo: escrituras, certificados de libertad, paz y salvos, y demás trámites legales.',
        mediaPlaceholder: 'tramites-legal',
        images: [
          '/Ultrarealistic_lifestyle_editorial_202602031 (1).jpeg',
          '/Ultrarealistic_lifestyle_editorial_202602031 (2).jpeg'
        ]
      }
    ]
  },
  cuenta_propia: {
    title: 'Venta propia',
    subtitle: 'Tú tienes el control total.',
    cardImage: '/Idea_visual_autonoma_202602031441 (1).jpeg',
    sections: [
      {
        type: 'hero',
        title: '',
        description: '',
        mediaPlaceholder: 'hero-venta-propia',
        image: '/Idea_visual_autonoma_202602031441 (1).jpeg',
        aspectRatio: '21/9'
      },
      {
        type: 'feature',
        title: 'Guía completa de venta',
        description: 'Te entregamos una guía paso a paso con todo lo que necesitas saber para vender tu inmueble de forma rápida y segura.',
        mediaPlaceholder: 'guia',
        image: '/Ultrarealistic_lifestyle_editorial_202602031 (4).jpeg'
      },
      {
        type: 'feature',
        title: 'Letrero de "Se Vende"',
        description: 'Recibe un letrero profesional para colocar en tu ventana y atraer compradores de tu zona.',
        mediaPlaceholder: 'letrero',
        image: '/Image_202602031441.jpeg'
      }
    ]
  }
};

// Componente de galería dual estilo Tesla
function GalleryDual({ images }: { images: string[] }) {
  const [focusIndex, setFocusIndex] = useState(0);
  
  const handlePrev = () => {
    setFocusIndex(0);
  };
  
  const handleNext = () => {
    setFocusIndex(1);
  };

  return (
    <div className="relative px-4">
      <div 
        className="flex gap-2"
        style={{ 
          transform: focusIndex === 0 ? 'translateX(0)' : 'translateX(-15%)'
        }}
      >
        {/* Imagen izquierda */}
        <div 
          className={`relative overflow-hidden rounded-xl flex-shrink-0 ${
            focusIndex === 0 ? 'w-[65%]' : 'w-[35%]'
          }`}
          style={{ aspectRatio: '4/3' }}
        >
          <img 
            src={images[0]} 
            alt="Galería 1"
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Imagen derecha */}
        <div 
          className={`relative overflow-hidden rounded-xl flex-shrink-0 ${
            focusIndex === 1 ? 'w-[65%]' : 'w-[35%]'
          }`}
          style={{ aspectRatio: '4/3' }}
        >
          <img 
            src={images[1]} 
            alt="Galería 2"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Flecha izquierda */}
      {focusIndex === 1 && (
        <button
          onClick={handlePrev}
          className="absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-md shadow-lg flex items-center justify-center hover:bg-gray-50"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Flecha derecha */}
      {focusIndex === 0 && (
        <button
          onClick={handleNext}
          className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-md shadow-lg flex items-center justify-center hover:bg-gray-50"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default function SaleModality({ modalidadVenta, setModalidadVenta, onSectionRef }: SaleModalityProps) {
  const [showModal, setShowModal] = useState(false);
  const [modalView, setModalView] = useState<ModalView>('features');
  const [modalTab, setModalTab] = useState<Modalidad>(modalidadVenta);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  
  const selectedTab = TABS.find(tab => tab.id === modalidadVenta);
  const modalContent = MODAL_CONTENT[modalTab];

  // Reportar la ref al padre
  useEffect(() => {
    if (onSectionRef) {
      onSectionRef(sectionRef.current);
    }
  }, [onSectionRef]);

  const handleSelectOption = (option: Modalidad) => {
    setModalidadVenta(option);
    setShowModal(false);
  };

  const handleOpenModal = () => {
    setModalTab(modalidadVenta);
    setModalView('features');
    setShowModal(true);
  };

  const handleChangeTab = (tab: Modalidad) => {
    setModalTab(tab);
    // Scroll al inicio del contenido
    setTimeout(() => {
      modalContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  };

  return (
    <div ref={sectionRef} id="sale-modality-section" className="bg-white">
      {/* Tabs de margen a margen */}
      <div className="flex border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setModalidadVenta(tab.id)}
            className={`flex-1 py-4 text-sm font-medium transition-all border-b-2 -mb-[2px] ${
              modalidadVenta === tab.id
                ? 'text-gray-900 border-gray-900'
                : 'text-gray-400 border-transparent hover:text-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Card de descripción */}
      {selectedTab && (
        <div className="px-6 py-5">
          <div className="p-5 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center flex-shrink-0">
                {selectedTab.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900">{selectedTab.title}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${selectedTab.badgeStyle}`}>
                    {selectedTab.badge}
                  </span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {selectedTab.description}
                </p>
              </div>
            </div>
          </div>

          {/* Card Ver detalles */}
          <button
            onClick={handleOpenModal}
            className="w-full mt-3 p-4 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-between transition-all group"
          >
            <span className="font-medium text-gray-800">Ver detalles y beneficios</span>
            <svg 
              className="w-5 h-5 text-gray-500 group-hover:translate-x-1 transition-transform" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Modal único con toggle entre Features y Comparación */}
      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        title=""
        contentRef={modalContentRef}
      >
        <div className="relative">
          {/* Header sticky con título y link de toggle - Vista Features */}
          {modalView === 'features' && (
            <div className="sticky top-0 z-10 bg-white pt-10 pb-4 px-6 rounded-t-2xl">
              <div className="flex items-start justify-between mb-6 pr-8">
                <h2 className="text-3xl font-bold text-gray-900">Habi te deja escoger</h2>
                <button 
                  onClick={() => setModalView('compare')}
                  className="text-sm text-gray-600 hover:text-gray-900 underline underline-offset-4 whitespace-nowrap"
                >
                  Comparar opciones
                </button>
              </div>

              {/* Tabs estilo Tesla */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                {(['habi', 'inmobiliaria', 'cuenta_propia'] as Modalidad[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => handleChangeTab(tab)}
                    className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-md transition-all ${
                      modalTab === tab
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab === 'habi' ? 'Compra directa' : tab === 'inmobiliaria' ? 'Inmobiliaria' : 'Venta propia'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Header sticky con título y columnas - Vista Compare */}
          {modalView === 'compare' && (
            <div className="sticky top-0 z-10 bg-white pt-10 pb-4 px-6 rounded-t-2xl">
              <div className="flex items-start justify-between mb-6 pr-8">
                <h2 className="text-3xl font-bold text-gray-900">Compara opciones</h2>
                <button 
                  onClick={() => setModalView('features')}
                  className="text-sm text-gray-600 hover:text-gray-900 underline underline-offset-4 whitespace-nowrap"
                >
                  Ver detalles
                </button>
              </div>

              {/* Header de columnas - responsive */}
              {/* Desktop: grid horizontal */}
              <div className="hidden md:grid grid-cols-4 gap-4">
                <div></div>
                {COMPARISON_OPTIONS.map((option) => (
                  <div 
                    key={option.id}
                    className={`text-center p-4 rounded-xl ${
                      modalidadVenta === option.id ? 'bg-purple-50' : ''
                    }`}
                  >
                    <p className="text-purple-600 text-sm font-medium">{option.title}</p>
                    <p className="text-gray-500 text-xs mb-2">{option.subtitle}</p>
                    <p className="text-2xl font-bold text-gray-900">{option.highlight}</p>
                    <p className="text-xs text-gray-500">{option.highlightLabel}</p>
                    <p className="text-sm text-gray-700 mt-2">{option.tagline}</p>
                    {modalidadVenta === option.id && (
                      <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-purple-200 text-purple-700 rounded-full">
                        Seleccionado
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Mobile: cards en grid */}
              <div className="md:hidden grid grid-cols-3 gap-2">
                {COMPARISON_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleSelectOption(option.id)}
                    className={`p-3 rounded-xl text-center transition-all ${
                      modalidadVenta === option.id 
                        ? 'bg-purple-100 border-2 border-purple-500' 
                        : 'bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <p className="text-purple-600 text-[11px] font-medium leading-tight">{option.title}</p>
                    <p className="text-base font-bold text-gray-900 mt-1">{option.highlight}</p>
                    {modalidadVenta === option.id && (
                      <svg className="w-4 h-4 text-purple-600 mx-auto mt-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Vista de Features */}
          {modalView === 'features' && (
            <div className="space-y-12 pb-6">
              {modalContent.sections.map((section, index) => {
                const aspectRatio = 'aspectRatio' in section ? section.aspectRatio : '16/9';
                const hasImage = 'image' in section && section.image;
                const hasVideo = 'video' in section && section.video;
                
                return (
                  <div key={index} className="space-y-4">
                    {/* Imagen hero - de margen a margen */}
                    {hasImage && section.type === 'hero' && (
                      <div 
                        className="relative w-full overflow-hidden"
                        style={{ aspectRatio }}
                      >
                        <img 
                          src={section.image as string} 
                          alt={section.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Imagen feature - mismo tamaño que video */}
                    {hasImage && section.type !== 'hero' && (
                      <div className="flex justify-center px-6">
                        <div 
                          className="relative overflow-hidden rounded-xl"
                          style={{ aspectRatio: '2/1', width: '85%' }}
                        >
                          <img 
                            src={section.image as string} 
                            alt={section.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}

                    {/* Video con loop - compacto */}
                    {hasVideo && (
                      <div className="flex justify-center px-6">
                        <div 
                          className="relative overflow-hidden rounded-xl"
                          style={{ aspectRatio: '2/1', width: '85%' }}
                        >
                          <video 
                            src={section.video as string}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover object-top"
                          />
                        </div>
                      </div>
                    )}

                    {/* Galería dual estilo Tesla */}
                    {section.type === 'gallery' && 'images' in section && (
                      <GalleryDual images={section.images as string[]} />
                    )}

                    {/* Placeholder cuando no hay imagen, video ni galería */}
                    {!hasImage && !hasVideo && section.type !== 'gallery' && (
                      <div 
                        className="relative w-full bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden rounded-2xl mx-6" 
                        style={{ aspectRatio, width: 'calc(100% - 48px)' }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-3 bg-gray-300 rounded-full flex items-center justify-center">
                              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <p className="text-sm text-gray-500">Imagen ilustrativa</p>
                            <p className="text-xs text-gray-400 mt-1">{section.mediaPlaceholder}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Texto - solo si hay título */}
                    {section.title && (
                      <div className="px-6">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{section.title}</h3>
                        <p className="text-gray-600 leading-relaxed">{section.description}</p>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Sección Explorar otras opciones */}
              <div className="pt-8 border-t border-gray-200 mx-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Explora otras opciones</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(['habi', 'inmobiliaria', 'cuenta_propia'] as Modalidad[])
                    .filter(opt => opt !== modalTab)
                    .map((opt) => {
                      const content = MODAL_CONTENT[opt];
                      return (
                        <button
                          key={opt}
                          onClick={() => handleChangeTab(opt)}
                          className="p-6 bg-gray-50 hover:bg-gray-100 rounded-2xl text-left transition-all group"
                        >
                          {/* Imagen de card */}
                          <div className="w-full aspect-[16/10] bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl mb-4 overflow-hidden">
                            {content.cardImage ? (
                              <img 
                                src={content.cardImage} 
                                alt={content.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-lg font-semibold text-gray-900">{content.title}</h4>
                            <svg className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{content.subtitle}</p>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Disclaimer y botón */}
              <div className="pt-6 space-y-4 mx-6">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Los tiempos de venta son estimados y pueden variar según las condiciones del mercado y las características de tu inmueble. 
                  Las comisiones incluyen todos los servicios mencionados. Consulta términos y condiciones completos.
                </p>
                
                <button
                  onClick={() => handleSelectOption(modalTab)}
                  className="w-full py-4 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition text-lg"
                >
                  Seleccionar {MODAL_CONTENT[modalTab].title}
                </button>
              </div>
            </div>
          )}

          {/* Vista de Comparación estilo Tesla */}
          {modalView === 'compare' && (
            <div className="space-y-8 px-6 pb-6">
              {/* Tabla de comparación por categorías - Desktop */}
              <div className="hidden md:block">
                {COMPARISON_ROWS.map((category) => (
                  <div key={category.category} className="mb-6">
                    <h4 className="text-lg font-bold text-gray-900 mb-4">{category.category}</h4>
                    <div className="space-y-0">
                      {category.features.map((feature, idx) => (
                        <div 
                          key={feature.name}
                          className={`grid grid-cols-4 gap-4 py-4 ${
                            idx < category.features.length - 1 ? 'border-b border-gray-100' : ''
                          }`}
                        >
                          <div className="text-sm text-gray-600">{feature.name}</div>
                          {(['habi', 'inmobiliaria', 'cuenta_propia'] as Modalidad[]).map((optId) => (
                            <div 
                              key={optId}
                              className={`text-center text-sm ${
                                modalidadVenta === optId ? 'bg-purple-50 -my-4 py-4' : ''
                              } ${
                                feature.highlights[optId] ? 'text-purple-700 font-medium' : 'text-gray-600'
                              }`}
                            >
                              {feature.values[optId]}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Tabla de comparación - Móvil: muestra las 3 opciones */}
              <div className="md:hidden space-y-4">
                {/* Header de columnas en móvil */}
                <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
                  <div></div>
                  <div className={`py-1 rounded ${modalidadVenta === 'habi' ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-500'}`}>Habi</div>
                  <div className={`py-1 rounded ${modalidadVenta === 'inmobiliaria' ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-500'}`}>Inmob.</div>
                  <div className={`py-1 rounded ${modalidadVenta === 'cuenta_propia' ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-500'}`}>Propia</div>
                </div>
                
                {COMPARISON_ROWS.map((category) => (
                  <div key={category.category} className="bg-gray-50 rounded-xl p-3">
                    <h4 className="text-xs font-bold text-gray-900 mb-2">{category.category}</h4>
                    <div className="space-y-1">
                      {category.features.map((feature) => (
                        <div 
                          key={feature.name}
                          className="grid grid-cols-4 gap-1 py-1.5 border-b border-gray-100 last:border-0 items-center"
                        >
                          <span className="text-[11px] text-gray-600">{feature.name}</span>
                          {(['habi', 'inmobiliaria', 'cuenta_propia'] as Modalidad[]).map((optId) => (
                            <span 
                              key={optId}
                              className={`text-[10px] text-center ${
                                modalidadVenta === optId ? 'bg-purple-50 rounded py-0.5' : ''
                              } ${
                                feature.highlights[optId] ? 'text-purple-700 font-medium' : 'text-gray-600'
                              }`}
                            >
                              {feature.values[optId]}
                            </span>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Sección incluido con todas las opciones */}
              <div className="pt-6 border-t border-gray-200">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Incluido con todas las opciones</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-purple-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-900">Avalúo gratuito</p>
                      <p className="text-sm text-gray-500">Conoce el valor real de tu inmueble</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-purple-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-900">Asesoría personalizada</p>
                      <p className="text-sm text-gray-500">Un experto te acompaña en todo el proceso</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-purple-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-900">Análisis de mercado</p>
                      <p className="text-sm text-gray-500">Comparamos con inmuebles similares en tu zona</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-purple-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-900">Sin compromisos</p>
                      <p className="text-sm text-gray-500">Puedes cambiar de opción cuando quieras</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <p className="text-xs text-gray-500 leading-relaxed pt-4">
                Los tiempos de venta son estimados y pueden variar según las condiciones del mercado y las características de tu inmueble. 
                Las comisiones incluyen todos los servicios mencionados. Consulta términos y condiciones completos.
              </p>

              {/* Botón de cierre */}
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-4 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition text-lg"
              >
                Entendido
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
