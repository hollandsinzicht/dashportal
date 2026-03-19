import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isAgencySlugTaken } from "@/lib/agency/queries";
import { DEFAULT_AGENCY_TIERS } from "@/lib/agency/pricing";
import { isAuthError } from "@/lib/auth/validate";
import { getAgencyOwnerContext } from "@/lib/auth/agency";

/** CORS preflight handler */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
    },
  });
}

/**
 * POST /api/agency
 *
 * Registreer een nieuwe agency.
 * 1. Auth user aanmaken (of bestaande hergebruiken)
 * 2. Agency record + owner agency_user + standaard prijsschijven
 * 3. Welkomstmail (non-blocking)
 */
export async function POST(req: NextRequest) {
  try {
    const {
      companyName,
      slug,
      contactName,
      email,
      password,
      billingEmail,
      companyDetails,
      logoUrl,
      primaryColor,
      accentColor,
    } = await req.json();

    // ─── Input validatie ───
    if (!email || !password) {
      return NextResponse.json(
        { error: "E-mail en wachtwoord zijn verplicht" },
        { status: 400 }
      );
    }
    if (!companyName || !slug) {
      return NextResponse.json(
        { error: "Bedrijfsnaam en portaal adres zijn verplicht" },
        { status: 400 }
      );
    }

    // Slug format check
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: "Slug mag alleen kleine letters, cijfers en streepjes bevatten" },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();
    const normalizedEmail = email.toLowerCase().trim();

    // ─── Stap 1: Check of slug beschikbaar is ───
    if (await isAgencySlugTaken(slug)) {
      return NextResponse.json(
        { error: "Dit agency adres is al in gebruik" },
        { status: 400 }
      );
    }

    // ─── Stap 2: Supabase Auth account aanmaken ───
    let authUserId: string | null = null;

    const { data: newUser, error: createError } =
      await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: { display_name: contactName },
      });

    if (createError) {
      if (
        createError.message?.includes("already") ||
        createError.message?.includes("exists")
      ) {
        const { data: listData } = await supabase.auth.admin.listUsers();
        const existingUser = listData?.users?.find(
          (u) => u.email === normalizedEmail
        );
        if (existingUser) {
          authUserId = existingUser.id;
          await supabase.auth.admin.updateUserById(existingUser.id, {
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
        console.error("[agency/post] Auth create error:", createError);
        return NextResponse.json(
          { error: createError.message || "Kon account niet aanmaken" },
          { status: 500 }
        );
      }
    } else {
      authUserId = newUser.user.id;
    }

    // ─── Stap 3: Agency aanmaken ───
    const { data: agency, error: agencyError } = await supabase
      .from("agencies")
      .insert({
        name: companyName,
        slug,
        owner_email: normalizedEmail,
        billing_email: billingEmail || normalizedEmail,
        company_details: companyDetails || {},
        logo_url: logoUrl || null,
        primary_color: primaryColor || "#1E3A5F",
        accent_color: accentColor || "#F59E0B",
      })
      .select()
      .single();

    if (agencyError) {
      console.error("[agency/post] Agency insert error:", agencyError);
      return NextResponse.json(
        { error: "Kon agency niet aanmaken" },
        { status: 500 }
      );
    }

    // ─── Stap 4: Owner agency_user aanmaken ───
    const { error: userError } = await supabase.from("agency_users").insert({
      agency_id: agency.id,
      email: normalizedEmail,
      name: contactName,
      role: "owner",
    });

    if (userError) {
      console.error("[agency/post] Agency user insert error:", userError);
      return NextResponse.json(
        { error: "Kon agency gebruiker niet aanmaken" },
        { status: 500 }
      );
    }

    // ─── Stap 5: Standaard prijsschijven aanmaken ───
    const tierInserts = DEFAULT_AGENCY_TIERS.map((tier) => ({
      agency_id: agency.id,
      ...tier,
    }));

    const { error: tierError } = await supabase
      .from("agency_pricing_tiers")
      .insert(tierInserts);

    if (tierError) {
      console.warn("[agency/post] Pricing tiers insert mislukt (niet-kritiek):", tierError);
    }

    // ─── Stap 6: Welkomstmail (non-blocking) ───
    try {
      const { sendAgencyWelcomeEmail } = await import("@/lib/email/agency");
      await sendAgencyWelcomeEmail(
        { id: agency.id, name: agency.name, slug: agency.slug },
        { email: normalizedEmail, name: contactName || null }
      );
    } catch (emailErr) {
      console.warn("[agency/post] Welkom e-mail mislukt (niet-kritiek):", emailErr);
    }

    console.log(`[agency/post] Agency aangemaakt: ${agency.slug} (${agency.id}) door ${normalizedEmail}`);

    return NextResponse.json({ agency });
  } catch (err) {
    console.error("[agency/post] Onverwachte fout:", err);
    return NextResponse.json({ error: "Interne fout" }, { status: 500 });
  }
}

/**
 * PATCH /api/agency
 *
 * Agency settings bijwerken (naam, kleuren, logo, bedrijfsgegevens).
 * Vereist owner of admin rol.
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { agencyId, ...rawUpdates } = body;

    if (!agencyId) {
      return NextResponse.json(
        { error: "agencyId is verplicht" },
        { status: 400 }
      );
    }

    const ctx = await getAgencyOwnerContext(agencyId);
    if (isAuthError(ctx)) {
      return NextResponse.json({ error: ctx.error }, { status: ctx.status });
    }

    const ALLOWED_FIELDS = [
      "name",
      "logo_url",
      "primary_color",
      "accent_color",
      "billing_email",
      "company_details",
    ];

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

    const { error } = await ctx.serviceClient
      .from("agencies")
      .update(updates)
      .eq("id", agencyId);

    if (error) {
      console.error("[agency/patch] Update fout:", error);
      return NextResponse.json(
        { error: "Kon instellingen niet opslaan" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[agency/patch] Onverwachte fout:", error);
    return NextResponse.json({ error: "Interne fout" }, { status: 500 });
  }
}
