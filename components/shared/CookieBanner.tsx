"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { Cookie, X } from "lucide-react";
import Link from "next/link";

const COOKIE_CONSENT_KEY = "bi_cookie_consent";
const CONSENT_DURATION_DAYS = 365;

type ConsentLevel = "essential" | "analytics" | "all";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Check of er al consent is gegeven
    const consent = Cookies.get(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Klein delay zodat de pagina eerst laadt
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  function saveConsent(level: ConsentLevel) {
    Cookies.set(COOKIE_CONSENT_KEY, level, {
      expires: CONSENT_DURATION_DAYS,
      sameSite: "lax",
      path: "/",
    });
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[100] p-4 sm:p-6">
      <div className="max-w-2xl mx-auto bg-surface border border-border rounded-2xl shadow-xl shadow-black/10">
        <div className="p-5 sm:p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Cookie className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-[family-name:var(--font-syne)] font-bold text-text-primary">
                Cookies
              </h3>
            </div>
            <button
              onClick={() => saveConsent("essential")}
              className="p-1 rounded-lg hover:bg-surface-secondary transition-colors"
              aria-label="Sluiten (alleen essentieel)"
            >
              <X className="w-4 h-4 text-text-secondary" />
            </button>
          </div>

          {/* Tekst */}
          <p className="text-sm text-text-secondary leading-relaxed mb-4">
            Wij gebruiken cookies om de website te laten werken en om je ervaring
            te verbeteren. Essentieel cookies zijn altijd actief.{" "}
            <Link
              href="/privacy"
              className="text-primary hover:underline"
            >
              Lees ons privacybeleid
            </Link>
          </p>

          {/* Details (uitklapbaar) */}
          {showDetails && (
            <div className="mb-4 space-y-2 text-sm">
              <div className="flex items-center justify-between p-3 bg-surface-secondary/50 rounded-lg">
                <div>
                  <p className="font-medium text-text-primary">
                    Essentieel
                  </p>
                  <p className="text-xs text-text-secondary">
                    Nodig voor login, sessie en basisfunctionaliteit
                  </p>
                </div>
                <span className="text-xs text-text-secondary bg-surface-secondary px-2 py-1 rounded-md">
                  Altijd aan
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-surface-secondary/50 rounded-lg">
                <div>
                  <p className="font-medium text-text-primary">
                    Analytics
                  </p>
                  <p className="text-xs text-text-secondary">
                    Anoniem gebruik meten om het product te verbeteren
                  </p>
                </div>
                <span className="text-xs text-text-secondary">
                  Optioneel
                </span>
              </div>
            </div>
          )}

          {/* Knoppen */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => saveConsent("all")}
              className="flex-1 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              Alles accepteren
            </button>
            <button
              onClick={() => saveConsent("essential")}
              className="flex-1 px-4 py-2.5 border border-border bg-surface text-sm font-medium text-text-primary rounded-lg hover:bg-surface-secondary transition-colors"
            >
              Alleen essentieel
            </button>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              {showDetails ? "Verberg details" : "Details"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
