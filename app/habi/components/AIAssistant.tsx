'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

// Respuestas predefinidas basadas en palabras clave
const FAQ_RESPONSES: { keywords: string[]; response: string }[] = [
  {
    keywords: ['precio', 'valor', 'cuanto', 'cuánto', 'cuesta', 'pagan'],
    response: 'El precio de tu inmueble se calcula basándose en comparables de la zona, área, ubicación y estado del inmueble. En esta página puedes ver tu precio estimado de compra que se actualiza según las opciones que elijas.'
  },
  {
    keywords: ['tiempo', 'demora', 'tarda', 'días', 'semanas', 'rápido'],
    response: 'Con Habi te compra, el proceso toma entre 7-15 días. Con Inmobiliaria puede tomar 3-6 meses, y vendiendo por tu cuenta puede ser 6-12 meses.'
  },
  {
    keywords: ['comisión', 'comision', 'cobran', 'porcentaje', 'costo'],
    response: 'La comisión de Habi te compra es del 4.4%. Con Inmobiliaria es del 5%. Si vendes por tu cuenta, no hay comisión.'
  },
  {
    keywords: ['pago', 'cuotas', 'forma de pago', 'inmediato'],
    response: 'Ofrecemos diferentes formas de pago: pago inmediato, 3 cuotas (+0.8%), 6 cuotas (+2.1%) o 9 cuotas (+3.4%). Entre más cuotas, mayor es el precio total que recibes.'
  },
  {
    keywords: ['tramites', 'trámites', 'notaría', 'notaria', 'papeles', 'documentos'],
    response: 'Habi puede encargarse de todos los trámites y notarías por ti, o puedes elegir hacerlos tú mismo y recibir un 4% adicional en el precio.'
  },
  {
    keywords: ['remodelación', 'remodelacion', 'arreglos', 'reparaciones', 'estado'],
    response: 'Si tu inmueble necesita reparaciones, Habi puede encargarse de ellas, o puedes hacerlas tú mismo y recibir un 3% adicional en el precio.'
  },
  {
    keywords: ['comparables', 'zona', 'mercado', 'similares'],
    response: 'Los comparables son inmuebles similares al tuyo en la misma zona que se han vendido recientemente. Los usamos para calcular el precio justo de mercado.'
  },
  {
    keywords: ['inmobiliaria', 'vender', 'publicar'],
    response: 'Con Inmobiliaria Habi, tú eliges el precio y nosotros nos encargamos de todo: fotografía profesional, publicación en portales, visitas, negociación y cierre.'
  },
  {
    keywords: ['donación', 'donacion', 'donar', 'hogar'],
    response: 'Puedes hacer una donación voluntaria para construir viviendas para familias colombianas. Por cada peso que aportes, Habi donará otro peso igual.'
  },
  {
    keywords: ['asesor', 'contacto', 'hablar', 'llamar', 'whatsapp'],
    response: 'Puedes hablar con tu asesor personal a través del botón de WhatsApp en la sección "Tu asesor personal".'
  },
  {
    keywords: ['hola', 'buenos días', 'buenas tardes', 'hey'],
    response: 'Hola, soy el asistente de Habi. ¿En qué puedo ayudarte?'
  }
];

function getAIResponse(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();
  
  for (const faq of FAQ_RESPONSES) {
    if (faq.keywords.some(keyword => lowerMessage.includes(keyword))) {
      return faq.response;
    }
  }
  
  return 'Para una respuesta más detallada, te recomiendo hablar con tu asesor personal. ¿Hay algo más en lo que pueda ayudarte?';
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hola, soy el asistente de Habi. ¿Tienes alguna pregunta sobre tu oferta o el proceso de venta?'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getAIResponse(userMessage.content)
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 800);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Botón flotante */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed right-4 bottom-20 md:left-4 md:right-auto md:bottom-4 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-colors bg-purple-600 hover:bg-purple-700"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}

      {/* Chat popup */}
      {isOpen && (
        <div className="fixed left-4 right-4 bottom-20 md:left-4 md:right-auto md:bottom-4 md:w-[420px] h-[65vh] max-h-[600px] md:h-[75vh] md:max-h-[700px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="font-medium text-gray-900 text-sm">Habi Assist</span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id}>
                  {message.role === 'assistant' ? (
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 relative bg-white border border-gray-200">
                        <Image
                          src="/Logo-1200x1200.png"
                          alt="Habi"
                          fill
                          className="object-contain p-0.5"
                        />
                      </div>
                      <div className="bg-gray-100 rounded-2xl rounded-tl-md px-3 py-2 text-sm text-gray-800 max-w-[85%]">
                        {message.content}
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-end">
                      <div className="bg-purple-600 text-white rounded-2xl rounded-tr-md px-3 py-2 text-sm max-w-[85%]">
                        {message.content}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 relative bg-white border border-gray-200">
                    <Image
                      src="/Logo-1200x1200.png"
                      alt="Habi"
                      fill
                      className="object-contain p-0.5"
                    />
                  </div>
                  <div className="bg-gray-100 rounded-2xl rounded-tl-md px-3 py-2 text-sm text-gray-500">
                    Escribiendo...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-4 py-3">
            <p className="text-center text-[10px] text-gray-400 mb-2">
              Habi Assist usa IA, pueden ocurrir errores.
            </p>
            <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe un mensaje"
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="w-7 h-7 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
