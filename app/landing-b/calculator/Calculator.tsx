"use client";

import React, { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import "./calculator.css";
import "./habi-comparison.css";
import { usePDFDownload } from "../hooks/usePDFDownload";
import FinancialReport from "../reports/FinancialReport";

// Stub analytics: Landing B no tiene tracking
const analytics = {
  ctaClick: (..._args: unknown[]) => {},
  downloadBrochure: (..._args: unknown[]) => {},
  calculatorUse: (..._args: unknown[]) => {},
  calculatorStart: (..._args: unknown[]) => {},
  calculatorFieldFilled: (..._args: unknown[]) => {},
  calculatorComplete: (..._args: unknown[]) => {},
  calculatorResultsViewed: (..._args: unknown[]) => {},
  calculatorReset: (..._args: unknown[]) => {},
  calculatorHabiOfferAdded: (..._args: unknown[]) => {},
};
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import confetti from "canvas-confetti";
import Image from "next/image";

gsap.registerPlugin(ScrollTrigger);

// Componente de comparación Habi vs Mercado
interface HabiVsMarketComparisonProps {
  propertyValue: number;
  totalExpenses: number;
  netAmount: number;
  habiOffer: number;
}

function HabiVsMarketComparison({ propertyValue, totalExpenses, netAmount, habiOffer }: HabiVsMarketComparisonProps) {
  const [progress, setProgress] = useState(1);
  const [animatedHabiTotal, setAnimatedHabiTotal] = useState(0);
  const [animatedMarketTotal, setAnimatedMarketTotal] = useState(0);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const confettiDisparadoRef = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const habiCounterRef = useRef<HTMLDivElement>(null);
  const marketCounterRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const habiCardRef = useRef<HTMLDivElement>(null);
  const marketCardRef = useRef<HTMLDivElement>(null);
  const habiDescRef = useRef<HTMLParagraphElement>(null);
  const marketDescRef = useRef<HTMLParagraphElement>(null);

  const months = 9;
  const habiPerMonth = (habiOffer / 1000000) / months; // Cuota mensual de Habi en millones
  const totalExpensesPerMonth = (totalExpenses / months) / 1000000; // Gastos totales mensuales en millones
  const marketNetAmount = netAmount / 1000000; // Valor neto final en millones (ej: 129.210M)
  const marketFinalSale = propertyValue / 1000000; // Precio de venta bruto en millones (ej: 150M)

  const habiTotal = progress * habiPerMonth; // Total acumulado Habi en millones
  // En el mes 9 mostramos el valor NETO real después de todos los gastos
  const marketTotal = progress === 9 ? marketNetAmount : -(progress * totalExpensesPerMonth); // Total mercado

  // Descripciones por mes para Habi
  const getHabiDescription = (month: number) => {
    if (month === months) return "Recibes tu última cuota fija";
    return "Recibes tu cuota fija";
  };

  // Descripciones por mes para Mercado
  const getMarketDescription = (month: number) => {
    if (month === 7) return "Comienzan los trámites del banco. Pagas gastos de tener un inmueble";
    if (month === 6) return "¡Consigues comprador! Pagas gastos de tener un inmueble";
    return "Pagas gastos de tener un inmueble";
  };

  // Función para disparar confetti
  const throwConfetti = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.3 },
      colors: ["#7400C2", "#8A00E6", "#EACDFE", "#F9F0FF", "#FFD700", "#FF69B4", "#00CED1"],
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  };

  // Disparar confetti cuando llegue al mes 6 (solo una vez)
  useEffect(() => {
    if (progress === 6 && !confettiDisparadoRef.current) {
      setTimeout(() => {
        throwConfetti();
        confettiDisparadoRef.current = true;
      }, 300);
    }
    // Resetear si baja del mes 6
    if (progress < 6) {
      confettiDisparadoRef.current = false;
    }
  }, [progress]);

  // Animar contadores cuando cambia el progress
  useEffect(() => {
    const tl = gsap.timeline();

    // Fade out suave de las cards
    tl.to([habiCardRef.current, marketCardRef.current], {
      opacity: 0.6,
      duration: 0.3,
      ease: "power2.inOut"
    });

    // Animar contadores con efecto suave
    tl.to({ value: animatedHabiTotal }, {
      value: habiTotal,
      duration: 0.8,
      ease: "power2.inOut",
      onUpdate: function() {
        setAnimatedHabiTotal(this.targets()[0].value);
      }
    }, "-=0.15");

    tl.to({ value: animatedMarketTotal }, {
      value: marketTotal,
      duration: 0.8,
      ease: "power2.inOut",
      onUpdate: function() {
        setAnimatedMarketTotal(this.targets()[0].value);
      }
    }, "<");

    // Fade in suave de las cards
    tl.to([habiCardRef.current, marketCardRef.current], {
      opacity: 1,
      duration: 0.3,
      ease: "power2.inOut"
    }, "-=0.4");

    // Animar descripciones con fade simple
    if (habiDescRef.current) {
      tl.fromTo(habiDescRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.4, ease: "power2.out" },
        "-=0.2"
      );
    }

    if (marketDescRef.current) {
      tl.fromTo(marketDescRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.4, ease: "power2.out" },
        "<"
      );
    }
  }, [progress]);

  // Track cuando el usuario ve la sección de comparación
  useEffect(() => {
    if (!hasTrackedView && scrollContainerRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !hasTrackedView) {
              analytics.ctaClick('habi_vs_market_viewed', 'comparison_section');
              setHasTrackedView(true);
            }
          });
        },
        { threshold: 0.3 }
      );

      observer.observe(scrollContainerRef.current);

      return () => observer.disconnect();
    }
  }, [hasTrackedView]);

  // Track progreso en la comparación
  useEffect(() => {
    if (progress === 6) {
      analytics.ctaClick('habi_vs_market_month_6', 'comparison_section');
    } else if (progress === 9) {
      analytics.ctaClick('habi_vs_market_completed', 'comparison_section');
    }
  }, [progress]);

  useEffect(() => {
    if (!scrollContainerRef.current) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: scrollContainerRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
        onUpdate: (self) => {
          // Va de mes 1 a mes 9
          const newProgress = Math.ceil(self.progress * 9);
          setProgress(Math.max(1, newProgress));
        },
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <section className="min-h-screen bg-gradient-to-b from-white via-[#F9F0FF] to-[#EACDFE]/30 mt-12">
      <div className="container mx-auto px-6 py-12 max-w-5xl">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black mb-4 sm:mb-6 leading-tight tracking-tight px-4" style={{ color: "#7400C2" }}>
            Habi vs Mercado Tradicional
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-700 max-w-2xl mx-auto font-medium px-4">
            Basado en los datos de tu calculadora: compara cómo evolucionan tus ingresos mes a mes
          </p>
        </header>

        {/* Comparación Card - Sticky */}
        <div 
          ref={cardRef}
          className="sticky top-8 bg-white rounded-2xl border shadow-sm p-8 mb-8 transition-all duration-300"
          style={{ borderColor: "#E5E7EB" }}>
          
          {/* Layout: Mes a la izquierda, Cards a la derecha */}
          <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-start">
            
            {/* Mes - Izquierda */}
            <div className="flex-shrink-0 text-center md:text-left w-full md:w-auto">
              <p className="text-xs sm:text-sm uppercase tracking-widest text-slate-400 mb-2 font-semibold">Mes</p>
              <p className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black" style={{ color: "#7400C2" }}>
                {progress}
              </p>
            </div>

            {/* Cards - Derecha */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 w-full">
              
              {/* Habi */}
              <div ref={habiCardRef} className="space-y-2 md:space-y-4 flex flex-col items-center">
                <p className="text-xs uppercase tracking-widest font-black text-center" style={{ color: "#7400C2" }}>
                  Habi
                </p>
                
                {/* Logo Habi - cambia en mes 1 */}
                <div className="py-1 md:py-2">
                  <Image 
                    src={progress === 1 ? "/mes1.png" : "/habi.png"}
                    alt="Habi" 
                    width={60} 
                    height={60}
                    className="object-contain md:w-[80px] md:h-[80px]"
                  />
                </div>
                
                <div ref={habiCounterRef}>
                  <p className="text-3xl sm:text-4xl md:text-5xl font-black text-center" style={{ color: "#7400C2" }}>
                    ${animatedHabiTotal.toFixed(1)}M
                  </p>
                </div>

                <p ref={habiDescRef} className="text-xs sm:text-sm text-slate-600 font-medium text-center px-2">
                  {getHabiDescription(progress)}
                </p>
              </div>

              {/* Mercado */}
              <div ref={marketCardRef} className="space-y-2 md:space-y-4 flex flex-col items-center">
                <p className="text-xs uppercase tracking-widest font-black text-center text-slate-700">
                  Mercado tradicional
                </p>
                
                {/* Imagen Mercado / Comprador / Banco / Mes9 - cambia según el mes */}
                <div className="py-1 md:py-2">
                  {progress === 6 ? (
                    <Image 
                      src="/comprador.png" 
                      alt="Comprador" 
                      width={60} 
                      height={60}
                      className="object-contain md:w-[80px] md:h-[80px]"
                    />
                  ) : progress === 9 ? (
                    <Image 
                      src="/mes9.png" 
                      alt="Venta completada" 
                      width={60} 
                      height={60}
                      className="object-contain md:w-[80px] md:h-[80px]"
                    />
                  ) : progress >= 7 ? (
                    <Image 
                      src="/banco.png" 
                      alt="Banco" 
                      width={60} 
                      height={60}
                      className="object-contain md:w-[80px] md:h-[80px]"
                    />
                  ) : (
                    <Image 
                      src="/mercado.png" 
                      alt="Mercado" 
                      width={60} 
                      height={60}
                      className="object-contain md:w-[80px] md:h-[80px]"
                    />
                  )}
                </div>
                
                <div ref={marketCounterRef}>
                  <p className={`text-3xl sm:text-4xl md:text-5xl font-black text-center ${marketTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${animatedMarketTotal.toFixed(1)}M
                  </p>
              </div>

                <p ref={marketDescRef} className="text-xs sm:text-sm font-medium text-center px-2">
                  {progress === 9 ? (
                    <>
                      <span className="text-slate-600 text-xs sm:text-sm">Vendiste en ${marketFinalSale.toFixed(1)}M pero...</span>
                      <br />
                      <span className="text-metallic-red text-sm sm:text-base">Con gastos de ${(totalExpenses / 1000000).toFixed(1)}M recibes ${marketNetAmount.toFixed(1)}M</span>
                    </>
                  ) : progress === 6 ? (
                    <>
                      <span className="text-metallic-purple text-sm sm:text-base md:text-lg">¡Consigues comprador!</span>
                      <br />
                      <span className="text-slate-600 text-xs sm:text-sm">Pagas gastos de tener un inmueble</span>
                    </>
                  ) : progress === 7 ? (
                    <>
                      <span className="text-metallic-purple text-sm sm:text-base md:text-lg">Comienzan los trámites del banco</span>
                      <br />
                      <span className="text-slate-600 text-xs sm:text-sm">Pagas gastos de tener un inmueble</span>
                    </>
                  ) : (
                    <span className="text-slate-600 text-xs sm:text-sm">{getMarketDescription(progress)}</span>
                  )}
                </p>
              </div>

            </div>
          </div>

          {/* Gráfica de Ingresos vs Egresos */}
          <div className="mt-8 pt-8 border-t border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Evolución financiera</p>
                <span className="text-xs text-slate-400">*</span>
              </div>
              
              {/* Leyenda */}
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#7400C2" }}></div>
                  <span className="text-xs font-semibold text-slate-700">Habi</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-xs font-semibold text-slate-700">Mercado</span>
                </div>
              </div>
            </div>
            
            <svg viewBox="0 0 900 360" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
                  <defs>
                {/* Gradiente para área Habi */}
                <linearGradient id="habiGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: "#7400C2", stopOpacity: 0.2 }} />
                  <stop offset="100%" style={{ stopColor: "#7400C2", stopOpacity: 0.02 }} />
                    </linearGradient>
                
                {/* Gradiente para área Mercado */}
                <linearGradient id="marketGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: "#DC2626", stopOpacity: 0.1 }} />
                  <stop offset="100%" style={{ stopColor: "#DC2626", stopOpacity: 0.02 }} />
                    </linearGradient>
                  </defs>
              
              {/* Grid horizontal */}
              <line x1="80" y1="60" x2="840" y2="60" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="80" y1="125" x2="840" y2="125" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="80" y1="190" x2="840" y2="190" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="80" y1="255" x2="840" y2="255" stroke="#F1F5F9" strokeWidth="1" />
              
              {/* Eje X (línea $0) */}
              <line x1="80" y1="310" x2="840" y2="310" stroke="#94A3B8" strokeWidth="2" />
              
              {/* Labels Eje Y - Dinámicos basados en el valor neto después de gastos */}
              <text x="65" y="65" textAnchor="end" fontSize="13" fill="#64748B" fontWeight="600">${marketNetAmount.toFixed(0)}M</text>
              <text x="65" y="130" textAnchor="end" fontSize="13" fill="#64748B" fontWeight="600">${(marketNetAmount * 0.75).toFixed(0)}M</text>
              <text x="65" y="195" textAnchor="end" fontSize="13" fill="#64748B" fontWeight="600">${(marketNetAmount * 0.5).toFixed(0)}M</text>
              <text x="65" y="260" textAnchor="end" fontSize="13" fill="#64748B" fontWeight="600">${(marketNetAmount * 0.25).toFixed(0)}M</text>
              <text x="65" y="315" textAnchor="end" fontSize="13" fill="#64748B" fontWeight="700">$0</text>
              
              {/* Labels Eje X (Meses) */}
              {[...Array(9)].map((_, i) => {
                const x = 80 + ((i + 1) * (760 / 9));
                      return (
                  <text key={`month-${i}`} x={x} y="335" textAnchor="middle" fontSize="14" fill="#475569" fontWeight="600">
                    M{i + 1}
                  </text>
                      );
                    })}
              
              {/* Área de relleno Habi */}
              {progress > 0 && (
                <polygon
                  points={`80,310 ${[...Array(Math.min(progress, 9))].map((_, i) => {
                    const month = i + 1;
                    const x = 80 + (month * (760 / 9));
                    const value = month * habiPerMonth;
                    const y = 310 - (value / marketNetAmount) * 250;
                    return `${x},${y}`;
                  }).join(' ')} ${80 + (Math.min(progress, 9) * (760 / 9))},310`}
                  fill="url(#habiGradient)"
                />
              )}
              
              {/* Línea Habi (morado) */}
              {progress > 0 && (
                <polyline
                  points={[...Array(Math.min(progress, 9))].map((_, i) => {
                    const month = i + 1;
                    const x = 80 + (month * (760 / 9));
                    const value = month * habiPerMonth;
                    const y = 310 - (value / marketNetAmount) * 250;
                    return `${x},${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#7400C2"
                  strokeWidth="4"
                          strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              
              {/* Línea Mercado - Parte Roja (Meses 1-8 o hasta el progress actual) */}
              {progress > 0 && (
                <polyline
                  points={[...Array(Math.min(progress, 8))].map((_, i) => {
                    const month = i + 1;
                    const x = 80 + (month * (760 / 9));
                    const value = 0; // Gastos, se queda en 0
                    const y = 310 - (value / marketNetAmount) * 250;
                    return `${x},${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#DC2626"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="8 4"
                />
              )}
              
              {/* Línea Mercado - Parte Verde (Solo del mes 8 al mes 9) */}
              {progress === 9 && (
                <polyline
                  points={(() => {
                    const points = [];
                    // Mes 8
                    const x8 = 80 + (8 * (760 / 9));
                    const y8 = 310;
                    points.push(`${x8},${y8}`);
                    
                    // Mes 9
                    const x9 = 80 + (9 * (760 / 9));
                    const value9 = marketNetAmount;
                    const y9 = 310 - (value9 / marketNetAmount) * 250;
                    points.push(`${x9},${y9}`);
                    
                    return points.join(' ');
                  })()}
                  fill="none"
                  stroke="#16A34A"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              
              {/* Puntos Mercado */}
              {[...Array(Math.min(progress, 9))].map((_, i) => {
                const month = i + 1;
                const x = 80 + (month * (760 / 9));
                let value;
                if (month === 9) {
                  value = marketNetAmount;
                } else {
                  value = 0;
                }
                const y = 310 - (value / marketNetAmount) * 250;
                const color = month === 9 ? "#16A34A" : "#DC2626";
                const isCurrentMonth = month === progress;
                
                return (
                  <g key={`market-point-${i}`}>
                    {/* Punto */}
                    <circle cx={x} cy={y} r={isCurrentMonth ? 8 : 6} fill="white" stroke={color} strokeWidth="3" />
                    <circle cx={x} cy={y} r={isCurrentMonth ? 4 : 3} fill={color} />
                    
                    {/* Valor en el punto actual */}
                    {isCurrentMonth && (
                      <>
                        <rect x={x - 35} y={month === 9 ? y - 45 : y + 11} width="70" height="24" rx="4" fill={color} />
                        <text x={x} y={month === 9 ? y - 27 : y + 29} textAnchor="middle" fontSize="12" fill="white" fontWeight="700">
                          {month === 9 ? `$${value.toFixed(1)}M` : `-$${(month * totalExpensesPerMonth).toFixed(1)}M`}
                    </text>
                      </>
                    )}
                  </g>
                );
              })}
              
              {/* Puntos y valores Habi (dibujados al final para que estén encima) */}
              {[...Array(Math.min(progress, 9))].map((_, i) => {
                const month = i + 1;
                const x = 80 + (month * (760 / 9));
                const value = month * habiPerMonth;
                const y = 310 - (value / marketNetAmount) * 250;
                const isCurrentMonth = month === progress;
                
                return (
                  <g key={`habi-point-${i}`}>
                    {/* Punto */}
                    <circle cx={x} cy={y} r={isCurrentMonth ? 8 : 6} fill="white" stroke="#7400C2" strokeWidth="3" />
                    <circle cx={x} cy={y} r={isCurrentMonth ? 4 : 3} fill="#7400C2" />
                    
                    {/* Valor en el punto actual */}
                    {isCurrentMonth && (
                      <>
                        <rect x={month === 9 ? x - 55 : x - 35} y={month === 9 ? y + 25 : y + 11} width="70" height="24" rx="4" fill="#7400C2" />
                        <text x={month === 9 ? x - 20 : x} y={month === 9 ? y + 43 : y + 29} textAnchor="middle" fontSize="12" fill="white" fontWeight="700">
                          ${value.toFixed(1)}M
                    </text>
                      </>
                    )}
                  </g>
                );
              })}
                </svg>
            
            {/* Disclaimer */}
            <p className="text-xs text-slate-500 mt-4 italic">
              * Esta gráfica es una ilustración comparativa basada en estimaciones y datos aproximados del mercado. No constituye una proyección financiera exacta ni garantiza resultados específicos. Los valores reales pueden variar según las condiciones particulares de cada transacción.
            </p>
          </div>

        </div>

        {/* Scroll Area */}
        <div ref={scrollContainerRef} className="h-[900vh]" />
      </div>
    </section>
  );
}

// Custom HelpIcon component
const HelpIcon = ({ title }: { title: string }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="help-icon-container">
      <div
        className="help-icon"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        ?
      </div>
      {showTooltip && <div className="tooltip">{title}</div>}
    </div>
  );
};

interface CalculatorProps {
  bnpl9Value?: string;
}

export default function Calculator({ bnpl9Value }: CalculatorProps = {}) {
  const [propertyValue, setPropertyValue] = useState("");
  const [administrationValue, setAdministrationValue] = useState("");
  const [servicesValue, setServicesValue] = useState("");
  const [propertyTaxValue, setPropertyTaxValue] = useState("");
  const [creditValue, setCreditValue] = useState("");
  const [habiOffer, setHabiOffer] = useState("");
  const [showHabiOffer, setShowHabiOffer] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Ref para asegurar que el tracking solo ocurra UNA VEZ
  const hasTrackedUse = useRef(false);

  // Hook para descargar PDF
  const { downloadPDF, isDownloading } = usePDFDownload({
    onDownloadStart: () => {
      analytics.downloadBrochure('calculadora_gastos');
    },
    onDownloadError: (error) => {
      console.error("Error al descargar PDF:", error);
      alert("Error al generar el PDF. Por favor, inténtalo de nuevo.");
    },
  });

  // Track cuando se monta el componente (solo UNA VEZ)
  useEffect(() => {
    // Solo trackear si no se ha trackeado antes
    if (!hasTrackedUse.current) {
    analytics.calculatorUse('gastos_venta');
      hasTrackedUse.current = true;
    }
    
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 480);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Array vacío = solo ejecutar UNA VEZ al montar

  const addThousandsSeparators = (digits: string) => {
    if (!digits) return "";
    let formatted = "";
    let counter = 0;

    for (let i = digits.length - 1; i >= 0; i -= 1) {
      formatted = digits[i] + formatted;
      counter += 1;

      if (counter === 3 && i !== 0) {
        formatted = `.${formatted}`;
        counter = 0;
      }
    }

    return formatted;
  };

  const formatCurrency = (value: string) => {
    if (!value || value === "") return "";
    const numericValue = value.replace(/\D/g, "");
    if (numericValue === "") return "";
    return `$ ${addThousandsSeparators(numericValue)}`;
  };

  const formatCurrencyDisplay = (value: string) => {
    if (!value) return "$ 0 COP";
    const numericValue = value.replace(/\D/g, "");
    if (numericValue === "") return "$ 0 COP";
    return `$ ${addThousandsSeparators(numericValue)} COP`;
  };

  const formatCOP = (value: number) => {
    return `$${value.toLocaleString("es-CO", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const handleInputChange = (
    value: string,
    setter: (value: string) => void,
    fieldName?: string
  ) => {
    // Remove everything except numbers
    const numericValue = value.replace(/\D/g, "");
    // Limit to maximum 15 digits
    if (numericValue.length <= 15) {
      setter(numericValue);
      
      // Track primer uso de la calculadora
      if (!hasStarted && numericValue.length > 0) {
        analytics.calculatorStart('gastos_venta');
        setHasStarted(true);
      }
      
      // Track campo completado (cuando tiene al menos 6 dígitos)
      if (fieldName && numericValue.length >= 6) {
        analytics.calculatorFieldFilled(fieldName);
      }
    }
  };

  // Function to validate if all required fields are filled
  const isFormValid = () => {
    return propertyValue && servicesValue && propertyTaxValue;
  };

  // Cálculos exactos como la calculadora original
  const calculateResults = () => {
    const propValue = parseInt(propertyValue) || 0;
    const adminValue = parseInt(administrationValue) || 0;
    const servValue = parseInt(servicesValue) || 0;
    const taxValue = parseInt(propertyTaxValue) || 0;
    const credValue = parseInt(creditValue) || 0;
    const habiOfferValue = parseInt(habiOffer) || 0;

    // GASTOS FIJOS (9 meses)
    const fixedExpenses = {
      administration: adminValue * 9,
      services: servValue * 9,
      propertyTax: taxValue * (9 / 12), // Prorrateado a 9 meses
      credit: credValue * 9,
    };
    const totalFixedExpenses = Object.values(fixedExpenses).reduce((a, b) => a + b, 0);

    // GASTOS DE PROCESO (porcentajes sobre valor de propiedad)
    const processExpenses = {
      agentCommission: (propValue * 3) / 100,        // 3%
      marketDiscount: (propValue * 5.0) / 100,      // 5%
      renovations: (propValue * 1.15) / 100,        // 1.15%
    };
    const totalProcessExpenses = Object.values(processExpenses).reduce((a, b) => a + b, 0);

    // GASTOS NOTARIALES Y TRÁMITES (3.21%)
    const notarialExpenses = {
      withholdingTax: (propValue * 1.0) / 100,      // 1%
      notarialFeesSeller: (propValue * 0.54) / 100 / 2,  // 0.27% (50% vendedor)
      notarialFeesBuyer: (propValue * 0.54) / 100 / 2,   // 0.27% (50% comprador)
      registrationTax: (propValue * 1.67) / 100,    // 1.67%
    };
    const totalNotarialExpenses = Object.values(notarialExpenses).reduce((a, b) => a + b, 0);

    // TOTALES
    const totalExpenses = totalFixedExpenses + totalProcessExpenses + totalNotarialExpenses;
    const netAmount = propValue - totalExpenses;

    return {
      propertyValue: propValue,
      fixedExpenses,
      totalFixedExpenses,
      processExpenses,
      totalProcessExpenses,
      notarialExpenses,
      totalNotarialExpenses,
      totalExpenses,
      netAmount,
      habiOffer: habiOfferValue,
    };
  };

  const handleCalculate = () => {
    const results = calculateResults();
    
    // Track conversión de calculadora completada
    analytics.calculatorComplete('gastos_venta', { 
      propertyValue: results.propertyValue 
    });
    
    setShowResults(true);
    
    // Track visualización de resultados
    setTimeout(() => {
      analytics.calculatorResultsViewed('gastos_venta', results.totalExpenses);
      
      const resultsElement = document.getElementById("calculation-results");
      if (resultsElement) {
        resultsElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  const handleNewCalculation = () => {
    // Track reset de calculadora
    analytics.calculatorReset('gastos_venta');
    
    setShowResults(false);
    setPropertyValue("");
    setAdministrationValue("");
    setServicesValue("");
    setPropertyTaxValue("");
    setCreditValue("");
    setHabiOffer("");
    setShowHabiOffer(false);
    setHasStarted(false);

    // Scroll to calculator
    setTimeout(() => {
      const calculatorElement = document.getElementById("calculator-section");
      if (calculatorElement) {
        calculatorElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  const handleDownloadPDF = () => {
    const data = {
      propertyValue,
      administrationValue,
      servicesValue,
      propertyTaxValue,
      creditValue,
      habiOffer: habiOffer || undefined,
    };
    
    const filename = `reporte-gastos-venta-${new Date().toISOString().split("T")[0]}.pdf`;
    downloadPDF(FinancialReport, data, filename);
  };

  // Calcular gastos mensuales para el análisis temporal
  const calculateMonthlyExpenses = () => {
    const administration = parseInt(administrationValue) || 0;
    const services = parseInt(servicesValue) || 0;
    const propertyTax = parseInt(propertyTaxValue) || 0;
    const credit = parseInt(creditValue) || 0;

    // Property tax is annual, so we need to prorate it monthly
    const monthlyPropertyTax = propertyTax / 12;

    return administration + services + monthlyPropertyTax + credit;
  };

  const results = showResults ? calculateResults() : null;

  return (
    <div className="calculator-wrapper">
      {/* Calculator Section */}
      <div id="calculator-section" className={showResults ? "calculator-hidden" : ""}>
        <div className="calculator-container-embedded">
          {/* Header */}
          <header className="calculator-header">
            <div className="logo-container">
              <img src="/images/logo/habi.svg" alt="Habi Logo" className="logo" />
              <span className="app-title">CALCULADORA DE GASTOS</span>
            </div>
            <a href="#calculator-section" className="calculate-link">
              HAGAMOS CUENTAS
            </a>
          </header>

          {/* Main Content */}
          <main className="calculator-main">
            <div className="calculator-content">
              {/* Left Section - Property Value */}
              <section className="property-value-section">
                <h2 className="section-title">Valor promedio de tu inmueble</h2>
                <p className="section-subtitle">
                  Primero debes saber datos sobre el valor comercial de tu inmueble.
                </p>

                <div className="input-card">
                  <div className="input-group">
                    <label className="input-label">
                      ¿Cuánto crees que vale tu inmueble?
                    </label>
                    <div className="input-with-icon">
                      <input
                        type="text"
                        value={formatCurrency(propertyValue)}
                        onChange={(e) =>
                          handleInputChange(e.target.value, setPropertyValue, 'property_value')
                        }
                        className="property-input"
                        placeholder="Ej: 500.000.000"
                      />
                      <HelpIcon title="Ingresa el valor estimado de tu inmueble." />
                    </div>
                    <div className="input-info">
                      <span className="currency-display">
                        {formatCurrencyDisplay(propertyValue)}
                      </span>
                      <span className="time-info">
                        Tiempo de venta promedio <b>9 Meses</b>
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Right Section - Fixed Expenses */}
              <section className="fixed-expenses-section">
                <h2 className="section-title">
                  Ingresa los gastos fijos de tu inmueble
                </h2>
                <p className="section-subtitle">
                  Para darte un cálculo exacto de tus gastos al momento de vender tu
                  inmueble primero tienes que ingresar los gastos fijos relacionados
                  al mismo.
                </p>

                <div className="expenses-form">
                  <div className="expenses-grid">
                    <div className="input-group">
                      <label className="input-label">Valor de administración</label>
                      <div className="input-with-icon">
                        <input
                          type="text"
                          value={formatCurrency(administrationValue)}
                          onChange={(e) =>
                            handleInputChange(
                              e.target.value,
                              setAdministrationValue,
                              'administration'
                            )
                          }
                          className="expense-input"
                          placeholder="Ej: 120.000"
                        />
                        <HelpIcon title="Este es el valor que pagas de administración cada mes." />
                      </div>
                    </div>

                    <div className="input-group">
                      <label className="input-label">
                        Valor aproximado de los servicios públicos
                      </label>
                      <div className="input-with-icon">
                        <input
                          type="text"
                          value={formatCurrency(servicesValue)}
                          onChange={(e) =>
                            handleInputChange(e.target.value, setServicesValue, 'services')
                          }
                          className="expense-input"
                          placeholder="Ej: 120.000"
                        />
                        <HelpIcon title="Dinero que pagas por servicios como gas, luz, agua, etc." />
                      </div>
                    </div>

                    <div className="input-group">
                      <label className="input-label">
                        Valor anual del impuesto predial
                      </label>
                      <div className="input-with-icon">
                        <input
                          type="text"
                          value={formatCurrency(propertyTaxValue)}
                          onChange={(e) =>
                            handleInputChange(e.target.value, setPropertyTaxValue, 'property_tax')
                          }
                          className="expense-input"
                          placeholder="Ej: 120.000"
                        />
                        <HelpIcon title="Este es el valor que deberás pagar de impuesto predial, si no conoces el valor puedes ingresar a la pagina de catastro de tu ciudad y verificarlos." />
                      </div>
                    </div>

                    <div className="input-group">
                      <label className="input-label">
                        Valor de la cuota del crédito (opcional)
                      </label>
                      <div className="input-with-icon">
                        <input
                          type="text"
                          value={formatCurrency(creditValue)}
                          onChange={(e) =>
                            handleInputChange(e.target.value, setCreditValue, 'credit')
                          }
                          className="expense-input"
                          placeholder="Ej: 120.000"
                        />
                        <HelpIcon title="Este es el valor que pagas de tu crédito o hipoteca cada mes." />
                      </div>
                    </div>

                    {/* Button to add Habi offer */}
                    {!showHabiOffer && (
                      <div className="add-habi-offer-container">
                        <button
                          type="button"
                          className="add-habi-offer-button"
                          onClick={() => {
                            setShowHabiOffer(true);
                            analytics.calculatorFieldFilled('habi_offer_opened');
                          }}
                        >
                          <span className="plus-icon">+</span>
                        </button>
                      </div>
                    )}

                    {/* Input Habi offer */}
                    {showHabiOffer && (
                      <div className="input-group habi-offer-group">
                        <label className="input-label">
                          Oferta de Habi (opcional)
                        </label>
                        <div className="input-with-icon">
                          <input
                            type="text"
                            value={formatCurrency(habiOffer)}
                            onChange={(e) => {
                              const numValue = parseInt(e.target.value.replace(/\D/g, ''));
                              if (numValue >= 1000000) {
                                analytics.calculatorHabiOfferAdded(numValue);
                              }
                              handleInputChange(e.target.value, setHabiOffer, 'habi_offer');
                            }}
                            className="expense-input"
                            placeholder="Ej: 450.000.000"
                          />
                          <HelpIcon title="Ingresa la oferta que te hizo Habi para tu inmueble. Esta información se mostrará como comparación en los resultados." />
                        </div>
                        <button
                          type="button"
                          className="remove-habi-offer-button"
                          onClick={() => {
                            setShowHabiOffer(false);
                            setHabiOffer("");
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    className={`calculate-button ${
                      !isFormValid() ? "disabled" : ""
                    }`}
                    onClick={handleCalculate}
                    disabled={!isFormValid()}
                  >
                    Calcular todos los gastos
                  </button>
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>

      {/* Results Section */}
      {showResults && results && (
        <div id="calculation-results" className="results-section-embedded">
          <div className="results-container">
            {/* Header */}
            <header className="calculator-header">
              <div className="logo-container">
                <img src="/images/logo/habi.svg" alt="Habi Logo" className="logo" />
                <span className="app-title">CALCULADORA DE GASTOS</span>
              </div>
              <div className="status-badge">RESULTADO</div>
            </header>

            <div className="results-main">
              {/* Step 1: Desglose de Gastos */}
              <div className="results-step">
                <div className="step-header">
                  <div className="step-number">1</div>
                  <h2 className="step-title">Desglose de Gastos</h2>
                </div>
                <div className="breakdown-container">
                  <div className="breakdown-grid">
                    {/* Fixed Expenses Section */}
                    <div className="expense-section">
                      <h3 className="section-title">Resultado de gastos fijos</h3>
                      <p className="section-description">
                        Estos son los gastos que calculaste en la página anterior.
                      </p>

                      <div className="expense-card">
                        <div className="expense-item">
                          <span className="expense-label">Valor de administración</span>
                          <div className="expense-value-container">
                            <span className="expense-value">
                              {formatCOP(results.fixedExpenses.administration)}
                            </span>
                            <HelpIcon title="Dinero que pagas por los servicios comunales del conjunto residencial." />
                          </div>
                        </div>

                        <div className="expense-item">
                          <span className="expense-label">
                            Valor aproximado de los servicios públicos
                          </span>
                          <div className="expense-value-container">
                            <span className="expense-value">
                              {formatCOP(results.fixedExpenses.services)}
                            </span>
                            <HelpIcon title="Dinero que pagas por servicios como gas, luz, agua, etc." />
                          </div>
                        </div>

                        <div className="expense-item">
                          <span className="expense-label">
                            Valor anual del impuesto predial
                          </span>
                          <div className="expense-value-container">
                            <span className="expense-value">
                              {formatCOP(results.fixedExpenses.propertyTax)}
                            </span>
                            <HelpIcon title="Impuesto anual prorrateado a 9 meses (75% del valor anual)." />
                          </div>
                        </div>

                        {results.fixedExpenses.credit > 0 && (
                          <div className="expense-item">
                            <span className="expense-label">
                              Valor de la cuota del crédito
                            </span>
                            <div className="expense-value-container">
                              <span className="expense-value">
                                {formatCOP(results.fixedExpenses.credit)}
                              </span>
                              <HelpIcon title="Cuota recurrente que pagas en caso de tener crédito hipotecario." />
                            </div>
                          </div>
                        )}

                        <div className="expense-total">
                          <span className="total-label">Total de gastos fijos</span>
                          <span className="total-value">
                            {formatCOP(results.totalFixedExpenses)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Process Expenses Section */}
                    <div className="expense-section">
                      <h3 className="section-title">Gastos de procesos</h3>
                      <p className="section-description">
                        Estos gastos son porcentajes según el precio al que vendes tu
                        inmueble.
                      </p>

                      <div className="expense-card">
                        <div className="expense-item">
                          <span className="expense-label">
                            Comisión con Agente inmobiliario (3%)
                          </span>
                          <div className="expense-value-container">
                            <span className="expense-value">
                              {formatCOP(results.processExpenses.agentCommission)}
                            </span>
                            <HelpIcon title="Porcentaje que se paga al agente inmobiliario por la venta." />
                          </div>
                        </div>

                        <div className="expense-item">
                          <span className="expense-label">
                            Descuento promedio del mercado (5%)
                          </span>
                          <div className="expense-value-container">
                            <span className="expense-value">
                              {formatCOP(results.processExpenses.marketDiscount)}
                            </span>
                            <HelpIcon title="Descuento promedio que se aplica en el mercado inmobiliario." />
                          </div>
                        </div>

                        <div className="expense-item">
                          <span className="expense-label">Remodelaciones (1,15%)</span>
                          <div className="expense-value-container">
                            <span className="expense-value">
                              {formatCOP(results.processExpenses.renovations)}
                            </span>
                            <HelpIcon title="Gastos estimados en remodelaciones para la venta." />
                          </div>
                        </div>

                        <div className="expense-total">
                          <span className="total-label">Total gastos de procesos</span>
                          <span className="total-value">
                            {formatCOP(results.totalProcessExpenses)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Resumen Total */}
              <div className="results-step">
                <div className="step-header">
                  <div className="step-number">2</div>
                  <h2 className="step-title">Resumen Total</h2>
                </div>
                <div className="summary-container">
                  {/* Section 1: Total Expenses */}
                  <div className="summary-section">
                    <div className="summary-content">
                      <div className="summary-text">
                        <h3 className="section-title">Estos serían tus gastos totales</h3>
                        <p className="section-description">
                          Estos son los gastos que como propietario debes tener en cuenta al
                          vender tu inmueble.
                        </p>
                      </div>

                      <div className="summary-card">
                        <div className="summary-item">
                          <span className="summary-label">Gastos de proceso</span>
                          <div className="summary-value-container">
                            <span className="summary-value">
                              {formatCOP(results.totalProcessExpenses)}
                            </span>
                            <HelpIcon title="Total de gastos relacionados con el proceso de venta." />
                          </div>
                        </div>

                        <div className="summary-item">
                          <span className="summary-label">Gastos fijos a 9 meses</span>
                          <div className="summary-value-container">
                            <span className="summary-value">
                              {formatCOP(results.totalFixedExpenses)}
                            </span>
                            <HelpIcon title="Total de gastos fijos acumulados en 9 meses." />
                          </div>
                        </div>

                        <div className="summary-item">
                          <span className="summary-label">Gastos notariales Colombia</span>
                          <div className="summary-value-container">
                            <span className="summary-value">
                              {formatCOP(results.totalNotarialExpenses)}
                            </span>
                            <HelpIcon title="Este es el valor promedio total de los trámites notariales que incluye: Retención en la Fuente: 1%, Gastos de Escrituración (Notaría): 0.54%, Gastos de Registro: Los impuestos y derechos de Registro (Beneficencia y Registro de Instrumentos Públicos, que suman aproximadamente entre 1.67%." />
                          </div>
                        </div>

                        <div className="summary-total">
                          <span className="total-label">Total gastos</span>
                          <span className="total-value">{formatCOP(results.totalExpenses)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="section-divider"></div>

                  {/* Section 2: Notarial Expenses Colombia */}
                  <div className="summary-section">
                    <div className="summary-content">
                      <div className="summary-text">
                        <h3 className="section-title">
                          Gastos notariales y trámites (3,21%)
                        </h3>
                        <p className="section-description">
                          Este es el valor promedio total de los trámites notariales que
                          incluye: Retención en la Fuente: 1%, Gastos de Escrituración
                          (Notaría): 0.54%, Gastos de Registro: Los impuestos y derechos de
                          Registro (Beneficencia y Registro de Instrumentos Públicos, que
                          suman aproximadamente entre 1.67% y el 2%.
                        </p>
                      </div>

                      <div className="summary-card">
                        <div className="summary-item">
                          <span className="summary-label">Retención en la Fuente (1%)</span>
                          <div className="summary-value-container">
                            <span className="summary-value">
                              {formatCOP(results.notarialExpenses.withholdingTax)}
                            </span>
                            <HelpIcon title="Retención en la fuente que el comprador debe practicar sobre el valor de la venta y consignar a la DIAN." />
                          </div>
                        </div>

                        <div className="summary-item">
                          <span className="summary-label">
                            Gastos de Escrituración (Notaría) - Parte vendedor (0.27%)
                          </span>
                          <div className="summary-value-container">
                            <span className="summary-value">
                              {formatCOP(results.notarialExpenses.notarialFeesSeller)}
                            </span>
                            <HelpIcon title="Gastos de escrituración en notaría para la formalización de la venta. El vendedor paga el 50% (0.27%) y el comprador paga el otro 50%." />
                          </div>
                        </div>

                        <div className="summary-item">
                          <span className="summary-label">
                            Gastos de Escrituración (Notaría) - Parte comprador (0.27%)
                          </span>
                          <div className="summary-value-container">
                            <span className="summary-value">
                              {formatCOP(results.notarialExpenses.notarialFeesBuyer)}
                            </span>
                            <HelpIcon title="Gastos de escrituración en notaría para la formalización de la venta. El comprador paga el 50% (0.27%) y el vendedor paga el otro 50%." />
                          </div>
                        </div>

                        <div className="summary-item">
                          <span className="summary-label">Gastos de Registro (1.67%)</span>
                          <div className="summary-value-container">
                            <span className="summary-value">
                              {formatCOP(results.notarialExpenses.registrationTax)}
                            </span>
                            <HelpIcon title="Los impuestos y derechos de Registro (Beneficencia y Registro de Instrumentos Públicos, que suman aproximadamente entre 1.67%." />
                          </div>
                        </div>

                        <div className="summary-total">
                          <span className="total-label">
                            Total gastos notariales y trámites
                          </span>
                          <span className="total-value">
                            {formatCOP(results.totalNotarialExpenses)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="section-divider"></div>

                  {/* Section 3: Final Calculation */}
                  <div className="summary-section">
                    <div className="summary-content">
                      <div className="summary-text">
                        <h3 className="section-title">
                          ¿Cuánto queda realmente después de 9 meses?
                        </h3>
                        <p className="section-description">
                          Si restas el valor del inmueble menos lo que te gastarás en
                          procesos y gastos fijos, te dará el dinero real que ganarás con el
                          negocio después de 9 meses.
                        </p>
                      </div>

                      <div className="summary-card">
                        <div className="summary-item">
                          <span className="summary-label">Valor del inmueble</span>
                          <div className="summary-value-container">
                            <span className="summary-value">
                              {formatCOP(results.propertyValue)}
                            </span>
                            <HelpIcon title="Valor comercial estimado de tu inmueble." />
                          </div>
                        </div>

                        <div className="summary-item negative">
                          <span className="summary-label">Total de gastos</span>
                          <div className="summary-value-container">
                            <span className="summary-value negative">
                              -{formatCOP(results.totalExpenses)}
                            </span>
                            <HelpIcon title="Total de gastos que debes descontar." />
                          </div>
                        </div>

                        <div className="summary-final">
                          <span className="final-label">Total a recibir:</span>
                          <span className="final-value">{formatCOP(results.netAmount)}</span>
                        </div>

                        <div className="summary-conclusion">
                          <p className="conclusion-text">
                            Esto es realmente lo que te quedará después de esperar 9 meses
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Comparación con oferta Habi */}
                  {results.habiOffer > 0 && (
                    <>
                      <div className="section-divider"></div>

                      <div className="summary-section">
                        <div className="summary-content">
                          <div className="summary-text">
                            <h3 className="section-title">Comparación con oferta Habi</h3>
                            <p className="section-description">
                              Compara el resultado de la venta tradicional con la oferta que
                              te hizo Habi.
                            </p>
                          </div>

                          <div className="habi-comparison-card">
                            <div className="comparison-grid">
                              {/* Venta Tradicional */}
                              <div className="comparison-option traditional">
                                <div className="option-header">
                                  <h4 className="option-title">Venta Tradicional</h4>
                                  <div className="option-icon">🏠</div>
                                </div>
                                <div className="option-amount">
                                  <span className="amount-label">Total a recibir:</span>
                                  <span className="amount-value traditional-value">
                                    {formatCOP(results.netAmount)}
                                  </span>
                                </div>
                                <div className="option-details">
                                  <p className="details-text">
                                    Después de 9 meses y todos los gastos
                                  </p>
                                </div>
                              </div>

                              {/* Oferta Habi */}
                              <div className="comparison-option habi">
                                <div className="option-header">
                                  <h4 className="option-title">Oferta Habi</h4>
                                  <img
                                    src="/images/logo/habi.svg"
                                    alt="Habi Logo"
                                    className="habi-logo"
                                  />
                                </div>
                                <div className="option-amount">
                                  <span className="amount-label">Oferta:</span>
                                  <span className="amount-value habi-value">
                                    {formatCOP(results.habiOffer)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Difference Section */}
                            <div className="difference-section">
                              <div className="difference-content">
                                <span className="difference-label">Diferencia:</span>
                                <span
                                  className={`difference-amount ${
                                    results.habiOffer > results.netAmount
                                      ? "positive"
                                      : "negative"
                                  }`}
                                >
                                  {results.habiOffer > results.netAmount ? "+" : ""}
                                  {formatCOP(results.habiOffer - results.netAmount)}
                                </span>
                              </div>
                              <p className="recommendation-text">
                                💡{" "}
                                {results.habiOffer > results.netAmount
                                  ? `Con Habi recibirías ${formatCOP(
                                      results.habiOffer - results.netAmount
                                    )} más que con la venta tradicional`
                                  : `Con la venta tradicional recibirías ${formatCOP(
                                      results.netAmount - results.habiOffer
                                    )} más que con Habi`}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Análisis Temporal */}
                  <>
                    <div className="section-divider"></div>

                    <div className="results-step">
                      <div className="step-header">
                        <div className="step-number">3</div>
                        <h2 className="step-title">Análisis Temporal</h2>
                      </div>
                    </div>

                    <div className="temporal-container">
                      <div className="temporal-main">
                        <div className="temporal-top">
                          <div className="temporal-text">
                            <h3 className="section-title">
                              Y cada mes que pasa tus gastos aumentan
                            </h3>
                            <p className="section-description">
                              Entre más tardes en vender tu inmueble los gastos en procesos y
                              fijos irán en aumento, consíderalo para vender a un precio justo.
                            </p>
                          </div>

                          {/* Simple Chart */}
                          <div className="chart-container">
                            <div className="chart-card">
                              <div className="chart-header">
                                <h4 className="chart-title">Incremento de gastos por tiempo</h4>
                              </div>

                              <div className="chart-content">
                                <div className="chart-bars">
                                  {[
                                    {
                                      id: uuidv4(),
                                      period: "10 días",
                                      value: Math.round((calculateMonthlyExpenses() * 10) / 30),
                                      color: "blue",
                                      height: "30px",
                                      mobileHeight: "25px",
                                    },
                                    {
                                      id: uuidv4(),
                                      period: "6 meses",
                                      value: calculateMonthlyExpenses() * 6,
                                      color: "gradient",
                                      height: "150px",
                                      mobileHeight: "125px",
                                    },
                                    {
                                      id: uuidv4(),
                                      period: "9 meses",
                                      value: calculateMonthlyExpenses() * 9,
                                      color: "gradient",
                                      height: "210px",
                                      mobileHeight: "175px",
                                    },
                                  ].map((item) => (
                                    <div key={item.id} className="chart-bar-container">
                                      <div
                                        className={`chart-bar ${item.color}`}
                                        style={{
                                          height: isMobile ? item.mobileHeight : item.height,
                                        }}
                                      >
                                        <div className="bar-value">{formatCOP(item.value)}</div>
                                      </div>
                                      <div className="bar-label">{item.period}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Conclusion Section */}
                      <div className="temporal-conclusion">
                        <div className="conclusion-inner">
                          <div className="conclusion-content">
                            <h4 className="conclusion-title">La información es poder</h4>
                            <p className="conclusion-description">
                              Ahora ya cuentas con los suficientes datos para poder vender tu
                              inmueble a un precio justo contemplando todos los gastos que
                              tienes que hacer.
                            </p>
                          </div>
                          <div className="temporal-icon">
                            <div className="icon-circle">
                              <img
                                src="/images/results/information.png"
                                alt="Información financiera"
                                className="hand-coin-icon"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Botón de descarga de PDF */}
                      <div className="pdf-download-section">
                        <button
                          onClick={handleDownloadPDF}
                          disabled={isDownloading}
                          className={`download-pdf-button ${isDownloading ? "downloading" : ""}`}
                        >
                          {isDownloading ? (
                            <>
                              <span className="loading-spinner">⏳</span>
                              Generando PDF...
                            </>
                          ) : (
                            <>📄 Descargar Reporte PDF</>
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                </div>
              </div>

              {/* Back to Calculator Button */}
              <div className="results-navigation">
                <button
                  className="nav-button secondary back-to-calculator"
                  onClick={handleNewCalculation}
                >
                  ← Volver a Calculadora
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sección de Comparación Habi vs Mercado - Fuera de los resultados, como sección independiente */}
      {showResults && bnpl9Value && results && (
        <HabiVsMarketComparison 
          propertyValue={results.propertyValue}
          totalExpenses={results.totalExpenses}
          netAmount={results.netAmount}
          habiOffer={parseFloat(bnpl9Value) || 0}
        />
      )}
    </div>
  );
}
