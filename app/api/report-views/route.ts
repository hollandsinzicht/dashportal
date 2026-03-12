import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { reportId, tenantId } = await req.json();

    if (!reportId || !tenantId) {
      return NextResponse.json(
        { error: "reportId en tenantId zijn verplicht" },
        { status: 400 }
      );
    }

    // ─── Auth check ───
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
    }

    const serviceClient = await createServiceClient();

    // Haal tenant_user op (voor user_id)
    const { data: tenantUser } = await serviceClient
      .from("tenant_users")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("email", user.email!)
      .eq("is_active", true)
      .maybeSingle();

    if (!tenantUser) {
      return NextResponse.json(
        { error: "Gebruiker niet gevonden" },
        { status: 404 }
      );
    }

    // ─── View registreren ───
    await serviceClient.from("report_views").insert({
      tenant_id: tenantId,
      report_id: reportId,
      user_id: tenantUser.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[report-views] Fout:", error);
    return NextResponse.json(
      { error: "Er ging iets mis" },
      { status: 500 }
    );
  }
}
