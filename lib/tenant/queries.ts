import { createServiceClient } from "@/lib/supabase/server";

export async function getTenantBySlug(slug: string) {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error) return null;
  return data;
}

export async function getTenantByCustomDomain(domain: string) {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("custom_domain", domain)
    .eq("is_active", true)
    .single();

  if (error) return null;
  return data;
}

export async function getTenantById(id: string) {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function getAllTenants() {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return [];
  return data;
}

export async function getTenantUserByEmail(tenantId: string, email: string) {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("tenant_users")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("email", email)
    .eq("is_active", true)
    .single();

  if (error) return null;
  return data;
}

/** @deprecated Gebruik getUserWorkspacesWithReports() */
export async function getUserReports(tenantId: string, userId: string) {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("reports")
    .select(`
      *,
      report_access!inner(user_id)
    `)
    .eq("tenant_id", tenantId)
    .eq("is_published", true)
    .eq("report_access.user_id", userId)
    .order("sort_order", { ascending: true });

  if (error) return [];
  return data;
}

/**
 * Haal workspaces op met hun rapporten, gefilterd op workspace_access
 * en rapport-level toegang (access_type).
 * Geeft een geneste structuur terug: workspace → reports[]
 *
 * Rapportkoppeling is robuust: matcht via pbi_workspace_id text-match
 * zodat het werkt ongeacht of de workspace_id FK is ingevuld.
 */
export async function getUserWorkspacesWithReports(
  tenantId: string,
  userId: string
) {
  try {
    const supabase = await createServiceClient();

    // 0. Haal de rol van de gebruiker op
    const { data: tenantUser, error: userError } = await supabase
      .from("tenant_users")
      .select("role")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("[getUserWorkspacesWithReports] User query fout:", userError.message);
    }

    const isAdmin = tenantUser?.role === "admin";
    console.log("[getUserWorkspacesWithReports] tenantId:", tenantId, "userId:", userId, "isAdmin:", isAdmin);

    // 1. Bepaal welke workspaces de gebruiker mag zien
    let workspaceFilter: string[] | null = null;

    if (!isAdmin) {
      const { data: accessRecords, error: accessError } = await supabase
        .from("workspace_access")
        .select("workspace_id")
        .eq("user_id", userId);

      if (accessError) {
        console.error("[getUserWorkspacesWithReports] Access query fout:", accessError.message);
      }

      if (!accessRecords || accessRecords.length === 0) {
        console.log("[getUserWorkspacesWithReports] Geen workspace_access records voor user");
        return [];
      }
      workspaceFilter = accessRecords.map((r) => r.workspace_id);
      console.log("[getUserWorkspacesWithReports] workspaceFilter:", workspaceFilter);
    }

    // 2. Haal workspaces op
    let wsQuery = supabase
      .from("workspaces")
      .select("id, name, thumbnail_url, sort_order, pbi_workspace_id")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (workspaceFilter) {
      wsQuery = wsQuery.in("id", workspaceFilter);
    }

    const { data: workspaces, error: wsError } = await wsQuery;

    if (wsError) {
      console.error("[getUserWorkspacesWithReports] Workspaces query fout:", wsError.message);
      return [];
    }

    console.log("[getUserWorkspacesWithReports] Workspaces gevonden:", workspaces?.length || 0,
      workspaces?.map((ws) => ({ id: ws.id, name: ws.name, pbi_ws_id: ws.pbi_workspace_id }))
    );

    if (!workspaces || workspaces.length === 0) {
      console.log("[getUserWorkspacesWithReports] Geen workspaces gevonden — return []");
      return [];
    }

    // 3. Haal rapporten op — selecteer ALLEEN kolommen die zeker bestaan in de DB
    //    access_type en category bestaan mogelijk nog niet (schema nog niet gemigreerd)
    const { data: allReports, error: reportsError } = await supabase
      .from("reports")
      .select("id, title, description, thumbnail_url, sort_order, is_published, pbi_workspace_id")
      .eq("tenant_id", tenantId);

    if (reportsError) {
      console.error("[getUserWorkspacesWithReports] Reports query fout:", reportsError.message);
      // Ga door met lege reports — workspaces zelf tonen we nog steeds
    }

    const reports = allReports || [];
    console.log("[getUserWorkspacesWithReports] Reports gevonden:", reports.length,
      "published:", reports.filter((r) => r.is_published).length,
      "pbi_workspace_ids in reports:", [...new Set(reports.map((r) => r.pbi_workspace_id))]
    );

    // 4. Koppel rapporten aan workspaces via pbi_workspace_id
    const pbiWsIdToLocalId = new Map(
      workspaces.map((ws) => [ws.pbi_workspace_id, ws.id])
    );

    type ReportItem = (typeof reports)[number];
    const reportsByWorkspace = new Map<string, ReportItem[]>();

    let matchedCount = 0;
    let unmatchedCount = 0;

    for (const report of reports) {
      const wsId = pbiWsIdToLocalId.get(report.pbi_workspace_id);
      if (!wsId) {
        unmatchedCount++;
        continue;
      }

      matchedCount++;
      const existing = reportsByWorkspace.get(wsId) || [];
      existing.push(report);
      reportsByWorkspace.set(wsId, existing);
    }

    console.log("[getUserWorkspacesWithReports] Reports matched:", matchedCount, "unmatched:", unmatchedCount);

    // 5. Als niet-admin: haal report_access records op voor filtering
    let userReportAccessIds: Set<string> = new Set();
    if (!isAdmin) {
      const { data: reportAccessData } = await supabase
        .from("report_access")
        .select("report_id")
        .eq("user_id", userId);

      if (reportAccessData) {
        userReportAccessIds = new Set(
          reportAccessData.map((r) => r.report_id)
        );
      }
    }

    // 6. Bouw resultaat: workspace + gefilterde rapporten
    const result = workspaces.map((ws) => ({
      id: ws.id,
      name: ws.name,
      thumbnail_url: ws.thumbnail_url,
      sort_order: ws.sort_order,
      reports: (reportsByWorkspace.get(ws.id) || [])
        .filter((r) => {
          if (!r.is_published) return false;
          // access_type kolom bestaat mogelijk nog niet — treat als "all_users"
          const accessType = (r as Record<string, unknown>).access_type as string | undefined || "all_users";
          if (isAdmin) return true;
          if (accessType === "admin_only") return false;
          if (accessType === "specific_users") {
            return userReportAccessIds.has(r.id);
          }
          return true;
        })
        .sort((a, b) => a.sort_order - b.sort_order),
    }));

    console.log("[getUserWorkspacesWithReports] Resultaat:",
      result.map((ws) => ({ name: ws.name, reportCount: ws.reports.length }))
    );

    return result;
  } catch (err) {
    console.error("[getUserWorkspacesWithReports] Onverwachte fout:", err);
    return [];
  }
}

/**
 * Haal één workspace op met geneste gepubliceerde rapporten,
 * gefilterd op access_type per rapport.
 * Gebruikt voor de workspace detail pagina in het portaal.
 *
 * Matcht rapporten via pbi_workspace_id (altijd betrouwbaar).
 */
export async function getWorkspaceWithReports(
  workspaceId: string,
  tenantId: string,
  userId?: string
) {
  try {
    const supabase = await createServiceClient();

    // 1. Haal workspace op
    const { data: workspace, error } = await supabase
      .from("workspaces")
      .select("id, name, description, thumbnail_url, sort_order, pbi_workspace_id")
      .eq("id", workspaceId)
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .single();

    if (error || !workspace) return null;

    // 2. Haal rapporten op via pbi_workspace_id (altijd aanwezig)
    //    access_type en category bestaan mogelijk nog niet in de DB
    const { data: reports } = await supabase
      .from("reports")
      .select("id, title, description, thumbnail_url, sort_order, is_published, pbi_workspace_id")
      .eq("tenant_id", tenantId)
      .eq("pbi_workspace_id", workspace.pbi_workspace_id);

    const matchedReports = reports || [];

    // 3. Bepaal of gebruiker admin is
    let isAdmin = false;
    let userReportAccessIds: Set<string> = new Set();

    if (userId) {
      const { data: tenantUser } = await supabase
        .from("tenant_users")
        .select("role")
        .eq("id", userId)
        .single();

      isAdmin = tenantUser?.role === "admin";

      if (!isAdmin) {
        const { data: reportAccessData } = await supabase
          .from("report_access")
          .select("report_id")
          .eq("user_id", userId);

        if (reportAccessData) {
          userReportAccessIds = new Set(
            reportAccessData.map((r) => r.report_id)
          );
        }
      }
    }

    return {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      thumbnail_url: workspace.thumbnail_url,
      sort_order: workspace.sort_order,
      reports: matchedReports
        .filter((r) => {
          if (!r.is_published) return false;
          if (!userId) return true;
          // access_type kolom bestaat mogelijk nog niet — treat als "all_users"
          const accessType = (r as Record<string, unknown>).access_type as string | undefined || "all_users";
          if (isAdmin) return true;
          if (accessType === "admin_only") return false;
          if (accessType === "specific_users")
            return userReportAccessIds.has(r.id);
          return true;
        })
        .sort((a, b) => a.sort_order - b.sort_order),
    };
  } catch (err) {
    console.error("[getWorkspaceWithReports] Onverwachte fout:", err);
    return null;
  }
}

/**
 * Check of een gebruiker toegang heeft tot een workspace.
 * Admins hebben altijd toegang tot alle workspaces.
 */
export async function checkWorkspaceAccess(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  const supabase = await createServiceClient();

  // Check of gebruiker admin is
  const { data: tenantUser } = await supabase
    .from("tenant_users")
    .select("role")
    .eq("id", userId)
    .single();

  if (tenantUser?.role === "admin") return true;

  // Viewers: check workspace_access record
  const { count, error } = await supabase
    .from("workspace_access")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId);

  if (error) return false;
  return (count ?? 0) > 0;
}

/**
 * Haal alle workspaces op voor een tenant (admin).
 */
export async function getWorkspacesByTenant(tenantId: string) {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("workspaces")
    .select("id, name, pbi_workspace_id, thumbnail_url, sort_order, is_active")
    .eq("tenant_id", tenantId)
    .order("sort_order", { ascending: true });

  if (error) return [];
  return data;
}

/**
 * Debug helper: haal ruwe workspace + report data op om matching issues te diagnosticeren.
 * Alleen gebruiken via ?debug=true op de portal pagina.
 */
export async function getDebugWorkspaceReportData(tenantId: string) {
  const supabase = await createServiceClient();

  const { data: workspaces, error: wsErr } = await supabase
    .from("workspaces")
    .select("id, name, pbi_workspace_id, is_active")
    .eq("tenant_id", tenantId);

  const { data: reports, error: repErr } = await supabase
    .from("reports")
    .select("id, title, pbi_workspace_id, is_published")
    .eq("tenant_id", tenantId);

  return {
    workspaces: workspaces || [],
    workspacesError: wsErr?.message || null,
    reports: reports || [],
    reportsError: repErr?.message || null,
  };
}
