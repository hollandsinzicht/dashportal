/**
 * Gedeelde plan data — single source of truth voor pricing & onboarding.
 *
 * De `lib/stripe/config.ts` bevat Stripe-specifieke configuratie (price IDs,
 * server-side helpers). Dit bestand bevat de klantgerichte presentatie-data
 * die veilig in client components gebruikt kan worden.
 */

export type PlanId = "starter" | "business" | "scale" | "enterprise";

export interface Plan {
  id: PlanId;
  name: string;
  monthlyPrice: number; // EUR, 0 = op maat
  yearlyPrice: number; // EUR, 0 = op maat (10× maandprijs = 2 maanden gratis)
  description: string;
  features: string[];
  limits: {
    workspaces: string;
    users: string;
    reports: string;
  };
  highlighted: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 99,
    yearlyPrice: 990,
    description: "Perfect voor kleine teams die Power BI willen delen.",
    features: [
      "Onbeperkt werkruimtes & rapporten",
      "1 – 10 gebruikers",
      "Eigen branding (logo + kleuren)",
      "E-mail authenticatie",
      "E-mail support",
    ],
    limits: {
      workspaces: "Onbeperkt",
      users: "10",
      reports: "Onbeperkt",
    },
    highlighted: false,
  },
  {
    id: "business",
    name: "Business",
    monthlyPrice: 249,
    yearlyPrice: 2490,
    description: "Voor groeiende organisaties met meer controle.",
    features: [
      "Onbeperkt werkruimtes & rapporten",
      "11 – 30 gebruikers",
      "Eigen domein",
      "Microsoft SSO",
      "Row-Level Security",
      "Crisp chat support",
      "API toegang",
    ],
    limits: {
      workspaces: "Onbeperkt",
      users: "30",
      reports: "Onbeperkt",
    },
    highlighted: true,
  },
  {
    id: "scale",
    name: "Scale",
    monthlyPrice: 499,
    yearlyPrice: 4990,
    description: "Voor grote organisaties met complexe behoeften.",
    features: [
      "Onbeperkt werkruimtes & rapporten",
      "31 – 150 gebruikers",
      "Alles van Business",
      "Geavanceerde analytics",
      "Priority support",
    ],
    limits: {
      workspaces: "Onbeperkt",
      users: "150",
      reports: "Onbeperkt",
    },
    highlighted: false,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Maatwerk met SLA en dedicated support.",
    features: [
      "Onbeperkt alles",
      "Alles van Scale",
      "SLA garantie",
      "Dedicated support",
      "Custom integraties",
      "Meerdere omgevingen",
    ],
    limits: {
      workspaces: "Onbeperkt",
      users: "Onbeperkt",
      reports: "Onbeperkt",
    },
    highlighted: false,
  },
];

/**
 * Vergelijkingstabel features met waarden per plan.
 * `true` = beschikbaar (✓), `false` = niet beschikbaar (—), `string` = specifieke waarde
 */
export interface ComparisonFeature {
  label: string;
  starter: string | boolean;
  business: string | boolean;
  scale: string | boolean;
  enterprise: string | boolean;
}

export const COMPARISON_FEATURES: ComparisonFeature[] = [
  { label: "Werkruimtes", starter: "Onbeperkt", business: "Onbeperkt", scale: "Onbeperkt", enterprise: "Onbeperkt" },
  { label: "Rapporten", starter: "Onbeperkt", business: "Onbeperkt", scale: "Onbeperkt", enterprise: "Onbeperkt" },
  { label: "Gebruikers", starter: "1 – 10", business: "11 – 30", scale: "31 – 150", enterprise: "151+" },
  { label: "Eigen branding", starter: true, business: true, scale: true, enterprise: true },
  { label: "Eigen domein", starter: false, business: true, scale: true, enterprise: true },
  { label: "Microsoft SSO", starter: false, business: true, scale: true, enterprise: true },
  { label: "Row-Level Security", starter: false, business: true, scale: true, enterprise: true },
  { label: "API toegang", starter: false, business: true, scale: true, enterprise: true },
  { label: "Geavanceerde analytics", starter: false, business: false, scale: true, enterprise: true },
  { label: "SLA garantie", starter: false, business: false, scale: false, enterprise: true },
  { label: "Dedicated support", starter: false, business: false, scale: false, enterprise: true },
  { label: "Custom integraties", starter: false, business: false, scale: false, enterprise: true },
  { label: "Support", starter: "E-mail", business: "Crisp chat", scale: "Priority", enterprise: "Dedicated" },
];

/**
 * FAQ items voor de pricing pagina.
 */
export interface FAQItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FAQItem[] = [
  {
    question: "Hoe werkt de gratis proefperiode?",
    answer:
      "Je kunt elk plan 14 dagen volledig gratis uitproberen. Er is geen creditcard nodig om te starten. Na 14 dagen kies je of je doorgaat met een betaald abonnement of stopt.",
  },
  {
    question: "Kan ik tussentijds upgraden of downgraden?",
    answer:
      "Ja, je kunt op elk moment van plan wisselen. Bij een upgrade wordt het verschil pro-rata berekend. Bij een downgrade gaat het nieuwe plan in aan het einde van je huidige factureringsperiode.",
  },
  {
    question: "Welke betaalmethoden worden geaccepteerd?",
    answer:
      "We accepteren alle gangbare betaalmethoden via Stripe: creditcard (Visa, Mastercard, Amex), iDEAL, SEPA incasso en bankoverschrijving. Facturering is beschikbaar voor Enterprise plannen.",
  },
  {
    question: "Is er een contractduur of opzegperiode?",
    answer:
      "Nee, er is geen minimale contractduur. Bij maandelijkse facturering kun je per maand opzeggen. Bij jaarlijkse facturering betaal je vooruit voor 12 maanden en bespaar je 17%.",
  },
  {
    question: "Wat gebeurt er als ik mijn limiet bereik?",
    answer:
      "Je ontvangt een melding wanneer je een limiet nadert. Je kunt dan upgraden naar een hoger plan of bestaande items verwijderen. Je portaal blijft altijd bereikbaar — we blokkeren je gebruikers nooit.",
  },
  {
    question: "Hoe werkt het Enterprise plan?",
    answer:
      "Het Enterprise plan is volledig op maat. Neem contact met ons op en we bespreken je specifieke wensen, waaronder SLA-afspraken, dedicated support, custom integraties en meerdere omgevingen.",
  },
];

/**
 * Helper: haal een plan op op basis van ID.
 */
export function getPlan(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

/**
 * Bereken de besparing in procent voor jaarlijks vs maandelijks.
 */
export function getYearlySavingsPercent(): number {
  // 10 maanden betalen ipv 12 = 2/12 ≈ 17%
  return 17;
}
