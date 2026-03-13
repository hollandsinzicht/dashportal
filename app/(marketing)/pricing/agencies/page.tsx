"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Check,
  Building2,
  Users,
  BarChart3,
  CreditCard,
  Palette,
  Shield,
  ChevronDown,
  Sparkles,
  ServerCog,
  Headphones,
  RefreshCw,
  Lock,
} from "lucide-react";

/* ─── Pricing data ─── */
const AGENCY_TIERS = [
  {
    label: "Starter",
    users: "1 – 25 gebruikers bij je klant",
    price: 79,
    description: "Ideaal voor kleinere klanten en startende portalen.",
    highlighted: false,
  },
  {
    label: "Growth",
    users: "26 – 100 gebruikers bij je klant",
    price: 199,
    description: "Voor groeiende klantomgevingen met meer gebruikers.",
    highlighted: true,
  },
  {
    label: "Professional",
    users: "101 – 250 gebruikers bij je klant",
    price: 399,
    description: "Voor grote klanten met complexe rapportage-behoeften.",
    highlighted: false,
  },
  {
    label: "Enterprise",
    users: "251+ gebruikers bij je klant",
    price: 0,
    description: "Maatwerk pricing voor de allergrootste omgevingen.",
    highlighted: false,
  },
];

const BENEFITS = [
  {
    icon: Users,
    title: "Onbeperkt klantportalen",
    description:
      "Maak zoveel klantportalen aan als je wilt. Elke klant krijgt een eigen omgeving met eigen branding.",
  },
  {
    icon: CreditCard,
    title: "Geconsolideerde facturatie",
    description:
      "Eén maandelijkse factuur voor al je klanten. Transparant berekend op basis van gebruikersaantallen.",
  },
  {
    icon: Palette,
    title: "White-label per klant",
    description:
      "Elke klant krijgt eigen logo, kleuren en eventueel een eigen domein. Volledig onder jouw merk.",
  },
  {
    icon: BarChart3,
    title: "Centraal beheer",
    description:
      "Beheer alle klantportalen vanuit één dashboard. Gebruikers, rapporten en toegang op één plek.",
  },
  {
    icon: Shield,
    title: "Enterprise-grade beveiliging",
    description:
      "Row-Level Security, Microsoft SSO en volledige audit trail. Je klanten zijn in goede handen.",
  },
  {
    icon: Building2,
    title: "Eigen agency branding",
    description:
      "Je agency dashboard draagt jouw huisstijl. Professioneel overkomen bij al je klanten.",
  },
];

const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Registreer als agency",
    description: "Maak in 2 minuten je agency account aan met je bedrijfsgegevens.",
  },
  {
    step: 2,
    title: "Maak klantportalen aan",
    description:
      "Voeg klanten toe, koppel Power BI werkruimtes en configureer branding per klant.",
  },
  {
    step: 3,
    title: "Nodig gebruikers uit",
    description:
      "Nodig de eindgebruikers van je klanten uit. Zij zien alleen hun eigen portaal.",
  },
  {
    step: 4,
    title: "Ontvang één factuur",
    description:
      "Maandelijks ontvang je één factuur op basis van het aantal gebruikers per klant.",
  },
];

/* ─── FAQ ─── */
const AGENCY_FAQ = [
  {
    question: "Wat telt als een 'gebruiker'?",
    answer:
      "Een gebruiker is een persoon met een actief account in een klantportaal. Dit zijn de eindgebruikers van jouw klant — de mensen die inloggen om Power BI rapporten te bekijken. Beheerders en uitgenodigd-maar-nooit-ingelogde accounts tellen ook mee. Gedeactiveerde accounts tellen niet mee. Het aantal wordt automatisch geteld op de eerste van elke maand.",
  },
  {
    question: "Hoe wordt de prijs per klant berekend?",
    answer:
      "De prijs per klantportaal is gebaseerd op het aantal actieve gebruikers van die klant. Heeft jouw klant 104 gebruikers in hun portaal? Dan valt dat portaal in de Professional schijf (101–250 gebruikers) en betaal je €399/maand voor die klant. Elke klant wordt apart berekend op basis van hun eigen gebruikersaantallen.",
  },
  {
    question: "Zijn er opstartkosten of een minimale afname?",
    answer:
      "Nee. Je betaalt alleen per actief klantportaal op basis van gebruikersaantallen. Geen opstartkosten, geen minimale afname, en je kunt maandelijks opzeggen.",
  },
  {
    question: "Kan ik de prijzen doorberekenen aan mijn klanten?",
    answer:
      "Ja, je bent volledig vrij om je eigen marges te bepalen. Veel agencies rekenen een vast bedrag per klant of nemen het op in hun consultancy-fee. DashPortal is volledig white-label — je klanten hoeven niet te weten welk platform je gebruikt.",
  },
  {
    question: "Wat is inbegrepen per klantportaal?",
    answer:
      "Elk klantportaal bevat onbeperkt werkruimtes, onbeperkt rapporten, eigen branding (logo + kleuren), e-mail authenticatie en optioneel een eigen domein. Microsoft SSO en Row-Level Security zijn ook beschikbaar.",
  },
  {
    question: "Hoe werkt de facturatie?",
    answer:
      "Op de eerste van elke maand tellen we automatisch de actieve gebruikers per klantportaal. Op basis daarvan wordt je factuur opgesteld via Stripe. Je ontvangt één geconsolideerde factuur per e-mail met een detail overzicht per klant.",
  },
  {
    question: "Kan ik aangepaste prijsschijven instellen?",
    answer:
      "Ja. In je agency dashboard kun je de standaard prijsschijven aanpassen of extra schijven toevoegen. Voor 251+ gebruikers bieden we maatwerk pricing — neem contact op zodat we samen een passende afspraak maken.",
  },
];

/* ─── Animatie varianten ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

/* ─── FAQ Accordion ─── */
function FAQAccordionItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-surface-secondary/50 transition-colors"
      >
        <span className="font-medium text-text-primary pr-4">{question}</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-text-secondary" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 text-sm text-text-secondary leading-relaxed">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Page ─── */
export default function AgencyPricingPage() {
  return (
    <>
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12 relative">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 bg-primary-light text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <Building2 className="w-4 h-4" />
              Agency &amp; Reseller Programma
            </div>
            <h1 className="font-[family-name:var(--font-syne)] text-4xl sm:text-5xl font-bold text-text-primary">
              Beheer al je klantportalen{" "}
              <span className="text-primary">onder één account</span>
            </h1>
            <p className="mt-5 text-lg text-text-secondary max-w-2xl mx-auto">
              Als Power BI consultancy of agency beheer je meerdere klantomgevingen vanuit
              één dashboard. Transparante per-klant pricing, geconsolideerde facturatie en
              volledig white-label.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
              <Link
                href="/agency/register"
                className="inline-flex items-center gap-2 h-12 px-8 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
              >
                Start als agency
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 h-12 px-8 bg-surface-secondary text-text-primary text-sm font-medium rounded-lg border border-border hover:bg-border/50 transition-colors"
              >
                Neem contact op
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Pricing Tiers ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-center mb-12"
        >
          <h2 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-text-primary">
            Transparante per-klant pricing
          </h2>
          <p className="text-text-secondary mt-3 max-w-xl mx-auto">
            Je betaalt per klantportaal op basis van het aantal actieve gebruikers
            van die klant. Geen verborgen kosten, geen minimale afname.{" "}
            <a href="#rekenvoorbeeld" className="text-primary hover:underline">
              Bekijk het rekenvoorbeeld &darr;
            </a>
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {AGENCY_TIERS.map((tier, i) => (
            <motion.div
              key={tier.label}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={cardVariants}
              className={`relative bg-surface rounded-2xl border p-7 flex flex-col transition-shadow duration-300 ${
                tier.highlighted
                  ? "border-primary ring-2 ring-primary/20 shadow-xl shadow-primary/15"
                  : "border-border hover:shadow-lg hover:shadow-black/5"
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Populairst
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h3 className="font-[family-name:var(--font-syne)] text-xl font-bold text-text-primary">
                  {tier.label}
                </h3>
                <p className="text-sm text-primary font-medium mt-1">
                  {tier.users}
                </p>
              </div>

              <div className="mb-4">
                {tier.price > 0 ? (
                  <>
                    <span className="text-3xl font-bold text-text-primary">
                      &euro;{tier.price}
                    </span>
                    <span className="text-text-secondary text-sm">/maand</span>
                    <p className="text-xs text-text-secondary mt-1">
                      per klantportaal
                    </p>
                  </>
                ) : (
                  <>
                    <span className="text-2xl font-bold text-text-primary">
                      Op maat
                    </span>
                    <p className="text-xs text-text-secondary mt-1">
                      neem contact op
                    </p>
                  </>
                )}
              </div>

              <p className="text-sm text-text-secondary mb-6 flex-1">
                {tier.description}
              </p>

              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success shrink-0" />
                  <span className="text-sm text-text-primary">Onbeperkt rapporten</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success shrink-0" />
                  <span className="text-sm text-text-primary">Eigen branding</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success shrink-0" />
                  <span className="text-sm text-text-primary">Microsoft SSO</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success shrink-0" />
                  <span className="text-sm text-text-primary">Row-Level Security</span>
                </li>
              </ul>

              <Link
                href={tier.price > 0 ? "/agency/register" : "/contact"}
                className={`inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg font-medium text-sm transition-all duration-200 ${
                  tier.highlighted
                    ? "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20"
                    : "bg-surface-secondary text-text-primary border border-border hover:bg-border/50"
                }`}
              >
                {tier.price > 0 ? "Start als agency" : "Neem contact op"}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="py-20 bg-surface border-t border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-14"
          >
            <h2 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-text-primary">
              Hoe het werkt
            </h2>
            <p className="text-text-secondary mt-3">
              In 4 stappen van registratie naar beheerd klantportaal
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((item, i) => (
              <motion.div
                key={item.step}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={cardVariants}
                className="text-center"
              >
                <div className="w-10 h-10 rounded-full bg-primary text-white font-bold flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-[family-name:var(--font-syne)] font-bold text-text-primary mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-text-secondary">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Benefits ─── */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-14"
          >
            <h2 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-text-primary">
              Waarom agencies kiezen voor DashPortal
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {BENEFITS.map((benefit, i) => (
              <motion.div
                key={benefit.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={cardVariants}
                className="bg-surface border border-border rounded-2xl p-6"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <benefit.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-[family-name:var(--font-syne)] font-bold text-text-primary mb-2">
                  {benefit.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Wat DashPortal regelt ─── */}
      <section className="py-20 bg-surface border-t border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-14"
          >
            <h2 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-text-primary">
              Wat DashPortal voor je regelt
            </h2>
            <p className="text-text-secondary mt-3 max-w-2xl mx-auto">
              Jij focust op je klanten, wij zorgen dat het platform draait.
              Dit is wat wij als partner voor je doen.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              {
                icon: ServerCog,
                title: "Hosting & infrastructuur",
                description:
                  "Het volledige platform draait op enterprise-grade infrastructuur (Vercel + Supabase). Wij zorgen voor uptime, schaalbaarheid en performance — jij hoeft geen servers te beheren.",
              },
              {
                icon: RefreshCw,
                title: "Updates & nieuwe features",
                description:
                  "Alle klantportalen profiteren automatisch van platform-updates, bugfixes en nieuwe functies. Geen handmatig updaten of migreren.",
              },
              {
                icon: Lock,
                title: "Beveiliging & compliance",
                description:
                  "End-to-end encryptie, versleutelde API-credentials, Row-Level Security en AVG-conforme gegevensverwerking. Wij houden het platform veilig.",
              },
              {
                icon: Headphones,
                title: "Technische support",
                description:
                  "Bij technische problemen staan wij klaar. Agencies krijgen directe support voor platformvragen, zodat jij je klanten kunt helpen met hun Power BI content.",
              },
              {
                icon: CreditCard,
                title: "Facturatie & administratie",
                description:
                  "Automatische maandelijkse facturatie op basis van gebruikersaantallen per klant. Eén geconsolideerde factuur via Stripe met gedetailleerd overzicht.",
              },
              {
                icon: BarChart3,
                title: "Power BI integratie",
                description:
                  "Wij onderhouden de koppeling met Microsoft Power BI: embed tokens, metadata-sync, werkruimte-monitoring en refresh-status tracking.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={cardVariants}
                className="flex gap-4 bg-background border border-border rounded-xl p-5"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-[family-name:var(--font-syne)] font-bold text-text-primary mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Rekenvoorbeeld ─── */}
      <section id="rekenvoorbeeld" className="py-20 bg-surface border-t border-border scroll-mt-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-10"
          >
            <h2 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-text-primary">
              Rekenvoorbeeld
            </h2>
            <p className="text-text-secondary mt-3">
              Stel je hebt 5 klanten met verschillende groottes
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="bg-background rounded-2xl border border-border overflow-hidden"
          >
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-secondary/50">
                  <th className="text-left text-sm font-medium text-text-secondary p-4">
                    Klant
                  </th>
                  <th className="text-right text-sm font-medium text-text-secondary p-4">
                    Gebruikers
                  </th>
                  <th className="text-right text-sm font-medium text-text-secondary p-4">
                    Schijf
                  </th>
                  <th className="text-right text-sm font-medium text-text-secondary p-4">
                    Prijs/maand
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "Klant A", users: 12, tier: "Starter", price: 79 },
                  { name: "Klant B", users: 8, tier: "Starter", price: 79 },
                  { name: "Klant C", users: 45, tier: "Growth", price: 199 },
                  { name: "Klant D", users: 80, tier: "Growth", price: 199 },
                  { name: "Klant E", users: 150, tier: "Professional", price: 399 },
                ].map((row, idx) => (
                  <tr
                    key={row.name}
                    className={idx % 2 === 0 ? "bg-surface-secondary/30" : ""}
                  >
                    <td className="p-4 text-sm font-medium text-text-primary">
                      {row.name}
                    </td>
                    <td className="p-4 text-sm text-text-secondary text-right">
                      {row.users}
                    </td>
                    <td className="p-4 text-sm text-text-secondary text-right">
                      {row.tier}
                    </td>
                    <td className="p-4 text-sm font-medium text-text-primary text-right">
                      &euro;{row.price}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-primary/[0.03]">
                  <td className="p-4 font-bold text-text-primary" colSpan={2}>
                    Totaal (5 klanten)
                  </td>
                  <td className="p-4 text-sm text-text-secondary text-right">
                    295 gebruikers
                  </td>
                  <td className="p-4 font-bold text-primary text-right text-lg">
                    &euro;955/maand
                  </td>
                </tr>
              </tfoot>
            </table>
          </motion.div>

          <p className="text-center text-sm text-text-secondary mt-4">
            Alle prijzen zijn exclusief BTW. Je ontvangt maandelijks één geconsolideerde factuur.
          </p>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-12"
          >
            <h2 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-text-primary">
              Veelgestelde vragen
            </h2>
          </motion.div>

          <div className="space-y-3">
            {AGENCY_FAQ.map((item) => (
              <FAQAccordionItem
                key={item.question}
                question={item.question}
                answer={item.answer}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 bg-surface border-t border-border">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-7 h-7 text-primary" />
            </div>
            <h2 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-text-primary mb-4">
              Klaar om te starten als agency?
            </h2>
            <p className="text-text-secondary mb-8 max-w-lg mx-auto">
              Registreer in 2 minuten en begin met het aanmaken van klantportalen.
              Geen opstartkosten, geen minimale afname.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/agency/register"
                className="inline-flex items-center gap-2 h-12 px-8 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
              >
                Registreer als agency
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 h-12 px-8 bg-surface-secondary text-text-primary text-sm font-medium rounded-lg border border-border hover:bg-border/50 transition-colors"
              >
                Stel een vraag
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
