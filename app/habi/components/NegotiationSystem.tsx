'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface NegotiationSystemProps {
  currentPrice: number;
  dealUuid: string;
  enabled: boolean; // solo para UUID 123
}

type NegotiationZone = 'optimal' | 'minimum' | 'outOfRange';
type NegotiationPhase = 'hidden' | 'initial' | 'response' | 'final';
type InputMode = 'slider' | 'freeInput';

// Motor matematico: zonas de negociacion
function getZone(proposed: number, basePrice: number): NegotiationZone {
  const optimalLimit = basePrice * 1.04;  // hasta +4% = zona optima
  const minimumLimit = basePrice * 1.08;  // hasta +8% = zona minima
  if (proposed <= optimalLimit) return 'optimal';
  if (proposed <= minimumLimit) return 'minimum';
  return 'outOfRange';
}

function generateCounterOffer(proposed: number, basePrice: number): number {
  const zone = getZone(proposed, basePrice);
  if (zone === 'optimal') return proposed;
  if (zone === 'minimum') {
    // Contraoferta: punto medio entre oferta base +4% y lo propuesto
    const optimalMax = basePrice * 1.04;
    return Math.round((optimalMax + proposed) / 2);
  }
  // Fuera de rango: ofrecer el maximo de zona minima
  return Math.round(basePrice * 1.06);
}

function formatPrice(price: number): string {
  return `$ ${Math.round(price).toLocaleString('es-CO')}`;
}

export default function NegotiationSystem({ currentPrice, dealUuid, enabled }: NegotiationSystemProps) {
  const [phase, setPhase] = useState<NegotiationPhase>('hidden');
  const [inputMode, setInputMode] = useState<InputMode>('slider');
  const [proposedPrice, setProposedPrice] = useState(currentPrice);
  const [counterOffer, setCounterOffer] = useState(0);
  const [round, setRound] = useState(0);
  const [finalAccepted, setFinalAccepted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Triggers state
  const timeInSectionRef = useRef(0);
  const scrollCountRef = useRef(0);
  const lastScrollDirRef = useRef<'up' | 'down' | null>(null);
  const ctaClickedRef = useRef(false);
  const triggerFiredRef = useRef(false);

  // Slider limits
  const sliderMin = currentPrice;
  const sliderMax = Math.round(currentPrice * 1.12);

  // Trigger system
  const checkTriggers = useCallback(() => {
    if (triggerFiredRef.current || dismissed || phase !== 'hidden') return;

    const timeThreshold = timeInSectionRef.current >= 15; // 15 seconds
    const scrollThreshold = scrollCountRef.current >= 4;  // 4 direction changes
    const noCtaClick = !ctaClickedRef.current;

    // Trigger if: spent time + no CTA click, OR excessive scrolling
    if ((timeThreshold && noCtaClick) || (scrollThreshold && noCtaClick)) {
      triggerFiredRef.current = true;
      setPhase('initial');
    }
  }, [dismissed, phase]);

  // Time tracking
  useEffect(() => {
    if (!enabled || dismissed) return;
    const interval = setInterval(() => {
      timeInSectionRef.current += 1;
      checkTriggers();
    }, 1000);
    return () => clearInterval(interval);
  }, [enabled, dismissed, checkTriggers]);

  // Scroll tracking (direction changes = friction)
  useEffect(() => {
    if (!enabled || dismissed) return;
    const handleScroll = () => {
      const dir = window.scrollY > (window as unknown as { _lastY?: number })._lastY! ? 'down' : 'up';
      (window as unknown as { _lastY: number })._lastY = window.scrollY;
      if (lastScrollDirRef.current && dir !== lastScrollDirRef.current) {
        scrollCountRef.current += 1;
        checkTriggers();
      }
      lastScrollDirRef.current = dir;
    };
    (window as unknown as { _lastY: number })._lastY = window.scrollY;
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [enabled, dismissed, checkTriggers]);

  // Exit intent (mouse leaves viewport top)
  useEffect(() => {
    if (!enabled || dismissed) return;
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !triggerFiredRef.current && phase === 'hidden') {
        triggerFiredRef.current = true;
        setPhase('initial');
      }
    };
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [enabled, dismissed, phase]);

  // CTA click detection
  useEffect(() => {
    if (!enabled) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button')?.textContent?.includes('Continuar') ||
          target.closest('a')?.href?.includes('wa.me')) {
        ctaClickedRef.current = true;
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [enabled]);

  const handleSubmitProposal = () => {
    const zone = getZone(proposedPrice, currentPrice);
    const counter = generateCounterOffer(proposedPrice, currentPrice);
    setCounterOffer(counter);
    setRound(r => r + 1);

    if (zone === 'optimal') {
      setFinalAccepted(true);
      setPhase('final');
    } else {
      setPhase('response');
    }
  };

  const handleAcceptCounter = () => {
    setFinalAccepted(true);
    setPhase('final');
  };

  const handleRejectCounter = () => {
    if (round >= 3) {
      setPhase('final');
    } else {
      setPhase('initial');
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setPhase('hidden');
  };

  if (!enabled || phase === 'hidden') return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-5 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold">
                {phase === 'final' ? (finalAccepted ? '¡Excelente!' : 'Nuestra mejor oferta') : 'Queremos escucharte'}
              </h3>
              <p className="text-purple-200 text-sm mt-1">
                {phase === 'final' 
                  ? (finalAccepted ? 'Hemos llegado a un acuerdo.' : 'Este es nuestro mejor esfuerzo bajo estas condiciones.')
                  : 'Entendemos que cada situación es diferente.'
                }
              </p>
            </div>
            <button onClick={handleDismiss} className="text-purple-200 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Phase: Initial - Proposal */}
        {phase === 'initial' && (
          <div className="p-5">
            <p className="text-gray-700 text-sm mb-4">
              Si esta cifra no se ajusta a lo que esperabas, cuéntanos cuál sería el número que te haría sentir cómodo para cerrar.
            </p>

            {/* Mode selector */}
            <div className="flex gap-2 mb-4">
              <button 
                onClick={() => setInputMode('slider')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition ${
                  inputMode === 'slider' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Ajustar con barra
              </button>
              <button 
                onClick={() => setInputMode('freeInput')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition ${
                  inputMode === 'freeInput' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Escribir valor
              </button>
            </div>

            {/* Current offer reference */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-500">Oferta actual</p>
              <p className="text-lg font-bold text-purple-700">{formatPrice(currentPrice)}</p>
            </div>

            {/* Option A: Slider */}
            {inputMode === 'slider' && (
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>{formatPrice(sliderMin)}</span>
                  <span>{formatPrice(sliderMax)}</span>
                </div>
                <input
                  type="range"
                  min={sliderMin}
                  max={sliderMax}
                  step={Math.round(currentPrice * 0.005)}
                  value={proposedPrice}
                  onChange={(e) => setProposedPrice(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <div className="text-center mt-2">
                  <p className="text-xs text-gray-500">Tu propuesta</p>
                  <p className="text-2xl font-bold text-gray-900">{formatPrice(proposedPrice)}</p>
                  {proposedPrice > currentPrice && (
                    <p className="text-xs text-green-600">
                      +{((proposedPrice - currentPrice) / currentPrice * 100).toFixed(1)}% sobre la oferta
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Option B: Free input */}
            {inputMode === 'freeInput' && (
              <div className="mb-4">
                <label className="text-xs text-gray-500 mb-1 block">Tu propuesta</label>
                <input
                  type="text"
                  value={proposedPrice > 0 ? `$ ${proposedPrice.toLocaleString('es-CO')}` : ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                    setProposedPrice(val);
                  }}
                  placeholder={`Ej: ${formatPrice(Math.round(currentPrice * 1.05))}`}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-lg font-semibold text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
                />
                {proposedPrice > currentPrice && (
                  <p className="text-xs text-green-600 mt-1">
                    +{((proposedPrice - currentPrice) / currentPrice * 100).toFixed(1)}% sobre la oferta
                  </p>
                )}
              </div>
            )}

            <button
              onClick={handleSubmitProposal}
              disabled={proposedPrice <= currentPrice}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Enviar propuesta
            </button>

            <p className="text-[10px] text-gray-400 text-center mt-3">
              Ronda {round + 1} de 3 • Sujeto a evaluación
            </p>
          </div>
        )}

        {/* Phase: Response - Counter offer */}
        {phase === 'response' && (
          <div className="p-5">
            {getZone(proposedPrice, currentPrice) === 'minimum' ? (
              <>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-800 font-medium mb-1">Tenemos una contraoferta</p>
                  <p className="text-xs text-yellow-700">
                    Hemos evaluado tu propuesta de {formatPrice(proposedPrice)} y podemos ofrecerte:
                  </p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 mb-4 text-center">
                  <p className="text-xs text-purple-600">Nuestra contraoferta</p>
                  <p className="text-3xl font-bold text-purple-700">{formatPrice(counterOffer)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    +{((counterOffer - currentPrice) / currentPrice * 100).toFixed(1)}% sobre la oferta inicial
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-red-800 font-medium mb-1">Valor fuera de rango</p>
                  <p className="text-xs text-red-700">
                    Para {formatPrice(proposedPrice)} necesitaríamos ajustar condiciones. Nuestra mejor alternativa:
                  </p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 mb-4 text-center">
                  <p className="text-xs text-purple-600">Máximo que podemos ofrecer</p>
                  <p className="text-3xl font-bold text-purple-700">{formatPrice(counterOffer)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    +{((counterOffer - currentPrice) / currentPrice * 100).toFixed(1)}% sobre la oferta inicial
                  </p>
                </div>
              </>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleAcceptCounter}
                className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
              >
                Aceptar
              </button>
              <button
                onClick={handleRejectCounter}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
              >
                {round >= 3 ? 'Cerrar' : 'Hacer otra propuesta'}
              </button>
            </div>

            <p className="text-[10px] text-gray-400 text-center mt-3">
              Ronda {round} de 3
            </p>
          </div>
        )}

        {/* Phase: Final */}
        {phase === 'final' && (
          <div className="p-5 text-center">
            {finalAccepted ? (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-lg font-bold text-gray-900 mb-2">Propuesta registrada</p>
                <p className="text-sm text-gray-600 mb-1">
                  Valor acordado: <strong className="text-purple-700">{formatPrice(counterOffer || proposedPrice)}</strong>
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Tu asesor se pondrá en contacto para confirmar los detalles y avanzar con el proceso.
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-lg font-bold text-gray-900 mb-2">Este es nuestro mejor esfuerzo</p>
                <p className="text-sm text-gray-600 mb-4">
                  La oferta de <strong className="text-purple-700">{formatPrice(currentPrice)}</strong> es la mejor que podemos hacer bajo las condiciones actuales del mercado.
                </p>
              </>
            )}
            <button
              onClick={handleDismiss}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
            >
              Entendido
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
