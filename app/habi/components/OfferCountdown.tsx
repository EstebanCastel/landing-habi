'use client';

import { useState, useEffect, useCallback } from 'react';

interface OfferCountdownProps {
  dealUuid: string;
}

export default function OfferCountdown({ dealUuid }: OfferCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [expired, setExpired] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);

  // Fetch countdown from API on mount
  useEffect(() => {
    if (!dealUuid) return;

    const fetchCountdown = async () => {
      try {
        const res = await fetch(`/api/countdown?deal_uuid=${dealUuid}`);
        if (res.ok) {
          const data = await res.json();
          setExpiresAt(new Date(data.expires_at));
        }
      } catch (err) {
        console.warn('[Countdown] Failed to fetch:', err);
      }
    };

    fetchCountdown();
  }, [dealUuid]);

  // Tick every second
  const updateTimeLeft = useCallback(() => {
    if (!expiresAt) return;

    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();

    if (diff <= 0) {
      setExpired(true);
      setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    setTimeLeft({ hours, minutes, seconds });
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
    <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-4 py-3 text-center">
      <div className="flex items-center justify-center gap-2">
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {expired ? (
          <p className="text-sm font-medium">Tu oferta ha expirado</p>
        ) : (
          <p className="text-sm font-medium">
            Tu oferta expira en{' '}
            <span className="font-mono font-bold text-base">
              {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
