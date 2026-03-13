import { Resend } from "resend";

// ─── Resend instance ───

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is niet geconfigureerd");
    _resend = new Resend(key);
  }
  return _resend;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@dashportal.app";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app.dashportal.app";

// ─── Types ───

interface UserInfo {
  email: string;
  name: string | null;
}

interface AgencyInfo {
  id: string;
  name: string;
  slug: string;
}

// ─── Agency welkom e-mail ───
// Trigger: Na registratie van een nieuwe agency

export async function sendAgencyWelcomeEmail(
  agency: AgencyInfo,
  user: UserInfo
) {
  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: `Welkom bij DashPortal Agency — ${agency.name} staat klaar`,
      html: `
        <div style="font-family: 'DM Sans', -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1E3A5F;">Welkom bij DashPortal Agency</h1>
          <p>Hoi ${user.name || "daar"},</p>
          <p>Je agency <strong>${agency.name}</strong> is aangemaakt en klaar voor gebruik.</p>
          <p>Je kunt nu:</p>
          <ul>
            <li>Klantportalen aanmaken en beheren</li>
            <li>Teamleden uitnodigen</li>
            <li>Prijsschijven instellen</li>
            <li>Facturatie bekijken</li>
          </ul>
          <p>
            <a href="${BASE_URL}/agency/${agency.slug}/dashboard"
               style="display: inline-block; background: #1E3A5F; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
              Ga naar je dashboard
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">— Het DashPortal team</p>
        </div>
      `,
    });
    console.log("[email/agency] Welkom e-mail verstuurd naar:", user.email);
  } catch (err) {
    console.error("[email/agency] Welkom e-mail mislukt:", err);
  }
}

// ─── Klant uitnodiging e-mail ───
// Trigger: Agency maakt nieuwe klant aan

export async function sendAgencyClientInviteEmail(
  user: UserInfo,
  invite: { agencyName: string; clientName: string; slug: string }
) {
  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: `${invite.agencyName} heeft een portaal voor je aangemaakt — ${invite.clientName}`,
      html: `
        <div style="font-family: 'DM Sans', -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1E3A5F;">Je dataportaal staat klaar</h1>
          <p>Hoi ${user.name || "daar"},</p>
          <p><strong>${invite.agencyName}</strong> heeft een DashPortal portaal voor je aangemaakt: <strong>${invite.clientName}</strong>.</p>
          <p>Met DashPortal kun je je Power BI rapporten veilig delen met je team, in je eigen huisstijl.</p>
          <p>
            <a href="${BASE_URL}/${invite.slug}/login"
               style="display: inline-block; background: #1E3A5F; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
              Log in op je portaal
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">Je kunt inloggen met dit e-mailadres. Gebruik de "Wachtwoord vergeten" link als je voor het eerst inlogt.</p>
          <p style="color: #666; font-size: 14px;">— Het DashPortal team</p>
        </div>
      `,
    });
    console.log("[email/agency] Klant uitnodiging verstuurd naar:", user.email);
  } catch (err) {
    console.error("[email/agency] Klant uitnodiging mislukt:", err);
  }
}

// ─── Team uitnodiging e-mail ───
// Trigger: Agency owner nodigt een teamlid uit

export async function sendAgencyTeamInviteEmail(
  user: UserInfo,
  invite: {
    agencyName: string;
    agencySlug: string;
    inviterName: string;
    role: string;
  }
) {
  const roleLabel = invite.role === "admin" ? "Beheerder" : "Meekijker";

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: `Je bent uitgenodigd voor ${invite.agencyName} op DashPortal`,
      html: `
        <div style="font-family: 'DM Sans', -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1E3A5F;">Je bent uitgenodigd</h1>
          <p>Hoi ${user.name || "daar"},</p>
          <p><strong>${invite.inviterName}</strong> heeft je uitgenodigd als <strong>${roleLabel}</strong> voor <strong>${invite.agencyName}</strong> op DashPortal.</p>
          <p>
            <a href="${BASE_URL}/agency/${invite.agencySlug}/dashboard"
               style="display: inline-block; background: #1E3A5F; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
              Ga naar het agency dashboard
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">Log in met dit e-mailadres. Gebruik de "Wachtwoord vergeten" link als je voor het eerst inlogt.</p>
          <p style="color: #666; font-size: 14px;">— Het DashPortal team</p>
        </div>
      `,
    });
    console.log("[email/agency] Team uitnodiging verstuurd naar:", user.email);
  } catch (err) {
    console.error("[email/agency] Team uitnodiging mislukt:", err);
  }
}
