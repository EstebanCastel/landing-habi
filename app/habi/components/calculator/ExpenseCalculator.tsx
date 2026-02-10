'use client';

import React, { useState, useEffect, useRef } from 'react';
import { analytics } from '../../../lib/analytics';
// CSS importado globalmente desde globals.css para asegurar prioridad sobre Tailwind

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

// Componente de comparación Habi vs Mercado (gráfica mes a mes)
interface HabiVsMarketComparisonProps {
  propertyValue: number;
  totalExpenses: number;
  netAmount: number;
  habiOffer: number;
  country?: string;
}

function HabiVsMarketComparison({ totalExpenses, netAmount, habiOffer, country }: HabiVsMarketComparisonProps) {
  const brandName = country === 'MX' ? 'TuHabi' : 'Habi';
  const [progress, setProgress] = useState(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const months = 9;
  const habiPerMonth = (habiOffer / 1000000) / months;
  const totalExpensesPerMonth = (totalExpenses / months) / 1000000;
  const marketNetAmount = netAmount / 1000000;

  const habiTotal = progress * habiPerMonth;
  const marketTotal = progress === 9 ? marketNetAmount : -(progress * totalExpensesPerMonth);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value * 1000000);
  };

  // Scroll handler para controlar el progreso
  useEffect(() => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const handleScroll = () => {
      const rect = container.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const containerTop = rect.top;
      const containerHeight = rect.height;
      
      // Calcular progreso basado en cuánto se ha scrolleado
      const scrollProgress = Math.max(0, Math.min(1, 
        (viewportHeight - containerTop) / (containerHeight + viewportHeight)
      ));
      
      const newProgress = Math.ceil(scrollProgress * 9);
      setProgress(Math.max(1, Math.min(9, newProgress)));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div ref={scrollContainerRef} className="mt-8 py-8 bg-gradient-to-b from-white via-purple-50 to-purple-100 rounded-2xl">
      <div className="px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-purple-700 mb-2">{brandName} vs Mercado Tradicional</h3>
          <p className="text-gray-600">Compara cómo evolucionan tus ingresos mes a mes</p>
        </div>

        {/* Comparación Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          {/* Layout: Mes + Cards */}
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Mes */}
            <div className="text-center md:text-left">
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-1 font-semibold">Mes</p>
              <p className="text-6xl md:text-8xl font-black text-purple-700">{progress}</p>
            </div>

            {/* Cards */}
            <div className="flex-1 grid grid-cols-2 gap-4 w-full">
              {/* Habi/Tu Habi */}
              <div className="text-center space-y-2">
                <p className="text-xs uppercase tracking-widest font-bold text-purple-700">{brandName}</p>
                <div className="py-2">
                  <img src={country === 'MX' ? '/tuhabi.svg' : '/habilogo.jpg'} alt={brandName} className="w-12 h-12 mx-auto rounded-lg object-contain" />
                </div>
                <p className="text-2xl md:text-4xl font-black text-purple-700">
                  ${habiTotal.toFixed(1)}M
                </p>
                <p className="text-xs text-gray-600">
                  {progress === 9 ? 'Recibes tu última cuota fija' : 'Recibes tu cuota fija'}
                </p>
              </div>

              {/* Mercado */}
              <div className="text-center space-y-2">
                <p className="text-xs uppercase tracking-widest font-bold text-gray-700">Mercado tradicional</p>
                <div className="py-2">
                  <div className="w-12 h-12 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                  </div>
                </div>
                <p className={`text-2xl md:text-4xl font-black ${marketTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${marketTotal.toFixed(1)}M
                </p>
                <p className="text-xs text-gray-600">
                  {progress === 9 
                    ? `Recibes ${formatCurrency(marketNetAmount)} después de gastos`
                    : progress === 6 
                    ? '¡Consigues comprador!'
                    : 'Pagas gastos del inmueble'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Gráfica */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Evolución financiera</p>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                  <span className="text-xs font-semibold text-gray-700">{brandName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-xs font-semibold text-gray-700">Mercado</span>
                </div>
              </div>
            </div>

            <svg viewBox="0 0 900 300" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="habiGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: "#7C3AED", stopOpacity: 0.2 }} />
                  <stop offset="100%" style={{ stopColor: "#7C3AED", stopOpacity: 0.02 }} />
                </linearGradient>
              </defs>

              {/* Grid */}
              <line x1="80" y1="60" x2="840" y2="60" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="80" y1="120" x2="840" y2="120" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="80" y1="180" x2="840" y2="180" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="80" y1="240" x2="840" y2="240" stroke="#94A3B8" strokeWidth="2" />

              {/* Labels Y */}
              <text x="65" y="65" textAnchor="end" fontSize="11" fill="#64748B" fontWeight="600">${marketNetAmount.toFixed(0)}M</text>
              <text x="65" y="125" textAnchor="end" fontSize="11" fill="#64748B" fontWeight="600">${(marketNetAmount * 0.66).toFixed(0)}M</text>
              <text x="65" y="185" textAnchor="end" fontSize="11" fill="#64748B" fontWeight="600">${(marketNetAmount * 0.33).toFixed(0)}M</text>
              <text x="65" y="245" textAnchor="end" fontSize="11" fill="#64748B" fontWeight="700">$0</text>

              {/* Labels X (Meses) */}
              {[...Array(9)].map((_, i) => {
                const x = 80 + ((i + 1) * (760 / 9));
                return (
                  <text key={`month-${i}`} x={x} y="270" textAnchor="middle" fontSize="12" fill="#475569" fontWeight="600">
                    M{i + 1}
                  </text>
                );
              })}

              {/* Área Habi */}
              {progress > 0 && (
                <polygon
                  points={`80,240 ${[...Array(Math.min(progress, 9))].map((_, i) => {
                    const month = i + 1;
                    const x = 80 + (month * (760 / 9));
                    const value = month * habiPerMonth;
                    const y = 240 - (value / marketNetAmount) * 180;
                    return `${x},${y}`;
                  }).join(' ')} ${80 + (Math.min(progress, 9) * (760 / 9))},240`}
                  fill="url(#habiGradient)"
                />
              )}

              {/* Línea Habi */}
              {progress > 0 && (
                <polyline
                  points={[...Array(Math.min(progress, 9))].map((_, i) => {
                    const month = i + 1;
                    const x = 80 + (month * (760 / 9));
                    const value = month * habiPerMonth;
                    const y = 240 - (value / marketNetAmount) * 180;
                    return `${x},${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#7C3AED"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Línea Mercado (roja en 0 hasta mes 8, luego sube a verde) */}
              {progress > 0 && progress < 9 && (
                <line x1="80" y1="240" x2={80 + (Math.min(progress, 8) * (760 / 9))} y2="240" 
                  stroke="#DC2626" strokeWidth="3" strokeDasharray="8 4" />
              )}
              {progress === 9 && (
                <>
                  <line x1="80" y1="240" x2={80 + (8 * (760 / 9))} y2="240" 
                    stroke="#DC2626" strokeWidth="3" strokeDasharray="8 4" />
                  <line x1={80 + (8 * (760 / 9))} y1="240" x2={80 + (9 * (760 / 9))} y2="60" 
                    stroke="#16A34A" strokeWidth="3" />
                </>
              )}

              {/* Puntos Habi */}
              {[...Array(Math.min(progress, 9))].map((_, i) => {
                const month = i + 1;
                const x = 80 + (month * (760 / 9));
                const value = month * habiPerMonth;
                const y = 240 - (value / marketNetAmount) * 180;
                const isCurrentMonth = month === progress;
                return (
                  <g key={`habi-${i}`}>
                    <circle cx={x} cy={y} r={isCurrentMonth ? 6 : 4} fill="white" stroke="#7C3AED" strokeWidth="2" />
                    <circle cx={x} cy={y} r={isCurrentMonth ? 3 : 2} fill="#7C3AED" />
                  </g>
                );
              })}

              {/* Punto final mercado (mes 9) */}
              {progress === 9 && (
                <g>
                  <circle cx={80 + (9 * (760 / 9))} cy={60} r={6} fill="white" stroke="#16A34A" strokeWidth="2" />
                  <circle cx={80 + (9 * (760 / 9))} cy={60} r={3} fill="#16A34A" />
                </g>
              )}
            </svg>

            <p className="text-xs text-gray-500 mt-4 italic text-center">
              * Gráfica ilustrativa. Los valores reales pueden variar según las condiciones de cada transacción.
            </p>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            {progress < 9 ? '↓ Sigue scrolleando para ver la evolución' : '✓ Comparación completa'}
          </p>
        </div>
      </div>

      {/* Scroll area para controlar la animación */}
      <div className="h-[300vh]" />
    </div>
  );
}

interface ExpenseCalculatorProps {
  initialPropertyValue?: number;
  initialAdministration?: number;
  habiOfferValue?: number;
  bnpl9Value?: number; // Para mostrar la gráfica de comparación solo si hay BNPL
  country?: string;
}

export default function ExpenseCalculator({ 
  initialPropertyValue = 0,
  initialAdministration = 0,
  habiOfferValue = 0,
  bnpl9Value = 0,
  country
}: ExpenseCalculatorProps) {
  const [propertyValue, setPropertyValue] = useState(initialPropertyValue > 0 ? initialPropertyValue.toString() : "");
  const [administrationValue, setAdministrationValue] = useState(initialAdministration > 0 ? initialAdministration.toString() : "");
  const [servicesValue, setServicesValue] = useState("");
  const [propertyTaxValue, setPropertyTaxValue] = useState("");
  const [creditValue, setCreditValue] = useState("");
  const [habiOffer, setHabiOffer] = useState(habiOfferValue > 0 ? habiOfferValue.toString() : "");
  const [showHabiOffer, setShowHabiOffer] = useState(habiOfferValue > 0);
  const [showResults, setShowResults] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 480);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, []);

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
    setter: (value: string) => void
  ) => {
    const numericValue = value.replace(/\D/g, "");
    if (numericValue.length <= 15) {
      setter(numericValue);
    }
  };

  const isFormValid = () => {
    return propertyValue && servicesValue && propertyTaxValue;
  };

  const calculateResults = () => {
    const propValue = parseInt(propertyValue) || 0;
    const adminValue = parseInt(administrationValue) || 0;
    const servValue = parseInt(servicesValue) || 0;
    const taxValue = parseInt(propertyTaxValue) || 0;
    const credValue = parseInt(creditValue) || 0;
    const habiOfferVal = parseInt(habiOffer) || 0;

    // GASTOS FIJOS (9 meses)
    const fixedExpenses = {
      administration: adminValue * 9,
      services: servValue * 9,
      propertyTax: taxValue * (9 / 12),
      credit: credValue * 9,
    };
    const totalFixedExpenses = Object.values(fixedExpenses).reduce((a, b) => a + b, 0);

    // GASTOS DE PROCESO (porcentajes sobre valor de propiedad)
    const processExpenses = {
      agentCommission: (propValue * 3) / 100,
      marketDiscount: (propValue * 5.0) / 100,
      renovations: (propValue * 1.15) / 100,
    };
    const totalProcessExpenses = Object.values(processExpenses).reduce((a, b) => a + b, 0);

    // GASTOS NOTARIALES Y TRÁMITES (3.21%)
    const notarialExpenses = {
      withholdingTax: (propValue * 1.0) / 100,
      notarialFeesSeller: (propValue * 0.54) / 100 / 2,
      notarialFeesBuyer: (propValue * 0.54) / 100 / 2,
      registrationTax: (propValue * 1.67) / 100,
    };
    const totalNotarialExpenses = Object.values(notarialExpenses).reduce((a, b) => a + b, 0);

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
      habiOffer: habiOfferVal,
    };
  };

  const handleCalculate = () => {
    setShowResults(true);
    analytics.calculatorResultsViewed(undefined, country);
  };

  const handleNewCalculation = () => {
    analytics.calculatorReset(country);
    setShowResults(false);
    setPropertyValue("");
    setAdministrationValue("");
    setServicesValue("");
    setPropertyTaxValue("");
    setCreditValue("");
    setHabiOffer("");
    setShowHabiOffer(false);
  };

  const calculateMonthlyExpenses = () => {
    const administration = parseInt(administrationValue) || 0;
    const services = parseInt(servicesValue) || 0;
    const propertyTax = parseInt(propertyTaxValue) || 0;
    const credit = parseInt(creditValue) || 0;
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
              <img src={country === 'MX' ? '/tuhabi.svg' : '/habilogo.jpg'} alt={`${country === 'MX' ? 'TuHabi' : 'Habi'} Logo`} style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'contain' }} />
              <span className="app-title">CALCULADORA DE GASTOS</span>
            </div>
            <span className="calculate-link">
              HAGAMOS CUENTAS
            </span>
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
                          handleInputChange(e.target.value, setPropertyValue)
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
                            handleInputChange(e.target.value, setAdministrationValue)
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
                            handleInputChange(e.target.value, setServicesValue)
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
                            handleInputChange(e.target.value, setPropertyTaxValue)
                          }
                          className="expense-input"
                          placeholder="Ej: 120.000"
                        />
                        <HelpIcon title="Este es el valor que deberás pagar de impuesto predial." />
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
                            handleInputChange(e.target.value, setCreditValue)
                          }
                          className="expense-input"
                          placeholder="Ej: 120.000"
                        />
                        <HelpIcon title="Este es el valor que pagas de tu crédito o hipoteca cada mes." />
                      </div>
                    </div>

                    {!showHabiOffer && (
                      <div className="add-habi-offer-container">
                        <button
                          type="button"
                          className="add-habi-offer-button"
                          onClick={() => setShowHabiOffer(true)}
                        >
                          <span className="plus-icon">+</span>
                        </button>
                      </div>
                    )}

                    {showHabiOffer && (
                      <div className="input-group habi-offer-group">
                        <label className="input-label">
                          Oferta de {country === 'MX' ? 'TuHabi' : 'Habi'} (opcional)
                        </label>
                        <div className="input-with-icon">
                          <input
                            type="text"
                            value={formatCurrency(habiOffer)}
                            onChange={(e) =>
                              handleInputChange(e.target.value, setHabiOffer)
                            }
                            className="expense-input"
                            placeholder="Ej: 450.000.000"
                          />
                          <HelpIcon title="Ingresa la oferta que te hizo Habi para tu inmueble." />
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
                    className={`calculate-button ${!isFormValid() ? "disabled" : ""}`}
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
                <img src={country === 'MX' ? '/tuhabi.svg' : '/habilogo.jpg'} alt={`${country === 'MX' ? 'TuHabi' : 'Habi'} Logo`} style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'contain' }} />
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
                            <HelpIcon title="Dinero que pagas por los servicios comunales." />
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
                            <HelpIcon title="Impuesto anual prorrateado a 9 meses." />
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
                              <HelpIcon title="Cuota recurrente de crédito hipotecario." />
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
                            <HelpIcon title="Porcentaje que se paga al agente inmobiliario." />
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
                            <HelpIcon title="Descuento promedio del mercado inmobiliario." />
                          </div>
                        </div>

                        <div className="expense-item">
                          <span className="expense-label">Remodelaciones (1.15%)</span>
                          <div className="expense-value-container">
                            <span className="expense-value">
                              {formatCOP(results.processExpenses.renovations)}
                            </span>
                            <HelpIcon title="Gastos estimados en remodelaciones." />
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
                          </div>
                        </div>

                        <div className="summary-item">
                          <span className="summary-label">Gastos fijos a 9 meses</span>
                          <div className="summary-value-container">
                            <span className="summary-value">
                              {formatCOP(results.totalFixedExpenses)}
                            </span>
                          </div>
                        </div>

                        <div className="summary-item">
                          <span className="summary-label">Gastos notariales Colombia</span>
                          <div className="summary-value-container">
                            <span className="summary-value">
                              {formatCOP(results.totalNotarialExpenses)}
                            </span>
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

                  {/* Final Calculation */}
                  <div className="summary-section">
                    <div className="summary-content">
                      <div className="summary-text">
                        <h3 className="section-title">
                          ¿Cuánto queda realmente después de 9 meses?
                        </h3>
                        <p className="section-description">
                          Si restas el valor del inmueble menos lo que te gastarás en
                          procesos y gastos fijos, te dará el dinero real que ganarás.
                        </p>
                      </div>

                      <div className="summary-card">
                        <div className="summary-item">
                          <span className="summary-label">Valor del inmueble</span>
                          <div className="summary-value-container">
                            <span className="summary-value">
                              {formatCOP(results.propertyValue)}
                            </span>
                          </div>
                        </div>

                        <div className="summary-item negative">
                          <span className="summary-label">Total de gastos</span>
                          <div className="summary-value-container">
                            <span className="summary-value negative">
                              -{formatCOP(results.totalExpenses)}
                            </span>
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
                              <div className="comparison-option traditional">
                                <div className="option-header">
                                  <h4 className="option-title">Venta Tradicional</h4>
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

                              <div className="comparison-option habi">
                                <div className="option-header">
                                  <h4 className="option-title">Oferta Habi</h4>
                                </div>
                                <div className="option-amount">
                                  <span className="amount-label">Oferta:</span>
                                  <span className="amount-value habi-value">
                                    {formatCOP(results.habiOffer)}
                                  </span>
                                </div>
                              </div>
                            </div>

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
                            fijos irán en aumento.
                          </p>
                        </div>

                        <div className="chart-container">
                          <div className="chart-card">
                            <div className="chart-header">
                              <h4 className="chart-title">Incremento de gastos por tiempo</h4>
                            </div>

                            <div className="chart-content">
                              <div className="chart-bars">
                                {[
                                  {
                                    period: "10 días",
                                    value: Math.round((calculateMonthlyExpenses() * 10) / 30),
                                    color: "blue",
                                    height: isMobile ? "25px" : "30px",
                                  },
                                  {
                                    period: "6 meses",
                                    value: calculateMonthlyExpenses() * 6,
                                    color: "gradient",
                                    height: isMobile ? "125px" : "150px",
                                  },
                                  {
                                    period: "9 meses",
                                    value: calculateMonthlyExpenses() * 9,
                                    color: "gradient",
                                    height: isMobile ? "175px" : "210px",
                                  },
                                ].map((item, index) => (
                                  <div key={index} className="chart-bar-container">
                                    <div
                                      className={`chart-bar ${item.color}`}
                                      style={{ height: item.height }}
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

                    <div className="temporal-conclusion">
                      <div className="conclusion-inner">
                        <div className="conclusion-content">
                          <h4 className="conclusion-title">La información es poder</h4>
                          <p className="conclusion-description">
                            Ahora ya cuentas con los suficientes datos para poder vender tu
                            inmueble a un precio justo.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
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

      {/* Sección de Comparación Habi vs Mercado - Solo si hay BNPL disponible */}
      {showResults && bnpl9Value > 0 && results && (
        <HabiVsMarketComparison 
          propertyValue={results.propertyValue}
          totalExpenses={results.totalExpenses}
          netAmount={results.netAmount}
          habiOffer={bnpl9Value}
          country={country}
        />
      )}
    </div>
  );
}
