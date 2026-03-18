import { NextRequest, NextResponse } from "next/server";
import {
  calculateAllAgencyBilling,
  saveInvoiceLines,
} from "@/lib/agency/billing";
import {
  addAgencyInvoiceItem,
  createAndFinalizeAgencyInvoice,
} from "@/lib/stripe/agency";

/**
 * GET /api/cron/agency-billing
 *
 * Maandelijkse cron job voor agency facturatie.
 * Draait op de 1e van elke maand om 02:00 UTC.
 *
 * Flow:
 * 1. Bereken kosten per klant per agency op basis van actieve gebruikers
 * 2. Maak Stripe invoice items aan per klant
 * 3. Finaliseer de Stripe factuur
 * 4. Sla invoice lines op in de database
 */
export async function GET(req: NextRequest) {
  // Cron authenticatie
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Niet geautoriseerd" },
      { status: 401 }
    );
  }

  try {
    const billingResults = await calculateAllAgencyBilling();

    if (billingResults.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Geen agencies om te factureren",
        processed: 0,
      });
    }

    const results: Array<{
      agencyId: string;
      agencyName: string;
      clientCount: number;
      total: number;
      success: boolean;
      error?: string;
      stripeInvoiceId?: string;
    }> = [];

    for (const billing of billingResults) {
      try {
        // Agencies zonder Stripe Customer — sla invoice lines op maar skip Stripe
        if (!billing.stripeCustomerId) {
          console.warn(
            `[cron/agency-billing] Agency ${billing.agencyId} (${billing.agencyName}) heeft geen Stripe customer. Invoice lines opgeslagen zonder Stripe facturatie.`
          );
          await saveInvoiceLines(
            billing.agencyId,
            billing.clients,
            billing.periodStart,
            billing.periodEnd
          );
          results.push({
            agencyId: billing.agencyId,
            agencyName: billing.agencyName,
            clientCount: billing.clients.length,
            total: billing.total,
            success: true,
          });
          continue;
        }

        // Skip als totaal €0 is (alleen custom pricing klanten)
        if (billing.total === 0) {
          // Toch invoice lines opslaan voor administratie
          await saveInvoiceLines(
            billing.agencyId,
            billing.clients,
            billing.periodStart,
            billing.periodEnd
          );
          results.push({
            agencyId: billing.agencyId,
            agencyName: billing.agencyName,
            clientCount: billing.clients.length,
            total: 0,
            success: true,
          });
          continue;
        }

        // Maak Stripe invoice items aan per klant
        const stripeItemIds: Record<string, string> = {};

        for (const client of billing.clients) {
          if (client.price <= 0) continue; // Custom pricing — skip

          const itemId = await addAgencyInvoiceItem(
            billing.stripeCustomerId,
            `${client.tenantName} — ${client.tierLabel || "Standaard"} (${client.userCount} gebruikers)`,
            client.price,
            {
              agency_id: billing.agencyId,
              tenant_id: client.tenantId,
              user_count: String(client.userCount),
              tier_label: client.tierLabel || "",
            }
          );

          stripeItemIds[client.tenantId] = itemId;
        }

        // Finaliseer de factuur
        const monthName = new Date(billing.periodEnd).toLocaleDateString(
          "nl-NL",
          { month: "long", year: "numeric" }
        );

        const { invoiceId } = await createAndFinalizeAgencyInvoice(
          billing.stripeCustomerId,
          `Agency facturatie — ${monthName}`
        );

        // Sla invoice lines op in de database
        await saveInvoiceLines(
          billing.agencyId,
          billing.clients,
          billing.periodStart,
          billing.periodEnd,
          stripeItemIds
        );

        results.push({
          agencyId: billing.agencyId,
          agencyName: billing.agencyName,
          clientCount: billing.clients.length,
          total: billing.total,
          success: true,
          stripeInvoiceId: invoiceId,
        });
      } catch (err) {
        console.error(
          `[cron/agency-billing] Fout bij agency ${billing.agencyId}:`,
          err
        );
        results.push({
          agencyId: billing.agencyId,
          agencyName: billing.agencyName,
          clientCount: billing.clients.length,
          total: billing.total,
          success: false,
          error: err instanceof Error ? err.message : "Onbekende fout",
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      invoiced: results.filter((r) => r.success && r.total > 0).length,
      failed: results.filter((r) => !r.success).length,
      results,
    });
  } catch (error) {
    console.error("[cron/agency-billing] Onverwachte fout:", error);
    return NextResponse.json(
      { error: "Cron job mislukt" },
      { status: 500 }
    );
  }
}
