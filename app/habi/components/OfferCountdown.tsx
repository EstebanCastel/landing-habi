'use client';

import { useState, useEffect, useCallback } from 'react';

interface OfferCountdownProps {
  dealUuid: string;
  country?: string;
  noRecibioOferta?: string | null;
}

export default function OfferCountdown({ dealUuid, country = 'CO', noRecibioOferta }: OfferCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [expired, setExpired] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!dealUuid) return;

    const fetchCountdown = async () => {
      try {
        // Si no_recibio_oferta tiene valor, resetear countdown a 48h (solo una vez por navegador)
        if (noRecibioOferta) {
          const resetKey = `countdown_email_reset_${dealUuid}`;
          const alreadyReset = localStorage.getItem(resetKey);

          if (!alreadyReset) {
            const resetRes = await fetch('/api/countdown', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ deal_uuid: dealUuid }),
            });
            if (resetRes.ok) {
              const resetData = await resetRes.json();
              localStorage.setItem(resetKey, new Date().toISOString());
              setExpiresAt(new Date(resetData.expires_at));
              console.log(`[Countdown] Reset to 48h for ${dealUuid} (no_recibio_oferta)`);
              return;
            }
          }
        }

        // Flujo normal: obtener countdown existente o crear uno nuevo
        const res = await fetch(`/api/countdown?deal_uuid=${dealUuid}&country=${country}`);
        if (res.ok) {
          const data = await res.json();
          setExpiresAt(new Date(data.expires_at));
        }
      } catch (err) {
        console.warn('[Countdown] Failed to fetch:', err);
      }
    };

    fetchCountdown();
  }, [dealUuid, noRecibioOferta, country]);

  const updateTimeLeft = useCallback(() => {
    if (!expiresAt) return;

    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();

    if (diff <= 0) {
      setExpired(true);
      setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    setTimeLeft({ days, hours, minutes, seconds });
  }, [expiresAt]);

  useEffect(() => {
    if (!expiresAt) return;

    const timeout = setTimeout(updateTimeLeft, 0);
    const interval = setInterval(updateTimeLeft, 1000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [expiresAt, updateTimeLeft]);

  if (!timeLeft) return null;

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 text-white px-4 py-2.5">
      {expired ? (
        <p className="text-sm font-medium text-center">Tu oferta ha expirado</p>
      ) : (
        <div className="flex items-center justify-center gap-3">
          <p className="text-sm font-semibold tracking-wide">Tu oferta expira en</p>
          <div className="flex items-center gap-1.5">
            {/* Dias */}
            <div className="flex flex-col items-center">
              <span className="font-mono font-bold text-lg leading-none">{pad(timeLeft.days)}</span>
              <span className="text-[9px] uppercase tracking-wider text-purple-200 mt-0.5">Días</span>
            </div>
            <span className="text-purple-300 font-bold text-lg leading-none mb-3">:</span>
            {/* Horas */}
            <div className="flex flex-col items-center">
              <span className="font-mono font-bold text-lg leading-none">{pad(timeLeft.hours)}</span>
              <span className="text-[9px] uppercase tracking-wider text-purple-200 mt-0.5">Horas</span>
            </div>
            <span className="text-purple-300 font-bold text-lg leading-none mb-3">:</span>
            {/* Minutos */}
            <div className="flex flex-col items-center">
              <span className="font-mono font-bold text-lg leading-none">{pad(timeLeft.minutes)}</span>
              <span className="text-[9px] uppercase tracking-wider text-purple-200 mt-0.5">Min</span>
            </div>
            <span className="text-purple-300 font-bold text-lg leading-none mb-3">:</span>
            {/* Segundos */}
            <div className="flex flex-col items-center">
              <span className="font-mono font-bold text-lg leading-none">{pad(timeLeft.seconds)}</span>
              <span className="text-[9px] uppercase tracking-wider text-purple-200 mt-0.5">Seg</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
