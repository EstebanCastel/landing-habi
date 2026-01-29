'use client';

import { useState } from 'react';
import Modal from './Modal';

type Modalidad = 'habi' | 'inmobiliaria' | 'cuenta_propia';

interface SaleModalityProps {
  modalidadVenta: Modalidad;
  setModalidadVenta: (modalidad: Modalidad) => void;
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

// Contenido de comparación para el modal
const COMPARISON_DATA = {
  habi: {
    title: 'Habi te compra',
    features: [
      { name: 'Tiempo de venta', value: '7-15 días', highlight: true },
      { name: 'Comisión', value: '4.4%', highlight: false },
      { name: 'Visitas de extraños', value: 'No', highlight: true },
      { name: 'Negociaciones', value: 'Ninguna', highlight: true },
      { name: 'Trámites', value: 'Habi se encarga', highlight: true },
      { name: 'Fotografía profesional', value: 'No aplica', highlight: false },
      { name: 'Publicación en portales', value: 'No aplica', highlight: false },
    ]
  },
  inmobiliaria: {
    title: 'Inmobiliaria Habi',
    features: [
      { name: 'Tiempo de venta', value: '3-6 meses', highlight: false },
      { name: 'Comisión', value: '5%', highlight: false },
      { name: 'Visitas de extraños', value: 'Sí', highlight: false },
      { name: 'Negociaciones', value: 'Nosotros negociamos', highlight: true },
      { name: 'Trámites', value: 'Incluidos', highlight: true },
      { name: 'Fotografía profesional', value: 'Incluida', highlight: true },
      { name: 'Publicación en portales', value: 'Incluida', highlight: true },
    ]
  },
  cuenta_propia: {
    title: 'Por mi cuenta',
    features: [
      { name: 'Tiempo de venta', value: '6-12 meses', highlight: false },
      { name: 'Comisión', value: '0%', highlight: true },
      { name: 'Visitas de extraños', value: 'Sí', highlight: false },
      { name: 'Negociaciones', value: 'Tú negocías', highlight: false },
      { name: 'Trámites', value: 'Tú los haces', highlight: false },
      { name: 'Fotografía profesional', value: 'Por tu cuenta', highlight: false },
      { name: 'Publicación en portales', value: 'Por tu cuenta', highlight: false },
    ]
  }
};

export default function SaleModality({ modalidadVenta, setModalidadVenta }: SaleModalityProps) {
  const [showCompareModal, setShowCompareModal] = useState(false);
  const selectedTab = TABS.find(tab => tab.id === modalidadVenta);

  return (
    <div className="bg-white">
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

          {/* Card Ver y Comparar */}
          <button
            onClick={() => setShowCompareModal(true)}
            className="w-full mt-3 p-4 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-between transition-all group"
          >
            <span className="font-medium text-gray-800">Ver y comparar opciones</span>
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

      {/* Modal de Comparación */}
      <Modal 
        isOpen={showCompareModal} 
        onClose={() => setShowCompareModal(false)}
        title="Compara tus opciones de venta"
      >
        <div className="space-y-6">
          <p className="text-gray-600">
            Encuentra la mejor manera de vender tu inmueble según tus necesidades.
          </p>

          {/* Tabla de comparación en desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 pr-4 font-medium text-gray-500 text-sm w-1/4"></th>
                  {Object.entries(COMPARISON_DATA).map(([key, data]) => (
                    <th 
                      key={key} 
                      className={`text-center py-4 px-4 font-semibold text-sm ${
                        modalidadVenta === key ? 'text-purple-700 bg-purple-50' : 'text-gray-900'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        {data.title}
                        {modalidadVenta === key && (
                          <span className="text-xs px-2 py-0.5 bg-purple-200 text-purple-700 rounded-full">
                            Seleccionado
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_DATA.habi.features.map((feature, index) => (
                  <tr key={feature.name} className="border-b border-gray-100 last:border-0">
                    <td className="py-4 pr-4 text-sm text-gray-600">{feature.name}</td>
                    {Object.entries(COMPARISON_DATA).map(([key, data]) => {
                      const feat = data.features[index];
                      return (
                        <td 
                          key={key} 
                          className={`text-center py-4 px-4 text-sm ${
                            modalidadVenta === key ? 'bg-purple-50' : ''
                          } ${feat.highlight ? 'text-purple-700 font-medium' : 'text-gray-600'}`}
                        >
                          {feat.value}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards en móvil */}
          <div className="md:hidden space-y-4">
            {Object.entries(COMPARISON_DATA).map(([key, data]) => (
              <div 
                key={key}
                className={`p-4 rounded-xl border ${
                  modalidadVenta === key 
                    ? 'border-purple-300 bg-purple-50' 
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">{data.title}</h4>
                  {modalidadVenta === key && (
                    <span className="text-xs px-2 py-0.5 bg-purple-200 text-purple-700 rounded-full">
                      Seleccionado
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {data.features.map((feat) => (
                    <div key={feat.name} className="flex justify-between text-sm">
                      <span className="text-gray-500">{feat.name}</span>
                      <span className={feat.highlight ? 'text-purple-700 font-medium' : 'text-gray-700'}>
                        {feat.value}
                      </span>
                    </div>
                  ))}
                </div>
                {modalidadVenta !== key && (
                  <button
                    onClick={() => {
                      setModalidadVenta(key as Modalidad);
                      setShowCompareModal(false);
                    }}
                    className="w-full mt-4 py-2 text-sm text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition"
                  >
                    Seleccionar esta opción
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Botón de cierre */}
          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={() => setShowCompareModal(false)}
              className="w-full py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition"
            >
              Entendido
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
