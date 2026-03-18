import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity/log";
import { getTenantUsage, getUpgradeSuggestion } from "@/lib/tenant/usage";
import { sendInviteEmail } from "@/lib/email/send";

export async function POST(req: NextRequest) {
  try {
    const { email, name, role, tenantId } = await req.json();

    // ─── Validatie ───
    if (!email || !tenantId) {
      return NextResponse.json(
        { error: "E-mail en tenantId zijn verplicht" },
        { status: 400 }
      );
    }

    const validRoles = ["viewer", "admin"];
    const userRole = validRoles.includes(role) ? role : "viewer";

    // ─── Auth check: alleen ingelogde admins ───
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
    }

    const serviceClient = await createServiceClient();

    // Controleer of de huidige gebruiker admin is voor deze tenant
    const { data: currentUser } = await serviceClient
      .from("tenant_users")
      .select("id, role, name")
      .eq("tenant_id", tenantId)
      .eq("email", user.email!)
      .eq("is_active", true)
      .single();

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "Alleen admins kunnen gebruikers uitnodigen" },
        { status: 403 }
      );
    }

    // ─── Tenant data ophalen (inclusief slug voor e-mail) ───
    const { data: tenantData } = await serviceClient
      .from("tenants")
      .select("subscription_plan, name, slug")
      .eq("id", tenantId)
      .single();

    const plan = tenantData?.subscription_plan || "starter";
    const tenantName = tenantData?.name || "je organisatie";
    const tenantSlug = tenantData?.slug || "portaal";

    // ─── Gebruikerslimiet check ───
    const usage = await getTenantUsage(serviceClient, tenantId, plan);

    if (!usage.isUnlimited && usage.remaining <= 0) {
      const upgrade = getUpgradeSuggestion(plan);
      const upgradeMsg = upgrade
        ? ` Upgrade naar ${upgrade.planName} voor ${upgrade.userLimit} gebruikers.`
        : "";

      return NextResponse.json(
        {
          error: `Gebruikerslimiet bereikt (${usage.currentUsers}/${usage.maxUsers}).${upgradeMsg}`,
          code: "USER_LIMIT_REACHED",
          usage: {
            current: usage.currentUsers,
            max: usage.maxUsers,
            plan,
          },
        },
        { status: 403 }
      );
    }

    // ─── Check of e-mail al bestaat voor deze tenant ───
    const normalizedEmail = email.toLowerCase().trim();
    const { data: existing } = await serviceClient
      .from("tenant_users")
      .select("id, is_active")
      .eq("tenant_id", tenantId)
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existing) {
      if (existing.is_active) {
        return NextResponse.json(
          { error: "Deze gebruiker bestaat al voor deze organisatie" },
          { status: 409 }
        );
      }
      // Heractiveer een eerder gedeactiveerde gebruiker
      await serviceClient
        .from("tenant_users")
        .update({
          is_active: true,
          name: name || null,
          role: userRole,
          invited_by: currentUser.id,
          invited_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      await logActivity({
        serviceClient,
        tenantId,
        actorId: currentUser.id,
        action: "user.invited",
        targetType: "user",
        targetId: existing.id,
        metadata: { email: normalizedEmail, name: name || "", role: userRole, reactivated: true },
      });

      return NextResponse.json({
        success: true,
        message: "Gebruiker is opnieuw geactiveerd",
        userId: existing.id,
        emailSent: false,
      });
    }

    // ─── Tenant user record aanmaken ───
    const { data: newUser, error: insertError } = await serviceClient
      .from("tenant_users")
      .insert({
        tenant_id: tenantId,
        email: normalizedEmail,
        name: name || null,
        role: userRole,
        auth_provider: "email",
        is_active: true,
        invited_by: currentUser.id,
        invited_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[invite] Insert fout:", insertError);
      return NextResponse.json(
        { error: "Kon gebruiker niet aanmaken: " + insertError.message },
        { status: 500 }
      );
    }

    // ─── Supabase Auth: genereer invite link + stuur e-mail via Resend ───
    let emailSent = false;
    // Gebruik altijd het platform domein voor redirects (niet tenant subdomains)
    // zodat Supabase de redirect URL herkent in de whitelist
    const rawOrigin = req.headers.get("origin") || req.headers.get("referer")?.replace(/\/[^/]*$/, "") || "http://localhost:3000";
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3001";
    const isLocal = rawOrigin.includes("localhost") || rawOrigin.includes("127.0.0.1");
    const origin = isLocal ? rawOrigin : `https://app.${rootDomain}`;
    const inviterName = currentUser.name || user.user_metadata?.display_name || user.email || "een beheerder";

    try {
      // Genereer een invite link via Supabase Auth (zonder e-mail te sturen)
      // Dit maakt een auth user aan en geeft een verify-token terug
      const { data: linkData, error: linkError } =
        await serviceClient.auth.admin.generateLink({
          type: "invite",
          email: normalizedEmail,
          options: {
            data: {
              tenant_id: tenantId,
              role: userRole,
              display_name: name,
            },
            redirectTo: `${origin}/auth/callback`,
          },
        });

      if (linkError) {
        if (linkError.message?.includes("already")) {
          // Auth user bestaat al → stuur een magic link
          console.log("[invite] Auth user bestaat al, stuur magic link:", normalizedEmail);

          const { data: magicData, error: magicError } =
            await serviceClient.auth.admin.generateLink({
              type: "magiclink",
              email: normalizedEmail,
              options: {
                redirectTo: `${origin}/auth/callback`,
              },
            });

          if (!magicError && magicData?.properties?.action_link) {
            const confirmUrl = buildConfirmUrl(origin, magicData.properties.action_link, "magiclink");
            emailSent = await sendInviteEmail(
              { email: normalizedEmail, name: name || null },
              { inviterName, companyName: tenantName, slug: tenantSlug, role: userRole, inviteUrl: confirmUrl }
            );
          }
        } else {
          console.warn("[invite] Link generatie fout:", linkError.message);
        }
      } else if (linkData?.properties?.action_link) {
        // Nieuwe gebruiker → stuur invite e-mail
        const confirmUrl = buildConfirmUrl(origin, linkData.properties.action_link, "invite");
        emailSent = await sendInviteEmail(
          { email: normalizedEmail, name: name || null },
          { inviterName, companyName: tenantName, slug: tenantSlug, role: userRole, inviteUrl: confirmUrl }
        );
      }
    } catch (authErr) {
      // Auth is niet-kritiek — tenant_user record is al aangemaakt
      console.warn("[invite] Auth invite mislukt (niet-kritiek):", authErr);
    }

    await logActivity({
      serviceClient,
      tenantId,
      actorId: currentUser.id,
      action: "user.invited",
      targetType: "user",
      targetId: newUser.id,
      metadata: { email: normalizedEmail, name: name || "", role: userRole, emailSent },
    });

    return NextResponse.json({
      success: true,
      message: emailSent
        ? "Uitnodigingsmail verstuurd"
        : "Gebruiker aangemaakt (e-mail kon niet verstuurd worden)",
      userId: newUser.id,
      emailSent,
    });
  } catch (error) {
    console.error("[invite] Onverwachte fout:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Er ging iets mis bij het uitnodigen",
      },
      { status: 500 }
    );
  }
}

/**
 * Bouw een confirm URL vanuit de Supabase action_link.
 *
 * Supabase action_link format:
 *   https://project.supabase.co/auth/v1/verify?token=TOKEN&type=TYPE&redirect_to=...
 *
 * We bouwen hier een URL naar /auth/confirm die de token client-side verifieert.
 */
function buildConfirmUrl(origin: string, actionLink: string, type: string): string {
  try {
    const url = new URL(actionLink);
    const token = url.searchParams.get("token");

    if (token) {
      return `${origin}/auth/confirm?token_hash=${token}&type=${type}&next=/dashboard`;
    }

    // Fallback: geef de originele action_link terug
    return actionLink;
  } catch {
    return actionLink;
  }
}
