import {
  Mail,
  Building2,
  MapPin,
  ArrowRight,
  BarChart3,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Contact — DashPortal",
  description:
    "Neem contact op met DashPortal. Onderdeel van Power BI Studio, gevestigd in Nederland.",
};

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <h1 className="font-[family-name:var(--font-syne)] text-4xl sm:text-5xl font-bold text-text-primary">
              Contact
            </h1>
            <p className="mt-4 text-lg text-text-secondary">
              Heb je een vraag, wil je een demo of wil je meer weten over
              DashPortal? Wij helpen je graag verder.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Contact info */}
            <div className="space-y-8">
              <div>
                <h2 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-text-primary mb-6">
                  Neem contact op
                </h2>
                <p className="text-text-secondary leading-relaxed mb-8">
                  DashPortal is een product van{" "}
                  <span className="font-semibold text-text-primary">
                    Power BI Studio
                  </span>
                  , gespecialiseerd in Power BI oplossingen voor het MKB en
                  enterprise. We zijn gevestigd in Nederland en helpen
                  organisaties door heel Europa.
                </p>
              </div>

              <div className="space-y-5">
                <a
                  href="mailto:info@dashportal.app"
                  className="flex items-start gap-4 p-4 bg-surface border border-border rounded-xl hover:border-primary/20 transition-colors group"
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary group-hover:text-primary transition-colors">
                      info@dashportal.app
                    </p>
                    <p className="text-sm text-text-secondary mt-0.5">
                      Voor vragen, demo-aanvragen en support
                    </p>
                  </div>
                </a>

                <div className="flex items-start gap-4 p-4 bg-surface border border-border rounded-xl">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">
                      Power BI Studio
                    </p>
                    <p className="text-sm text-text-secondary mt-0.5">
                      KVK: 62432168
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-surface border border-border rounded-xl">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">Nederland</p>
                    <p className="text-sm text-text-secondary mt-0.5">
                      Wij werken volledig remote en bedienen klanten door heel
                      Europa
                    </p>
                  </div>
                </div>
              </div>

              {/* Power BI Studio link */}
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-text-secondary mb-3">
                  Meer over Power BI Studio:
                </p>
                <a
                  href="https://powerbistudio.nl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline"
                >
                  powerbistudio.nl
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* CTA card */}
            <div className="space-y-6">
              {/* Snel starten */}
              <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-8 text-white">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-5">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-[family-name:var(--font-syne)] text-xl font-bold mb-3">
                  Liever direct aan de slag?
                </h3>
                <p className="text-white/80 text-sm leading-relaxed mb-6">
                  Start een gratis 14-dagen trial en ontdek hoe eenvoudig het is
                  om een eigen dataportaal op te zetten. Geen creditcard nodig,
                  geen verplichtingen.
                </p>
                <Link
                  href="/onboarding/plan"
                  className="inline-flex items-center gap-2 h-11 px-6 bg-white text-primary font-medium text-sm rounded-lg hover:bg-white/90 transition-colors"
                >
                  Start gratis trial
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* FAQ teaser */}
              <div className="bg-surface border border-border rounded-2xl p-8">
                <h3 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text-primary mb-4">
                  Veelgestelde vragen
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      q: "Is er een gratis proefperiode?",
                      a: "Ja, je kunt DashPortal 14 dagen gratis uitproberen. Geen creditcard nodig.",
                    },
                    {
                      q: "Kan ik mijn eigen domein gebruiken?",
                      a: "Ja, je kunt een eigen domein zoals data.jouwbedrijf.nl koppelen aan je portaal.",
                    },
                    {
                      q: "Werkt het met mijn bestaande Power BI licentie?",
                      a: "Ja, DashPortal werkt met elke Power BI Pro of Premium Per User licentie.",
                    },
                    {
                      q: "Hoe lang duurt het opzetten?",
                      a: "De meeste klanten zijn binnen 10 minuten live met hun eerste portaal.",
                    },
                  ].map((faq) => (
                    <div
                      key={faq.q}
                      className="border-b border-border last:border-0 pb-3 last:pb-0"
                    >
                      <p className="text-sm font-medium text-text-primary">
                        {faq.q}
                      </p>
                      <p className="text-sm text-text-secondary mt-1">
                        {faq.a}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
