'use client';

import React, { useState, useEffect } from 'react';
import './calculator.css';
import './habi-comparison.css';

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

interface ExpenseCalculatorProps {
  initialPropertyValue?: number;
  initialAdministration?: number;
  habiOfferValue?: number;
}

export default function ExpenseCalculator({ 
  initialPropertyValue = 0,
  initialAdministration = 0,
  habiOfferValue = 0
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
  };

  const handleNewCalculation = () => {
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
              <img src="/habilogo.jpg" alt="Habi Logo" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'contain' }} />
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
                          Oferta de Habi (opcional)
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
                <img src="/habilogo.jpg" alt="Habi Logo" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'contain' }} />
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
    </div>
  );
}
