import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacybeleid — DashPortal",
  description: "Privacybeleid en gegevensverwerking van DashPortal by DashPortal.",
};

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-text-primary mb-2">
        Privacybeleid
      </h1>
      <p className="text-sm text-text-secondary mb-10">
        Laatst bijgewerkt: 12 maart 2026
      </p>

      <div className="prose prose-sm max-w-none text-text-secondary [&_h2]:font-[family-name:var(--font-syne)] [&_h2]:text-text-primary [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-3 [&_h3]:text-text-primary [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:mb-4 [&_p]:leading-relaxed [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1">
        <h2>1. Wie zijn wij?</h2>
        <p>
          DashPortal is een product van DashPortal. Wij bieden een
          white-label SaaS-platform waarmee organisaties hun Power BI
          rapporten veilig delen met medewerkers en klanten via een eigen
          branded dataportaal.
        </p>
        <p>
          <strong>
            Belangrijk: DashPortal slaat geen klantdata op uit Power BI
            rapporten.
          </strong>{" "}
          Alle rapportdata (tabellen, grafieken, datasets) blijft te allen
          tijde bij Microsoft Power BI. Het Platform fungeert uitsluitend als
          een beveiligde laag voor het presenteren en delen van bestaande
          rapporten.
        </p>

        <h2>2. Welke gegevens verwerken wij?</h2>
        <p>
          Hoewel wij geen rapportdata opslaan, verwerken wij wel de minimale
          gegevens die nodig zijn om het Platform te laten functioneren:
        </p>

        <h3>Accountgegevens</h3>
        <p>
          Bij registratie verwerken wij: naam, e-mailadres, bedrijfsnaam en
          het gekozen abonnementsplan. Deze gegevens zijn nodig voor het
          aanmaken en beheren van je account.
        </p>

        <h3>Gebruiksgegevens</h3>
        <p>
          Wij registreren welke rapporten worden bekeken (rapport-views),
          inlogmomenten en acties die beheerders uitvoeren in het dashboard
          (activiteitslog). Dit helpt ons bij het verbeteren van het
          product en bij het bieden van ondersteuning.
        </p>

        <h3>Technische gegevens</h3>
        <p>
          Bij gebruik van het platform worden automatisch technische
          gegevens verzameld zoals IP-adres, browser-type en
          besturingssysteem. Deze gegevens worden geanonimiseerd verwerkt.
        </p>

        <h2>3. Cookies</h2>
        <p>Wij gebruiken de volgende categorien cookies:</p>
        <ul>
          <li>
            <strong>Essentieel:</strong> Noodzakelijk voor het functioneren
            van het platform (sessie, authenticatie, CSRF-bescherming).
            Deze cookies kunnen niet worden uitgeschakeld.
          </li>
          <li>
            <strong>Analytics:</strong> Anonieme gebruiksstatistieken om
            het product te verbeteren. Je kunt deze cookies weigeren via de
            cookie-banner.
          </li>
        </ul>
        <p>
          Wij gebruiken geen tracking- of advertentiecookies.
        </p>

        <h2>4. Rechtsgrond voor verwerking</h2>
        <p>Wij verwerken persoonsgegevens op basis van:</p>
        <ul>
          <li>
            <strong>Uitvoering van de overeenkomst:</strong> Voor het
            leveren van onze dienst (Art. 6(1)(b) AVG).
          </li>
          <li>
            <strong>Gerechtvaardigd belang:</strong> Voor beveiliging,
            fraudepreventie en productontwikkeling (Art. 6(1)(f) AVG).
          </li>
          <li>
            <strong>Toestemming:</strong> Voor analytics cookies (Art.
            6(1)(a) AVG).
          </li>
        </ul>

        <h2>5. Gegevensverwerkers</h2>
        <p>Wij maken gebruik van de volgende verwerkers:</p>
        <ul>
          <li>
            <strong>Supabase (Hetzner, EU):</strong> Database, authenticatie
            en opslag
          </li>
          <li>
            <strong>Vercel (AWS, EU/US):</strong> Hosting en CDN
          </li>
          <li>
            <strong>Resend:</strong> Transactionele e-mails
          </li>
          <li>
            <strong>Stripe:</strong> Betalingsverwerking
          </li>
          <li>
            <strong>Microsoft Azure:</strong> Power BI embed tokens
          </li>
        </ul>

        <h2>6. Bewartermijnen</h2>
        <p>
          Accountgegevens worden bewaard zolang je account actief is. Na
          opzegging worden gegevens binnen 30 dagen verwijderd, tenzij
          wettelijke bewaarplichten gelden.
        </p>
        <p>
          Activiteitslogboeken worden maximaal 12 maanden bewaard.
          Rapport-views worden maximaal 6 maanden bewaard.
        </p>

        <h2>7. Jouw rechten</h2>
        <p>
          Op grond van de AVG heb je de volgende rechten:
        </p>
        <ul>
          <li>Recht op inzage van je persoonsgegevens</li>
          <li>Recht op correctie van onjuiste gegevens</li>
          <li>Recht op verwijdering (&quot;recht op vergetelheid&quot;)</li>
          <li>Recht op dataportabiliteit (export)</li>
          <li>Recht op beperking van de verwerking</li>
          <li>Recht van bezwaar tegen verwerking</li>
        </ul>
        <p>
          Neem contact met ons op via{" "}
          <a
            href="mailto:privacy@dashportal.app"
            className="text-primary hover:underline"
          >
            privacy@dashportal.app
          </a>{" "}
          om je rechten uit te oefenen.
        </p>

        <h2>8. Verwerkersovereenkomst (DPA)</h2>
        <p>
          Als je als tenant persoonsgegevens van jouw gebruikers verwerkt
          via DashPortal, treedt DashPortal op als verwerker in de zin
          van de AVG. Bij het aanmaken van een account ga je akkoord met
          onze standaard verwerkersovereenkomst.
        </p>
        <p>
          Een kopie van de DPA kan worden opgevraagd via{" "}
          <a
            href="mailto:privacy@dashportal.app"
            className="text-primary hover:underline"
          >
            privacy@dashportal.app
          </a>
          .
        </p>

        <h2>9. Beveiliging</h2>
        <p>
          Wij nemen passende technische en organisatorische maatregelen om
          je gegevens te beschermen, waaronder:
        </p>
        <ul>
          <li>Versleuteling van gevoelige gegevens (AES-256)</li>
          <li>Row Level Security op database-niveau</li>
          <li>HTTPS/TLS voor alle communicatie</li>
          <li>Toegangscontrole op basis van rollen</li>
          <li>Regelmatige security audits</li>
        </ul>

        <h2>10. Wijzigingen</h2>
        <p>
          Dit privacybeleid kan worden bijgewerkt. Bij wezenlijke
          wijzigingen informeren wij je via e-mail of een melding in het
          platform.
        </p>

        <h2>11. Contact</h2>
        <p>
          Heb je vragen over dit privacybeleid of over de verwerking van
          je persoonsgegevens? Neem contact op via{" "}
          <a
            href="mailto:privacy@dashportal.app"
            className="text-primary hover:underline"
          >
            privacy@dashportal.app
          </a>
          .
        </p>
      </div>
    </main>
  );
}
