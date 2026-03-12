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

interface InviteEmailProps {
  userName: string;
  inviterName: string;
  companyName: string;
  slug: string;
  role: string;
  inviteUrl: string;
}

export default function InviteEmail({
  userName = "daar",
  inviterName = "een beheerder",
  companyName = "Jouw bedrijf",
  slug = "demo",
  role = "viewer",
  inviteUrl = "https://demo.dashportal.app/auth/confirm",
}: InviteEmailProps) {
  const portalUrl = `https://${slug}.dashportal.app`;
  const roleLabel = role === "admin" ? "Beheerder" : "Viewer";

  return (
    <Html>
      <Head />
      <Preview>
        {inviterName} heeft je uitgenodigd voor het dataportaal van {companyName}
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
            <Heading style={h1}>Je bent uitgenodigd!</Heading>
            <Text style={heroText}>
              Hoi {userName}, {inviterName} heeft je uitgenodigd voor het
              dataportaal van <strong>{companyName}</strong>. Je hebt toegang
              als <strong>{roleLabel}</strong>.
            </Text>
          </Section>

          {/* Portal info */}
          <Section style={portalCard}>
            <Text style={portalLabel}>Dataportaal</Text>
            <Text style={portalUrlStyle}>{slug}.dashportal.app</Text>
          </Section>

          {/* What to expect */}
          <Section style={infoSection}>
            <Text style={infoText}>
              {role === "admin"
                ? "Als beheerder kun je rapporten beheren, gebruikers uitnodigen en instellingen wijzigen."
                : "Als viewer krijg je toegang tot de rapporten die met je gedeeld worden."}
            </Text>
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Button style={ctaButton} href={inviteUrl}>
              Account activeren
            </Button>
          </Section>

          {/* Security note */}
          <Section style={securitySection}>
            <Text style={securityText}>
              Na het klikken op de knop kun je een wachtwoord instellen en
              direct inloggen op het portaal. De link is 24 uur geldig.
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Verwachtte je deze e-mail niet? Dan kun je deze veilig negeren.
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

const portalUrlStyle = {
  color: "#1a1a2e",
  fontSize: "18px",
  fontWeight: "600" as const,
  fontFamily: '"JetBrains Mono", monospace',
  margin: "0",
};

const infoSection = {
  padding: "0 40px 24px",
};

const infoText = {
  color: "#4a5568",
  fontSize: "14px",
  lineHeight: "22px",
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

const securitySection = {
  padding: "0 40px 24px",
};

const securityText = {
  color: "#94a3b8",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0",
  textAlign: "center" as const,
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
