import { NextRequest, NextResponse } from "next/server";
import { getAgencyOwnerContext, getAgencyMemberContext } from "@/lib/auth/agency";
import { isAuthError } from "@/lib/auth/validate";
import { getAgencyClients } from "@/lib/agency/queries";

/**
 * GET /api/agency/clients?agencyId=xxx
 *
 * Haal alle klant-tenants van een agency op.
 * Elk teamlid (inclusief viewers) kan dit zien.
 */
export async function GET(req: NextRequest) {
  try {
    const agencyId = req.nextUrl.searchParams.get("agencyId");
    if (!agencyId) {
      return NextResponse.json(
        { error: "agencyId is verplicht" },
        { status: 400 }
      );
    }

    const ctx = await getAgencyMemberContext(agencyId);
    if (isAuthError(ctx)) {
      return NextResponse.json({ error: ctx.error }, { status: ctx.status });
    }

    const clients = await getAgencyClients(agencyId);
    return NextResponse.json({ clients });
  } catch (error) {
    console.error("[agency/clients] GET fout:", error);
    return NextResponse.json({ error: "Interne fout" }, { status: 500 });
  }
}

/**
 * POST /api/agency/clients
 *
 * Maak een nieuwe klant-tenant aan onder de agency.
 * 1. Tenant aanmaken met agency_id + billing_owner='agency'
 * 2. Klant-admin tenant_user aanmaken
 * 3. Uitnodigingsmail versturen (non-blocking)
 *
 * Body: { agencyId, clientName, clientSlug, adminEmail, adminName?, adminPassword? }
 */
export async function POST(req: NextRequest) {
  try {
    const { agencyId, clientName, clientSlug, adminEmail, adminName, adminPassword } =
      await req.json();

    // ─── Input validatie ───
    if (!agencyId || !clientName || !clientSlug || !adminEmail) {
      return NextResponse.json(
        { error: "agencyId, clientName, clientSlug en adminEmail zijn verplicht" },
        { status: 400 }
      );
    }

    if (!/^[a-z0-9-]+$/.test(clientSlug)) {
      return NextResponse.json(
        { error: "Slug mag alleen kleine letters, cijfers en streepjes bevatten" },
        { status: 400 }
      );
    }

    // ─── Auth: owner of admin ───
    const ctx = await getAgencyOwnerContext(agencyId);
    if (isAuthError(ctx)) {
      return NextResponse.json({ error: ctx.error }, { status: ctx.status });
    }

    const normalizedEmail = adminEmail.toLowerCase().trim();

    // ─── Check of slug beschikbaar is ───
    const { data: existing } = await ctx.serviceClient
      .from("tenants")
      .select("id")
      .eq("slug", clientSlug)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Dit portaal adres is al in gebruik" },
        { status: 400 }
      );
    }

    // ─── Auth user aanmaken voor klant-admin ───
    const password = adminPassword || `dp-${crypto.randomUUID().slice(0, 16)}`;
    let authUserId: string | null = null;

    const { data: newUser, error: createError } =
      await ctx.serviceClient.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: { display_name: adminName || clientName },
      });

    if (createError) {
      if (
        createError.message?.includes("already") ||
        createError.message?.includes("exists")
      ) {
        const { data: listData } = await ctx.serviceClient.auth.admin.listUsers();
        const existingUser = listData?.users?.find(
          (u) => u.email === normalizedEmail
        );
        authUserId = existingUser?.id || null;

        // Als agency een wachtwoord heeft ingesteld, update het voor de bestaande user
        if (authUserId && adminPassword) {
          await ctx.serviceClient.auth.admin.updateUserById(authUserId, {
            password: adminPassword,
          });
        }
      } else {
        console.error("[agency/clients/post] Auth create error:", createError);
        return NextResponse.json(
          { error: "Kon klant-account niet aanmaken" },
          { status: 500 }
        );
      }
    } else {
      authUserId = newUser.user.id;
    }

    // ─── Tenant aanmaken ───
    const { data: tenant, error: tenantError } = await ctx.serviceClient
      .from("tenants")
      .insert({
        name: clientName,
        slug: clientSlug,
        agency_id: agencyId,
        billing_owner: "agency",
        subscription_plan: "starter",
        subscription_status: "active",
      })
      .select()
      .single();

    if (tenantError) {
      console.error("[agency/clients/post] Tenant insert error:", tenantError);
      return NextResponse.json(
        { error: "Kon klant-portaal niet aanmaken" },
        { status: 500 }
      );
    }

    // ─── Klant-admin tenant_user aanmaken ───
    const { error: userError } = await ctx.serviceClient
      .from("tenant_users")
      .insert({
        tenant_id: tenant.id,
        email: normalizedEmail,
        name: adminName || null,
        role: "admin",
        auth_provider: "email",
      });

    if (userError) {
      console.error("[agency/clients/post] Tenant user insert error:", userError);
      return NextResponse.json(
        { error: "Kon klant-beheerder niet aanmaken" },
        { status: 500 }
      );
    }

    // ─── Vercel subdomain (non-blocking) ───
    try {
      const { addTenantSubdomain } = await import("@/lib/vercel/domains");
      await addTenantSubdomain(clientSlug);
    } catch (domainErr) {
      console.warn("[agency/clients/post] Subdomain registratie mislukt (niet-kritiek):", domainErr);
    }

    // ─── Uitnodigingsmail (non-blocking) ───
    try {
      const { sendAgencyClientInviteEmail } = await import("@/lib/email/agency");
      const { data: agency } = await ctx.serviceClient
        .from("agencies")
        .select("name")
        .eq("id", agencyId)
        .single();

      await sendAgencyClientInviteEmail(
        { email: normalizedEmail, name: adminName || null },
        {
          agencyName: agency?.name || "je agency",
          clientName,
          slug: clientSlug,
        }
      );
    } catch (emailErr) {
      console.warn("[agency/clients/post] Uitnodigingsmail mislukt (niet-kritiek):", emailErr);
    }

    console.log(`[agency/clients/post] Klant aangemaakt: ${clientSlug} (${tenant.id}) voor agency ${agencyId}`);

    return NextResponse.json({ tenant });
  } catch (error) {
    console.error("[agency/clients/post] Onverwachte fout:", error);
    return NextResponse.json({ error: "Interne fout" }, { status: 500 });
  }
}
