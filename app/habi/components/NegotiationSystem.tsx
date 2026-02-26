'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';

interface NegotiationSystemProps {
  currentPrice: number;
  dealUuid: string;
  enabled: boolean;
}

type NegotiationZone = 'optimal' | 'minimum' | 'outOfRange';

interface BidEntry {
  from: 'client' | 'habi' | 'system';
  amount: number;
  message: string;
}

function getZone(proposed: number, basePrice: number): NegotiationZone {
  const optimalLimit = basePrice * 1.04;
  const minimumLimit = basePrice * 1.08;
  if (proposed <= optimalLimit) return 'optimal';
  if (proposed <= minimumLimit) return 'minimum';
  return 'outOfRange';
}

function generateCounterOffer(proposed: number, basePrice: number): number {
  const zone = getZone(proposed, basePrice);
  if (zone === 'optimal') return proposed;
  if (zone === 'minimum') {
    const optimalMax = basePrice * 1.04;
    return Math.round((optimalMax + proposed) / 2);
  }
  return Math.round(basePrice * 1.06);
}

function formatPrice(price: number): string {
  return `$ ${Math.round(price).toLocaleString('es-CO')}`;
}

const STEP = 500000;

export default function NegotiationSystem({ currentPrice, dealUuid, enabled }: NegotiationSystemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [clientBid, setClientBid] = useState(currentPrice);
  const [editingPrice, setEditingPrice] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [history, setHistory] = useState<BidEntry[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [round, setRound] = useState(0);
  const [isThinking, setIsThinking] = useState(false);
  const [waitingForAction, setWaitingForAction] = useState(false); // waiting for user to accept/counter/reject
  const historyEndRef = useRef<HTMLDivElement>(null);

  // Triggers
  const timeRef = useRef(0);
  const scrollChangesRef = useRef(0);
  const lastScrollDirRef = useRef<'up' | 'down' | null>(null);
  const ctaClickedRef = useRef(false);
  const triggeredRef = useRef(false);

  const triggerCheck = useCallback(() => {
    if (triggeredRef.current || dismissed || isOpen) return;
    const timeOk = timeRef.current >= 15;
    const scrollOk = scrollChangesRef.current >= 4;
    const noCta = !ctaClickedRef.current;
    if ((timeOk && noCta) || (scrollOk && noCta)) {
      triggeredRef.current = true;
      setIsOpen(true);
      setHistory([{
        from: 'habi', amount: currentPrice,
        message: 'Nuestra oferta inicial por tu inmueble.',
      }]);
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
      if (lastScrollDirRef.current && dir !== lastScrollDirRef.current) {
        scrollChangesRef.current += 1; triggerCheck();
      }
      lastScrollDirRef.current = dir;
    };
    window.addEventListener('scroll', handle, { passive: true });
    return () => window.removeEventListener('scroll', handle);
  }, [enabled, dismissed, triggerCheck]);

  useEffect(() => {
    if (!enabled || dismissed) return;
    const handle = (e: MouseEvent) => {
      if (e.clientY <= 0 && !triggeredRef.current && !isOpen) {
        triggeredRef.current = true;
        setIsOpen(true);
        setHistory([{ from: 'habi', amount: currentPrice, message: 'Nuestra oferta inicial por tu inmueble.' }]);
        setWaitingForAction(true);
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

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isThinking]);

  const addHabiResponse = useCallback((entries: BidEntry[], finalAgreed?: boolean) => {
    setIsThinking(true);
    setHistory(prev => [...prev, { from: 'system', amount: 0, message: 'Estamos revisando tu contraoferta...' }]);
    setTimeout(() => {
      setIsThinking(false);
      setHistory(prev => [...prev.filter(e => e.from !== 'system'), ...entries]);
      if (finalAgreed) setAgreed(true);
      else setWaitingForAction(true);
    }, 2500);
  }, []);

  // User clicks "Contraofertar" -> show bid controls
  const handleStartCounter = () => {
    setWaitingForAction(false);
    setClientBid(currentPrice + STEP);
  };

  // User submits their counter bid
  const handleSubmitBid = () => {
    if (clientBid <= currentPrice || agreed || round >= 3 || isThinking) return;
    const newRound = round + 1;
    setRound(newRound);
    setWaitingForAction(false);

    setHistory(prev => [...prev, { from: 'client', amount: clientBid, message: 'Mi propuesta' }]);

    const zone = getZone(clientBid, currentPrice);
    if (zone === 'optimal') {
      addHabiResponse([{ from: 'habi', amount: clientBid, message: '¡Aceptamos tu propuesta! Tu asesor te contactará.' }], true);
      return;
    }

    const counter = generateCounterOffer(clientBid, currentPrice);
    if (newRound >= 3) {
      addHabiResponse([{ from: 'habi', amount: counter, message: 'Esta es nuestra mejor oferta. Es lo máximo que podemos ofrecer.' }]);
    } else if (zone === 'minimum') {
      addHabiResponse([{ from: 'habi', amount: counter, message: `Podemos subir a ${formatPrice(counter)}. ¿Te parece?` }]);
    } else {
      addHabiResponse([{ from: 'habi', amount: counter, message: `Ese valor está fuera de nuestro rango. Lo máximo: ${formatPrice(counter)}.` }]);
    }
    setClientBid(counter);
  };

  // User accepts last Habi offer
  const handleAccept = () => {
    const lastHabi = [...history].reverse().find(h => h.from === 'habi');
    if (!lastHabi || agreed) return;
    setWaitingForAction(false);
    setHistory(prev => [...prev, { from: 'client', amount: lastHabi.amount, message: 'Acepto esta propuesta.' }]);
    addHabiResponse([{ from: 'habi', amount: lastHabi.amount, message: '¡Excelente! Tu asesor se pondrá en contacto para confirmar.' }], true);
  };

  // User rejects
  const handleReject = () => {
    setWaitingForAction(false);
    setHistory(prev => [...prev, { from: 'client', amount: 0, message: 'No me interesa por ahora.' }]);
    setTimeout(() => { setDismissed(true); setIsOpen(false); }, 1000);
  };

  const handleStartEdit = () => {
    setEditingPrice(true);
    setEditValue(clientBid.toString());
  };

  const handleFinishEdit = () => {
    const val = parseInt(editValue.replace(/\D/g, '')) || currentPrice;
    setClientBid(Math.max(currentPrice + STEP, val));
    setEditingPrice(false);
  };

  if (!enabled || !isOpen) return null;

  const maxRoundsReached = round >= 3;
  const pctDiff = clientBid > currentPrice ? ((clientBid - currentPrice) / currentPrice * 100).toFixed(1) : '0.0';
  const showBidControls = !waitingForAction && !agreed && !isThinking;

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-4 sm:rounded-t-2xl rounded-t-2xl flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image src="/Logo-1200x1200.png" alt="Habi" width={32} height={32} className="rounded-lg" />
            <div>
              <h3 className="text-white font-bold text-base">Negociación</h3>
              <p className="text-purple-200 text-xs">Ronda {Math.min(round + 1, 3)} de 3</p>
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
                  entry.from === 'habi'
                    ? 'bg-white border border-gray-200 rounded-bl-sm'
                    : 'bg-purple-600 text-white rounded-br-sm'
                }`}>
                  <p className={`text-sm ${entry.from === 'habi' ? 'text-gray-700' : 'text-white'}`}>
                    {entry.message}
                  </p>
                  {entry.amount > 0 && (
                    <p className={`text-lg font-bold mt-1 ${entry.from === 'habi' ? 'text-purple-700' : 'text-white'}`}>
                      {formatPrice(entry.amount)}
                    </p>
                  )}
                </div>
                {entry.from === 'client' && (
                  <div className="w-7 h-7 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mb-1">
                    <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                    </svg>
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
            <div className="text-center py-2">
              <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-semibold text-sm">Acuerdo registrado</span>
              </div>
              <button onClick={() => { setDismissed(true); setIsOpen(false); }} className="text-sm text-purple-600 font-medium">Cerrar</button>
            </div>
          ) : waitingForAction ? (
            /* 3 clear action buttons after Habi responds */
            <div className="space-y-2">
              <p className="text-xs text-gray-500 text-center mb-2">¿Qué te gustaría hacer?</p>
              <button onClick={handleAccept} className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition text-sm flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Aceptar oferta
              </button>
              {!maxRoundsReached && (
                <button onClick={handleStartCounter} className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition text-sm flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                  Contraofertar
                </button>
              )}
              <button onClick={handleReject} className="w-full bg-gray-100 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-200 transition text-sm">
                No me interesa
              </button>
            </div>
          ) : showBidControls ? (
            /* Bid controls: DiDi style */
            <>
              <p className="text-xs text-gray-500 text-center mb-3">Ajusta tu propuesta</p>
              <div className="flex items-center justify-center gap-4 mb-4">
                <button
                  onClick={() => setClientBid(prev => Math.max(currentPrice + STEP, prev - STEP))}
                  className="w-14 h-14 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-700 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition font-bold text-base"
                >
                  -0.5
                </button>
                
                <div 
                  className="flex-1 max-w-[200px] bg-gray-100 rounded-2xl px-5 py-4 text-center cursor-pointer hover:bg-gray-200 transition"
                  onClick={handleStartEdit}
                >
                  {editingPrice ? (
                    <input
                      type="text"
                      value={`$ ${Number(editValue).toLocaleString('es-CO')}`}
                      onChange={(e) => setEditValue(e.target.value.replace(/[^\d]/g, ''))}
                      onBlur={handleFinishEdit}
                      onKeyDown={(e) => e.key === 'Enter' && handleFinishEdit()}
                      autoFocus
                      className="w-full text-center text-xl font-bold text-gray-900 bg-transparent outline-none"
                    />
                  ) : (
                    <>
                      <p className="text-xl font-bold text-gray-900">{formatPrice(clientBid)}</p>
                      {clientBid > currentPrice && (
                        <p className="text-xs text-green-600 font-medium mt-0.5">+{pctDiff}%</p>
                      )}
                      <p className="text-[9px] text-gray-400 mt-1">Toca para editar</p>
                    </>
                  )}
                </div>

                <button
                  onClick={() => setClientBid(prev => Math.min(Math.round(currentPrice * 1.15), prev + STEP))}
                  className="w-14 h-14 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-700 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition font-bold text-base"
                >
                  +0.5
                </button>
              </div>

              <button
                onClick={handleSubmitBid}
                disabled={clientBid <= currentPrice}
                className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition disabled:opacity-40 disabled:cursor-not-allowed text-sm"
              >
                Enviar propuesta
              </button>
            </>
          ) : isThinking ? (
            <div className="text-center py-3">
              <p className="text-sm text-gray-500">Revisando tu propuesta...</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
