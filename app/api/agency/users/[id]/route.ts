import { NextRequest, NextResponse } from "next/server";
import { getAgencyOwnerContext } from "@/lib/auth/agency";
import { isAuthError } from "@/lib/auth/validate";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * PATCH /api/agency/users/[id]
 *
 * Wijzig de rol van een teamlid.
 * Body: { agencyId, role }
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { agencyId, role } = await req.json();

    if (!agencyId) {
      return NextResponse.json({ error: "agencyId is verplicht" }, { status: 400 });
    }

    const validRoles = ["admin", "viewer"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Ongeldige rol. Kies uit: ${validRoles.join(", ")}` },
        { status: 400 }
      );
    }

    const ctx = await getAgencyOwnerContext(agencyId);
    if (isAuthError(ctx)) {
      return NextResponse.json({ error: ctx.error }, { status: ctx.status });
    }

    // Verifieer dat het teamlid bij deze agency hoort
    const { data: agencyUser } = await ctx.serviceClient
      .from("agency_users")
      .select("id, role, email")
      .eq("id", id)
      .eq("agency_id", agencyId)
      .single();

    if (!agencyUser) {
      return NextResponse.json({ error: "Teamlid niet gevonden" }, { status: 404 });
    }

    // Owner rol kan niet gewijzigd worden
    if (agencyUser.role === "owner") {
      return NextResponse.json(
        { error: "De eigenaar rol kan niet gewijzigd worden" },
        { status: 400 }
      );
    }

    const { error } = await ctx.serviceClient
      .from("agency_users")
      .update({ role })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "Kon rol niet wijzigen" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[agency/users/id] PATCH fout:", error);
    return NextResponse.json({ error: "Interne fout" }, { status: 500 });
  }
}

/**
 * DELETE /api/agency/users/[id]
 *
 * Verwijder een teamlid (soft delete: is_active = false).
 * Body: { agencyId }
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { agencyId } = await req.json();

    if (!agencyId) {
      return NextResponse.json({ error: "agencyId is verplicht" }, { status: 400 });
    }

    const ctx = await getAgencyOwnerContext(agencyId);
    if (isAuthError(ctx)) {
      return NextResponse.json({ error: ctx.error }, { status: ctx.status });
    }

    // Verifieer dat het teamlid bij deze agency hoort
    const { data: agencyUser } = await ctx.serviceClient
      .from("agency_users")
      .select("id, role")
      .eq("id", id)
      .eq("agency_id", agencyId)
      .single();

    if (!agencyUser) {
      return NextResponse.json({ error: "Teamlid niet gevonden" }, { status: 404 });
    }

    if (agencyUser.role === "owner") {
      return NextResponse.json(
        { error: "De eigenaar kan niet verwijderd worden" },
        { status: 400 }
      );
    }

    // Soft delete
    const { error } = await ctx.serviceClient
      .from("agency_users")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "Kon teamlid niet verwijderen" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[agency/users/id] DELETE fout:", error);
    return NextResponse.json({ error: "Interne fout" }, { status: 500 });
  }
}
