'use client';

import { useState, useEffect, ReactNode, RefObject } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  contentRef?: RefObject<HTMLDivElement | null>;
}

export default function Modal({ isOpen, onClose, children, title, contentRef }: ModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);

  // Manejar apertura/cierre basado en cambios de isOpen
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      document.body.style.overflow = 'hidden';
    } else if (shouldRender && !isClosing) {
      setIsClosing(true);
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Manejar la animación de cierre
  useEffect(() => {
    if (isClosing) {
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
        document.body.style.overflow = 'unset';
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isClosing]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!shouldRender) return null;

  return (
    <div 
      className={`fixed inset-0 z-[60] flex items-end justify-center px-2 pb-2 transition-all duration-300 ease-out ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Backdrop con blur */}
      <div 
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-all duration-300 ${
          isClosing ? 'backdrop-blur-none opacity-0' : ''
        }`}
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div 
        className={`relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl transition-all duration-300 ease-out ${
          isClosing ? 'opacity-0 translate-y-8 scale-95' : 'animate-modal-enter'
        }`}
        style={{ maxHeight: '90vh' }}
      >
        {/* Header con título */}
        {title ? (
          <>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              <button
                onClick={handleClose}
                className="ml-auto w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Contenido con scroll - sin barra visible */}
            <div 
              className="overflow-y-auto p-6 scrollbar-hide" 
              style={{ maxHeight: 'calc(90vh - 80px)', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {children}
            </div>
          </>
        ) : (
          /* Contenido con scroll y botón de cerrar flotante - sin barra visible */
          <div 
            ref={contentRef}
            className="overflow-y-auto scrollbar-hide" 
            style={{ maxHeight: '90vh', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* Botón de cerrar integrado */}
            <button
              onClick={handleClose}
              className="absolute top-5 right-6 z-20 p-1 hover:opacity-60 transition"
            >
              <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

