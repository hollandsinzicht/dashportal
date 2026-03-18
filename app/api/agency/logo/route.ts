import { NextRequest, NextResponse } from "next/server";
import { getAgencyOwnerContext } from "@/lib/auth/agency";
import { isAuthError } from "@/lib/auth/validate";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * POST /api/agency/logo
 *
 * Upload een agency logo via de server (omzeilt Storage RLS).
 * Verwacht FormData met: agencyId (string) + file (File)
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const agencyId = formData.get("agencyId") as string;
    const file = formData.get("file") as File;

    if (!agencyId || !file) {
      return NextResponse.json({ error: "agencyId en file zijn verplicht" }, { status: 400 });
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "Logo mag maximaal 2MB zijn" }, { status: 400 });
    }

    // Auth check
    const ctx = await getAgencyOwnerContext(agencyId);
    if (isAuthError(ctx)) {
      return NextResponse.json({ error: ctx.error }, { status: ctx.status });
    }

    const serviceClient = await createServiceClient();

    // Upload met service role (geen RLS beperkingen)
    const ext = file.name.split(".").pop() || "png";
    const path = `agency-logos/${agencyId}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await serviceClient.storage
      .from("logos")
      .upload(path, buffer, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("[agency/logo] Upload fout:", uploadError);
      return NextResponse.json({ error: "Upload mislukt: " + uploadError.message }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = serviceClient.storage
      .from("logos")
      .getPublicUrl(path);

    // Update agency record
    await serviceClient
      .from("agencies")
      .update({ logo_url: urlData.publicUrl })
      .eq("id", agencyId);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (error) {
    console.error("[agency/logo] Fout:", error);
    return NextResponse.json({ error: "Interne fout" }, { status: 500 });
  }
}
