"use client";

import React, { useState, useEffect, useRef } from "react";
import { Montserrat } from "next/font/google";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./timeline-comparison.css";

// Registrar plugin de GSAP
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const montserrat = Montserrat({ subsets: ["latin"] });

interface TimelineComparisonProps {
  monthlyExpenses?: number; // Gastos mensuales del mercado tradicional
  habiMonthlyPayment?: number; // Pago mensual de Habi (cuota fija)
  hasCalculatorData?: boolean; // Si el usuario ya usó la calculadora
}

interface MonthData {
  month: number;
  habiPayment: number;
  habiCosts: number;
  marketCosts: number;
  marketStatus: string;
  habiStatus: string;
}

export default function TimelineComparison({
  monthlyExpenses = 0,
  habiMonthlyPayment = 0,
  hasCalculatorData = false
}: TimelineComparisonProps) {
  const [activeMonth, setActiveMonth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const monthRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Generar datos para 10 meses
  const months: MonthData[] = Array.from({ length: 10 }, (_, i) => ({
    month: i + 1,
    habiPayment: habiMonthlyPayment || 65000000, // Ejemplo: ~65M por mes en 9 cuotas
    habiCosts: 0, // Habi cubre todos los costos
    marketCosts: monthlyExpenses || 2500000, // Ejemplo: ~2.5M/mes
    marketStatus: i < 4 ? "Buscando comprador..." : i < 7 ? "Esperando desembolso FNA..." : "Vendido",
    habiStatus: i < 9 ? "Recibiendo cuota fija" : "Completado"
  }));

  // Calcular totales acumulados
  const calculateTotals = (upToMonth: number) => {
    const habiTotal = months.slice(0, upToMonth + 1).reduce((sum, m) => sum + m.habiPayment, 0);
    const marketTotal = months.slice(0, upToMonth + 1).reduce((sum, m) => sum + m.marketCosts, 0);
    return { habiTotal, marketTotal };
  };

  // GSAP ScrollTrigger animations
  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    const ctx = gsap.context(() => {
      const monthsContainer = document.querySelector(".timeline-months");
      
      if (!monthsContainer) return;

      // Pin the entire section and animate through months
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top top",
        end: `+=${months.length * 100}%`,
        pin: true,
        anticipatePin: 1,
        scrub: 1,
        onUpdate: (self) => {
          const progress = self.progress;
          const currentIndex = Math.min(
            Math.floor(progress * months.length),
            months.length - 1
          );
          setActiveMonth(currentIndex);

          // Animate each month based on scroll progress
          monthRefs.current.forEach((monthEl, index) => {
            if (!monthEl) return;

            const monthProgress = (progress * months.length) - index;
            
            if (monthProgress < 0) {
              // Month hasn't appeared yet
              gsap.set(monthEl, {
                opacity: 0,
                y: 100,
                scale: 0.9,
                zIndex: index,
              });
            } else if (monthProgress < 1) {
              // Month is appearing/active
              gsap.set(monthEl, {
                opacity: 1,
                y: 0,
                scale: 1,
                zIndex: index + 100,
              });
            } else {
              // Month is leaving
              const exitProgress = Math.min((monthProgress - 1) * 2, 1);
              gsap.set(monthEl, {
                opacity: 1 - exitProgress,
                y: -100 * exitProgress,
                scale: 0.9,
                zIndex: index,
              });
            }
          });
        },
      });

      // Animate summary at the end
      const summary = document.querySelector(".timeline-summary");
      if (summary) {
        gsap.set(summary, { opacity: 0, y: 60 });
        
        ScrollTrigger.create({
          trigger: containerRef.current,
          start: `+=${months.length * 90}%`,
          end: `+=${months.length * 100}%`,
          scrub: 1,
          onUpdate: (self) => {
            const summaryProgress = (self.progress - 0.9) / 0.1;
            if (summaryProgress > 0) {
              gsap.set(summary, {
                opacity: summaryProgress,
                y: 60 * (1 - summaryProgress),
              });
            }
          },
        });
      }
    }, containerRef);

    return () => {
      ctx.revert();
    };
  }, [months.length]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const totals = calculateTotals(activeMonth);

  return (
    <div className="timeline-comparison-wrapper" ref={containerRef}>
      <div className="timeline-container">
        {/* Header */}
        <div className="timeline-header">
          <h2 className={`${montserrat.className} timeline-title`}>
            <span className="timeline-title-main">¿Cuánto tiempo y dinero</span>
            <span className="timeline-title-highlight">ahorras con Habi?</span>
          </h2>
          
          {!hasCalculatorData && (
            <div className="timeline-calculator-prompt">
              <p className="timeline-prompt-text">
                💡 <strong>¿Sabías que?</strong> Mes a mes debes pagar administración, servicios públicos y predial mientras esperas vender tu inmueble.
              </p>
              <p className="timeline-prompt-cta">
                Usa nuestra <a href="#calculator-section" className="timeline-link">calculadora</a> para ver tus costos reales.
              </p>
            </div>
          )}
        </div>

        {/* Timeline Visual */}
        <div className="timeline-visual">
          {/* Column Headers */}
          <div className="timeline-columns-header">
            <div className="timeline-column-spacer"></div>
            <div className="timeline-column-header timeline-habi-header">
              <div className="timeline-header-content">
                <img src="/images/logo/habi.svg" alt="Habi" className="timeline-logo" />
                <h3>Con Habi</h3>
                <p className="timeline-header-subtitle">Cuotas fijas, sin costos adicionales</p>
              </div>
            </div>
            <div className="timeline-column-header timeline-market-header">
              <div className="timeline-header-content">
                <svg className="timeline-market-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                <h3>Mercado Tradicional</h3>
                <p className="timeline-header-subtitle">Costos mensuales mientras vendes</p>
              </div>
            </div>
          </div>

          {/* Timeline Months */}
          <div className="timeline-months">
            {months.map((monthData, index) => {
              const isActive = index <= activeMonth;
              const isCurrentMonth = index === activeMonth;
              
              return (
                <div
                  key={index}
                  ref={el => { monthRefs.current[index] = el; }}
                  className={`timeline-month ${isActive ? 'timeline-month-active' : ''} ${isCurrentMonth ? 'timeline-month-current' : ''}`}
                  style={{
                    transitionDelay: `${index * 50}ms`
                  }}
                >
                  {/* Month Number */}
                  <div className="timeline-month-number">
                    <div className="timeline-dot"></div>
                    <span className="timeline-month-label">Mes {monthData.month}</span>
                  </div>

                  {/* Habi Column */}
                  <div className="timeline-column timeline-habi-column">
                    <div className="timeline-card timeline-habi-card">
                      <div className="timeline-card-header">
                        <svg className="timeline-icon timeline-icon-check" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="timeline-card-status">{monthData.habiStatus}</span>
                      </div>
                      <div className="timeline-card-amount timeline-positive">
                        + {formatCurrency(monthData.habiPayment)}
                      </div>
                      <div className="timeline-card-detail">
                        Cuota fija recibida
                      </div>
                      <div className="timeline-card-costs">
                        <span className="timeline-costs-label">Costos:</span>
                        <span className="timeline-costs-value">{formatCurrency(0)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Market Column */}
                  <div className="timeline-column timeline-market-column">
                    <div className="timeline-card timeline-market-card">
                      <div className="timeline-card-header">
                        {monthData.month <= 7 ? (
                          <>
                            <svg className="timeline-icon timeline-icon-clock" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            <span className="timeline-card-status">{monthData.marketStatus}</span>
                          </>
                        ) : (
                          <>
                            <svg className="timeline-icon timeline-icon-check" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="timeline-card-status">{monthData.marketStatus}</span>
                          </>
                        )}
                      </div>
                      <div className="timeline-card-amount timeline-negative">
                        - {formatCurrency(monthData.marketCosts)}
                      </div>
                      <div className="timeline-card-detail">
                        Gastos mensuales
                      </div>
                      <div className="timeline-card-costs">
                        <span className="timeline-costs-label">Incluye:</span>
                        <span className="timeline-costs-items">Admin, servicios, predial</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className={`timeline-summary ${activeMonth >= 8 ? 'timeline-summary-visible' : ''}`}>
            <div className="timeline-summary-content">
              <h3 className={`${montserrat.className} timeline-summary-title`}>
                Resumen hasta el mes {activeMonth + 1}
              </h3>
              <div className="timeline-summary-grid">
                <div className="timeline-summary-card timeline-summary-habi">
                  <div className="timeline-summary-label">Con Habi recibiste</div>
                  <div className="timeline-summary-amount timeline-positive">
                    + {formatCurrency(totals.habiTotal)}
                  </div>
                  <div className="timeline-summary-detail">En {activeMonth + 1} cuotas fijas</div>
                </div>
                <div className="timeline-summary-card timeline-summary-market">
                  <div className="timeline-summary-label">En el mercado pagaste</div>
                  <div className="timeline-summary-amount timeline-negative">
                    - {formatCurrency(totals.marketTotal)}
                  </div>
                  <div className="timeline-summary-detail">En costos de mantenimiento</div>
                </div>
                <div className="timeline-summary-card timeline-summary-difference">
                  <div className="timeline-summary-label">Diferencia total</div>
                  <div className="timeline-summary-amount timeline-highlight">
                    {formatCurrency(totals.habiTotal + totals.marketTotal)}
                  </div>
                  <div className="timeline-summary-detail">Más dinero en tu bolsillo</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="timeline-cta">
          <p className="timeline-cta-text">
            <strong>¿Quieres recibir tu oferta personalizada?</strong>
          </p>
          <a href="#contact-form" className="timeline-cta-button">
            Solicitar oferta ahora
          </a>
        </div>
      </div>
    </div>
  );
}
