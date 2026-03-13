import { NextRequest, NextResponse } from "next/server";
import { getAgencyOwnerContext, getAgencyMemberContext } from "@/lib/auth/agency";
import { isAuthError } from "@/lib/auth/validate";
import { getAgencyUsers } from "@/lib/agency/queries";

/**
 * GET /api/agency/users?agencyId=xxx
 *
 * Haal alle teamleden van een agency op.
 */
export async function GET(req: NextRequest) {
  try {
    const agencyId = req.nextUrl.searchParams.get("agencyId");
    if (!agencyId) {
      return NextResponse.json({ error: "agencyId is verplicht" }, { status: 400 });
    }

    const ctx = await getAgencyMemberContext(agencyId);
    if (isAuthError(ctx)) {
      return NextResponse.json({ error: ctx.error }, { status: ctx.status });
    }

    const users = await getAgencyUsers(agencyId);
    return NextResponse.json({ users });
  } catch (error) {
    console.error("[agency/users] GET fout:", error);
    return NextResponse.json({ error: "Interne fout" }, { status: 500 });
  }
}

/**
 * POST /api/agency/users
 *
 * Nodig een nieuw teamlid uit voor de agency.
 * Body: { agencyId, email, name?, role? }
 */
export async function POST(req: NextRequest) {
  try {
    const { agencyId, email, name, role } = await req.json();

    if (!agencyId || !email) {
      return NextResponse.json(
        { error: "agencyId en email zijn verplicht" },
        { status: 400 }
      );
    }

    const validRoles = ["admin", "viewer"];
    const assignedRole = validRoles.includes(role) ? role : "viewer";

    const ctx = await getAgencyOwnerContext(agencyId);
    if (isAuthError(ctx)) {
      return NextResponse.json({ error: ctx.error }, { status: ctx.status });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check of gebruiker al lid is
    const { data: existing } = await ctx.serviceClient
      .from("agency_users")
      .select("id, is_active")
      .eq("agency_id", agencyId)
      .eq("email", normalizedEmail)
      .single();

    if (existing) {
      if (existing.is_active) {
        return NextResponse.json(
          { error: "Dit e-mailadres is al teamlid van deze agency" },
          { status: 400 }
        );
      }
      // Heractiveer inactief lid
      await ctx.serviceClient
        .from("agency_users")
        .update({ is_active: true, role: assignedRole, name })
        .eq("id", existing.id);

      return NextResponse.json({ success: true, reactivated: true });
    }

    // ─── Auth user aanmaken ───
    const tempPassword = `dp-${crypto.randomUUID().slice(0, 16)}`;
    const { error: createError } =
      await ctx.serviceClient.auth.admin.createUser({
        email: normalizedEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { display_name: name || normalizedEmail },
      });

    if (createError && !createError.message?.includes("already") && !createError.message?.includes("exists")) {
      console.error("[agency/users/post] Auth create error:", createError);
    }

    // ─── Agency user aanmaken ───
    const { error: insertError } = await ctx.serviceClient
      .from("agency_users")
      .insert({
        agency_id: agencyId,
        email: normalizedEmail,
        name: name || null,
        role: assignedRole,
        invited_by: ctx.user.email,
        invited_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("[agency/users/post] Insert error:", insertError);
      return NextResponse.json(
        { error: "Kon teamlid niet toevoegen" },
        { status: 500 }
      );
    }

    // ─── Uitnodigingsmail (non-blocking) ───
    try {
      const { sendAgencyTeamInviteEmail } = await import("@/lib/email/agency");
      const { data: agency } = await ctx.serviceClient
        .from("agencies")
        .select("name, slug")
        .eq("id", agencyId)
        .single();

      await sendAgencyTeamInviteEmail(
        { email: normalizedEmail, name: name || null },
        {
          agencyName: agency?.name || "de agency",
          agencySlug: agency?.slug || "",
          inviterName: ctx.user.email,
          role: assignedRole,
        }
      );
    } catch (emailErr) {
      console.warn("[agency/users/post] Uitnodigingsmail mislukt (niet-kritiek):", emailErr);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[agency/users/post] Onverwachte fout:", error);
    return NextResponse.json({ error: "Interne fout" }, { status: 500 });
  }
}
