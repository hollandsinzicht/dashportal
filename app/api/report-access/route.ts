import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity/log";

export async function POST(req: NextRequest) {
  try {
    const { reportId, userId, tenantId, action } = await req.json();

    if (!reportId || !userId || !tenantId || !action) {
      return NextResponse.json(
        { error: "reportId, userId, tenantId en action zijn verplicht" },
        { status: 400 }
      );
    }

    if (!["grant", "revoke"].includes(action)) {
      return NextResponse.json(
        { error: "action moet 'grant' of 'revoke' zijn" },
        { status: 400 }
      );
    }

    // ─── Auth check: alleen ingelogde admins ───
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
    }

    const serviceClient = await createServiceClient();

    const { data: currentUser } = await serviceClient
      .from("tenant_users")
      .select("id, role")
      .eq("tenant_id", tenantId)
      .eq("email", user.email!)
      .eq("is_active", true)
      .single();

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "Alleen admins kunnen toegang beheren" },
        { status: 403 }
      );
    }

    // ─── Tenant boundary check ───
    const { data: report } = await serviceClient
      .from("reports")
      .select("id")
      .eq("id", reportId)
      .eq("tenant_id", tenantId)
      .single();

    if (!report) {
      return NextResponse.json(
        { error: "Rapport niet gevonden" },
        { status: 404 }
      );
    }

    const { data: targetUser } = await serviceClient
      .from("tenant_users")
      .select("id")
      .eq("id", userId)
      .eq("tenant_id", tenantId)
      .single();

    if (!targetUser) {
      return NextResponse.json(
        { error: "Gebruiker niet gevonden" },
        { status: 404 }
      );
    }

    // ─── Grant of revoke ───
    if (action === "grant") {
      const { error: upsertError } = await serviceClient
        .from("report_access")
        .upsert(
          {
            report_id: reportId,
            user_id: userId,
            granted_by: currentUser.id,
            granted_at: new Date().toISOString(),
          },
          { onConflict: "report_id,user_id" }
        );

      if (upsertError) {
        console.error("[report-access] Grant fout:", upsertError);
        return NextResponse.json(
          { error: "Kon toegang niet verlenen" },
          { status: 500 }
        );
      }
    } else {
      const { error: deleteError } = await serviceClient
        .from("report_access")
        .delete()
        .eq("report_id", reportId)
        .eq("user_id", userId);

      if (deleteError) {
        console.error("[report-access] Revoke fout:", deleteError);
        return NextResponse.json(
          { error: "Kon toegang niet intrekken" },
          { status: 500 }
        );
      }
    }

    // Activity logging (niet blokkeren)
    await logActivity({
      serviceClient,
      tenantId,
      actorId: currentUser.id,
      action: action === "grant" ? "access.granted" : "access.revoked",
      targetType: "access",
      targetId: reportId,
      metadata: { userId, reportId },
    });

    return NextResponse.json({ success: true, action });
  } catch (error) {
    console.error("[report-access] Onverwachte fout:", error);
    return NextResponse.json(
      { error: "Er ging iets mis" },
      { status: 500 }
    );
  }
}
