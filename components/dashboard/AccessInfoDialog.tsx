"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Info,
  X,
  ShieldCheck,
  Layers,
  Database,
  Check,
  Minus,
} from "lucide-react";

const accessLevels = [
  {
    level: "Workspace-toegang",
    description:
      "Bepaalt of een gebruiker een werkruimte kan zien in het portaal",
    controlledBy: "DashPortal (deze matrix)",
    icon: Layers,
  },
  {
    level: "Rapport-zichtbaarheid",
    description:
      "Bepaalt welke rapporten zichtbaar zijn binnen een werkruimte (all_users, specific_users, admin_only)",
    controlledBy: "DashPortal (rapport instellingen)",
    icon: ShieldCheck,
  },
  {
    level: "Data-niveau (RLS)",
    description:
      "Bepaalt welke rijen/data een gebruiker ziet binnen een rapport — bijv. alleen eigen regio of afdeling",
    controlledBy: "Power BI (Row-Level Security)",
    icon: Database,
  },
];

const matrixData = [
  {
    feature: "Werkruimte zichtbaar",
    portal: true,
    powerbi: false,
    note: "Via deze toegangsmatrix",
  },
  {
    feature: "Rapport zichtbaar",
    portal: true,
    powerbi: false,
    note: "Via access_type per rapport",
  },
  {
    feature: "Data filtering (RLS)",
    portal: false,
    powerbi: true,
    note: "Geconfigureerd in Power BI Desktop",
  },
  {
    feature: "Embed-token generatie",
    portal: true,
    powerbi: true,
    note: "Portal vraagt token aan met RLS-identiteit",
  },
];

export function AccessInfoDialog() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sluit met Escape
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Block body scroll wanneer modal open is
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const modal = open ? (
    <>
      {/* Backdrop — vaste laag over heel het scherm */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99998,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(4px)",
        }}
        onClick={() => setOpen(false)}
      />

      {/* Scrollbare overlay — bevat de gecentreerde dialog */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99999,
          overflowY: "auto",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "40px 16px",
        }}
        onClick={(e) => {
          // Sluit als je op de overlay klikt (niet op de dialog zelf)
          if (e.target === e.currentTarget) setOpen(false);
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Hoe werkt het toegangsmodel?"
      >
        {/* Dialog card */}
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "672px",
            backgroundColor: "var(--surface, #fff)",
            borderRadius: "16px",
            border: "1px solid var(--border, #e2e8f0)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          }}
        >
          {/* Header */}
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 24px",
              borderBottom: "1px solid var(--border, #e2e8f0)",
              backgroundColor: "var(--surface, #fff)",
              borderRadius: "16px 16px 0 0",
            }}
          >
            <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text-primary">
              Hoe werkt het toegangsmodel?
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6 px-6 py-5">
            {/* Intro */}
            <p className="text-sm leading-relaxed text-text-secondary">
              Toegang in DashPortal werkt op drie niveaus. De werkruimte- en
              rapporttoegang regel je hier in het dashboard. Data-niveau
              beveiliging (Row-Level Security) configureer je in Power BI
              zelf.
            </p>

            {/* 3 Levels */}
            <div className="space-y-3">
              {accessLevels.map((item) => (
                <div
                  key={item.level}
                  className="flex gap-4 rounded-xl border border-border/50 bg-surface-secondary/40 p-4"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-text-primary">
                      {item.level}
                    </h4>
                    <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">
                      {item.description}
                    </p>
                    <p className="mt-1 text-xs font-medium text-primary/80">
                      {item.controlledBy}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Matrix tabel */}
            <div>
              <h4 className="mb-3 font-[family-name:var(--font-syne)] text-sm font-bold text-text-primary">
                Verantwoordelijkheidsmatrix
              </h4>
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-secondary/50">
                      <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                        Functie
                      </th>
                      <th className="px-3 py-2.5 text-center text-xs font-medium uppercase tracking-wider text-text-secondary">
                        DashPortal
                      </th>
                      <th className="px-3 py-2.5 text-center text-xs font-medium uppercase tracking-wider text-text-secondary">
                        Power BI
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                        Toelichting
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {matrixData.map((row, i) => (
                      <tr
                        key={row.feature}
                        className={
                          i < matrixData.length - 1
                            ? "border-b border-border/50"
                            : ""
                        }
                      >
                        <td className="px-4 py-2.5 font-medium text-text-primary">
                          {row.feature}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {row.portal ? (
                            <Check className="mx-auto h-4 w-4 text-emerald-500" />
                          ) : (
                            <Minus className="mx-auto h-4 w-4 text-text-secondary/30" />
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {row.powerbi ? (
                            <Check className="mx-auto h-4 w-4 text-emerald-500" />
                          ) : (
                            <Minus className="mx-auto h-4 w-4 text-text-secondary/30" />
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-text-secondary">
                          {row.note}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RLS Tip */}
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <h4 className="mb-1 text-sm font-semibold text-amber-600">
                💡 Tip: Row-Level Security (RLS)
              </h4>
              <p className="text-xs leading-relaxed text-text-secondary">
                Als je wilt dat gebruikers alleen hun eigen data zien (bijv.
                per regio, afdeling of klant), configureer dan RLS-rollen in
                Power BI Desktop. DashPortal past deze automatisch toe bij het
                genereren van embed-tokens op basis van het e-mailadres van de
                gebruiker.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  ) : null;

  return (
    <>
      {/* Trigger knop */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors px-3 py-2 rounded-lg bg-primary/5 hover:bg-primary/10 border border-primary/20 hover:border-primary/30 shrink-0"
      >
        <Info className="w-4 h-4" />
        <span>Hoe werkt toegang?</span>
      </button>

      {/* Modal via Portal op document.body */}
      {mounted && modal ? createPortal(modal, document.body) : null}
    </>
  );
}
