'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

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
        from: 'habi',
        amount: currentPrice,
        message: 'Nuestra oferta inicial por tu inmueble.',
      }]);
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
        scrollChangesRef.current += 1;
        triggerCheck();
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
      }
    };
    document.addEventListener('mouseleave', handle);
    return () => document.removeEventListener('mouseleave', handle);
  }, [enabled, dismissed, isOpen, currentPrice]);

  useEffect(() => {
    if (!enabled) return;
    const handle = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('button')?.textContent?.includes('Continuar') || t.closest('a')?.href?.includes('wa.me')) {
        ctaClickedRef.current = true;
      }
    };
    document.addEventListener('click', handle);
    return () => document.removeEventListener('click', handle);
  }, [enabled]);

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isThinking]);

  const addHabiResponse = useCallback((entries: BidEntry[], finalAgreed?: boolean) => {
    setIsThinking(true);
    // Mostrar "Revisando..." por 2 segundos
    const thinkingEntry: BidEntry = { from: 'system', amount: 0, message: 'Estamos revisando tu contraoferta...' };
    setHistory(prev => [...prev, thinkingEntry]);

    setTimeout(() => {
      setIsThinking(false);
      // Remover el "thinking" y agregar la respuesta real
      setHistory(prev => {
        const withoutThinking = prev.filter(e => e.from !== 'system');
        return [...withoutThinking, ...entries];
      });
      if (finalAgreed) setAgreed(true);
    }, 2000);
  }, []);

  const handleSubmitBid = () => {
    if (clientBid <= currentPrice || agreed || round >= 3 || isThinking) return;

    const newRound = round + 1;
    setRound(newRound);

    const zone = getZone(clientBid, currentPrice);
    
    // Agregar bid del cliente inmediatamente
    setHistory(prev => [...prev, {
      from: 'client',
      amount: clientBid,
      message: `Mi propuesta`,
    }]);

    if (zone === 'optimal') {
      addHabiResponse([{
        from: 'habi',
        amount: clientBid,
        message: '¡Aceptamos tu propuesta! Tu asesor te contactará para continuar.',
      }], true);
      return;
    }

    const counter = generateCounterOffer(clientBid, currentPrice);

    if (newRound >= 3) {
      addHabiResponse([{
        from: 'habi',
        amount: counter,
        message: `Esta es nuestra mejor oferta. Es lo máximo que podemos ofrecer.`,
      }]);
      return;
    }

    if (zone === 'minimum') {
      addHabiResponse([{
        from: 'habi',
        amount: counter,
        message: `Podemos subir a ${formatPrice(counter)}. ¿Te parece?`,
      }]);
    } else {
      addHabiResponse([{
        from: 'habi',
        amount: counter,
        message: `Ese valor está fuera de nuestro rango. Lo máximo que podemos ofrecer es ${formatPrice(counter)}.`,
      }]);
    }

    setClientBid(counter);
  };

  const handleAcceptLastOffer = () => {
    const lastHabi = [...history].reverse().find(h => h.from === 'habi');
    if (lastHabi && !agreed) {
      setHistory(prev => [...prev, {
        from: 'client',
        amount: lastHabi.amount,
        message: 'Acepto esta propuesta.',
      }]);
      addHabiResponse([{
        from: 'habi',
        amount: lastHabi.amount,
        message: '¡Excelente! Tu asesor se pondrá en contacto para confirmar los detalles.',
      }], true);
    }
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
  const hasHabiOffer = history.some(h => h.from === 'habi' && h.amount > 0);

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-4 sm:rounded-t-2xl rounded-t-2xl flex justify-between items-center">
          <div>
            <h3 className="text-white font-bold text-base">Negociación</h3>
            <p className="text-purple-200 text-xs">Ronda {Math.min(round + 1, 3)} de 3</p>
          </div>
          <button onClick={() => { setDismissed(true); setIsOpen(false); }} className="text-purple-200 hover:text-white p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Bid history */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[400px] bg-gray-50">
          {history.map((entry, i) => {
            if (entry.from === 'system') {
              return (
                <div key={i} className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <p className="text-sm text-gray-500 italic">{entry.message}</p>
                    </div>
                  </div>
                </div>
              );
            }
            return (
              <div key={i} className={`flex ${entry.from === 'client' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  entry.from === 'habi'
                    ? 'bg-white border border-gray-200 rounded-tl-sm'
                    : 'bg-purple-600 text-white rounded-tr-sm'
                }`}>
                  <p className={`text-xs mb-1 font-semibold ${entry.from === 'habi' ? 'text-purple-600' : 'text-purple-200'}`}>
                    {entry.from === 'habi' ? 'Habi' : 'Tú'}
                  </p>
                  <p className={`text-sm ${entry.from === 'habi' ? 'text-gray-700' : 'text-white'}`}>
                    {entry.message}
                  </p>
                  {entry.amount > 0 && (
                    <p className={`text-lg font-bold mt-1 ${entry.from === 'habi' ? 'text-purple-700' : 'text-white'}`}>
                      {formatPrice(entry.amount)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={historyEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-gray-200 p-4 bg-white sm:rounded-b-2xl">
          {agreed ? (
            <div className="text-center py-2">
              <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-semibold text-sm">Acuerdo registrado</span>
              </div>
              <button onClick={() => { setDismissed(true); setIsOpen(false); }} className="text-sm text-purple-600 font-medium">
                Cerrar
              </button>
            </div>
          ) : (
            <>
              {/* DiDi-style bid control */}
              <div className="flex items-center justify-center gap-3 mb-3">
                <button
                  onClick={() => setClientBid(prev => Math.max(currentPrice + STEP, prev - STEP))}
                  disabled={isThinking}
                  className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-purple-400 hover:text-purple-600 transition text-sm font-bold disabled:opacity-40"
                >
                  -{STEP / 1000000 >= 1 ? `${STEP / 1000000}M` : `${STEP / 1000}K`}
                </button>
                
                <div 
                  className="flex-1 max-w-[180px] bg-gray-100 rounded-xl px-4 py-3 text-center cursor-pointer hover:bg-gray-200 transition"
                  onClick={handleStartEdit}
                >
                  {editingPrice ? (
                    <input
                      type="text"
                      value={editValue}
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
                        <p className="text-[10px] text-green-600 font-medium">+{pctDiff}%</p>
                      )}
                      <p className="text-[9px] text-gray-400 mt-0.5">Toca para editar</p>
                    </>
                  )}
                </div>

                <button
                  onClick={() => setClientBid(prev => Math.min(Math.round(currentPrice * 1.15), prev + STEP))}
                  disabled={isThinking}
                  className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-purple-400 hover:text-purple-600 transition text-sm font-bold disabled:opacity-40"
                >
                  +{STEP / 1000000 >= 1 ? `${STEP / 1000000}M` : `${STEP / 1000}K`}
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSubmitBid}
                  disabled={clientBid <= currentPrice || isThinking || maxRoundsReached}
                  className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                >
                  {isThinking ? 'Esperando...' : 'Enviar propuesta'}
                </button>
                {hasHabiOffer && !maxRoundsReached && (
                  <button
                    onClick={handleAcceptLastOffer}
                    disabled={isThinking}
                    className="px-4 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-40 text-sm"
                  >
                    Aceptar
                  </button>
                )}
                {maxRoundsReached && (
                  <button
                    onClick={handleAcceptLastOffer}
                    disabled={isThinking}
                    className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-40 text-sm"
                  >
                    Aceptar última oferta
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
