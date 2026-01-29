'use client';

import { useState, useEffect } from 'react';

interface AnnouncementBarProps {
  fechaExpiracion: string;
}

export default function AnnouncementBar({ fechaExpiracion }: AnnouncementBarProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(fechaExpiracion).getTime() - new Date().getTime();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [fechaExpiracion]);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className="bg-purple-600 text-white py-2 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-sm">
        <span className="font-bold">Tu oferta expira en</span>
        
        <div className="flex items-center gap-1 ml-3">
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg leading-none">{formatNumber(timeLeft.days)}</span>
            <span className="text-[10px] uppercase opacity-80">Días</span>
          </div>
          
          <span className="text-lg font-light mx-1">:</span>
          
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg leading-none">{formatNumber(timeLeft.hours)}</span>
            <span className="text-[10px] uppercase opacity-80">Horas</span>
          </div>
          
          <span className="text-lg font-light mx-1">:</span>
          
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg leading-none">{formatNumber(timeLeft.minutes)}</span>
            <span className="text-[10px] uppercase opacity-80">Min</span>
          </div>
          
          <span className="text-lg font-light mx-1">:</span>
          
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg leading-none">{formatNumber(timeLeft.seconds)}</span>
            <span className="text-[10px] uppercase opacity-80">Seg</span>
          </div>
        </div>
      </div>
    </div>
  );
}

