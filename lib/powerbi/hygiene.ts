// ============================================
// Hygiene Score — Power BI omgeving gezondheid
// ============================================

export interface HygieneBreakdownItem {
  score: number; // 0-100 voor dit onderdeel
  weight: number; // gewicht in totaalscore
  label: string;
  detail: string;
}

export interface HygieneScore {
  total: number; // 0-100 gewogen totaal
  grade: "green" | "yellow" | "red";
  gradeLabel: string;
  breakdown: {
    refreshSuccess: HygieneBreakdownItem;
    dataFreshness: HygieneBreakdownItem;
    workspaceHealth: HygieneBreakdownItem;
    coverage: HygieneBreakdownItem;
  };
}

interface DatasetInput {
  last_refresh_status: string | null;
  last_refresh_at: string | null;
  is_refreshable?: boolean;
}

interface WorkspaceInput {
  state: string | null;
}

/**
 * Bereken de Hygiene Score voor een Power BI omgeving.
 *
 * Formule (gewogen gemiddelde):
 * - Refresh success (40%): % datasets met succesvolle laatste refresh
 * - Data freshness (35%): % refreshable datasets ververst binnen 24u
 * - Workspace health (15%): % workspaces met Active status
 * - Coverage (10%): % datasets dat refreshable is
 */
export function calculateHygieneScore(
  datasets: DatasetInput[],
  workspaces: WorkspaceInput[]
): HygieneScore {
  // ─── 1. Refresh Success (40%) ───
  const datasetsWithStatus = datasets.filter(
    (d) => d.last_refresh_status !== null && d.last_refresh_status !== undefined
  );
  const completedCount = datasetsWithStatus.filter(
    (d) =>
      d.last_refresh_status === "Completed" ||
      d.last_refresh_status === "Succeeded"
  ).length;
  const refreshScore =
    datasetsWithStatus.length > 0
      ? Math.round((completedCount / datasetsWithStatus.length) * 100)
      : 100; // Geen datasets met status = niets fout

  const refreshDetail =
    datasetsWithStatus.length > 0
      ? `${completedCount}/${datasetsWithStatus.length} geslaagd`
      : "Geen refresh data beschikbaar";

  // ─── 2. Data Freshness (35%) ───
  const now = Date.now();
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

  // Refreshable datasets = datasets die een refresh_at hebben (dus ooit ververst)
  const refreshableDatasets = datasets.filter((d) => d.last_refresh_at);
  const freshCount = refreshableDatasets.filter((d) => {
    const refreshTime = new Date(d.last_refresh_at!).getTime();
    return now - refreshTime < TWENTY_FOUR_HOURS;
  }).length;

  const freshnessScore =
    refreshableDatasets.length > 0
      ? Math.round((freshCount / refreshableDatasets.length) * 100)
      : 100;

  const freshnessDetail =
    refreshableDatasets.length > 0
      ? `${freshCount}/${refreshableDatasets.length} binnen 24 uur`
      : "Geen refresh historie";

  // ─── 3. Workspace Health (15%) ───
  const activeCount = workspaces.filter(
    (w) => w.state === "Active" || w.state === "active"
  ).length;
  const workspaceScore =
    workspaces.length > 0
      ? Math.round((activeCount / workspaces.length) * 100)
      : 0;

  const workspaceDetail =
    workspaces.length > 0
      ? `${activeCount}/${workspaces.length} actief`
      : "Geen werkruimtes";

  // ─── 4. Coverage (10%) ───
  // Datasets die refreshable zijn (is_refreshable flag, of die ooit een refresh gehad hebben)
  const refreshableCount = datasets.filter(
    (d) => d.is_refreshable === true || d.last_refresh_at !== null
  ).length;
  const coverageScore =
    datasets.length > 0
      ? Math.round((refreshableCount / datasets.length) * 100)
      : 100;

  const coverageDetail =
    datasets.length > 0
      ? `${refreshableCount}/${datasets.length} geconfigureerd`
      : "Geen datasets";

  // ─── Totaal berekenen (gewogen gemiddelde) ───
  const total = Math.round(
    refreshScore * 0.4 +
      freshnessScore * 0.35 +
      workspaceScore * 0.15 +
      coverageScore * 0.1
  );

  // Grade bepalen
  let grade: HygieneScore["grade"];
  let gradeLabel: string;

  if (total >= 80) {
    grade = "green";
    gradeLabel = "Uitstekend";
  } else if (total >= 50) {
    grade = "yellow";
    gradeLabel = "Aandacht nodig";
  } else {
    grade = "red";
    gradeLabel = "Kritiek";
  }

  return {
    total,
    grade,
    gradeLabel,
    breakdown: {
      refreshSuccess: {
        score: refreshScore,
        weight: 40,
        label: "Refresh succes",
        detail: refreshDetail,
      },
      dataFreshness: {
        score: freshnessScore,
        weight: 35,
        label: "Data versheid",
        detail: freshnessDetail,
      },
      workspaceHealth: {
        score: workspaceScore,
        weight: 15,
        label: "Werkruimte status",
        detail: workspaceDetail,
      },
      coverage: {
        score: coverageScore,
        weight: 10,
        label: "Refresh dekking",
        detail: coverageDetail,
      },
    },
  };
}
