import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/utils/encryption";
import { canUseFeature } from "@/lib/features/gates";
import { getTenantUsage } from "@/lib/tenant/usage";
import {
  getGraphToken,
  listAzureADUsers,
  listAzureADGroups,
  listAzureADGroupMembers,
  type AzureADUser,
} from "@/lib/microsoft/graph";

// ─── Helpers ───

async function getAuthContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: tenantUser } = await supabase
    .from("tenant_users")
    .select("id, tenant_id, role")
    .eq("email", user.email!)
    .limit(1)
    .maybeSingle();

  if (!tenantUser || tenantUser.role !== "admin") return null;

  return { user, tenantUser };
}

async function getTenantGraphConfig(tenantId: string) {
  const serviceClient = await createServiceClient();

  const { data: tenant } = await serviceClient
    .from("tenants")
    .select(
      "pbi_tenant_id, pbi_client_id, pbi_client_secret, subscription_plan, subscription_status, trial_ends_at"
    )
    .eq("id", tenantId)
    .single();

  if (!tenant?.pbi_tenant_id || !tenant?.pbi_client_id || !tenant?.pbi_client_secret) {
    return null;
  }

  // Feature gate check
  const ssoEnabled = canUseFeature(
    {
      subscription_plan: tenant.subscription_plan || "starter",
      subscription_status: tenant.subscription_status,
      trial_ends_at: tenant.trial_ends_at,
    },
    "microsoft_sso"
  );

  if (!ssoEnabled) return null;

  return {
    tenantId: tenant.pbi_tenant_id,
    clientId: tenant.pbi_client_id,
    clientSecret: decrypt(tenant.pbi_client_secret),
    plan: tenant.subscription_plan || "starter",
  };
}

// ─── GET: Lijst Azure AD gebruikers / groepen ───

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
    }

    const graphConfig = await getTenantGraphConfig(auth.tenantUser.tenant_id);
    if (!graphConfig) {
      return NextResponse.json(
        {
          error:
            "Microsoft SSO niet beschikbaar. Configureer eerst je Power BI credentials en upgrade naar Business+.",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") || "users"; // "users" | "groups" | "group-members"
    const search = searchParams.get("search") || undefined;
    const groupId = searchParams.get("groupId") || undefined;
    const skipToken = searchParams.get("skipToken") || undefined;

    const token = await getGraphToken(graphConfig);

    if (mode === "groups") {
      const { groups, nextLink } = await listAzureADGroups(token, {
        search,
        top: 50,
        skipToken,
      });
      return NextResponse.json({ groups, nextLink });
    }

    if (mode === "group-members" && groupId) {
      const { users, nextLink } = await listAzureADGroupMembers(
        token,
        groupId,
        { top: 100, skipToken }
      );

      // Cross-ref met bestaande tenant_users
      const enriched = await enrichWithTenantStatus(
        users,
        auth.tenantUser.tenant_id
      );

      return NextResponse.json({ users: enriched, nextLink });
    }

    // Default: lijst users
    const { users, nextLink } = await listAzureADUsers(token, {
      search,
      top: 50,
      skipToken,
    });

    // Cross-ref met bestaande tenant_users
    const enriched = await enrichWithTenantStatus(
      users,
      auth.tenantUser.tenant_id
    );

    return NextResponse.json({ users: enriched, nextLink });
  } catch (error) {
    console.error("[azure-import] GET error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Fout bij ophalen Azure AD gegevens",
      },
      { status: 500 }
    );
  }
}

// ─── POST: Bulk import gebruikers ───

interface ImportUserPayload {
  azureOid: string;
  email: string;
  name: string;
  department?: string;
  role: "viewer" | "admin";
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
    }

    const tenantId = auth.tenantUser.tenant_id;

    const graphConfig = await getTenantGraphConfig(tenantId);
    if (!graphConfig) {
      return NextResponse.json(
        { error: "Microsoft SSO niet beschikbaar." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const users: ImportUserPayload[] = body.users;

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json(
        { error: "Geen gebruikers opgegeven." },
        { status: 400 }
      );
    }

    // Limiet check
    const serviceClient = await createServiceClient();
    const usage = await getTenantUsage(serviceClient, tenantId, graphConfig.plan);

    if (!usage.isUnlimited) {
      // Tel hoeveel echt nieuwe users er bij komen
      const emails = users.map((u) => u.email.toLowerCase().trim());
      const { data: existingUsers } = await serviceClient
        .from("tenant_users")
        .select("email")
        .eq("tenant_id", tenantId)
        .in("email", emails);

      const existingEmails = new Set(
        (existingUsers || []).map((u) => u.email.toLowerCase())
      );
      const newCount = emails.filter((e) => !existingEmails.has(e)).length;

      if (usage.remaining !== -1 && newCount > usage.remaining) {
        return NextResponse.json(
          {
            error: `Gebruikerslimiet bereikt. Je hebt nog ruimte voor ${usage.remaining} gebruiker(s), maar je probeert ${newCount} nieuwe te importeren.`,
          },
          { status: 403 }
        );
      }
    }

    // Verwerk elke gebruiker
    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const u of users) {
      const email = u.email.toLowerCase().trim();

      if (!email) {
        results.skipped++;
        continue;
      }

      try {
        // Check of user al bestaat
        const { data: existing } = await serviceClient
          .from("tenant_users")
          .select("id, azure_oid")
          .eq("tenant_id", tenantId)
          .eq("email", email)
          .maybeSingle();

        if (existing) {
          // Update bestaande user met Azure OID
          await serviceClient
            .from("tenant_users")
            .update({
              azure_oid: u.azureOid,
              auth_provider: "microsoft",
              azure_department: u.department || null,
              azure_synced_at: new Date().toISOString(),
            })
            .eq("id", existing.id);

          results.updated++;
        } else {
          // Nieuwe user aanmaken
          const { error: insertError } = await serviceClient
            .from("tenant_users")
            .insert({
              tenant_id: tenantId,
              name: u.name,
              email,
              role: u.role || "viewer",
              azure_oid: u.azureOid,
              auth_provider: "microsoft",
              azure_department: u.department || null,
              azure_synced_at: new Date().toISOString(),
              is_active: true,
            });

          if (insertError) {
            results.errors.push(`${email}: ${insertError.message}`);
          } else {
            results.created++;
          }
        }
      } catch (err) {
        results.errors.push(
          `${email}: ${err instanceof Error ? err.message : "Onbekende fout"}`
        );
      }
    }

    // Activity log (fire-and-forget, fouten worden genegeerd)
    try {
      await serviceClient.from("activity_log").insert({
        tenant_id: tenantId,
        actor_id: auth.tenantUser.id,
        action: "azure_import",
        details: {
          total: users.length,
          created: results.created,
          updated: results.updated,
          skipped: results.skipped,
          errorCount: results.errors.length,
        },
      });
    } catch {
      // Silently ignore — activity logging is niet-kritisch
    }

    return NextResponse.json({
      success: true,
      ...results,
      message: `${results.created} aangemaakt, ${results.updated} bijgewerkt${results.skipped ? `, ${results.skipped} overgeslagen` : ""}${results.errors.length ? `, ${results.errors.length} fout(en)` : ""}.`,
    });
  } catch (error) {
    console.error("[azure-import] POST error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Fout bij importeren gebruikers",
      },
      { status: 500 }
    );
  }
}

// ─── Enrich users met tenant_users status ───

async function enrichWithTenantStatus(
  azureUsers: AzureADUser[],
  tenantId: string
) {
  const serviceClient = await createServiceClient();

  // Haal bestaande tenant_users op (email + azure_oid)
  const emails = azureUsers
    .map((u) => (u.mail || u.userPrincipalName).toLowerCase())
    .filter(Boolean);

  const { data: existingUsers } = await serviceClient
    .from("tenant_users")
    .select("email, azure_oid, role, is_active")
    .eq("tenant_id", tenantId)
    .in("email", emails);

  const existingMap = new Map(
    (existingUsers || []).map((u) => [u.email.toLowerCase(), u])
  );

  return azureUsers.map((u) => {
    const email = (u.mail || u.userPrincipalName).toLowerCase();
    const existing = existingMap.get(email);

    return {
      ...u,
      email,
      status: existing ? ("existing" as const) : ("new" as const),
      tenantRole: existing?.role || null,
      isLinked: !!existing?.azure_oid,
    };
  });
}
