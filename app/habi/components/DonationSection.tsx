'use client';

import { useState, useRef, useEffect } from 'react';
import Modal from './Modal';

interface DonationSectionProps {
  selectedDonation: string;
  donationAmount: number;
  onDonationChange: (optionId: string, amount: number) => void;
  onSectionRef?: (ref: HTMLDivElement | null) => void;
}

export default function DonationSection({ donationAmount, onDonationChange, onSectionRef }: DonationSectionProps) {
  const [inputValue, setInputValue] = useState(donationAmount > 0 ? donationAmount.toLocaleString('es-CO') : '0');
  const [showModal, setShowModal] = useState(false);
  const isUserTypingRef = useRef(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Reportar la ref al padre
  useEffect(() => {
    if (onSectionRef) {
      onSectionRef(sectionRef.current);
    }
  }, [onSectionRef]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isUserTypingRef.current = true;
    
    // Remover caracteres no numéricos
    const rawValue = e.target.value.replace(/[^\d]/g, '');
    const numericValue = parseInt(rawValue) || 0;
    
    // Formatear con separador de miles
    const formattedValue = numericValue > 0 ? numericValue.toLocaleString('es-CO') : '0';
    setInputValue(formattedValue);
    
    onDonationChange(numericValue > 0 ? 'custom' : 'none', numericValue);
    
    // Reset después de un pequeño delay
    setTimeout(() => {
      isUserTypingRef.current = false;
    }, 100);
  };

  return (
    <div ref={sectionRef} id="donation-section" className="px-6 py-6 bg-white">
      {/* Header */}
      <h3 className="text-xl font-bold text-gray-900 text-center mb-6">Construye un hogar</h3>

      {/* Card estilo Tesla */}
      <div className="border border-gray-200 rounded-xl p-5">
        {/* Info */}
        <div className="flex items-start gap-4">
          {/* Ícono */}
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>

          <div className="flex-1">
            {/* Título */}
            <p className="font-semibold text-gray-900 mb-1">Duplica tu impacto</p>

            {/* Descripción */}
            <p className="text-sm text-gray-500 leading-relaxed">
              Por cada peso que aportes, Habi donará otro peso igual. Juntos duplicamos el impacto para construir hogares.
            </p>
          </div>
        </div>

        {/* Input de monto */}
        <div className="mt-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              className="w-full pl-7 pr-4 py-3 border border-gray-300 rounded-lg text-lg font-medium focus:border-purple-500 focus:ring-2 focus:ring-purple-100 bg-white transition-colors"
              placeholder="50.000"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-gray-600">127 hogares construidos con donaciones</span>
          </div>
        </div>
      </div>

      {/* Learn more link */}
      <div className="mt-4 text-center">
        <button 
          onClick={() => setShowModal(true)}
          className="text-sm text-gray-500 hover:text-gray-700 underline underline-offset-4"
        >
          Conoce más
        </button>
      </div>

      {/* Modal de información del programa */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="">
        <div className="px-6 py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Programa de Vivienda Social</h2>
          
          <div className="space-y-6 text-gray-700 text-sm leading-relaxed">
            <section>
              <h3 className="font-semibold text-gray-900 mb-2">Sobre el programa</h3>
              <p>
                Desde 2022, Habi ha destinado parte de sus recursos a la construcción de viviendas 
                para familias colombianas en situación de vulnerabilidad. A través de alianzas con 
                fundaciones especializadas en vivienda social, hemos logrado entregar más de 10 casas 
                completamente nuevas a familias que antes no contaban con un techo propio.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900 mb-2">Cómo funciona tu donación</h3>
              <p>
                El monto que decidas donar se descuenta directamente del valor que recibes por la 
                venta de tu inmueble. Habi iguala tu donación peso a peso, duplicando el impacto 
                de tu aporte. Los fondos se transfieren íntegramente a las fundaciones aliadas una 
                vez se concrete la venta.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900 mb-2">Transparencia</h3>
              <p>
                Cada donación es registrada y auditada. Al finalizar el proceso de venta, recibirás 
                un certificado de donación que podrás usar para efectos tributarios. Habi no retiene 
                ningún porcentaje de los fondos donados.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900 mb-2">Beneficio tributario</h3>
              <p>
                Las donaciones realizadas a través de este programa pueden ser deducibles de 
                impuestos según la normativa vigente. Consulta con tu asesor tributario para 
                conocer los beneficios aplicables a tu caso.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900 mb-2">Condiciones</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>La donación es voluntaria y no afecta el proceso de venta.</li>
                <li>El monto mínimo de donación es de $10.000 COP.</li>
                <li>Puedes modificar o eliminar tu donación en cualquier momento antes de firmar.</li>
                <li>Habi iguala donaciones hasta un máximo de $5.000.000 COP por transacción.</li>
              </ul>
            </section>

            <section className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Para más información sobre el programa o las fundaciones aliadas, contacta a tu 
                asesor comercial o escríbenos a donaciones@habi.co
              </p>
            </section>
          </div>

          <button
            onClick={() => setShowModal(false)}
            className="w-full mt-8 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition"
          >
            Entendido
          </button>
        </div>
      </Modal>
    </div>
  );
}
