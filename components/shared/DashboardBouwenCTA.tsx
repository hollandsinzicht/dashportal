import { ArrowRight, BarChart3, Sparkles } from "lucide-react";
import Link from "next/link";

interface DashboardBouwenCTAProps {
  /**
   * "inline" = compact card (dashboard, portaal)
   * "banner" = full-width section (marketing pages)
   */
  variant?: "inline" | "banner";
}

/**
 * Herbruikbare CTA sectie: "Laat je dashboard bouwen door experts"
 *
 * Twee varianten:
 * - inline: Card formaat voor in dashboard en portaal
 * - banner: Full-width sectie voor marketing pagina's
 */
export function DashboardBouwenCTA({
  variant = "inline",
}: DashboardBouwenCTAProps) {
  const contactUrl =
    "mailto:info@dashportal.app?subject=Dashboard%20laten%20bouwen";

  if (variant === "banner") {
    return (
      <section className="py-20 border-t border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-gradient-to-br from-primary/5 via-surface to-accent/5 rounded-3xl border border-border p-8 sm:p-12 overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />

            <div className="relative flex flex-col lg:flex-row items-center gap-8">
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
                  <Sparkles className="w-3.5 h-3.5" />
                  Power BI Experts
                </div>
                <h2 className="font-[family-name:var(--font-syne)] text-2xl sm:text-3xl font-bold text-text-primary mb-3">
                  Laat je dashboard bouwen door experts
                </h2>
                <p className="text-text-secondary max-w-xl">
                  Geen tijd of kennis om zelf dashboards te bouwen? Ons team van
                  gecertificeerde Power BI experts bouwt professionele
                  dashboards die direct waarde leveren voor jouw organisatie.
                </p>
              </div>

              <div className="shrink-0">
                <Link
                  href={contactUrl}
                  className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                >
                  Neem contact op
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ─── Inline variant (dashboard card) ───
  return (
    <div className="bg-gradient-to-r from-primary/5 via-surface to-accent/5 rounded-2xl border border-border p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <BarChart3 className="w-5 h-5 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-[family-name:var(--font-syne)] font-bold text-text-primary text-sm">
          Laat je dashboard bouwen door experts
        </h3>
        <p className="text-text-secondary text-xs mt-0.5">
          Geen tijd of kennis? Ons team bouwt professionele Power BI dashboards
          voor je.
        </p>
      </div>

      <Link
        href={contactUrl}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors shrink-0"
      >
        Contact opnemen
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
