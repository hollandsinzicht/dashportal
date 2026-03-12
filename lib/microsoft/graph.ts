// ============================================
// Microsoft Graph API — Azure AD gebruikers & groepen
// ============================================

interface GraphTokenConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
}

/**
 * Haal een Microsoft Graph API token op via client credentials grant.
 * Hergebruikt dezelfde Azure AD app als Power BI, maar met Graph scope.
 */
export async function getGraphToken(config: GraphTokenConfig): Promise<string> {
  const url = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`;

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: config.clientId,
    client_secret: config.clientSecret,
    scope: "https://graph.microsoft.com/.default",
  });

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Graph token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

// ─── Types ───

export interface AzureADUser {
  id: string; // Azure Object ID
  displayName: string;
  mail: string | null;
  userPrincipalName: string;
  department: string | null;
  jobTitle: string | null;
  accountEnabled: boolean;
}

export interface AzureADGroup {
  id: string;
  displayName: string;
  description: string | null;
  mailEnabled: boolean;
  securityEnabled: boolean;
}

interface GraphListResponse<T> {
  value: T[];
  "@odata.nextLink"?: string;
  "@odata.count"?: number;
}

// ─── Users ───

interface ListUsersOptions {
  search?: string;
  top?: number;
  skipToken?: string;
}

/**
 * Lijst Azure AD gebruikers op.
 * Vereist User.Read.All application permission.
 */
export async function listAzureADUsers(
  token: string,
  options: ListUsersOptions = {}
): Promise<{ users: AzureADUser[]; nextLink: string | null }> {
  const { search, top = 50, skipToken } = options;

  let url: string;

  if (skipToken) {
    // Gebruik de volledige nextLink URL voor paginatie
    url = skipToken;
  } else {
    const params = new URLSearchParams({
      $top: String(top),
      $select:
        "id,displayName,mail,userPrincipalName,department,jobTitle,accountEnabled",
      $orderby: "displayName",
    });

    if (search) {
      // ConsistencyLevel: eventual is vereist voor $search
      params.set(
        "$filter",
        `startswith(displayName,'${escapeOData(search)}') or startswith(mail,'${escapeOData(search)}') or startswith(userPrincipalName,'${escapeOData(search)}')`
      );
    }

    url = `https://graph.microsoft.com/v1.0/users?${params.toString()}`;
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      ConsistencyLevel: "eventual",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to list Azure AD users: ${error}`);
  }

  const data: GraphListResponse<AzureADUser> = await response.json();

  return {
    users: data.value,
    nextLink: data["@odata.nextLink"] || null,
  };
}

// ─── Groups ───

interface ListGroupsOptions {
  search?: string;
  top?: number;
  skipToken?: string;
}

/**
 * Lijst Azure AD groepen op.
 * Vereist GroupMember.Read.All application permission.
 */
export async function listAzureADGroups(
  token: string,
  options: ListGroupsOptions = {}
): Promise<{ groups: AzureADGroup[]; nextLink: string | null }> {
  const { search, top = 50, skipToken } = options;

  let url: string;

  if (skipToken) {
    url = skipToken;
  } else {
    const params = new URLSearchParams({
      $top: String(top),
      $select: "id,displayName,description,mailEnabled,securityEnabled",
      $orderby: "displayName",
    });

    if (search) {
      params.set(
        "$filter",
        `startswith(displayName,'${escapeOData(search)}')`
      );
    }

    url = `https://graph.microsoft.com/v1.0/groups?${params.toString()}`;
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      ConsistencyLevel: "eventual",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to list Azure AD groups: ${error}`);
  }

  const data: GraphListResponse<AzureADGroup> = await response.json();

  return {
    groups: data.value,
    nextLink: data["@odata.nextLink"] || null,
  };
}

// ─── Group Members ───

/**
 * Lijst leden van een Azure AD groep op.
 * Retourneert alleen gebruikers (geen geneste groepen).
 */
export async function listAzureADGroupMembers(
  token: string,
  groupId: string,
  options: { top?: number; skipToken?: string } = {}
): Promise<{ users: AzureADUser[]; nextLink: string | null }> {
  const { top = 100, skipToken } = options;

  let url: string;

  if (skipToken) {
    url = skipToken;
  } else {
    const params = new URLSearchParams({
      $top: String(top),
      $select:
        "id,displayName,mail,userPrincipalName,department,jobTitle,accountEnabled",
    });

    url = `https://graph.microsoft.com/v1.0/groups/${groupId}/members/microsoft.graph.user?${params.toString()}`;
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to list group members: ${error}`);
  }

  const data: GraphListResponse<AzureADUser> = await response.json();

  return {
    users: data.value,
    nextLink: data["@odata.nextLink"] || null,
  };
}

// ─── Helpers ───

/**
 * Escape OData filter waarden om injection te voorkomen.
 */
function escapeOData(value: string): string {
  return value.replace(/'/g, "''").replace(/[#%&*+]/g, "");
}

/**
 * Test of de Graph API verbinding werkt.
 * Haalt de eerste 5 gebruikers op als test.
 */
export async function testGraphConnection(config: GraphTokenConfig) {
  try {
    const token = await getGraphToken(config);
    const { users } = await listAzureADUsers(token, { top: 5 });
    return {
      success: true,
      userCount: users.length,
      message: `Verbinding succesvol. ${users.length} gebruiker(s) gevonden.`,
    };
  } catch (error) {
    return {
      success: false,
      userCount: 0,
      message:
        error instanceof Error ? error.message : "Graph API verbinding mislukt",
    };
  }
}
