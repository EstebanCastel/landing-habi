'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface NegotiationSystemProps {
  currentPrice: number;
  dealUuid: string;
  enabled: boolean;
}

type NegotiationZone = 'optimal' | 'minimum' | 'outOfRange';

interface BidEntry {
  from: 'client' | 'habi';
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
  const [history, setHistory] = useState<BidEntry[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [round, setRound] = useState(0);
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

  // Auto-scroll history
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleSubmitBid = () => {
    if (clientBid <= currentPrice || agreed || round >= 3) return;

    const newRound = round + 1;
    setRound(newRound);

    const zone = getZone(clientBid, currentPrice);
    const newHistory = [...history, {
      from: 'client' as const,
      amount: clientBid,
      message: `Mi propuesta: ${formatPrice(clientBid)}`,
    }];

    if (zone === 'optimal') {
      newHistory.push({
        from: 'habi',
        amount: clientBid,
        message: '¡Aceptamos tu propuesta! Tu asesor te contactará para continuar.',
      });
      setHistory(newHistory);
      setAgreed(true);
      return;
    }

    const counter = generateCounterOffer(clientBid, currentPrice);

    if (newRound >= 3) {
      newHistory.push({
        from: 'habi',
        amount: counter,
        message: `Esta es nuestra mejor oferta: ${formatPrice(counter)}. Es lo máximo que podemos ofrecer.`,
      });
      setHistory(newHistory);
      return;
    }

    if (zone === 'minimum') {
      newHistory.push({
        from: 'habi',
        amount: counter,
        message: `Podemos subir a ${formatPrice(counter)}. ¿Te parece?`,
      });
    } else {
      newHistory.push({
        from: 'habi',
        amount: counter,
        message: `Ese valor está fuera de nuestro rango. Lo máximo que podemos ofrecer es ${formatPrice(counter)}.`,
      });
    }

    setHistory(newHistory);
    setClientBid(counter);
  };

  const handleAcceptLastOffer = () => {
    const lastHabi = [...history].reverse().find(h => h.from === 'habi');
    if (lastHabi) {
      setHistory([...history, {
        from: 'client',
        amount: lastHabi.amount,
        message: 'Acepto esta propuesta.',
      }, {
        from: 'habi',
        amount: lastHabi.amount,
        message: '¡Excelente! Tu asesor se pondrá en contacto para confirmar.',
      }]);
      setAgreed(true);
    }
  };

  if (!enabled || !isOpen) return null;

  const maxRoundsReached = round >= 3;
  const canBid = !agreed && !maxRoundsReached;
  const pctDiff = clientBid > currentPrice ? ((clientBid - currentPrice) / currentPrice * 100).toFixed(1) : '0.0';

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

        {/* Bid history - chat style */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[400px] bg-gray-50">
          {history.map((entry, i) => (
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
                <p className={`text-lg font-bold mt-1 ${entry.from === 'habi' ? 'text-purple-700' : 'text-white'}`}>
                  {formatPrice(entry.amount)}
                </p>
              </div>
            </div>
          ))}
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
          ) : maxRoundsReached ? (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 text-center">Hemos llegado al máximo de rondas.</p>
              <div className="flex gap-2">
                <button onClick={handleAcceptLastOffer} className="flex-1 bg-purple-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-700 transition">
                  Aceptar última oferta
                </button>
                <button onClick={() => { setDismissed(true); setIsOpen(false); }} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition">
                  Cerrar
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* DiDi-style bid control */}
              <div className="flex items-center justify-center gap-3 mb-3">
                <button
                  onClick={() => setClientBid(prev => Math.max(currentPrice + STEP, prev - STEP))}
                  className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-purple-400 hover:text-purple-600 transition text-lg font-bold"
                >
                  -{(STEP / 1000000).toFixed(1)}
                </button>
                
                <div className="flex-1 max-w-[180px] bg-gray-100 rounded-xl px-4 py-3 text-center">
                  <p className="text-xl font-bold text-gray-900">{formatPrice(clientBid)}</p>
                  {clientBid > currentPrice && (
                    <p className="text-[10px] text-green-600 font-medium">+{pctDiff}%</p>
                  )}
                </div>

                <button
                  onClick={() => setClientBid(prev => Math.min(Math.round(currentPrice * 1.15), prev + STEP))}
                  className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-purple-400 hover:text-purple-600 transition text-lg font-bold"
                >
                  +{(STEP / 1000000).toFixed(1)}
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
          )}
        </div>
      </div>
    </div>
  );
}
