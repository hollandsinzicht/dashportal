import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/agency/me
 * Zoek de agency waar de ingelogde gebruiker bij hoort.
 * Retourneert de agency slug zodat we kunnen redirecten.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json(
        { error: "Niet ingelogd." },
        { status: 401 }
      );
    }

    const serviceClient = await createServiceClient();

    // Zoek actieve agency_user records voor dit e-mailadres
    const { data: agencyUsers, error } = await serviceClient
      .from("agency_users")
      .select("agency_id, role")
      .eq("email", user.email)
      .eq("is_active", true);

    if (error || !agencyUsers || agencyUsers.length === 0) {
      return NextResponse.json(
        { error: "Geen agency gevonden voor dit account." },
        { status: 404 }
      );
    }

    // Haal de eerste actieve agency op
    const agencyUser = agencyUsers[0];
    const { data: agency } = await serviceClient
      .from("agencies")
      .select("slug, name")
      .eq("id", agencyUser.agency_id)
      .eq("is_active", true)
      .single();

    if (!agency) {
      return NextResponse.json(
        { error: "Agency is niet meer actief." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      slug: agency.slug,
      name: agency.name,
      role: agencyUser.role,
    });
  } catch {
    return NextResponse.json(
      { error: "Er ging iets mis." },
      { status: 500 }
    );
  }
}
