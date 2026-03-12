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

interface WelcomeEmailProps {
  userName: string;
  companyName: string;
  slug: string;
  plan: string;
  trialEndDate: string;
}

export default function WelcomeEmail({
  userName = "daar",
  companyName = "Jouw bedrijf",
  slug = "demo",
  plan = "Starter",
  trialEndDate = "25 maart 2026",
}: WelcomeEmailProps) {
  const portalUrl = `https://${slug}.dashportal.app`;
  const dashboardUrl = `${portalUrl}/dashboard`;

  return (
    <Html>
      <Head />
      <Preview>Je DashPortal is klaar — begin met het delen van je rapporten</Preview>
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
            <Heading style={h1}>
              Welkom bij DashPortal! 🎉
            </Heading>
            <Text style={heroText}>
              Hoi {userName}, je dataportaal voor {companyName} staat klaar.
              Je kunt nu beginnen met het delen van je Power BI rapporten.
            </Text>
          </Section>

          {/* Portal link */}
          <Section style={portalCard}>
            <Text style={portalLabel}>Je portaal adres</Text>
            <Text style={portalUrl_style}>{slug}.dashportal.app</Text>
          </Section>

          {/* Steps */}
          <Section style={stepsSection}>
            <Heading as="h2" style={h2}>
              Drie stappen om te beginnen
            </Heading>

            <Section style={stepRow}>
              <Text style={stepNumber}>1</Text>
              <div>
                <Text style={stepTitle}>Koppel je Power BI workspace</Text>
                <Text style={stepDesc}>
                  Ga naar Instellingen en koppel je Microsoft account om
                  rapporten automatisch te importeren.
                </Text>
              </div>
            </Section>

            <Section style={stepRow}>
              <Text style={stepNumber}>2</Text>
              <div>
                <Text style={stepTitle}>Nodig gebruikers uit</Text>
                <Text style={stepDesc}>
                  Voeg collega&apos;s en klanten toe via Gebruikers in het
                  dashboard. Zij ontvangen een uitnodigingsmail.
                </Text>
              </div>
            </Section>

            <Section style={stepRow}>
              <Text style={stepNumber}>3</Text>
              <div>
                <Text style={stepTitle}>Pas je branding aan</Text>
                <Text style={stepDesc}>
                  Upload je logo en stel je kleuren in zodat het portaal bij
                  jouw huisstijl past.
                </Text>
              </div>
            </Section>
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Button style={ctaButton} href={dashboardUrl}>
              Open je dashboard
            </Button>
          </Section>

          {/* Trial info */}
          <Section style={trialSection}>
            <Text style={trialText}>
              Je {plan} plan is actief met een gratis proefperiode van 14
              dagen. Je proefperiode eindigt op{" "}
              <strong>{trialEndDate}</strong>. Er wordt pas iets
              afgeschreven nadat je een betaalmethode hebt ingesteld.
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Vragen? Reply op deze e-mail of neem contact op via{" "}
              support@dashportal.app
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

const logoSection = {
  padding: "32px 40px 0",
};

const heroSection = {
  padding: "24px 40px",
};

const h1 = {
  color: "#1a1a2e",
  fontSize: "24px",
  fontWeight: "700" as const,
  lineHeight: "32px",
  margin: "0 0 12px",
};

const h2 = {
  color: "#1a1a2e",
  fontSize: "18px",
  fontWeight: "600" as const,
  lineHeight: "24px",
  margin: "0 0 16px",
};

const heroText = {
  color: "#4a5568",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0",
};

const portalCard = {
  background: "#eef2ff",
  borderRadius: "12px",
  padding: "16px 24px",
  margin: "0 40px 24px",
  textAlign: "center" as const,
};

const portalLabel = {
  color: "#6366f1",
  fontSize: "12px",
  fontWeight: "600" as const,
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0 0 4px",
};

const portalUrl_style = {
  color: "#1a1a2e",
  fontSize: "18px",
  fontWeight: "600" as const,
  fontFamily: '"JetBrains Mono", monospace',
  margin: "0",
};

const stepsSection = {
  padding: "0 40px 24px",
};

const stepRow = {
  display: "flex" as const,
  gap: "12px",
  marginBottom: "16px",
};

const stepNumber = {
  backgroundColor: "#6366f1",
  color: "#ffffff",
  width: "28px",
  height: "28px",
  borderRadius: "50%",
  fontSize: "14px",
  fontWeight: "600" as const,
  textAlign: "center" as const,
  lineHeight: "28px",
  flexShrink: 0,
  margin: "0",
};

const stepTitle = {
  color: "#1a1a2e",
  fontSize: "14px",
  fontWeight: "600" as const,
  margin: "0 0 2px",
};

const stepDesc = {
  color: "#64748b",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0",
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

const trialSection = {
  padding: "0 40px 24px",
};

const trialText = {
  color: "#64748b",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0",
};

const hr = {
  borderColor: "#e2e8f0",
  margin: "0 40px",
};

const footer = {
  padding: "24px 40px 0",
};

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
