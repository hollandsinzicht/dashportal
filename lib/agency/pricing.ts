import type { AgencyPricingTier } from "./types";

// ─── Standaard prijsschijven voor nieuwe agencies ──────────

export const DEFAULT_AGENCY_TIERS: Omit<AgencyPricingTier, "id" | "agency_id" | "created_at">[] = [
  {
    min_users: 1,
    max_users: 25,
    price_per_month: 79,
    label: "Starter",
    sort_order: 0,
  },
  {
    min_users: 26,
    max_users: 100,
    price_per_month: 199,
    label: "Growth",
    sort_order: 1,
  },
  {
    min_users: 101,
    max_users: 250,
    price_per_month: 399,
    label: "Professional",
    sort_order: 2,
  },
  {
    min_users: 251,
    max_users: null, // onbeperkt
    price_per_month: 0, // custom pricing — op aanvraag
    label: "Enterprise",
    sort_order: 3,
  },
];

// ─── Tier berekening ───────────────────────────────────────

export interface TierResult {
  price: number;
  label: string | null;
  isCustom: boolean;
}

/**
 * Bepaal de maandelijkse prijs voor een klant op basis van het aantal
 * actieve gebruikers en de prijsschijven van de agency.
 *
 * Als de gebruiker in de "Enterprise" schijf valt (price = 0),
 * wordt isCustom = true teruggegeven.
 */
export function calculateTierPrice(
  userCount: number,
  tiers: Pick<AgencyPricingTier, "min_users" | "max_users" | "price_per_month" | "label">[]
): TierResult {
  // Sorteer op min_users oplopend
  const sorted = [...tiers].sort((a, b) => a.min_users - b.min_users);

  for (const tier of sorted) {
    const inRange =
      userCount >= tier.min_users &&
      (tier.max_users === null || userCount <= tier.max_users);

    if (inRange) {
      return {
        price: tier.price_per_month,
        label: tier.label,
        isCustom: tier.price_per_month === 0,
      };
    }
  }

  // Fallback: hoogste schijf
  const last = sorted[sorted.length - 1];
  if (last) {
    return {
      price: last.price_per_month,
      label: last.label,
      isCustom: last.price_per_month === 0,
    };
  }

  // Geen schijven geconfigureerd
  return { price: 0, label: null, isCustom: true };
}

/**
 * Bereken de totale maandelijkse kosten voor alle klanten van een agency.
 * Geeft per-klant breakdown + totaal terug.
 */
export function calculateMonthlyInvoice(
  clients: { tenantId: string; userCount: number }[],
  tiers: Pick<AgencyPricingTier, "min_users" | "max_users" | "price_per_month" | "label">[]
): {
  lines: {
    tenantId: string;
    userCount: number;
    price: number;
    tierLabel: string | null;
    isCustom: boolean;
  }[];
  total: number;
} {
  const lines = clients.map((client) => {
    const result = calculateTierPrice(client.userCount, tiers);
    return {
      tenantId: client.tenantId,
      userCount: client.userCount,
      price: result.price,
      tierLabel: result.label,
      isCustom: result.isCustom,
    };
  });

  const total = lines.reduce((sum, line) => sum + line.price, 0);

  return { lines, total };
}

/**
 * Formatteer een bedrag als euro string.
 */
export function formatEuro(amount: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}
