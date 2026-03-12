import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity/log";

// ─── Admin auth helper ───
async function getAdminContext(tenantId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Niet ingelogd", status: 401 };

  const serviceClient = await createServiceClient();
  const { data: currentUser } = await serviceClient
    .from("tenant_users")
    .select("id, role, tenant_id")
    .eq("tenant_id", tenantId)
    .eq("email", user.email!)
    .eq("is_active", true)
    .single();

  if (!currentUser || currentUser.role !== "admin") {
    return { error: "Alleen admins kunnen gebruikers beheren", status: 403 };
  }

  return { currentUser, serviceClient };
}

// ─── PATCH: Rol of status wijzigen ───
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const { role, is_active, tenantId } = await req.json();

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is verplicht" },
        { status: 400 }
      );
    }

    const ctx = await getAdminContext(tenantId);
    if ("error" in ctx) {
      return NextResponse.json(
        { error: ctx.error },
        { status: ctx.status }
      );
    }
    const { currentUser, serviceClient } = ctx;

    // Controleer dat de doelgebruiker bij dezelfde tenant hoort
    const { data: targetUser } = await serviceClient
      .from("tenant_users")
      .select("id, role, tenant_id, email, is_active")
      .eq("id", userId)
      .eq("tenant_id", tenantId)
      .single();

    if (!targetUser) {
      return NextResponse.json(
        { error: "Gebruiker niet gevonden" },
        { status: 404 }
      );
    }

    const updates: Record<string, unknown> = {};

    // ─── Rol wijzigen ───
    if (role !== undefined) {
      const validRoles = ["viewer", "admin"];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: "Ongeldige rol" },
          { status: 400 }
        );
      }

      // Voorkom self-demotion
      if (targetUser.id === currentUser.id && role !== "admin") {
        return NextResponse.json(
          { error: "Je kunt je eigen admin-rol niet verwijderen" },
          { status: 400 }
        );
      }

      // Als we een admin naar viewer zetten, check of er nog minstens 1 admin overblijft
      if (targetUser.role === "admin" && role === "viewer") {
        const { count } = await serviceClient
          .from("tenant_users")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .eq("role", "admin")
          .eq("is_active", true);

        if ((count ?? 0) <= 1) {
          return NextResponse.json(
            {
              error:
                "Er moet minimaal één admin overblijven. Maak eerst een andere gebruiker admin.",
            },
            { status: 400 }
          );
        }
      }

      updates.role = role;
    }

    // ─── Status wijzigen ───
    if (is_active !== undefined) {
      // Voorkom zelf-deactivering
      if (targetUser.id === currentUser.id && !is_active) {
        return NextResponse.json(
          { error: "Je kunt jezelf niet deactiveren" },
          { status: 400 }
        );
      }

      // Als we een admin deactiveren, check of er nog minstens 1 admin overblijft
      if (targetUser.role === "admin" && !is_active) {
        const { count } = await serviceClient
          .from("tenant_users")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .eq("role", "admin")
          .eq("is_active", true);

        if ((count ?? 0) <= 1) {
          return NextResponse.json(
            {
              error:
                "Er moet minimaal één actieve admin overblijven.",
            },
            { status: 400 }
          );
        }
      }

      updates.is_active = is_active;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Geen wijzigingen opgegeven" },
        { status: 400 }
      );
    }

    const { error: updateError } = await serviceClient
      .from("tenant_users")
      .update(updates)
      .eq("id", userId);

    if (updateError) {
      console.error("[users/patch] Update fout:", updateError);
      return NextResponse.json(
        { error: "Kon gebruiker niet bijwerken" },
        { status: 500 }
      );
    }

    // Activity logging
    const action = is_active === false
      ? "user.deactivated"
      : is_active === true
      ? "user.activated"
      : "user.updated";

    await logActivity({
      serviceClient,
      tenantId,
      actorId: currentUser.id,
      action,
      targetType: "user",
      targetId: userId,
      metadata: { email: targetUser.email, ...updates },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[users/patch] Onverwachte fout:", error);
    return NextResponse.json(
      { error: "Er ging iets mis" },
      { status: 500 }
    );
  }
}

// ─── DELETE: Gebruiker verwijderen ───
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const { tenantId } = await req.json();

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is verplicht" },
        { status: 400 }
      );
    }

    const ctx = await getAdminContext(tenantId);
    if ("error" in ctx) {
      return NextResponse.json(
        { error: ctx.error },
        { status: ctx.status }
      );
    }
    const { currentUser, serviceClient } = ctx;

    // Controleer dat de doelgebruiker bij dezelfde tenant hoort
    const { data: targetUser } = await serviceClient
      .from("tenant_users")
      .select("id, role, tenant_id")
      .eq("id", userId)
      .eq("tenant_id", tenantId)
      .single();

    if (!targetUser) {
      return NextResponse.json(
        { error: "Gebruiker niet gevonden" },
        { status: 404 }
      );
    }

    // Voorkom zelf-verwijdering
    if (targetUser.id === currentUser.id) {
      return NextResponse.json(
        { error: "Je kunt jezelf niet verwijderen" },
        { status: 400 }
      );
    }

    // Als het een admin is, check of er nog minstens 1 admin overblijft
    if (targetUser.role === "admin") {
      const { count } = await serviceClient
        .from("tenant_users")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("role", "admin")
        .eq("is_active", true);

      if ((count ?? 0) <= 1) {
        return NextResponse.json(
          { error: "Er moet minimaal één admin overblijven" },
          { status: 400 }
        );
      }
    }

    // Verwijder (cascade handelt report_access af)
    const { error: deleteError } = await serviceClient
      .from("tenant_users")
      .delete()
      .eq("id", userId);

    if (deleteError) {
      console.error("[users/delete] Delete fout:", deleteError);
      return NextResponse.json(
        { error: "Kon gebruiker niet verwijderen" },
        { status: 500 }
      );
    }

    await logActivity({
      serviceClient,
      tenantId,
      actorId: currentUser.id,
      action: "user.deleted",
      targetType: "user",
      targetId: userId,
      metadata: { role: targetUser.role },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[users/delete] Onverwachte fout:", error);
    return NextResponse.json(
      { error: "Er ging iets mis" },
      { status: 500 }
    );
  }
}
