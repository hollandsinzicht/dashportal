"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

const COOKIE_CONSENT_KEY = "dp_cookie_consent";

/**
 * Leest cookie consent uit localStorage of document.cookie.
 * Komt overeen met de logica in CookieBanner.tsx.
 */
function getConsent(): string | null {
  if (typeof window !== "undefined") {
    const ls = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (ls) return ls;
  }
  if (typeof document !== "undefined") {
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${COOKIE_CONSENT_KEY}=([^;]*)`)
    );
    return match ? decodeURIComponent(match[1]) : null;
  }
  return null;
}

/**
 * Laadt Google Analytics en Meta Pixel ALLEEN als de gebruiker
 * analytics cookies heeft geaccepteerd ("analytics" of "all").
 *
 * AVG/GDPR: tracking scripts mogen pas laden na expliciete consent.
 */
export function AnalyticsScripts() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    // Check initieel
    const consent = getConsent();
    if (consent === "all" || consent === "analytics") {
      setAllowed(true);
      return;
    }

    // Luister naar consent changes (vanuit CookieBanner)
    function onStorage(e: StorageEvent) {
      if (e.key === COOKIE_CONSENT_KEY) {
        const val = e.newValue;
        if (val === "all" || val === "analytics") {
          setAllowed(true);
        }
      }
    }

    // Luister ook naar custom event (voor same-tab updates)
    function onConsent() {
      const val = getConsent();
      if (val === "all" || val === "analytics") {
        setAllowed(true);
      }
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener("cookie-consent-update", onConsent);

    // Poll als fallback (cookie banner zit in dezelfde tab)
    const interval = setInterval(onConsent, 1000);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("cookie-consent-update", onConsent);
      clearInterval(interval);
    };
  }, []);

  if (!allowed) return null;

  return (
    <>
      {/* Google Analytics */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-YHED8H8DHL"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-YHED8H8DHL', { anonymize_ip: true });
        `}
      </Script>

      {/* Meta Pixel */}
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '1197212833963947');
          fbq('track', 'PageView');
        `}
      </Script>
    </>
  );
}
