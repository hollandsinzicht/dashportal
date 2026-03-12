import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/utils/encryption";
import { logActivity } from "@/lib/activity/log";
import { sendWelcomeEmail } from "@/lib/email/send";
import { addTenantSubdomain } from "@/lib/vercel/domains";

export async function POST(req: NextRequest) {
  try {
    const { companyName, slug, contactName, email, password, plan, referralCode } =
      await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-mail en wachtwoord zijn verplicht" },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // ─── Stap 1: Check of slug beschikbaar is ───
    const { data: existing } = await supabase
      .from("tenants")
      .select("id")
      .eq("slug", slug)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Dit portaal adres is al in gebruik" },
        { status: 400 }
      );
    }

    // ─── Stap 2: Supabase Auth account aanmaken (server-side) ───
    // Door email_confirm: true wordt e-mailbevestiging overgeslagen,
    // zodat de gebruiker direct kan inloggen met signInWithPassword().
    const normalizedEmail = email.toLowerCase().trim();

    // Probeer createUser — als user al bestaat, vangen we dat af
    let authUserId: string | null = null;

    const { data: newUser, error: createError } =
      await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: { display_name: contactName },
      });

    if (createError) {
      // User bestaat al — dat is OK, we gaan door
      if (
        createError.message?.includes("already") ||
        createError.message?.includes("exists")
      ) {
        // Haal bestaande user op
        const { data: listData } = await supabase.auth.admin.listUsers();
        const existingAuthUser = listData?.users?.find(
          (u) => u.email === normalizedEmail
        );
        if (existingAuthUser) {
          authUserId = existingAuthUser.id;
          // Update het wachtwoord zodat de klant kan inloggen
          await supabase.auth.admin.updateUserById(existingAuthUser.id, {
            password,
            email_confirm: true,
          });
        } else {
          return NextResponse.json(
            { error: "Kon account niet aanmaken. Probeer het opnieuw." },
            { status: 500 }
          );
        }
      } else {
        console.error("[tenant/post] Auth create error:", createError);
        return NextResponse.json(
          { error: createError.message || "Kon account niet aanmaken" },
          { status: 500 }
        );
      }
    } else {
      authUserId = newUser.user.id;
    }

    // ─── Stap 3: Tenant aanmaken ───
    const validPlans = ["starter", "business", "scale", "enterprise"];
    const subscriptionPlan = validPlans.includes(plan) ? plan : "starter";
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .insert({
        name: companyName,
        slug,
        subscription_plan: subscriptionPlan,
        subscription_status: "trialing",
        trial_ends_at: trialEndsAt,
        dpa_accepted_at: new Date().toISOString(),
        dpa_accepted_by: normalizedEmail,
      })
      .select()
      .single();

    if (tenantError) {
      return NextResponse.json(
        { error: "Kon account niet aanmaken" },
        { status: 500 }
      );
    }

    // ─── Stap 4: Admin tenant_user aanmaken ───
    const { error: userError } = await supabase.from("tenant_users").insert({
      tenant_id: tenant.id,
      email: normalizedEmail,
      name: contactName,
      role: "admin",
      auth_provider: "email",
    });

    if (userError) {
      return NextResponse.json(
        { error: "Kon gebruiker niet aanmaken" },
        { status: 500 }
      );
    }

    // ─── Stap 5: Vercel subdomain registreren ───
    // Non-blocking: als het misgaat, loggen we maar blocken we niet
    try {
      await addTenantSubdomain(slug);
    } catch (domainErr) {
      console.warn("[tenant/post] Vercel subdomain registratie mislukt (niet-kritiek):", domainErr);
    }

    // ─── Stap 6: Welkom e-mail versturen ───
    try {
      await sendWelcomeEmail(
        {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          subscription_plan: subscriptionPlan,
          trial_ends_at: trialEndsAt,
        },
        {
          email: normalizedEmail,
          name: contactName || null,
        }
      );
    } catch (emailErr) {
      // E-mail is niet-kritiek — tenant is al aangemaakt
      console.warn("[tenant/post] Welkom e-mail mislukt (niet-kritiek):", emailErr);
    }

    // ─── Stap 7: Referral tracking (optioneel) ───
    if (referralCode) {
      try {
        const { validateReferralCode, trackReferral } = await import(
          "@/lib/affiliate/referral"
        );
        const affiliate = await validateReferralCode(referralCode);
        if (affiliate) {
          await trackReferral(affiliate.id, tenant.id, normalizedEmail);
          console.log(
            `[tenant/post] Referral geregistreerd: ${referralCode} → ${tenant.slug}`
          );
        }
      } catch (refErr) {
        // Referral tracking is niet-kritiek
        console.warn("[tenant/post] Referral tracking mislukt:", refErr);
      }
    }

    return NextResponse.json({ tenant });
  } catch (err) {
    console.error("[tenant/post] Onverwachte fout:", err);
    return NextResponse.json(
      { error: "Interne fout" },
      { status: 500 }
    );
  }
}

// ─── Veilige velden die via branding/settings gewijzigd mogen worden ───
const ALLOWED_FIELDS = [
  "name",
  "primary_color",
  "accent_color",
  "custom_domain",
  "logo_url",
  "pbi_tenant_id",
  "pbi_client_id",
  "pbi_client_secret",
  "pbi_workspace_ids",
  "meta_sync_schedule",
  "meta_next_sync_at",
];

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId, ...rawUpdates } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is verplicht" },
        { status: 400 }
      );
    }

    // ─── Auth: sessie + admin check (via gedeelde helper) ───
    const { getAdminContext, isAuthError } = await import("@/lib/auth/validate");
    const ctx = await getAdminContext(tenantId);
    if (isAuthError(ctx)) {
      return NextResponse.json({ error: ctx.error }, { status: ctx.status });
    }
    const { currentUser, serviceClient } = ctx;

    // ─── Filter op toegestane velden ───
    const updates: Record<string, unknown> = {};
    for (const key of Object.keys(rawUpdates)) {
      if (ALLOWED_FIELDS.includes(key)) {
        updates[key] = rawUpdates[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Geen geldige velden opgegeven" },
        { status: 400 }
      );
    }

    // UUID validatie voor Power BI velden
    if (updates.pbi_tenant_id && typeof updates.pbi_tenant_id === "string") {
      const { isValidUUID } = await import("@/lib/utils/validation");
      if (!isValidUUID(updates.pbi_tenant_id as string)) {
        return NextResponse.json(
          { error: "Azure Tenant ID heeft geen geldig UUID formaat (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)" },
          { status: 400 }
        );
      }
    }
    if (updates.pbi_client_id && typeof updates.pbi_client_id === "string") {
      const { isValidUUID } = await import("@/lib/utils/validation");
      if (!isValidUUID(updates.pbi_client_id as string)) {
        return NextResponse.json(
          { error: "Application (Client) ID heeft geen geldig UUID formaat (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)" },
          { status: 400 }
        );
      }
    }

    // ─── Sync schedule tier validatie ───
    if (updates.meta_sync_schedule && typeof updates.meta_sync_schedule === "string") {
      const { isSyncScheduleAllowed } = await import("@/lib/features/gates");
      const { data: tenantForPlan } = await serviceClient
        .from("tenants")
        .select("subscription_plan")
        .eq("id", tenantId)
        .single();

      const plan = tenantForPlan?.subscription_plan || "starter";
      if (!isSyncScheduleAllowed(plan, updates.meta_sync_schedule as string)) {
        return NextResponse.json(
          { error: "Deze sync-frequentie is niet beschikbaar op je huidige plan. Upgrade om deze optie te gebruiken." },
          { status: 403 }
        );
      }
    }

    // Encrypt client secret if provided
    if (updates.pbi_client_secret && typeof updates.pbi_client_secret === "string") {
      updates.pbi_client_secret = encrypt(updates.pbi_client_secret as string);
    }

    const { error } = await serviceClient
      .from("tenants")
      .update(updates)
      .eq("id", tenantId);

    if (error) {
      console.error("[tenant/patch] Update fout:", error);
      return NextResponse.json(
        { error: "Kon instellingen niet opslaan" },
        { status: 500 }
      );
    }

    // Activity logging
    const changedFields = Object.keys(updates).filter((k) => k !== "pbi_client_secret");
    await logActivity({
      serviceClient,
      tenantId,
      actorId: currentUser.id,
      action: "tenant.updated",
      targetType: "tenant",
      targetId: tenantId,
      metadata: { field: changedFields.join(", ") },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[tenant/patch] Onverwachte fout:", error);
    return NextResponse.json(
      { error: "Interne fout" },
      { status: 500 }
    );
  }
}
