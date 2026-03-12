import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Shield,
  Palette,
  Users,
  Zap,
  Globe,
  Lock,
} from "lucide-react";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary-light text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <Zap className="w-4 h-4" />
              Nu beschikbaar — start in 10 minuten
            </div>

            <h1 className="font-[family-name:var(--font-syne)] text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary leading-tight">
              Jouw eigen{" "}
              <span className="text-primary">dataportaal</span>
              <br />
              voor Power BI
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
              Bied Power BI rapporten aan via een branded, gebruiksvriendelijk
              portaal. Met eigen huisstijl, eigen domein, en een cleane
              tegel-interface.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/onboarding/plan"
                className="inline-flex items-center gap-2 h-12 px-8 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-all duration-200 shadow-lg shadow-primary/20"
              >
                Start gratis trial
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 h-12 px-8 bg-surface border border-border text-text-primary font-medium rounded-lg hover:bg-surface-secondary transition-colors"
              >
                Bekijk prijzen
              </Link>
            </div>
          </div>
        </div>

        {/* Hero visual — placeholder tegel grid */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="relative bg-surface rounded-2xl border border-border shadow-xl overflow-hidden">
            <div className="bg-primary/5 p-4 border-b border-border flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-danger/60" />
              <div className="w-3 h-3 rounded-full bg-accent/60" />
              <div className="w-3 h-3 rounded-full bg-success/60" />
              <div className="flex-1 text-center">
                <span className="text-xs text-text-secondary font-mono">
                  jouwbedrijf.dashportal.app
                </span>
              </div>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { title: "Omzet Dashboard", category: "Finance" },
                  { title: "Sales Pipeline", category: "Sales" },
                  { title: "HR Analytics", category: "HR" },
                  { title: "Marketing KPIs", category: "Marketing" },
                  { title: "Voorraad Beheer", category: "Operations" },
                  { title: "Klanttevredenheid", category: "CX" },
                ].map((report) => (
                  <div
                    key={report.title}
                    className="bg-surface-secondary rounded-xl p-5 border border-border/50 hover:border-primary/20 transition-colors"
                  >
                    <div className="w-full h-24 bg-primary/5 rounded-lg mb-4 flex items-center justify-center">
                      <BarChart3 className="w-8 h-8 text-primary/30" />
                    </div>
                    <h4 className="font-medium text-text-primary text-sm">
                      {report.title}
                    </h4>
                    <span className="text-xs text-text-secondary mt-1 inline-block">
                      {report.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <h2 className="font-[family-name:var(--font-syne)] text-3xl sm:text-4xl font-bold text-text-primary">
              Alles wat je nodig hebt
            </h2>
            <p className="mt-4 text-lg text-text-secondary">
              Een compleet platform om Power BI rapporten te delen met jouw
              organisatie.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Palette,
                title: "Eigen huisstijl",
                description:
                  "Upload je logo, stel je kleuren in en gebruik je eigen domein. Jouw medewerkers zien jouw merk, niet Power BI.",
              },
              {
                icon: Shield,
                title: "Row-Level Security",
                description:
                  "Configureer per gebruiker welke data ze mogen zien. Volledig geïntegreerd met Power BI RLS.",
              },
              {
                icon: Users,
                title: "Gebruikersbeheer",
                description:
                  "Nodig medewerkers uit, beheer rollen, en bepaal per persoon welke rapporten zichtbaar zijn.",
              },
              {
                icon: Globe,
                title: "Eigen domein",
                description:
                  "Gebruik data.jouwbedrijf.nl in plaats van een generiek Power BI adres. Professioneel en herkenbaar.",
              },
              {
                icon: Lock,
                title: "Microsoft SSO",
                description:
                  "Laat medewerkers inloggen met hun bestaande Microsoft account. Geen extra wachtwoorden nodig.",
              },
              {
                icon: Zap,
                title: "Klaar in 10 minuten",
                description:
                  "Onze stap-voor-stap wizard begeleidt je door de installatie. Geen technische kennis vereist.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-background rounded-xl p-6 border border-border hover:border-primary/20 transition-colors"
              >
                <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-[family-name:var(--font-syne)] font-bold text-text-primary mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-[family-name:var(--font-syne)] text-3xl sm:text-4xl font-bold text-text-primary">
            Klaar om te starten?
          </h2>
          <p className="mt-4 text-lg text-text-secondary max-w-xl mx-auto">
            Maak in enkele minuten een branded dataportaal voor jouw
            organisatie. Geen creditcard nodig.
          </p>
          <div className="mt-8">
            <Link
              href="/onboarding/plan"
              className="inline-flex items-center gap-2 h-12 px-8 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-all duration-200 shadow-lg shadow-primary/20"
            >
              Start gratis trial
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
