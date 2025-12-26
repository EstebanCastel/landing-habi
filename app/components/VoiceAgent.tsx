'use client';

import { useState, useEffect, useRef } from 'react';

interface VoiceAgentProps {
  currentSection?: string;
  configuration?: any;
  price?: number;
}

export default function VoiceAgent({ currentSection, configuration, price }: VoiceAgentProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasSpoken, setHasSpoken] = useState<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Mensajes del agente según la sección
  const messages: Record<string, string> = {
    hero: "Hola, bienvenido a tu oferta personalizada de Habi. Soy tu asistente virtual y estoy aquí para ayudarte. Esta es una oferta formal que tienes 3 días para revisar. Cuando estés listo, haz clic en Personalizar Oferta para comenzar.",
    
    inicio: "Perfecto, vamos a personalizar tu oferta. Te voy a mostrar cómo se construye el precio. Recuerda que en Habi solo cobramos 4.4% de comisión, mucho menos que el mercado tradicional.",
    
    tramites_habi: "Excelente elección. Nosotros nos encargamos de todos los trámites notariales por ti. No tendrás que hacer ningún pago adicional ni acercarte a la notaría.",
    
    tramites_cliente: "Entiendo, prefieres asumir los trámites para obtener un mayor precio. Ten en cuenta que deberás pagar entre 8 y 15 millones y acercarte a la notaría el día de la escritura.",
    
    remodelacion_habi: "Perfecto. Compraremos tu inmueble tal como está. No necesitas hacer ninguna reparación ni mejora.",
    
    remodelacion_cliente: "Muy bien, si realizas las mejoras recomendadas, podrás obtener un mejor precio. Una vez las completes, podremos avanzar con la compra.",
    
    forma_pago: "Ahora elige cómo prefieres recibir tu dinero. Entre más flexibilidad escojas, mayor será el precio total. La opción de 9 cuotas te da el mejor precio.",
    
    precio_final: `Perfecto, basado en tus elecciones, el precio estimado de compra es de ${price ? `${(price / 1000000).toFixed(1)} millones de pesos` : 'tu inmueble'}. Si estás conforme, puedes continuar con la venta o hablar con tu asesor si tienes dudas.`,
    
    alternativas: "Veo que quieres explorar otras opciones. Eso está bien. En este video te explicamos el costo real de vender por tu cuenta: tiempo, visitas, negociaciones y trámites. También puedes descargar nuestra guía completa con consejos para ayudarte."
  };

  // Función para hablar usando ElevenLabs
  const speak = async (text: string, sectionKey: string) => {
    if (hasSpoken.has(sectionKey) || !isEnabled) return;

    try {
      setIsSpeaking(true);

      // Llamada a la API de ElevenLabs
      const response = await fetch('/api/elevenlabs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!response.ok) throw new Error('Error en la síntesis de voz');

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        await audioRef.current.play();
        setHasSpoken(prev => new Set([...prev, sectionKey]));
      }
    } catch (error) {
      console.error('Error al reproducir audio:', error);
    } finally {
      setIsSpeaking(false);
    }
  };

  // Efecto para detectar cambios de sección
  useEffect(() => {
    if (currentSection && messages[currentSection]) {
      speak(messages[currentSection], currentSection);
    }
  }, [currentSection]);

  // Efecto para mensajes basados en configuración
  useEffect(() => {
    if (!configuration) return;

    if (configuration.tramites === 'habi' && !hasSpoken.has('tramites_habi')) {
      speak(messages.tramites_habi, 'tramites_habi');
    } else if (configuration.tramites === 'cliente' && !hasSpoken.has('tramites_cliente')) {
      speak(messages.tramites_cliente, 'tramites_cliente');
    }

    if (configuration.remodelacion === 'habi' && !hasSpoken.has('remodelacion_habi')) {
      speak(messages.remodelacion_habi, 'remodelacion_habi');
    } else if (configuration.remodelacion === 'cliente' && !hasSpoken.has('remodelacion_cliente')) {
      speak(messages.remodelacion_cliente, 'remodelacion_cliente');
    }
  }, [configuration]);

  return (
    <>
      {/* Audio element */}
      <audio
        ref={audioRef}
        onEnded={() => setIsSpeaking(false)}
        className="hidden"
      />

      {/* Botón de control del agente */}
      <div className="fixed bottom-6 left-6 z-50">
        <button
          onClick={() => setIsEnabled(!isEnabled)}
          className={`relative flex items-center justify-center w-16 h-16 rounded-full shadow-2xl transition-all ${
            isEnabled 
              ? 'bg-purple-600 hover:bg-purple-700' 
              : 'bg-gray-400 hover:bg-gray-500'
          }`}
          title={isEnabled ? 'Desactivar asistente de voz' : 'Activar asistente de voz'}
        >
          {/* Ícono de micrófono */}
          <svg 
            className="w-7 h-7 text-white" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            {isEnabled ? (
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" 
              />
            ) : (
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" 
              />
            )}
          </svg>

          {/* Animación de ondas cuando está hablando */}
          {isSpeaking && isEnabled && (
            <>
              <span className="absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75 animate-ping"></span>
              <span className="absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-50 animate-pulse"></span>
            </>
          )}
        </button>

        {/* Label */}
        {isEnabled && (
          <div className="absolute left-20 top-1/2 -translate-y-1/2 bg-white px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
            <p className="text-xs font-medium text-gray-900">
              {isSpeaking ? 'Hablando...' : 'Asistente activo'}
            </p>
          </div>
        )}
      </div>
    </>
  );
}

