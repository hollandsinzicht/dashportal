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

interface TrialReminderEmailProps {
  userName: string;
  companyName: string;
  slug: string;
  plan: string;
  planPrice: number;
  trialEndDate: string;
  reportCount: number;
  userCount: number;
}

export default function TrialReminderEmail({
  userName = "daar",
  companyName = "Jouw bedrijf",
  slug = "demo",
  plan = "Starter",
  planPrice = 99,
  trialEndDate = "25 maart 2026",
  reportCount = 0,
  userCount = 0,
}: TrialReminderEmailProps) {
  const billingUrl = `https://${slug}.dashportal.app/dashboard/billing`;

  return (
    <Html>
      <Head />
      <Preview>
        Je proefperiode eindigt over 3 dagen — activeer je abonnement
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
            <Heading style={h1}>
              Je proefperiode eindigt over 3 dagen ⏳
            </Heading>
            <Text style={heroText}>
              Hoi {userName}, je gratis proefperiode voor {companyName} eindigt
              op <strong>{trialEndDate}</strong>. Activeer je abonnement om
              toegang te behouden tot al je rapporten en data.
            </Text>
          </Section>

          {/* Usage stats */}
          {(reportCount > 0 || userCount > 0) && (
            <Section style={statsSection}>
              <Text style={statsLabel}>Wat je tot nu toe hebt gedaan</Text>
              <Section style={statsGrid}>
                <div style={statBox}>
                  <Text style={statNumber}>{reportCount}</Text>
                  <Text style={statDesc}>
                    rapport{reportCount !== 1 ? "en" : ""}
                  </Text>
                </div>
                <div style={statBox}>
                  <Text style={statNumber}>{userCount}</Text>
                  <Text style={statDesc}>
                    gebruiker{userCount !== 1 ? "s" : ""}
                  </Text>
                </div>
              </Section>
            </Section>
          )}

          {/* Plan info */}
          <Section style={planCard}>
            <Text style={planLabel}>Je gekozen plan</Text>
            <Text style={planName}>{plan}</Text>
            {planPrice > 0 && (
              <Text style={planPrice_style}>
                €{planPrice}/maand
              </Text>
            )}
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Button style={ctaButton} href={billingUrl}>
              Activeer je abonnement
            </Button>
            <Text style={ctaSubtext}>
              Na activatie wordt er pas afgeschreven na je proefperiode.
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Vragen? Reply op deze e-mail of neem contact op via
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

const statsSection = { padding: "0 40px 24px" };

const statsLabel = {
  color: "#64748b",
  fontSize: "12px",
  fontWeight: "600" as const,
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0 0 12px",
};

const statsGrid = {
  display: "flex" as const,
  gap: "12px",
};

const statBox = {
  flex: "1",
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "16px",
  textAlign: "center" as const,
};

const statNumber = {
  color: "#1a1a2e",
  fontSize: "28px",
  fontWeight: "700" as const,
  margin: "0",
};

const statDesc = {
  color: "#64748b",
  fontSize: "13px",
  margin: "4px 0 0",
};

const planCard = {
  background: "#eef2ff",
  borderRadius: "12px",
  padding: "20px",
  margin: "0 40px 24px",
  textAlign: "center" as const,
};

const planLabel = {
  color: "#6366f1",
  fontSize: "12px",
  fontWeight: "600" as const,
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0 0 4px",
};

const planName = {
  color: "#1a1a2e",
  fontSize: "20px",
  fontWeight: "700" as const,
  margin: "0 0 4px",
};

const planPrice_style = {
  color: "#64748b",
  fontSize: "14px",
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
