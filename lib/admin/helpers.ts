import { PLAN_CONFIG, type PlanId } from "@/lib/stripe/config";

// ─── Status Badge Mapping ───

export function getSubscriptionStatusBadge(status: string): {
  variant: "default" | "success" | "warning" | "danger" | "accent";
  label: string;
} {
  switch (status) {
    case "trialing":
      return { variant: "accent", label: "Trial" };
    case "active":
      return { variant: "success", label: "Actief" };
    case "past_due":
      return { variant: "danger", label: "Achterstallig" };
    case "canceled":
      return { variant: "default", label: "Geannuleerd" };
    case "suspended":
      return { variant: "danger", label: "Opgeschort" };
    default:
      return { variant: "default", label: status };
  }
}

// ─── Currency ───

export function formatCurrency(amount: number): string {
  return `\u20AC ${amount.toLocaleString("nl-NL")}`;
}

// ─── Date ───

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Zojuist";
  if (diffMin < 60) return `${diffMin} min geleden`;
  if (diffHrs < 24) return `${diffHrs} uur geleden`;
  if (diffDays < 7) return `${diffDays} dag${diffDays !== 1 ? "en" : ""} geleden`;
  return formatDate(dateStr);
}

// ─── Stripe Dashboard URL ───

export function getStripeDashboardUrl(customerId: string): string {
  const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_");
  const base = isTestMode
    ? "https://dashboard.stripe.com/test"
    : "https://dashboard.stripe.com";
  return `${base}/customers/${customerId}`;
}

// ─── Plan helpers ───

export function getPlanPrice(plan: string): string {
  const config = PLAN_CONFIG[plan as PlanId];
  if (!config) return "—";
  if (config.price === 0) return "Op maat";
  return `\u20AC ${config.price}/mnd`;
}

export function getUserLimitLabel(plan: string): string {
  const config = PLAN_CONFIG[plan as PlanId];
  if (!config) return "—";
  return config.limits.users === -1 ? "\u221E" : String(config.limits.users);
}
