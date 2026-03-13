# DashPortal — Deployment Guide

## Pre-requisites

- [x] Vercel project gekoppeld aan GitHub (`hollandsinzicht/dashportal`)
- [x] Domeinen geconfigureerd: `dashportal.app`, `app.dashportal.app`, `www.dashportal.app`
- [x] Build slaagt (65 routes, 0 errors)
- [x] Marketing site live en bereikbaar

---

## Stap 1: Supabase Configuratie

### 1a. Schema deployen

1. Ga naar [Supabase Dashboard](https://supabase.com/dashboard) → Project `egtjjxqldibtkvshppcl`
2. Open **SQL Editor**
3. Plak de inhoud van `supabase/schema.sql`
4. Klik **Run** — dit maakt alle 7 tabellen + RLS policies + indexes

**Tabellen die aangemaakt worden:**
- `tenants` — Klantorganisaties
- `tenant_users` — Gebruikers per tenant
- `reports` — Power BI rapporten
- `report_access` — Wie mag welk rapport zien
- `rls_roles` — RLS rolconfiguratie per gebruiker/rapport
- `report_views` — Rapport bekeken-statistieken
- `activity_log` — Audit trail

### 1b. Storage Buckets aanmaken

1. Ga naar **Storage** → **New Bucket**
2. Maak twee **public** buckets:
   - `logos` — Tenant logo uploads
   - `thumbnails` — Rapport/werkruimte thumbnail uploads
3. Zet voor beide buckets:
   - **Public**: Aan
   - **File size limit**: 5MB
   - **Allowed MIME types**: `image/png, image/jpeg, image/webp`

### 1c. Auth Redirect URLs

1. Ga naar **Authentication** → **URL Configuration**
2. **Site URL**: `https://app.dashportal.app`
3. **Redirect URLs** (voeg alle drie toe):
   ```
   https://dashportal.app/auth/callback
   https://app.dashportal.app/auth/callback
   https://*.dashportal.app/auth/callback
   ```
4. **Email Templates** → Controleer dat de confirm URL wijst naar `/auth/confirm`

### 1d. Auth Email Templates (optioneel)

Supabase stuurt standaard Engelse emails. Pas de templates aan in **Authentication** → **Email Templates**:

- **Confirm signup**: Welkom bij DashPortal...
- **Magic Link**: Je login link voor DashPortal...
- **Invite user**: Je bent uitgenodigd voor DashPortal...

---

## Stap 2: Stripe Configuratie

### 2a. Live modus activeren

1. Ga naar [Stripe Dashboard](https://dashboard.stripe.com)
2. Schakel **Test mode** uit → **Live mode**
3. Maak 3 producten/prijzen aan (of gebruik bestaande):
   - **Starter**: €99/maand (recurring)
   - **Business**: €249/maand (recurring)
   - **Scale**: €499/maand (recurring)
4. Noteer de `price_xxx` IDs

### 2b. Webhook instellen

1. Ga naar **Developers** → **Webhooks** → **Add endpoint**
2. **Endpoint URL**: `https://dashportal.app/api/stripe/webhook`
3. **Events** (selecteer deze):
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`
   - `invoice.payment_failed`
   - `invoice.paid`
4. Noteer de **Signing secret** (`whsec_...`)

### 2c. Env vars bijwerken

Vervang in Vercel env vars:
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...  (van de LIVE webhook)
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_BUSINESS=price_...
STRIPE_PRICE_SCALE=price_...
```

---

## Stap 3: Resend (Email)

### 3a. DNS verifiëren

DNS records voor `send.dashportal.app`:
- **MX** record: `feedback-smtp.eu-west-1.amazonses.com` (priority 10)
- **TXT** record: `v=spf1 include:amazonses.com ~all`

1. Ga naar [Resend Dashboard](https://resend.com/domains)
2. Klik **Verify** bij `dashportal.app`
3. Wacht tot status "Verified" is (kan tot 48u duren)

### 3b. Test email

Na verificatie, stuur een test-email vanuit Resend dashboard om te bevestigen dat sending werkt.

---

## Stap 4: Vercel Environment Variables

Ga naar **Vercel** → **Settings** → **Environment Variables** en zorg dat ALLE variabelen ingesteld zijn voor **Production**:

| Variabele | Waarde | Scope |
|-----------|--------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://egtjjxqldibtkvshppcl.supabase.co` | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | All |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Production + Preview |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Production |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Production |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Production |
| `STRIPE_PRICE_STARTER` | `price_...` | All |
| `STRIPE_PRICE_BUSINESS` | `price_...` | All |
| `STRIPE_PRICE_SCALE` | `price_...` | All |
| `RESEND_API_KEY` | `re_...` | Production + Preview |
| `RESEND_FROM_EMAIL` | `noreply@dashportal.app` | All |
| `ENCRYPTION_KEY` | (base64 key) | Production + Preview |
| `SUPER_ADMIN_EMAIL` | `info@dashportal.app` | All |
| `NEXT_PUBLIC_APP_URL` | `https://dashportal.app` | All |
| `NEXT_PUBLIC_ROOT_DOMAIN` | `dashportal.app` | All |
| `NEXT_PUBLIC_CRISP_WEBSITE_ID` | `830cd031-...` | All |
| `VERCEL_TOKEN` | `vcp_...` | Production + Preview |
| `VERCEL_PROJECT_ID` | `prj_oPDmYKF4Npw84sW7ITVQhRAbrmHt` | All |

**Optioneel (niet nodig voor MVP):**
- `AZURE_AD_CLIENT_ID` — Microsoft SSO
- `AZURE_AD_CLIENT_SECRET` — Microsoft SSO
- `AZURE_AD_TENANT_ID` — Microsoft SSO
- `NEXTAUTH_SECRET` — Microsoft SSO
- `NEXTAUTH_URL` — Microsoft SSO

Na het instellen van alle variabelen: **Redeploy** via Vercel dashboard.

---

## Stap 5: Smoke Test

Na deployment, test de volledige flow:

### 5a. Marketing site
- [ ] `https://dashportal.app` laadt correct
- [ ] `https://www.dashportal.app` redirect naar `dashportal.app`
- [ ] Pricing pagina toont correcte prijzen
- [ ] Demo pagina werkt

### 5b. Onboarding flow
- [ ] Klik "Start gratis proefperiode" op pricing pagina
- [ ] Vul bedrijfsnaam in → slug wordt gegenereerd
- [ ] Branding stap: logo upload werkt (test Storage bucket)
- [ ] Plan selectie → Stripe checkout opent (test met testkaart als nog in test mode)
- [ ] Na checkout → redirect naar dashboard

### 5c. Admin Dashboard
- [ ] `https://app.dashportal.app/dashboard` laadt
- [ ] Rapporten pagina toont (leeg als geen PBI config)
- [ ] Gebruikers pagina toont admin gebruiker
- [ ] Instellingen pagina toont branding opties

### 5d. Portal (tenant subdomain)
- [ ] `https://[slug].dashportal.app` laadt login pagina
- [ ] Login met magic link werkt (test Resend)
- [ ] Na login: rapport tiles verschijnen (als PBI geconfigureerd)

### 5e. Super Admin
- [ ] `https://app.dashportal.app/admin` → alleen toegankelijk met `info@dashportal.app`
- [ ] Tenant overzicht toont nieuwe test-tenant

---

## Stap 6: Go Live Checklist

- [ ] Stripe staat in **Live mode**
- [ ] Stripe webhook endpoint is actief en verified
- [ ] Resend domein is geverifieerd
- [ ] Supabase schema is deployed
- [ ] Storage buckets (logos, thumbnails) zijn aangemaakt
- [ ] Auth redirect URLs zijn ingesteld
- [ ] Alle Vercel env vars zijn ingesteld voor Production
- [ ] Smoke test is volledig doorlopen
- [ ] Crisp chat widget verschijnt op de site

---

## Troubleshooting

### "Not authenticated" errors
→ Check Supabase Auth redirect URLs. Zorg dat `https://*.dashportal.app/auth/callback` toegevoegd is.

### Upload mislukt
→ Check dat de Storage buckets `logos` en `thumbnails` bestaan en **public** zijn.

### Stripe checkout mislukt
→ Check dat de Stripe keys **live** zijn (niet `pk_test_`/`sk_test_`). Controleer of de Price IDs overeenkomen.

### Emails komen niet aan
→ Check Resend domein verificatie. SPF record moet op `send.dashportal.app` staan, niet op root.

### RLS detectie werkt niet
→ Normaal als er nog geen Power BI is geconfigureerd. De form toont een grijze fallback.

### Cron jobs mislukken
→ Vercel Hobby plan: max 1 cron per dag. Check `vercel.json` schedules.
