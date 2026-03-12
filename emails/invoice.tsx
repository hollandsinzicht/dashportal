import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface InvoiceEmailProps {
  userName: string;
  companyName: string;
  plan: string;
  invoiceNumber: string;
  invoiceDate: string;
  periodStart: string;
  periodEnd: string;
  amount: string;
  invoiceUrl: string;
}

export default function InvoiceEmail({
  userName = "daar",
  companyName = "Jouw bedrijf",
  plan = "Starter",
  invoiceNumber = "INV-0001",
  invoiceDate = "1 maart 2026",
  periodStart = "1 maart 2026",
  periodEnd = "1 april 2026",
  amount = "€99,00",
  invoiceUrl = "#",
}: InvoiceEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Factuur {invoiceNumber} — DashPortal {plan}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo */}
          <Section style={logoSection}>
            <Img
              src="https://dashportal.app/logo.png"
              width="140"
              height="32"
              alt="DashPortal"
            />
          </Section>

          {/* Header */}
          <Section style={heroSection}>
            <Heading style={h1}>Factuur</Heading>
            <Text style={heroText}>
              Hoi {userName}, hier is je factuur voor {companyName}.
            </Text>
          </Section>

          {/* Invoice card */}
          <Section style={invoiceCard}>
            <table style={invoiceTable} cellPadding="0" cellSpacing="0">
              <tbody>
                <tr>
                  <td style={invoiceLabel}>Factuurnummer</td>
                  <td style={invoiceValue}>{invoiceNumber}</td>
                </tr>
                <tr>
                  <td style={invoiceLabel}>Datum</td>
                  <td style={invoiceValue}>{invoiceDate}</td>
                </tr>
                <tr>
                  <td style={invoiceLabel}>Plan</td>
                  <td style={invoiceValue}>DashPortal {plan}</td>
                </tr>
                <tr>
                  <td style={invoiceLabel}>Periode</td>
                  <td style={invoiceValue}>
                    {periodStart} — {periodEnd}
                  </td>
                </tr>
              </tbody>
            </table>

            <Hr style={invoiceDivider} />

            <table style={invoiceTable} cellPadding="0" cellSpacing="0">
              <tbody>
                <tr>
                  <td style={totalLabel}>Totaal</td>
                  <td style={totalValue}>{amount}</td>
                </tr>
              </tbody>
            </table>
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Button style={ctaButton} href={invoiceUrl}>
              Bekijk factuur
            </Button>
          </Section>

          {/* Company info */}
          <Section style={companySection}>
            <Text style={companyText}>
              <strong>Gefactureerd aan:</strong> {companyName}
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Vragen over je factuur? Reply op deze e-mail of neem contact
              op via support@dashportal.app
            </Text>
            <Text style={footerMuted}>
              DashPortal is een product van DashPortal
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ─── Styles ───

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "560px",
};

const logoSection = { padding: "32px 40px 0" };

const heroSection = { padding: "24px 40px" };

const h1 = {
  color: "#1a1a2e",
  fontSize: "24px",
  fontWeight: "700" as const,
  lineHeight: "32px",
  margin: "0 0 12px",
};

const heroText = {
  color: "#4a5568",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0",
};

const invoiceCard = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "24px",
  margin: "0 40px 24px",
};

const invoiceTable = {
  width: "100%",
};

const invoiceLabel = {
  color: "#64748b",
  fontSize: "13px",
  padding: "6px 0",
  verticalAlign: "top" as const,
};

const invoiceValue = {
  color: "#1a1a2e",
  fontSize: "13px",
  fontWeight: "500" as const,
  textAlign: "right" as const,
  padding: "6px 0",
  verticalAlign: "top" as const,
};

const invoiceDivider = {
  borderColor: "#e2e8f0",
  margin: "12px 0",
};

const totalLabel = {
  color: "#1a1a2e",
  fontSize: "15px",
  fontWeight: "600" as const,
  padding: "4px 0",
};

const totalValue = {
  color: "#1a1a2e",
  fontSize: "18px",
  fontWeight: "700" as const,
  textAlign: "right" as const,
  padding: "4px 0",
};

const ctaSection = {
  padding: "0 40px 24px",
  textAlign: "center" as const,
};

const ctaButton = {
  backgroundColor: "#6366f1",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 32px",
};

const companySection = { padding: "0 40px 16px" };

const companyText = {
  color: "#64748b",
  fontSize: "13px",
  margin: "0",
};

const hr = { borderColor: "#e2e8f0", margin: "0 40px" };

const footer = { padding: "24px 40px 0" };

const footerText = {
  color: "#64748b",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0 0 8px",
};

const footerMuted = {
  color: "#94a3b8",
  fontSize: "12px",
  margin: "0",
};
