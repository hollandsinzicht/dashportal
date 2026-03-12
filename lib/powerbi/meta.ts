/**
 * Power BI Meta API helpers
 *
 * Functies voor het ophalen van datasets, refresh-geschiedenis,
 * databronnen en rapport-gebruikers uit de Power BI REST API.
 */

const PBI_BASE = "https://api.powerbi.com/v1.0/myorg/groups";

// ─── Shared helper ───

async function pbiGet<T>(
  accessToken: string,
  path: string
): Promise<T | null> {
  const response = await fetch(`${PBI_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    // DirectQuery datasets return 400 for refresh history — catch gracefully
    if (response.status === 400) return null;
    console.error(
      `PBI API error: ${response.status} ${response.statusText} — ${path}`
    );
    return null;
  }

  return response.json();
}

// ─── Types ───

export interface PBIDataset {
  id: string;
  name: string;
  configuredBy: string;
  isRefreshable: boolean;
  webUrl?: string;
}

export interface PBIRefreshEntry {
  refreshType: string;
  status: string;
  startTime: string;
  endTime?: string;
  serviceExceptionJson?: string;
}

export interface PBIDatasource {
  datasourceType: string;
  datasourceId: string;
  connectionDetails: Record<string, string>;
  gatewayId?: string;
}

export interface PBIReportUser {
  emailAddress: string;
  displayName: string;
  reportUserAccessRight: string;
  identifier: string;
  principalType: string;
}

// ─── API functions ───

/**
 * Haal datasets op voor een workspace.
 */
export async function getDatasets(
  accessToken: string,
  workspaceId: string
): Promise<PBIDataset[]> {
  const data = await pbiGet<{ value: PBIDataset[] }>(
    accessToken,
    `/${workspaceId}/datasets`
  );
  return data?.value || [];
}

/**
 * Haal refresh geschiedenis op voor een dataset.
 * Vangt 400 af voor DirectQuery datasets (niet verversbaar).
 */
export async function getDatasetRefreshHistory(
  accessToken: string,
  workspaceId: string,
  datasetId: string,
  top: number = 10
): Promise<PBIRefreshEntry[]> {
  const data = await pbiGet<{ value: PBIRefreshEntry[] }>(
    accessToken,
    `/${workspaceId}/datasets/${datasetId}/refreshes?$top=${top}`
  );
  return data?.value || [];
}

/**
 * Haal databronnen op voor een dataset.
 */
export async function getDatasetDatasources(
  accessToken: string,
  workspaceId: string,
  datasetId: string
): Promise<PBIDatasource[]> {
  const data = await pbiGet<{ value: PBIDatasource[] }>(
    accessToken,
    `/${workspaceId}/datasets/${datasetId}/datasources`
  );
  return data?.value || [];
}

/**
 * Haal rapport-gebruikers op.
 */
export async function getReportUsers(
  accessToken: string,
  workspaceId: string,
  reportId: string
): Promise<PBIReportUser[]> {
  const data = await pbiGet<{ value: PBIReportUser[] }>(
    accessToken,
    `/${workspaceId}/reports/${reportId}/users`
  );
  return data?.value || [];
}
