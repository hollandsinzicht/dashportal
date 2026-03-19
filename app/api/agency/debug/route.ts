import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/agency/debug
 * Debug endpoint om auth + agency toegang te testen.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      return NextResponse.json({ step: "auth", error: authError.message });
    }
    if (!user) {
      return NextResponse.json({ step: "auth", error: "Geen user gevonden", cookies: req.cookies.getAll().map(c => c.name) });
    }

    const serviceClient = await createServiceClient();
    const { data: agencyUser, error: auError } = await serviceClient
      .from("agency_users")
      .select("id, role, agency_id, email")
      .eq("email", user.email!)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      step: "ok",
      user: { email: user.email, id: user.id },
      agencyUser: agencyUser || null,
      agencyUserError: auError?.message || null,
    });
  } catch (err) {
    return NextResponse.json({ step: "crash", error: String(err) });
  }
}
