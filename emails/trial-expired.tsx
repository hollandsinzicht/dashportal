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

interface TrialExpiredEmailProps {
  userName: string;
  companyName: string;
  slug: string;
}

export default function TrialExpiredEmail({
  userName = "daar",
  companyName = "Jouw bedrijf",
  slug = "demo",
}: TrialExpiredEmailProps) {
  const billingUrl = `https://${slug}.dashportal.app/dashboard/billing`;

  return (
    <Html>
      <Head />
      <Preview>
        Je proefperiode is verlopen — heractiveer je abonnement
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
            <Heading style={h1}>Je proefperiode is verlopen</Heading>
            <Text style={heroText}>
              Hoi {userName}, de gratis proefperiode voor het portaal van{" "}
              {companyName} is verlopen. Je toegang is tijdelijk gepauzeerd.
            </Text>
          </Section>

          {/* Reassurance */}
          <Section style={infoSection}>
            <Section style={infoCard}>
              <Text style={infoTitle}>Geen data verloren</Text>
              <Text style={infoText}>
                Al je rapporten, gebruikers en instellingen staan nog klaar.
                Je data blijft <strong>30 dagen</strong> bewaard. Activeer
                je abonnement om direct weer toegang te krijgen.
              </Text>
            </Section>
          </Section>

          {/* What happens */}
          <Section style={listSection}>
            <Text style={listItem}>
              ✅ Je data en instellingen zijn bewaard
            </Text>
            <Text style={listItem}>
              ✅ Je gebruikers en rapporten staan klaar
            </Text>
            <Text style={listItem}>
              ⚠️ Toegang is tijdelijk gepauzeerd
            </Text>
            <Text style={listItem}>
              ⏳ Na 30 dagen wordt alles permanent verwijderd
            </Text>
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Button style={ctaButton} href={billingUrl}>
              Heractiveer je abonnement
            </Button>
            <Text style={ctaSubtext}>
              Na activatie heb je direct weer toegang tot alles.
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Vragen of hulp nodig? Reply op deze e-mail of mail naar
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

const infoSection = { padding: "0 40px 16px" };

const infoCard = {
  background: "#fef3c7",
  border: "1px solid #fde68a",
  borderRadius: "12px",
  padding: "16px 20px",
};

const infoTitle = {
  color: "#92400e",
  fontSize: "14px",
  fontWeight: "600" as const,
  margin: "0 0 4px",
};

const infoText = {
  color: "#78350f",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0",
};

const listSection = { padding: "0 40px 24px" };

const listItem = {
  color: "#4a5568",
  fontSize: "14px",
  lineHeight: "28px",
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

const ctaSubtext = {
  color: "#94a3b8",
  fontSize: "12px",
  margin: "12px 0 0",
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
