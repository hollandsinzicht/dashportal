"use client";

import { useState } from "react";
import {
  Monitor,
  Copy,
  Check,
  QrCode,
  ExternalLink,
} from "lucide-react";

interface MobileReportFallbackProps {
  reportTitle: string;
}

/**
 * Fallback voor mobiele gebruikers (< 768px) die Power BI rapporten
 * proberen te bekijken. Power BI embeds werken slecht op kleine schermen.
 *
 * Toont:
 * - Bericht dat het rapport beter op desktop te bekijken is
 * - Kopieer-link knop om de URL naar zichzelf te sturen
 * - QR code (via Google Charts API) die naar dezelfde pagina linkt
 */
export function MobileReportFallback({
  reportTitle,
}: MobileReportFallbackProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: gebruik een hidden input
      const input = document.createElement("input");
      input.value = currentUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // QR code via Google Charts API (geen dependency nodig)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentUrl)}`;

  return (
    <div className="flex-1 flex items-center justify-center bg-background p-6">
      <div className="bg-surface border border-border rounded-2xl p-8 max-w-sm w-full text-center space-y-6">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Monitor className="w-8 h-8 text-primary" />
        </div>

        {/* Titel */}
        <div>
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text-primary mb-2">
            Desktop aanbevolen
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            <span className="font-medium text-text-primary">{reportTitle}</span>{" "}
            is geoptimaliseerd voor grotere schermen. Open deze pagina op een
            desktop of laptop voor de beste ervaring.
          </p>
        </div>

        {/* Acties */}
        <div className="space-y-3">
          {/* Kopieer link */}
          <button
            onClick={handleCopy}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Link gekopieerd!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Kopieer link
              </>
            )}
          </button>

          {/* QR Code toggle */}
          <button
            onClick={() => setShowQR(!showQR)}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 border border-border bg-surface rounded-xl text-sm font-medium text-text-primary hover:bg-surface-secondary transition-colors"
          >
            <QrCode className="w-4 h-4" />
            {showQR ? "QR-code verbergen" : "Toon QR-code voor desktop"}
          </button>
        </div>

        {/* QR Code */}
        {showQR && (
          <div className="pt-2 space-y-3">
            <div className="bg-white rounded-xl p-4 inline-block mx-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrUrl}
                alt="QR-code om rapport te openen op desktop"
                width={200}
                height={200}
                className="w-[200px] h-[200px]"
              />
            </div>
            <p className="text-xs text-text-secondary">
              Scan deze QR-code met je desktop om het rapport te openen
            </p>
          </div>
        )}

        {/* Open in new tab hint */}
        <p className="text-xs text-text-secondary flex items-center justify-center gap-1">
          <ExternalLink className="w-3 h-3" />
          Of draai je scherm naar landschap voor een betere weergave
        </p>
      </div>
    </div>
  );
}
