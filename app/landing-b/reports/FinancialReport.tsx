import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Link,
} from "@react-pdf/renderer";

// Styles based on the expense calculator design
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#f0f9ff",
    fontFamily: "Helvetica",
    padding: 0,
  },

  // Header Section
  header: {
    backgroundColor: "#ffffff",
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "2px solid #e5e7eb",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  companyName: {
    color: "#7c01ff",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 10,
  },
  reportTitle: {
    color: "#374151",
    fontSize: 12,
    fontWeight: "bold",
  },
  resultButton: {
    color: "#7c01ff",
    fontSize: 14,
    fontWeight: "bold",
  },

  // Main Content
  mainContent: {
    flex: 1,
    padding: 15,
  },

  // Two Column Layout
  twoColumnLayout: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 10,
  },

  // Section Styles
  section: {
    flex: 1,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 10,
    color: "#6b7280",
    marginBottom: 15,
    lineHeight: 1.4,
  },

  // Card Styles
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    border: "1px solid #e5e7eb",
  },
  cardItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottom: "1px solid #f3f4f6",
  },
  cardItemLast: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottom: "none",
  },
  cardLabel: {
    fontSize: 10,
    color: "#374151",
    flex: 1,
  },
  cardValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#374151",
  },
  cardValuePurple: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#7c01ff",
  },
  cardValueRed: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#dc2626",
  },
  helpIcon: {
    fontSize: 10,
    color: "#7c01ff",
    marginLeft: 5,
  },

  // Full Width Sections
  fullWidthSection: {},
  finalResult: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#7c01ff",
    textAlign: "center",
    marginTop: 10,
  },
  conclusion: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 10,
    textAlign: "center",
    fontStyle: "italic",
  },

  // Footer
  footer: {
    backgroundColor: "#7c01ff",
    padding: 20,
    alignItems: "center",
  },
  footerText: {
    color: "#ffffff",
    fontSize: 10,
    marginBottom: 5,
  },
  footerLink: {
    color: "#ffffff",
    fontSize: 10,
    marginBottom: 5,
    textDecoration: "underline",
  },

  // Habi Comparison Styles
  comparisonContainer: {
    gap: 15,
    flexDirection: "row",
    marginBottom: 20,
  },
  comparisonCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 8,
    border: "1px solid #e5e7eb",
  },
  comparisonTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#374151",
  },
  comparisonHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  comparisonAmount: {
    marginBottom: 10,
  },
  comparisonIcon: {
    fontSize: 16,
    color: "#6b7280",
  },
  comparisonLabel: {
    fontSize: 10,
    color: "#6b7280",
    marginBottom: 5,
  },
  comparisonValue: {
    fontWeight: "bold",
    fontSize: 14,
  },
  comparisonResult: {
    backgroundColor: "#ffffff",
    padding: 15,
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    textAlign: "center",
  },
  comparisonDetails: {
    fontSize: 9,
    fontStyle: "italic",
    color: "#6b7280",
  },
  differenceSection: {
    marginBottom: 10,
  },
  differenceLabel: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "bold",
    marginBottom: 5,
  },
  differenceAmount: {
    fontWeight: "bold",
    fontSize: 18,
  },
  recommendationText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#374151",
    lineHeight: 1.4,
  },
});

interface CalculationData {
  propertyValue: string;
  administrationValue: string;
  servicesValue: string;
  propertyTaxValue: string;
  creditValue: string;
  habiOffer?: string;
}

interface FinancialReportProps {
  data: CalculationData;
}

const FinancialReport: React.FC<FinancialReportProps> = ({ data }) => {
  // Helper function to safely parse numbers
  const safeParseInt = (value: string): number => {
    if (!value || value === "") return 0;
    const cleaned = value.replace(/\D/g, ""); // Remove non-numeric characters
    const parsed = parseInt(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Calculate financial metrics with validation
  const propertyValue = safeParseInt(data.propertyValue);
  const administration = safeParseInt(data.administrationValue);
  const services = safeParseInt(data.servicesValue);
  const propertyTax = safeParseInt(data.propertyTaxValue);
  const credit = safeParseInt(data.creditValue);

  // Calculate fixed expenses for 9 months (same as calculator)
  const calculateFixedExpenses = () => {
    const administrationCalc = administration * 9;
    const servicesCalc = services * 9;
    const propertyTaxCalc = propertyTax * (9 / 12); // Annual tax prorated to 9 months
    const creditCalc = credit * 9;

    return administrationCalc + servicesCalc + propertyTaxCalc + creditCalc;
  };

  // Calculate basic process expenses (same as calculator)
  const calculateProcessExpenses = () => {
    const percentages = {
      agentCommission: 3,
      marketDiscount: 5.0,
      renovations: 1.15,
    };

    const totalPercentage = Object.values(percentages).reduce(
      (a, b) => a + b,
      0
    );
    return (propertyValue * totalPercentage) / 100;
  };

  // Calculate notarial expenses and procedures (same as calculator)
  const calculateNotarialExpenses = () => {
    const percentages = {
      notarialFees: 0.54, // Notarial fees (50% seller, 50% buyer)
      registrationTax: 1.67, // Registration tax (paid in full by buyer)
      withholdingTax: 1.0, // Withholding tax (paid by buyer to DIAN)
    };

    const notarialFeesBuyer =
      (propertyValue * percentages.notarialFees) / 100 / 2; // 50% of the buyer
    const notarialFeesSeller =
      (propertyValue * percentages.notarialFees) / 100 / 2; // 50% of the seller
    const withholdingTax = (propertyValue * percentages.withholdingTax) / 100; // Buyer pays in full
    const registrationTax = (propertyValue * percentages.registrationTax) / 100; // Buyer pays in full

    const total =
      notarialFeesSeller + registrationTax + withholdingTax + notarialFeesBuyer;

    return {
      notarialFeesSeller,
      notarialFeesBuyer,
      registrationTax,
      withholdingTax,
      total,
    };
  };

  const fixedExpenses = calculateFixedExpenses();
  const processExpenses = calculateProcessExpenses();
  const notarialExpenses = calculateNotarialExpenses();
  const totalExpenses =
    fixedExpenses + processExpenses + notarialExpenses.total;
  const netAmount = propertyValue - totalExpenses;

  const formatCOP = (value: number) => {
    if (isNaN(value) || value === null || value === undefined) {
      return "$0";
    }
    return `$${value.toLocaleString("es-CO", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  return (
    <Document>
      {/* Calculadora de Gastos */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image style={styles.logo} src="/images/logo/habi.png" />
            <Text style={styles.reportTitle}>CALCULADORA DE GASTOS</Text>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Two Column Layout */}
          <View style={styles.twoColumnLayout}>
            {/* Left Column - Gastos Fijos */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Resultado de gastos fijos</Text>
              <Text style={styles.sectionDescription}>
                Estos son los gastos que se calcularon.
              </Text>
              <View style={styles.card}>
                <View style={styles.cardItem}>
                  <Text style={styles.cardLabel}>Valor de administración</Text>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={styles.cardValue}>
                      {formatCOP(administration)}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardItem}>
                  <Text style={styles.cardLabel}>
                    Valor aproximado de los servicios públicos.
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={styles.cardValue}>{formatCOP(services)}</Text>
                  </View>
                </View>
                <View style={styles.cardItem}>
                  <Text style={styles.cardLabel}>
                    Valor anual del impuesto predial
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={styles.cardValue}>
                      {formatCOP(propertyTax)}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardItemLast}>
                  <Text style={styles.cardLabel}>
                    Valor de la cuota del crédito (opcional)
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={styles.cardValue}>{formatCOP(credit)}</Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.cardItemLast,
                    {
                      marginTop: 10,
                      paddingTop: 15,
                      borderTop: "2px solid #e5e7eb",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.cardLabel,
                      { fontWeight: "bold", fontSize: 14 },
                    ]}
                  >
                    Total de gastos fijos
                  </Text>
                  <Text style={styles.cardValuePurple}>
                    {formatCOP(fixedExpenses)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Right Column - Gastos de Proceso */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Gastos de procesos</Text>
              <Text style={styles.sectionDescription}>
                Estos gastos son porcentajes según el precio al que vendes tu
                inmueble.
              </Text>
              <View style={styles.card}>
                <View style={styles.cardItem}>
                  <Text style={styles.cardLabel}>
                    Comisión con Agente inmobiliario (3%).
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={styles.cardValue}>
                      {formatCOP(propertyValue * 0.03)}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardItem}>
                  <Text style={styles.cardLabel}>
                    Descuento promedio del mercado (5%).
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={styles.cardValue}>
                      {formatCOP(propertyValue * 0.05)}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardItem}>
                  <Text style={styles.cardLabel}>Remodelaciones (1,15%).</Text>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={styles.cardValue}>
                      {formatCOP(propertyValue * 0.0115)}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardItemLast}>
                  <Text style={styles.cardLabel}>
                    Gastos notariales y trámites (3,21%)
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={styles.cardValue}>
                      {formatCOP(notarialExpenses.total)}
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.cardItemLast,
                    {
                      marginTop: 10,
                      paddingTop: 15,
                      borderTop: "2px solid #e5e7eb",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.cardLabel,
                      { fontWeight: "bold", fontSize: 14 },
                    ]}
                  >
                    Total gastos de procesos
                  </Text>
                  <Text style={styles.cardValuePurple}>
                    {formatCOP(processExpenses + notarialExpenses.total)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Final Calculation Section */}
          <View style={styles.fullWidthSection}>
            {/* Habi Offer Comparison - Inside the same section */}
            {data.habiOffer && parseInt(data.habiOffer) > 0 && (
              <>
                <View>
                  <Text style={styles.sectionTitle}>
                    Comparación con oferta Habi
                  </Text>
                  <Text style={styles.sectionDescription}>
                    Compara el resultado de la venta tradicional con la oferta
                    que te hizo Habi.
                  </Text>
                </View>

                <View style={styles.comparisonContainer}>
                  {/* Traditional Sale */}
                  <View style={styles.comparisonCard}>
                    <View style={styles.comparisonHeader}>
                      <Text style={styles.comparisonTitle}>
                        Venta Tradicional
                      </Text>
                      <Text style={styles.comparisonIcon}></Text>
                    </View>
                    <View style={styles.comparisonAmount}>
                      <Text style={styles.comparisonLabel}>
                        Total a recibir:
                      </Text>
                      <Text
                        style={[styles.comparisonValue, { color: "#059669" }]}
                      >
                        {formatCOP(netAmount)}
                      </Text>
                    </View>
                    <Text style={styles.comparisonDetails}>
                      Después de 9 meses y todos los gastos
                    </Text>
                  </View>

                  {/* Habi Offer */}
                  <View style={styles.comparisonCard}>
                    <View style={styles.comparisonHeader}>
                      <Text style={styles.comparisonTitle}>Oferta Habi</Text>
                      <Text style={styles.comparisonIcon}>
                        <Image
                          style={styles.logo}
                          src="/images/logo/habi.png"
                        />
                      </Text>
                    </View>
                    <View style={styles.comparisonAmount}>
                      <Text style={styles.comparisonLabel}>Oferta:</Text>
                      <Text
                        style={[styles.comparisonValue, { color: "#7c01ff" }]}
                      >
                        {formatCOP(parseInt(data.habiOffer))}
                      </Text>
                    </View>
                    <Text style={styles.comparisonDetails}>
                      Venta inmediata sin gastos adicionales
                    </Text>
                  </View>
                </View>

                {/* Difference and Recommendation */}
                <View style={styles.comparisonResult}>
                  <View style={styles.differenceSection}>
                    <Text style={styles.differenceLabel}>Diferencia:</Text>
                    <Text
                      style={[
                        styles.differenceAmount,
                        {
                          color:
                            parseInt(data.habiOffer) > netAmount
                              ? "#7c01ff"
                              : "#059669",
                        },
                      ]}
                    >
                      {parseInt(data.habiOffer) > netAmount ? "+" : ""}
                      {formatCOP(parseInt(data.habiOffer) - netAmount)}
                    </Text>
                  </View>

                  <Text style={styles.recommendationText}>
                    {parseInt(data.habiOffer) > netAmount
                      ? ` Con Habi recibirías ${formatCOP(
                          parseInt(data.habiOffer) - netAmount
                        )} más que con la venta tradicional`
                      : ` Con la venta tradicional recibirías ${formatCOP(
                          netAmount - parseInt(data.habiOffer)
                        )} más que con Habi`}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Link src="https://wa.me/573009114406" style={styles.footerLink}>
            WhatsApp: +57 300 911 4406
          </Link>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Link src="mailto:contacto@habi.co" style={styles.footerLink}>
              contacto@habi.co
            </Link>
            <Link src="https://www.habi.co" style={styles.footerLink}>
              www.habi.co
            </Link>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default FinancialReport;
