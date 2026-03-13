import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Algemene Voorwaarden — DashPortal",
  description: "Algemene voorwaarden voor het gebruik van DashPortal by DashPortal.",
};

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-text-primary mb-2">
        Algemene Voorwaarden
      </h1>
      <p className="text-sm text-text-secondary mb-10">
        Laatst bijgewerkt: 13 maart 2026
      </p>

      <div className="prose prose-sm max-w-none text-text-secondary [&_h2]:font-[family-name:var(--font-syne)] [&_h2]:text-text-primary [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-3 [&_h3]:text-text-primary [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:mb-4 [&_p]:leading-relaxed [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1">
        <h2>1. Definities</h2>
        <ul>
          <li>
            <strong>Platform:</strong> DashPortal, het SaaS-platform van
            DashPortal waarmee organisaties Power BI rapporten delen via een
            eigen branded dataportaal.
          </li>
          <li>
            <strong>Tenant:</strong> De organisatie die een abonnement afneemt
            op het Platform en daarmee een eigen portaalomgeving beheert.
          </li>
          <li>
            <strong>Eindgebruiker:</strong> Een persoon die door de Tenant
            toegang heeft gekregen tot het portaal om rapporten te bekijken.
          </li>
          <li>
            <strong>Beheerder:</strong> Een gebruiker met admin-rechten binnen
            een Tenant-omgeving.
          </li>
          <li>
            <strong>DashPortal:</strong> De onderneming die het Platform
            exploiteert en aanbiedt.
          </li>
          <li>
            <strong>Agency:</strong> Een organisatie (zoals een consultancy,
            adviesbureau of IT-dienstverlener) die via het Agency &amp; Reseller
            Programma meerdere Tenant-omgevingen beheert namens haar klanten.
          </li>
          <li>
            <strong>Klantportaal:</strong> Een Tenant-omgeving die door een
            Agency wordt aangemaakt en beheerd ten behoeve van een klant van
            de Agency.
          </li>
        </ul>

        <h2>2. Toepasselijkheid</h2>
        <p>
          Deze algemene voorwaarden zijn van toepassing op ieder gebruik van
          het Platform en op alle overeenkomsten tussen DashPortal en de
          Tenant. Door een account aan te maken of het Platform te gebruiken,
          ga je akkoord met deze voorwaarden.
        </p>

        <h2>3. Beschrijving van de dienst</h2>
        <p>
          DashPortal biedt een platform waarmee Tenants hun bestaande Microsoft
          Power BI rapporten kunnen delen met eindgebruikers via een eigen
          branded portaal. Het Platform biedt onder meer:
        </p>
        <ul>
          <li>White-label portaal met eigen branding (logo, kleuren, domein)</li>
          <li>Gebruikersbeheer met rolgebaseerde toegangscontrole</li>
          <li>Power BI rapport-embedding met Row Level Security</li>
          <li>Metadata monitoring en hygiene scoring</li>
          <li>Optioneel: Microsoft SSO en Azure AD gebruikersimport</li>
        </ul>
        <p>
          <strong>
            Het Platform slaat geen klantdata uit Power BI rapporten op.
          </strong>{" "}
          Alle rapportdata blijft bij Microsoft. Het Platform fungeert
          uitsluitend als een beveiligde laag voor het presenteren en delen
          van bestaande rapporten.
        </p>

        <h2>4. Account en registratie</h2>
        <p>
          Om het Platform te gebruiken dient de Tenant een account aan te
          maken. De Tenant is verantwoordelijk voor:
        </p>
        <ul>
          <li>Het verstrekken van correcte en actuele informatie</li>
          <li>Het beveiligen van inloggegevens</li>
          <li>
            Alle activiteiten die plaatsvinden onder het Tenant-account,
            inclusief acties van Beheerders en Eindgebruikers
          </li>
        </ul>

        <h2>5. Abonnementen en betaling</h2>
        <h3>5.1 Plannen</h3>
        <p>
          Het Platform wordt aangeboden in verschillende abonnementsplannen
          (Starter, Business, Scale, Enterprise), elk met eigen functies en
          gebruikerslimieten. De actuele specificaties en prijzen staan
          vermeld op de{" "}
          <a href="/pricing" className="text-primary hover:underline">
            prijzenpagina
          </a>
          .
        </p>

        <h3>5.2 Proefperiode</h3>
        <p>
          Nieuwe Tenants kunnen gebruikmaken van een gratis proefperiode van
          14 dagen. Tijdens de proefperiode zijn alle functies beschikbaar.
          Na afloop wordt het account gedowngraded tenzij een betaald plan
          wordt geactiveerd.
        </p>

        <h3>5.3 Betaling</h3>
        <p>
          Betalingen worden maandelijks of jaarlijks vooruit gefactureerd via
          Stripe. De Tenant is verantwoordelijk voor tijdige betaling. Bij
          het uitblijven van betaling kan de toegang tot het Platform worden
          opgeschort.
        </p>

        <h3>5.4 Opzegging</h3>
        <p>
          De Tenant kan het abonnement op elk moment opzeggen via het
          dashboard. Na opzegging blijft het account actief tot het einde van
          de lopende factuurperiode. Na afloop worden gegevens conform ons{" "}
          <a href="/privacy" className="text-primary hover:underline">
            privacybeleid
          </a>{" "}
          verwijderd.
        </p>

        <h2>6. Agency &amp; Reseller Programma</h2>
        <h3>6.1 Toepasselijkheid</h3>
        <p>
          Dit artikel is aanvullend van toepassing op Agencies die gebruikmaken
          van het Agency &amp; Reseller Programma. De overige artikelen in deze
          voorwaarden blijven onverminderd van kracht.
        </p>

        <h3>6.2 Facturatie voor Agencies</h3>
        <p>
          Agencies ontvangen maandelijks één geconsolideerde factuur voor alle
          actieve Klantportalen. De prijs per Klantportaal wordt bepaald op
          basis van het aantal actieve gebruikers in dat portaal, conform de op
          dat moment geldende prijsschijven. De actuele tarieven staan vermeld
          op de{" "}
          <a href="/pricing/agencies" className="text-primary hover:underline">
            agency pricing pagina
          </a>
          . Tellingen vinden plaats op de eerste dag van elke kalendermaand.
        </p>

        <h3>6.3 Definitie van een gebruiker</h3>
        <p>
          Een &quot;gebruiker&quot; in het kader van de facturatie is een persoon
          met een actief account in een Klantportaal, ongeacht of deze persoon
          in de betreffende maand daadwerkelijk heeft ingelogd. Gedeactiveerde
          accounts tellen niet mee voor de facturatie.
        </p>

        <h3>6.4 Verantwoordelijkheden van de Agency</h3>
        <p>
          De Agency is verantwoordelijk voor:
        </p>
        <ul>
          <li>
            Het aanmaken, configureren en beheren van Klantportalen
          </li>
          <li>
            Het correct instellen van toegangsrechten, branding en rapportkoppelingen
            per Klantportaal
          </li>
          <li>
            De relatie met en ondersteuning van haar eigen klanten
          </li>
          <li>
            Het informeren van haar klanten over de toepasselijke voorwaarden
            en het privacybeleid van DashPortal
          </li>
          <li>
            Tijdige betaling van de geconsolideerde factuur
          </li>
        </ul>

        <h3>6.5 Verantwoordelijkheden van DashPortal</h3>
        <p>
          DashPortal is verantwoordelijk voor:
        </p>
        <ul>
          <li>
            Het beschikbaar houden en onderhouden van het Platform
            (hosting, infrastructuur, beveiliging)
          </li>
          <li>
            Het doorvoeren van updates, bugfixes en nieuwe functies
          </li>
          <li>
            Het onderhouden van de koppeling met Microsoft Power BI
            (embed tokens, metadata-sync)
          </li>
          <li>
            Het verwerken van de maandelijkse facturatie via Stripe
          </li>
          <li>
            Technische support bij platformgerelateerde problemen
          </li>
        </ul>

        <h3>6.6 White-label en doorverkoop</h3>
        <p>
          Agencies mogen het Platform op white-label basis aanbieden aan hun
          klanten. De Agency is vrij om eigen tarieven te hanteren richting
          haar klanten. De Agency mag het Platform niet presenteren als een
          eigen product zonder vermelding dat het draait op DashPortal-technologie,
          tenzij schriftelijk anders overeengekomen.
        </p>

        <h3>6.7 Beëindiging Agency-account</h3>
        <p>
          Bij beëindiging van het Agency-account worden alle gekoppelde
          Klantportalen gedeactiveerd na een overgangsperiode van 30 dagen.
          Gedurende deze periode kan de Agency haar klanten informeren en
          eventueel zelfstandige Tenant-accounts laten aanmaken.
        </p>

        <h2>7. Gebruik van het Platform</h2>
        <h3>7.1 Toegestaan gebruik</h3>
        <p>
          De Tenant mag het Platform gebruiken voor het delen van eigen
          Power BI rapporten met geautoriseerde eindgebruikers. Het Platform
          mag niet worden gebruikt voor:
        </p>
        <ul>
          <li>Illegale activiteiten of het delen van illegale content</li>
          <li>
            Het overbelasten of verstoren van het Platform of de
            onderliggende infrastructuur
          </li>
          <li>
            Het omzeilen van beveiligingsmaatregelen of toegangscontroles
          </li>
          <li>
            Het doorverkopen of herverdelen van het Platform zonder
            schriftelijke toestemming
          </li>
        </ul>

        <h3>7.2 Verantwoordelijkheid van de Tenant</h3>
        <p>
          De Tenant is verantwoordelijk voor:
        </p>
        <ul>
          <li>
            De juistheid en rechtmatigheid van gedeelde Power BI rapporten
          </li>
          <li>
            Het correct configureren van Row Level Security en
            toegangsrechten
          </li>
          <li>
            Het beheer van Eindgebruikers en hun toegangsniveaus
          </li>
          <li>
            Naleving van toepasselijke wet- en regelgeving, waaronder de AVG
          </li>
        </ul>

        <h2>8. Beschikbaarheid en onderhoud</h2>
        <p>
          DashPortal streeft naar een beschikbaarheid van 99,5% op
          maandbasis, exclusief gepland onderhoud en overmacht. Gepland
          onderhoud wordt, waar mogelijk, vooraf aangekondigd.
        </p>
        <p>
          Het Platform is afhankelijk van diensten van derden (Microsoft,
          Supabase, Vercel). DashPortal is niet aansprakelijk voor
          storingen in deze diensten.
        </p>

        <h2>9. Intellectueel eigendom</h2>
        <p>
          Alle intellectuele eigendomsrechten op het Platform (broncode,
          ontwerp, merknaam) berusten bij DashPortal. De Tenant behoudt
          alle rechten op eigen data, branding en Power BI content.
        </p>
        <p>
          De Tenant verleent DashPortal een beperkte licentie om
          branding-materialen (logo, kleuren) te gebruiken uitsluitend voor
          het weergeven van het Tenant-portaal.
        </p>

        <h2>10. Gegevensbescherming</h2>
        <p>
          DashPortal verwerkt persoonsgegevens conform de Algemene
          Verordening Gegevensbescherming (AVG). Voor details over welke
          gegevens wij verwerken, verwijzen wij naar ons{" "}
          <a href="/privacy" className="text-primary hover:underline">
            privacybeleid
          </a>
          .
        </p>
        <p>
          Wanneer de Tenant via het Platform persoonsgegevens van
          Eindgebruikers verwerkt, treedt DashPortal op als verwerker.
          Een verwerkersovereenkomst (DPA) is onderdeel van deze
          overeenkomst.
        </p>

        <h2>11. Aansprakelijkheid</h2>
        <p>
          De aansprakelijkheid van DashPortal is beperkt tot het bedrag
          dat de Tenant in de 12 maanden voorafgaand aan het schadeveroorzakende
          feit aan abonnementskosten heeft betaald.
        </p>
        <p>
          DashPortal is in geen geval aansprakelijk voor indirecte schade,
          gevolgschade, gederfde winst of verlies van data. Zie onze{" "}
          <a href="/disclaimer" className="text-primary hover:underline">
            disclaimer
          </a>{" "}
          voor meer details.
        </p>

        <h2>12. Overmacht</h2>
        <p>
          DashPortal is niet gehouden tot nakoming van enige verplichting
          indien zij daartoe verhinderd is als gevolg van overmacht. Onder
          overmacht wordt onder meer verstaan: storingen bij derden,
          internetproblemen, stroomuitval, natuurrampen en overheidsmaatregelen.
        </p>

        <h2>13. Wijzigingen</h2>
        <p>
          DashPortal kan deze voorwaarden wijzigen. Wezenlijke wijzigingen
          worden minimaal 30 dagen vooraf per e-mail aangekondigd. Voortgezet
          gebruik na de wijzigingsdatum geldt als aanvaarding van de nieuwe
          voorwaarden.
        </p>

        <h2>14. Toepasselijk recht</h2>
        <p>
          Op deze voorwaarden en het gebruik van het Platform is Nederlands
          recht van toepassing. Geschillen worden voorgelegd aan de bevoegde
          rechter in het arrondissement waar DashPortal gevestigd is.
        </p>

        <h2>15. Contact</h2>
        <p>
          Heb je vragen over deze voorwaarden? Neem contact op via{" "}
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
