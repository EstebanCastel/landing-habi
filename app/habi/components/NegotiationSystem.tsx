'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';

interface NegotiationSystemProps {
  currentPrice: number;
  dealUuid: string;
  enabled: boolean;
  precioIntermedio: number;
  precioMaximo: number;
  whatsappAsesor?: string;
}

interface BidEntry {
  from: 'client' | 'habi' | 'system';
  amount: number;
  message: string;
}

function formatPrice(price: number): string {
  return `$ ${Math.round(price).toLocaleString('es-CO')}`;
}

const STEP = 500000;

export default function NegotiationSystem({ currentPrice, dealUuid, enabled, precioIntermedio, precioMaximo, whatsappAsesor }: NegotiationSystemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [clientBid, setClientBid] = useState(currentPrice);
  const [editingPrice, setEditingPrice] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [history, setHistory] = useState<BidEntry[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [agreedPrice, setAgreedPrice] = useState(0);
  const [isThinking, setIsThinking] = useState(false);
  const [waitingForAction, setWaitingForAction] = useState(false);
  const [lastHabiOffer, setLastHabiOffer] = useState(currentPrice);
  const [finalChance, setFinalChance] = useState(false);
  const historyEndRef = useRef<HTMLDivElement>(null);

  // Triggers
  const timeRef = useRef(0);
  const scrollChangesRef = useRef(0);
  const lastScrollDirRef = useRef<'up' | 'down' | null>(null);
  const ctaClickedRef = useRef(false);
  const triggeredRef = useRef(false);

  const triggerCheck = useCallback(() => {
    if (triggeredRef.current || dismissed || isOpen) return;
    if ((timeRef.current >= 15 && !ctaClickedRef.current) || (scrollChangesRef.current >= 4 && !ctaClickedRef.current)) {
      triggeredRef.current = true;
      setIsOpen(true);
      setHistory([{ from: 'habi', amount: currentPrice, message: 'Nuestra oferta inicial por tu inmueble.' }]);
      setLastHabiOffer(currentPrice);
      setWaitingForAction(true);
    }
  }, [dismissed, isOpen, currentPrice]);

  useEffect(() => {
    if (!enabled || dismissed) return;
    const interval = setInterval(() => { timeRef.current += 1; triggerCheck(); }, 1000);
    return () => clearInterval(interval);
  }, [enabled, dismissed, triggerCheck]);

  useEffect(() => {
    if (!enabled || dismissed) return;
    let lastY = window.scrollY;
    const handle = () => {
      const dir = window.scrollY > lastY ? 'down' : 'up';
      lastY = window.scrollY;
      if (lastScrollDirRef.current && dir !== lastScrollDirRef.current) { scrollChangesRef.current += 1; triggerCheck(); }
      lastScrollDirRef.current = dir;
    };
    window.addEventListener('scroll', handle, { passive: true });
    return () => window.removeEventListener('scroll', handle);
  }, [enabled, dismissed, triggerCheck]);

  useEffect(() => {
    if (!enabled || dismissed) return;
    const handle = (e: MouseEvent) => {
      if (e.clientY <= 0 && !triggeredRef.current && !isOpen) {
        triggeredRef.current = true; setIsOpen(true);
        setHistory([{ from: 'habi', amount: currentPrice, message: 'Nuestra oferta inicial por tu inmueble.' }]);
        setLastHabiOffer(currentPrice); setWaitingForAction(true);
      }
    };
    document.addEventListener('mouseleave', handle);
    return () => document.removeEventListener('mouseleave', handle);
  }, [enabled, dismissed, isOpen, currentPrice]);

  useEffect(() => {
    if (!enabled) return;
    const handle = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('button')?.textContent?.includes('Continuar') || t.closest('a')?.href?.includes('wa.me')) ctaClickedRef.current = true;
    };
    document.addEventListener('click', handle);
    return () => document.removeEventListener('click', handle);
  }, [enabled]);

  useEffect(() => { historyEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [history, isThinking]);

  const addHabiResponse = useCallback((entries: BidEntry[], finalPrice?: number) => {
    setIsThinking(true);
    setHistory(prev => [...prev, { from: 'system', amount: 0, message: 'Estamos revisando tu contraoferta...' }]);
    setTimeout(() => {
      setIsThinking(false);
      setHistory(prev => [...prev.filter(e => e.from !== 'system'), ...entries]);
      if (finalPrice) { setAgreed(true); setAgreedPrice(finalPrice); }
      else setWaitingForAction(true);
    }, 2500);
  }, []);

  const handleSubmitBid = () => {
    if (clientBid <= currentPrice || agreed || isThinking) return;
    setWaitingForAction(false);

    setHistory(prev => [...prev, { from: 'client', amount: clientBid, message: 'Mi propuesta' }]);

    // Zona 1: cliente pide <= intermedio → aceptar al precio del cliente
    if (clientBid <= precioIntermedio) {
      const finalOffer = Math.max(clientBid, lastHabiOffer);
      setLastHabiOffer(finalOffer);
      addHabiResponse([{ from: 'habi', amount: finalOffer, message: '¡Aceptamos tu propuesta!' }], finalOffer);
      return;
    }

    // Siempre pasar primero por el intermedio antes de subir mas
    // Si aun no hemos ofrecido el intermedio, ofrecerlo ahora
    if (lastHabiOffer < precioIntermedio) {
      setLastHabiOffer(precioIntermedio);
      addHabiResponse([{ from: 'habi', amount: precioIntermedio, message: `Podemos ofrecerte ${formatPrice(precioIntermedio)}. ¿Te parece?` }]);
      return;
    }

    // Ya ofrecimos el intermedio y el cliente quiere mas → ofrecer maximo - 1M
    if (lastHabiOffer < precioMaximo - 1000000) {
      const offerPreFinal = precioMaximo - 1000000;
      setLastHabiOffer(offerPreFinal);
      setFinalChance(true);
      addHabiResponse([{
        from: 'habi', amount: offerPreFinal,
        message: `Hemos hecho un esfuerzo adicional. Podemos ofrecerte ${formatPrice(offerPreFinal)}.`,
      }]);
      return;
    }

    // Ya ofrecimos maximo - 1M, no podemos subir mas por esta via
    addHabiResponse([{
      from: 'habi', amount: lastHabiOffer,
      message: `Nuestra oferta de ${formatPrice(lastHabiOffer)} es la mejor que podemos hacer.`,
    }]);
  };

  const handleStartCounter = () => {
    setWaitingForAction(false);
    setClientBid(lastHabiOffer + STEP);
  };

  const handleAccept = () => {
    if (agreed) return;
    setWaitingForAction(false);
    const price = lastHabiOffer;
    setHistory(prev => [...prev, { from: 'client', amount: price, message: 'Acepto esta propuesta.' }]);
    addHabiResponse([{ from: 'habi', amount: price, message: '¡Excelente!' }], price);
  };

  const handleReject = () => {
    setWaitingForAction(false);

    // Si estamos en "final chance" y rechaza, darle el millon extra
    if (finalChance && lastHabiOffer < precioMaximo) {
      setHistory(prev => [...prev, { from: 'client', amount: 0, message: 'No me convence...' }]);
      const finalOffer = precioMaximo;
      setLastHabiOffer(finalOffer);
      setFinalChance(false);
      addHabiResponse([{
        from: 'habi', amount: finalOffer,
        message: `Espera, hemos hecho un último esfuerzo. Te ofrecemos ${formatPrice(finalOffer)}. Es nuestro máximo absoluto.`,
      }]);
      return;
    }

    // Cerrar sin enviar mensaje
    setDismissed(true);
    setIsOpen(false);
  };

  const handleWhatsApp = () => {
    if (!whatsappAsesor) return;
    const url = whatsappAsesor.startsWith('http') ? whatsappAsesor : `https://wa.me/${whatsappAsesor.replace(/[^\d]/g, '')}`;
    const msg = encodeURIComponent(`Hola, quiero continuar con la venta de mi inmueble. Precio acordado: ${formatPrice(agreedPrice)}`);
    window.open(`${url}?text=${msg}`, '_blank');
  };

  const handleReviewOffer = () => {
    setDismissed(true);
    setIsOpen(false);
    // TODO: actualizar precios en la landing con agreedPrice
  };

  const handleStartEdit = () => { setEditingPrice(true); setEditValue(clientBid.toString()); };
  const handleFinishEdit = () => {
    const val = parseInt(editValue.replace(/\D/g, '')) || currentPrice;
    setClientBid(Math.max(currentPrice + STEP, val));
    setEditingPrice(false);
  };

  if (!enabled || !isOpen) return null;

  const pctDiff = clientBid > currentPrice ? ((clientBid - currentPrice) / currentPrice * 100).toFixed(1) : '0.0';
  const showBidControls = !waitingForAction && !agreed && !isThinking;

  // Calcular cuanto cede Habi respecto a la oferta inicial
  const cededAmount = agreedPrice - currentPrice;
  const cededPct = currentPrice > 0 ? ((cededAmount / currentPrice) * 100).toFixed(1) : '0';

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-4 sm:rounded-t-2xl rounded-t-2xl flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image src="/Logo-1200x1200.png" alt="Habi" width={32} height={32} className="rounded-lg" />
            <div>
              <h3 className="text-white font-bold text-base">Negociación</h3>
              <p className="text-purple-200 text-xs">Oferta actual: {formatPrice(lastHabiOffer)}</p>
            </div>
          </div>
          <button onClick={() => { setDismissed(true); setIsOpen(false); }} className="text-purple-200 hover:text-white p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Chat history */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[220px] max-h-[400px] bg-gray-50">
          {history.map((entry, i) => {
            if (entry.from === 'system') {
              return (
                <div key={i} className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <p className="text-xs text-gray-500 italic">{entry.message}</p>
                    </div>
                  </div>
                </div>
              );
            }
            return (
              <div key={i} className={`flex ${entry.from === 'client' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                {entry.from === 'habi' && (
                  <Image src="/Logo-1200x1200.png" alt="Habi" width={28} height={28} className="rounded-full flex-shrink-0 mb-1" />
                )}
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                  entry.from === 'habi' ? 'bg-white border border-gray-200 rounded-bl-sm' : 'bg-purple-600 text-white rounded-br-sm'
                }`}>
                  <p className={`text-sm ${entry.from === 'habi' ? 'text-gray-700' : 'text-white'}`}>{entry.message}</p>
                  {entry.amount > 0 && (
                    <p className={`text-lg font-bold mt-1 ${entry.from === 'habi' ? 'text-purple-700' : 'text-white'}`}>{formatPrice(entry.amount)}</p>
                  )}
                </div>
                {entry.from === 'client' && (
                  <div className="w-7 h-7 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mb-1">
                    <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" /></svg>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={historyEndRef} />
        </div>

        {/* Action area */}
        <div className="border-t border-gray-200 p-4 bg-white sm:rounded-b-2xl">
          {agreed ? (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                <p className="text-green-800 font-bold text-lg">{formatPrice(agreedPrice)}</p>
                {cededAmount > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    Habi cede un {cededPct}% de su margen para ofrecerte este precio, asumiendo la incertidumbre de venta en el mercado.
                  </p>
                )}
              </div>
              <button onClick={handleWhatsApp}
                className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition text-sm flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                Continuar con la venta
              </button>
              <button onClick={handleReviewOffer}
                className="w-full bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-200 transition text-sm">
                Revisar mi oferta actualizada
              </button>
            </div>
          ) : waitingForAction ? (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 text-center mb-2">¿Qué te gustaría hacer?</p>
              <button onClick={handleAccept} className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition text-sm flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Aceptar oferta
              </button>
              <button onClick={handleStartCounter} className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition text-sm flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                Contraofertar
              </button>
              <button onClick={handleReject} className="w-full bg-gray-100 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-200 transition text-sm">
                No me interesa
              </button>
            </div>
          ) : showBidControls ? (
            <>
              <p className="text-xs text-gray-500 text-center mb-3">Ajusta tu propuesta</p>
              <div className="flex items-center justify-center gap-4 mb-4">
                <button onClick={() => setClientBid(prev => Math.max(currentPrice + STEP, prev - STEP))}
                  className="w-14 h-14 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-700 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition font-bold text-base">
                  -0.5
                </button>
                <div className="flex-1 max-w-[200px] bg-gray-100 rounded-2xl px-5 py-4 text-center cursor-pointer hover:bg-gray-200 transition" onClick={handleStartEdit}>
                  {editingPrice ? (
                    <input type="text" value={`$ ${Number(editValue).toLocaleString('es-CO')}`}
                      onChange={(e) => setEditValue(e.target.value.replace(/[^\d]/g, ''))}
                      onBlur={handleFinishEdit} onKeyDown={(e) => e.key === 'Enter' && handleFinishEdit()}
                      autoFocus className="w-full text-center text-xl font-bold text-gray-900 bg-transparent outline-none" />
                  ) : (
                    <>
                      <p className="text-xl font-bold text-gray-900">{formatPrice(clientBid)}</p>
                      {clientBid > currentPrice && <p className="text-xs text-green-600 font-medium mt-0.5">+{pctDiff}%</p>}
                      <p className="text-[9px] text-gray-400 mt-1">Toca para editar</p>
                    </>
                  )}
                </div>
                <button onClick={() => setClientBid(prev => prev + STEP)}
                  className="w-14 h-14 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-700 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition font-bold text-base">
                  +0.5
                </button>
              </div>
              <button onClick={handleSubmitBid} disabled={clientBid <= currentPrice}
                className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition disabled:opacity-40 disabled:cursor-not-allowed text-sm">
                Enviar propuesta
              </button>
            </>
          ) : isThinking ? (
            <div className="text-center py-3"><p className="text-sm text-gray-500">Revisando tu propuesta...</p></div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
