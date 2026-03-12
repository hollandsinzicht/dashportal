import { NextRequest, NextResponse } from "next/server";
import { getAdminContext, isAuthError } from "@/lib/auth/validate";

/**
 * GET /api/activity-log?tenantId=...&page=1&limit=50&action=...&from=...&to=...
 *
 * Haal activiteitslogboek op voor een tenant.
 * Alleen admins hebben toegang.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is verplicht" },
        { status: 400 }
      );
    }

    // ─── Auth: sessie + admin check ───
    const ctx = await getAdminContext(tenantId);
    if (isAuthError(ctx)) {
      return NextResponse.json({ error: ctx.error }, { status: ctx.status });
    }
    const { serviceClient } = ctx;

    // ─── Query parameters ───
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const action = searchParams.get("action");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const offset = (page - 1) * limit;

    // ─── Query bouwen ───
    let query = serviceClient
      .from("activity_log")
      .select(
        `
        id, action, target_type, target_id, metadata, created_at,
        actor:tenant_users!activity_log_actor_id_fkey(id, name, email)
      `,
        { count: "exact" }
      )
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Optionele filters
    if (action) {
      query = query.eq("action", action);
    }
    if (from) {
      query = query.gte("created_at", from);
    }
    if (to) {
      query = query.lte("created_at", to);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("[activity-log] Query fout:", error);
      return NextResponse.json(
        { error: "Kon activiteitslog niet ophalen" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      items: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error("[activity-log] Onverwachte fout:", error);
    return NextResponse.json(
      { error: "Interne fout" },
      { status: 500 }
    );
  }
}
