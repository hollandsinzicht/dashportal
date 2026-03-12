import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disclaimer — DashPortal",
  description: "Disclaimer en aansprakelijkheidsbeperking van DashPortal by DashPortal.",
};

export default function DisclaimerPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-text-primary mb-2">
        Disclaimer
      </h1>
      <p className="text-sm text-text-secondary mb-10">
        Laatst bijgewerkt: 12 maart 2026
      </p>

      <div className="prose prose-sm max-w-none text-text-secondary [&_h2]:font-[family-name:var(--font-syne)] [&_h2]:text-text-primary [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-3 [&_h3]:text-text-primary [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:mb-4 [&_p]:leading-relaxed [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1">
        <h2>1. Algemeen</h2>
        <p>
          Deze disclaimer is van toepassing op het gebruik van DashPortal
          (&quot;het Platform&quot;), een product van DashPortal. Door het
          Platform te gebruiken, ga je akkoord met de voorwaarden in deze
          disclaimer.
        </p>

        <h2>2. Aard van het Platform</h2>
        <p>
          DashPortal is een platform dat organisaties in staat stelt om hun
          bestaande Power BI rapporten te delen met medewerkers en klanten via
          een eigen branded dataportaal. Het Platform is uitsluitend een
          doorgeefluik.
        </p>
        <p>
          <strong>
            DashPortal slaat geen klantdata op uit Power BI rapporten.
          </strong>{" "}
          De inhoud van rapporten (tabellen, grafieken, datasets) blijft te
          allen tijde bij Microsoft Power BI. Het Platform verwerkt uitsluitend
          de minimale gegevens die nodig zijn om te functioneren, zoals
          accountgegevens, gebruikersinformatie en rapportmetadata.
        </p>

        <h2>3. Geen garantie op beschikbaarheid</h2>
        <p>
          Wij streven naar een hoge beschikbaarheid van het Platform, maar
          kunnen niet garanderen dat het Platform te allen tijde ononderbroken
          of foutloos beschikbaar zal zijn. Onderhoud, updates en
          omstandigheden buiten onze controle (zoals storingen bij Microsoft
          Power BI, Supabase of Vercel) kunnen leiden tot tijdelijke
          onbereikbaarheid.
        </p>

        <h2>4. Afhankelijkheid van derden</h2>
        <p>
          Het Platform is afhankelijk van diensten van derden, waaronder:
        </p>
        <ul>
          <li>
            <strong>Microsoft Power BI</strong> — voor het genereren van embed
            tokens en het ophalen van rapportinhoud
          </li>
          <li>
            <strong>Microsoft Azure AD</strong> — voor SSO-authenticatie en
            gebruikersimport
          </li>
          <li>
            <strong>Supabase</strong> — voor database, authenticatie en opslag
          </li>
          <li>
            <strong>Vercel</strong> — voor hosting en content delivery
          </li>
          <li>
            <strong>Stripe</strong> — voor betalingsverwerking
          </li>
        </ul>
        <p>
          DashPortal is niet aansprakelijk voor storingen, wijzigingen of
          beperkingen in deze diensten van derden.
        </p>

        <h2>5. Data-eigendom</h2>
        <p>
          Alle data in Power BI rapporten blijft eigendom van de tenant (de
          organisatie die het abonnement afneemt). DashPortal heeft geen
          toegang tot, noch eigendom over, de inhoud van rapporten. Wij
          verwerken uitsluitend:
        </p>
        <ul>
          <li>Accountgegevens (naam, e-mail, bedrijfsnaam)</li>
          <li>Gebruikersbeheer (namen, e-mailadressen, rollen)</li>
          <li>Rapportmetadata (titels, werkruimte-namen, refresh-statussen)</li>
          <li>Versleutelde Azure-credentials voor API-verbindingen</li>
          <li>Activiteits- en gebruikslogboeken</li>
        </ul>

        <h2>6. Beperking van aansprakelijkheid</h2>
        <p>
          DashPortal is niet aansprakelijk voor:
        </p>
        <ul>
          <li>
            Directe of indirecte schade als gevolg van het gebruik van het
            Platform
          </li>
          <li>
            Verlies van data, omzet of bedrijfsonderbreking
          </li>
          <li>
            Onjuiste, onvolledige of verouderde informatie in Power BI
            rapporten (deze worden door de tenant zelf beheerd)
          </li>
          <li>
            Ongeautoriseerde toegang als gevolg van onjuiste configuratie door
            de tenant (bijv. verkeerde Row Level Security instellingen)
          </li>
          <li>
            Schade voortvloeiend uit storingen bij derden (Microsoft, Supabase,
            Vercel, Stripe)
          </li>
        </ul>
        <p>
          De totale aansprakelijkheid van DashPortal is in alle gevallen
          beperkt tot het bedrag dat de tenant in de afgelopen 12 maanden aan
          abonnementskosten heeft betaald.
        </p>

        <h2>7. Beveiliging</h2>
        <p>
          Wij nemen passende technische maatregelen om de veiligheid van het
          Platform te waarborgen, maar kunnen geen absolute veiligheid
          garanderen. Tenants zijn zelf verantwoordelijk voor:
        </p>
        <ul>
          <li>Het correct configureren van toegangsrechten en RLS</li>
          <li>Het veilig bewaren van inloggegevens</li>
          <li>Het beheer van gebruikerstoegang binnen hun organisatie</li>
        </ul>

        <h2>8. Intellectueel eigendom</h2>
        <p>
          Alle intellectuele eigendomsrechten op het Platform (code, design,
          merk) berusten bij DashPortal. Tenants behouden volledig eigendom
          over hun eigen data, branding-materialen en Power BI content.
        </p>

        <h2>9. Wijzigingen</h2>
        <p>
          DashPortal behoudt zich het recht voor om deze disclaimer te allen
          tijde te wijzigen. Bij wezenlijke wijzigingen informeren wij je via
          e-mail of een melding in het Platform.
        </p>

        <h2>10. Contact</h2>
        <p>
          Heb je vragen over deze disclaimer? Neem contact op via{" "}
          <a
            href="mailto:info@dashportal.app"
            className="text-primary hover:underline"
          >
            info@dashportal.app
          </a>
          .
        </p>
      </div>
    </main>
  );
}
