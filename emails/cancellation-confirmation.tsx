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

interface CancellationConfirmationEmailProps {
  userName: string;
  companyName: string;
  slug: string;
  cancelDate: string;
  dataRetentionDate: string;
}

export default function CancellationConfirmationEmail({
  userName = "daar",
  companyName = "Jouw bedrijf",
  slug = "demo",
  cancelDate = "1 april 2026",
  dataRetentionDate = "1 mei 2026",
}: CancellationConfirmationEmailProps) {
  const billingUrl = `https://${slug}.dashportal.app/dashboard/billing`;
  const exportUrl = `https://${slug}.dashportal.app/dashboard/billing`;

  return (
    <Html>
      <Head />
      <Preview>
        Bevestiging: je DashPortal abonnement wordt beëindigd
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
            <Heading style={h1}>Abonnement wordt beëindigd</Heading>
            <Text style={heroText}>
              Hoi {userName}, we hebben de annulering van het{" "}
              {companyName}-portaal verwerkt. Jammer dat je weggaat.
            </Text>
          </Section>

          {/* Tijdlijn */}
          <Section style={timelineSection}>
            <Section style={timelineCard}>
              <Text style={timelineTitle}>Wat er nu gebeurt</Text>

              <Section style={timelineItem}>
                <Text style={timelineDate}>Nu</Text>
                <Text style={timelineText}>
                  Je annulering is verwerkt. Je hebt nog steeds volledige
                  toegang tot je portaal.
                </Text>
              </Section>

              <Section style={timelineItem}>
                <Text style={timelineDate}>{cancelDate}</Text>
                <Text style={timelineText}>
                  Je abonnement eindigt en de toegang wordt gepauzeerd.
                  Alle data blijft bewaard.
                </Text>
              </Section>

              <Section style={timelineItem}>
                <Text style={timelineDate}>{dataRetentionDate}</Text>
                <Text style={timelineText}>
                  Na 30 dagen worden alle gegevens permanent verwijderd.
                  Download je data vóór deze datum.
                </Text>
              </Section>
            </Section>
          </Section>

          {/* Acties */}
          <Section style={actionsSection}>
            <Text style={actionsTitle}>Vergeet niet:</Text>
            <Text style={listItem}>
              📥 Download je data-export voor {dataRetentionDate}
            </Text>
            <Text style={listItem}>
              👥 Informeer je gebruikers over de wijziging
            </Text>
            <Text style={listItem}>
              🔄 Je kunt altijd heractiveren vóór {dataRetentionDate}
            </Text>
          </Section>

          {/* CTAs */}
          <Section style={ctaSection}>
            <Button style={ctaButton} href={exportUrl}>
              Download je data
            </Button>
            <Text style={ctaSubtext}>
              Of{" "}
              <a href={billingUrl} style={link}>
                heractiveer je abonnement
              </a>{" "}
              als je van gedachten bent veranderd.
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Vragen of feedback? Reply op deze e-mail of mail naar
              support@dashportal.app — we horen graag wat we beter
              kunnen doen.
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

const timelineSection = { padding: "0 40px 16px" };

const timelineCard = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "20px 24px",
};

const timelineTitle = {
  color: "#1a1a2e",
  fontSize: "15px",
  fontWeight: "600" as const,
  margin: "0 0 16px",
};

const timelineItem = {
  paddingBottom: "12px",
  marginBottom: "12px",
  borderBottom: "1px solid #f1f5f9",
};

const timelineDate = {
  color: "#6366f1",
  fontSize: "12px",
  fontWeight: "600" as const,
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0 0 4px",
};

const timelineText = {
  color: "#4a5568",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0",
};

const actionsSection = { padding: "0 40px 16px" };

const actionsTitle = {
  color: "#1a1a2e",
  fontSize: "14px",
  fontWeight: "600" as const,
  margin: "0 0 8px",
};

const listItem = {
  color: "#4a5568",
  fontSize: "14px",
  lineHeight: "28px",
  margin: "0",
};

const ctaSection = {
  padding: "8px 40px 24px",
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

const link = {
  color: "#6366f1",
  textDecoration: "underline",
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
