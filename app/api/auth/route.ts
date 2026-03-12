import { NextRequest, NextResponse } from "next/server";
import { getAdminContext, isAuthError } from "@/lib/auth/validate";
import { generateTempPassword } from "@/lib/utils/password";

export async function POST(req: NextRequest) {
  try {
    const { tenantId, emails, role } = await req.json();

    if (!tenantId || !emails || !Array.isArray(emails)) {
      return NextResponse.json(
        { error: "tenantId en emails zijn verplicht" },
        { status: 400 }
      );
    }

    // ─── Auth: sessie + admin check ───
    const ctx = await getAdminContext(tenantId);
    if (isAuthError(ctx)) {
      return NextResponse.json({ error: ctx.error }, { status: ctx.status });
    }
    const { serviceClient: supabase } = ctx;

    const results = await Promise.all(
      emails.map(async (email: string) => {
        const normalizedEmail = email.toLowerCase().trim();

        // 1. Tenant user record aanmaken/updaten
        const { error: userError } = await supabase
          .from("tenant_users")
          .upsert(
            {
              tenant_id: tenantId,
              email: normalizedEmail,
              role: role || "viewer",
              invited_at: new Date().toISOString(),
            },
            { onConflict: "tenant_id,email" }
          );

        if (userError) {
          return {
            email: normalizedEmail,
            success: false,
            error: userError.message,
          };
        }

        // 2. Supabase Auth account aanmaken met tijdelijk wachtwoord
        const tempPassword = generateTempPassword();
        let authCreated = false;

        try {
          const { error: createError } =
            await supabase.auth.admin.createUser({
              email: normalizedEmail,
              password: tempPassword,
              email_confirm: true,
              user_metadata: {
                tenant_id: tenantId,
                role: role || "viewer",
              },
            });

          if (createError) {
            if (createError.message?.includes("already")) {
              // Auth user bestaat al — dat is prima
            } else {
              console.warn(
                `[auth] Create waarschuwing voor ${normalizedEmail}:`,
                createError.message
              );
            }
          } else {
            authCreated = true;
          }
        } catch (authErr) {
          console.warn(
            `[auth] Auth create mislukt voor ${normalizedEmail}:`,
            authErr
          );
        }

        return {
          email: normalizedEmail,
          success: true,
          tempPassword: authCreated ? tempPassword : undefined,
          authCreated,
        };
      })
    );

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json(
      { error: "Kon uitnodigingen niet versturen" },
      { status: 500 }
    );
  }
}
