import { decrypt } from "@/lib/utils/encryption";

interface TokenConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
}

export async function getMicrosoftToken(config: TokenConfig): Promise<string> {
  const url = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`;

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: config.clientId,
    client_secret: config.clientSecret,
    scope: "https://analysis.windows.net/powerbi/api/.default",
  });

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Microsoft token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

export async function getWorkspaces(accessToken: string) {
  const response = await fetch(
    "https://api.powerbi.com/v1.0/myorg/groups",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch workspaces");
  }

  const data = await response.json();
  return data.value;
}

export async function getReportsInWorkspace(
  accessToken: string,
  workspaceId: string
) {
  const response = await fetch(
    `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch reports");
  }

  const data = await response.json();
  return data.value;
}

interface EmbedTokenRequest {
  reportId: string;
  workspaceId: string;
  accessToken: string;
  datasetId?: string;
  rlsIdentity?: {
    username: string;
    roles: string[];
    datasets: { id: string }[];
  };
}

export async function generateEmbedToken(config: EmbedTokenRequest) {
  const body: Record<string, unknown> = {
    accessLevel: "View",
  };

  if (config.rlsIdentity) {
    body.identities = [config.rlsIdentity];
  }

  const response = await fetch(
    `https://api.powerbi.com/v1.0/myorg/groups/${config.workspaceId}/reports/${config.reportId}/GenerateToken`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to generate embed token: ${error}`);
  }

  return response.json();
}

export async function getWorkspaceById(
  accessToken: string,
  workspaceId: string
): Promise<{ id: string; name: string }> {
  const response = await fetch(
    `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch workspace ${workspaceId}`);
  }

  return response.json();
}

export async function testPowerBIConnection(config: TokenConfig) {
  try {
    const accessToken = await getMicrosoftToken(config);
    const workspaces = await getWorkspaces(accessToken);
    return { success: true, workspaces };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Verbinding mislukt",
    };
  }
}
