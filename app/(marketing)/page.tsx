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
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  Activity,
  AlertTriangle,
  Layers,
  MousePointerClick,
  HeartHandshake,
  CloudCog,
  CreditCard,
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
              Deel Power BI rapporten met klanten en collega&apos;s via een
              professioneel, branded portaal — met je eigen logo, kleuren en
              domein. Inclusief metadatabeheer en data-hygiëne monitoring.
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
                href="/demo"
                className="inline-flex items-center gap-2 h-12 px-8 bg-surface border border-border text-text-primary font-medium rounded-lg hover:bg-surface-secondary transition-colors"
              >
                <Eye className="w-4 h-4" />
                Bekijk live demo
              </Link>
            </div>
          </div>
        </div>

        {/* Hero visual — realistic report tiles */}
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
            <div className="px-8 pt-6 pb-4 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <span className="font-[family-name:var(--font-syne)] font-bold text-sm text-text-primary">
                  Acme Analytics
                </span>
              </div>
              <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-primary">JD</span>
              </div>
            </div>
            <div className="p-8">
              <p className="text-sm text-text-secondary mb-4">
                3 werkruimtes · 10 rapporten
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { title: "Omzet Dashboard", category: "Finance", color: "from-blue-500/20 to-indigo-500/10", icon: "📊" },
                  { title: "Sales Pipeline", category: "Sales", color: "from-emerald-500/20 to-teal-500/10", icon: "📈" },
                  { title: "HR Analytics", category: "HR", color: "from-violet-500/20 to-purple-500/10", icon: "👥" },
                  { title: "Marketing KPIs", category: "Marketing", color: "from-amber-500/20 to-orange-500/10", icon: "🎯" },
                  { title: "Voorraad Beheer", category: "Operations", color: "from-cyan-500/20 to-sky-500/10", icon: "📦" },
                  { title: "Klanttevredenheid", category: "CX", color: "from-rose-500/20 to-pink-500/10", icon: "⭐" },
                ].map((report) => (
                  <div
                    key={report.title}
                    className="bg-surface-secondary rounded-xl p-4 border border-border/50 hover:border-primary/30 transition-all hover:shadow-md group cursor-pointer"
                  >
                    <div
                      className={`w-full h-28 bg-gradient-to-br ${report.color} rounded-lg mb-3 flex items-center justify-center relative overflow-hidden`}
                    >
                      <span className="text-3xl opacity-60">{report.icon}</span>
                      <div className="absolute bottom-0 left-0 right-0 h-12 flex items-end gap-1 px-3 pb-2">
                        {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 50, 95].map(
                          (h, i) => (
                            <div
                              key={i}
                              className="flex-1 bg-primary/20 rounded-t-sm"
                              style={{ height: `${h}%` }}
                            />
                          )
                        )}
                      </div>
                    </div>
                    <h4 className="font-medium text-text-primary text-sm group-hover:text-primary transition-colors">
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

      {/* Video showcase */}
      <section className="py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl overflow-hidden border border-border shadow-2xl">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-auto"
            >
              <source src="/DashPortal.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      </section>

      {/* Problems / Struggles we solve */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <h2 className="font-[family-name:var(--font-syne)] text-3xl sm:text-4xl font-bold text-text-primary">
              Herken je dit?
            </h2>
            <p className="mt-4 text-lg text-text-secondary">
              Power BI is krachtig, maar het delen van rapporten met externe
              gebruikers of klanten is frustrerend complex.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              {
                problem: "Klanten moeten een Microsoft-account aanmaken",
                description:
                  "Externe gebruikers begrijpen niet waarom ze een Microsoft-licentie nodig hebben alleen om een rapport te bekijken.",
              },
              {
                problem: "De Power BI interface is verwarrend voor eindgebruikers",
                description:
                  "Te veel menu's, knoppen en opties. Klanten raken verdwaald en stellen steeds dezelfde vragen.",
              },
              {
                problem: "Geen eigen branding of professionele uitstraling",
                description:
                  "Je stuurt klanten naar app.powerbi.com — niet bepaald een visitekaartje voor jouw organisatie.",
              },
              {
                problem: "Geen controle over wie wat ziet",
                description:
                  "Row-level security instellen kost uren, en je hebt geen overzicht van wie toegang heeft tot welk rapport.",
              },
              {
                problem: "Geen inzicht in metadata en data-kwaliteit",
                description:
                  "Wanneer is een dataset voor het laatst vernieuwd? Zijn er fouten? Je ontdekt het pas als een klant klaagt.",
              },
              {
                problem: "Tijd kwijt aan handmatig gebruikersbeheer",
                description:
                  "Elke nieuwe gebruiker, elk nieuw rapport — het is een handmatig proces van licenties, rechten en e-mails.",
              },
            ].map((item) => (
              <div
                key={item.problem}
                className="flex gap-4 p-5 bg-background rounded-xl border border-border"
              >
                <div className="shrink-0">
                  <div className="w-8 h-8 bg-danger/10 rounded-lg flex items-center justify-center">
                    <XCircle className="w-4 h-4 text-danger" />
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-text-primary text-sm">
                    {item.problem}
                  </h3>
                  <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="max-w-2xl mx-auto mt-14 text-center">
            <div className="inline-flex items-center gap-2 bg-success/10 text-success text-sm font-medium px-5 py-2 rounded-full mb-4">
              <CheckCircle2 className="w-4 h-4" />
              DashPortal lost dit allemaal op
            </div>
            <p className="text-text-secondary">
              Eén platform dat Power BI rapporten omzet naar een professioneel
              klantportaal — zonder technische kennis, binnen 10 minuten.
            </p>
          </div>
        </div>
      </section>

      {/* Features — three pillars */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <h2 className="font-[family-name:var(--font-syne)] text-3xl sm:text-4xl font-bold text-text-primary">
              Drie pijlers. Eén platform.
            </h2>
            <p className="mt-4 text-lg text-text-secondary">
              DashPortal combineert een gebruiksvriendelijk portaal met krachtig
              metadatabeheer en data-hygiëne monitoring.
            </p>
          </div>

          {/* Pillar 1: Portal */}
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Layers className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-text-primary">
                Branded Rapportportaal
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: Palette, title: "Eigen huisstijl", description: "Upload je logo, stel je kleuren in en gebruik je eigen domein. Jouw klanten zien jouw merk, niet het onze." },
                { icon: MousePointerClick, title: "Tegel-interface", description: "Rapporten als visuele tegels georganiseerd per werkruimte. Intuïtief, overzichtelijk en zonder Power BI-clutter." },
                { icon: Shield, title: "Row-Level Security", description: "Configureer per gebruiker welke data ze mogen zien. Volledig geïntegreerd met Power BI RLS." },
                { icon: Users, title: "Gebruikersbeheer", description: "Nodig gebruikers uit per e-mail, beheer rollen en bepaal per persoon welke rapporten zichtbaar zijn." },
                { icon: Globe, title: "Eigen domein", description: "Gebruik data.jouwbedrijf.nl in plaats van een generiek Power BI adres. Professioneel en herkenbaar." },
                { icon: Lock, title: "Microsoft SSO", description: "Laat gebruikers inloggen met hun bestaande Microsoft-account. Geen extra wachtwoorden nodig." },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="bg-surface rounded-xl p-6 border border-border hover:border-primary/20 transition-colors"
                >
                  <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h4 className="font-[family-name:var(--font-syne)] font-bold text-text-primary mb-2">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Pillar 2: Metadata */}
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-text-primary">
                Metadatabeheer
              </h3>
            </div>
            <div className="bg-surface rounded-2xl border border-border p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <p className="text-text-secondary leading-relaxed mb-6">
                    Houd grip op je Power BI omgeving. DashPortal synchroniseert
                    automatisch metadata van al je werkruimtes, datasets en
                    rapporten — zodat je altijd actueel inzicht hebt.
                  </p>
                  <ul className="space-y-3">
                    {[
                      "Automatische synchronisatie van werkruimtes en rapporten",
                      "Overzicht van alle datasets, eigenaren en verversingsstatus",
                      "Rapportconfiguratie per workspace in één dashboard",
                      "Wijzigingshistorie en audit trail",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                        <span className="text-text-primary">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-surface-secondary rounded-xl border border-border p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <RefreshCw className="w-4 h-4 text-accent" />
                    <span className="text-sm font-medium text-text-primary">
                      Metadata Overzicht
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      { label: "Werkruimtes", value: "4", color: "text-primary" },
                      { label: "Datasets", value: "12", color: "text-accent" },
                      { label: "Rapporten", value: "23", color: "text-success" },
                      { label: "Gebruikers", value: "48", color: "text-primary" },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-background rounded-lg p-3">
                        <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                        <p className="text-xs text-text-secondary">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {[
                      { name: "Sales Dataset", time: "Vandaag 06:00", status: "success" },
                      { name: "HR Dataset", time: "Vandaag 06:15", status: "success" },
                      { name: "Finance Dataset", time: "Gisteren 23:00", status: "warning" },
                    ].map((ds) => (
                      <div key={ds.name} className="flex items-center justify-between bg-background rounded-lg px-3 py-2">
                        <span className="text-xs text-text-primary">{ds.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-text-secondary">{ds.time}</span>
                          <div className={`w-2 h-2 rounded-full ${ds.status === "success" ? "bg-success" : "bg-warning"}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pillar 3: Hygiene */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-success" />
              </div>
              <h3 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-text-primary">
                Data-hygiëne Monitoring
              </h3>
            </div>
            <div className="bg-surface rounded-2xl border border-border p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="bg-surface-secondary rounded-xl border border-border p-5 order-2 lg:order-1">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-text-primary">Hygiëne Score</span>
                    <span className="text-2xl font-bold text-success">87%</span>
                  </div>
                  <div className="w-full bg-border rounded-full h-3 mb-5">
                    <div className="bg-success h-3 rounded-full" style={{ width: "87%" }} />
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { check: "Alle datasets vernieuwd afgelopen 24u", ok: true },
                      { check: "Geen verweesde rapporten gevonden", ok: true },
                      { check: "RLS geconfigureerd op alle gevoelige datasets", ok: true },
                      { check: "2 datasets zonder eigenaar gedetecteerd", ok: false },
                      { check: "1 werkruimte met verouderde rapporten", ok: false },
                    ].map((item) => (
                      <div key={item.check} className="flex items-start gap-2.5 text-xs">
                        {item.ok ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-success mt-0.5 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-warning mt-0.5 shrink-0" />
                        )}
                        <span className={item.ok ? "text-text-secondary" : "text-text-primary font-medium"}>
                          {item.check}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="order-1 lg:order-2">
                  <p className="text-text-secondary leading-relaxed mb-6">
                    Voorkom dat klanten naar verouderde of kapotte rapporten
                    kijken. DashPortal monitort continu de gezondheid van je
                    Power BI omgeving en waarschuwt je proactief.
                  </p>
                  <ul className="space-y-3">
                    {[
                      "Automatische hygiënescore per werkruimte",
                      "Alerts bij mislukte dataset-vernieuwingen",
                      "Detectie van verweesde of ongebruikte rapporten",
                      "Monitoring van RLS-configuratie en datakwaliteit",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                        <span className="text-text-primary">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works — 5 steps */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <h2 className="font-[family-name:var(--font-syne)] text-3xl sm:text-4xl font-bold text-text-primary">
              In 5 stappen live
            </h2>
            <p className="mt-4 text-lg text-text-secondary">
              Geen ingewikkelde installatie. Geen IT-afdeling nodig. Volg onze
              wizard en je portaal staat binnen 10 minuten online.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {[
              { step: 1, icon: CreditCard, title: "Kies je plan", description: "Start met een gratis 14-dagen trial. Geen creditcard nodig. Kies later het plan dat bij je past." },
              { step: 2, icon: CloudCog, title: "Koppel Power BI", description: "Verbind je Microsoft Power BI account. We synchroniseren automatisch je werkruimtes en rapporten." },
              { step: 3, icon: Palette, title: "Style je portaal", description: "Upload je logo, kies je kleuren en koppel eventueel je eigen domein. Klaar in 2 minuten." },
              { step: 4, icon: Users, title: "Nodig gebruikers uit", description: "Voeg gebruikers toe per e-mail of importeer ze uit Azure AD. Stel per persoon in welke rapporten ze zien." },
              { step: 5, icon: Zap, title: "Ga live!", description: "Deel de link met je klanten of collega's. Zij loggen in en zien direct hun persoonlijke rapportomgeving." },
            ].map((item, index) => (
              <div key={item.step} className="flex gap-6 items-start">
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary/20">
                    {item.step}
                  </div>
                  {index < 4 && <div className="w-0.5 h-16 bg-border mt-2" />}
                </div>
                <div className="pb-10">
                  <div className="flex items-center gap-3 mb-2">
                    <item.icon className="w-5 h-5 text-primary" />
                    <h3 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text-primary">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-text-secondary leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof / Trust */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-surface rounded-2xl border border-border p-10 text-center">
              <HeartHandshake className="w-10 h-10 text-primary mx-auto mb-4" />
              <h2 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-text-primary mb-3">
                Gebouwd door Power BI specialisten
              </h2>
              <p className="text-text-secondary max-w-2xl mx-auto leading-relaxed">
                DashPortal is ontwikkeld door Power BI Studio — met jarenlange
                ervaring in het bouwen van Power BI oplossingen voor organisaties
                in heel Nederland. We kennen de uitdagingen, want we lossen ze
                dagelijks op voor onze klanten.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-surface">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-[family-name:var(--font-syne)] text-3xl sm:text-4xl font-bold text-text-primary">
            Klaar om te starten?
          </h2>
          <p className="mt-4 text-lg text-text-secondary max-w-xl mx-auto">
            Maak in enkele minuten een branded dataportaal voor jouw organisatie.
            Geen creditcard nodig.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/onboarding/plan"
              className="inline-flex items-center gap-2 h-12 px-8 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-all duration-200 shadow-lg shadow-primary/20"
            >
              Start 14 dagen gratis
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 h-12 px-8 bg-surface border border-border text-text-primary font-medium rounded-lg hover:bg-surface-secondary transition-colors"
            >
              Neem contact op
            </Link>
          </div>
          <p className="text-xs text-text-secondary mt-4">
            Geen creditcard nodig · Binnen 10 minuten live · Altijd opzegbaar
          </p>
        </div>
      </section>
    </>
  );
}
