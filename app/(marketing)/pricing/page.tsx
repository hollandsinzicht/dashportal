"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Check,
  X,
  Star,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { DashboardBouwenCTA } from "@/components/shared/DashboardBouwenCTA";
import {
  PLANS,
  COMPARISON_FEATURES,
  FAQ_ITEMS,
  getYearlySavingsPercent,
} from "@/lib/plans";
import type { PlanId } from "@/lib/plans";

/* ─── Animatie varianten ─── */
const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

/* ─── FAQ Accordion Item ─── */
function FAQAccordionItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-surface-secondary/50 transition-colors"
      >
        <span className="font-medium text-text-primary pr-4">{question}</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-text-secondary" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 text-sm text-text-secondary leading-relaxed">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Pricing Page ─── */
export default function PricingPage() {
  const [yearly, setYearly] = useState(false);
  const savingsPercent = getYearlySavingsPercent();

  return (
    <>
      {/* ─── Header ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12 relative">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 bg-primary-light text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <Sparkles className="w-4 h-4" />
              14 dagen gratis uitproberen
            </div>
            <h1 className="font-[family-name:var(--font-syne)] text-4xl sm:text-5xl font-bold text-text-primary">
              Transparante prijzen
            </h1>
            <p className="mt-4 text-lg text-text-secondary">
              Kies het plan dat bij jouw organisatie past. Elk plan start met een
              gratis proefperiode — geen creditcard nodig.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── Billing Toggle ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="flex items-center justify-center gap-4">
          <span
            className={`text-sm font-medium transition-colors ${
              !yearly ? "text-text-primary" : "text-text-secondary"
            }`}
          >
            Maandelijks
          </span>

          <button
            onClick={() => setYearly(!yearly)}
            className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${
              yearly ? "bg-primary" : "bg-border"
            }`}
            aria-label="Toggle jaarlijks/maandelijks"
          >
            <motion.div
              className="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm"
              animate={{ x: yearly ? 28 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>

          <span
            className={`text-sm font-medium transition-colors ${
              yearly ? "text-text-primary" : "text-text-secondary"
            }`}
          >
            Jaarlijks
          </span>

          <AnimatePresence>
            {yearly && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="bg-success/10 text-success text-xs font-bold px-2.5 py-1 rounded-full"
              >
                Bespaar {savingsPercent}%
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ─── Plan Cards ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {PLANS.map((plan, i) => {
            const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
            const isEnterprise = plan.id === "enterprise";

            return (
              <motion.div
                key={plan.id}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={cardVariants}
                className={`relative bg-surface rounded-2xl border p-7 flex flex-col transition-shadow duration-300 ${
                  plan.highlighted
                    ? "border-primary ring-2 ring-primary/20 shadow-xl shadow-primary/15"
                    : "border-border hover:shadow-lg hover:shadow-black/5"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      Populairst
                    </span>
                  </div>
                )}

                <div className="mb-5">
                  <h3 className="font-[family-name:var(--font-syne)] text-xl font-bold text-text-primary">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-text-secondary mt-1">
                    {plan.description}
                  </p>
                </div>

                <div className="mb-6">
                  {isEnterprise ? (
                    <span className="text-2xl font-bold text-text-primary">
                      Op maat
                    </span>
                  ) : (
                    <>
                      <span className="text-3xl font-bold text-text-primary">
                        &euro;{price}
                      </span>
                      <span className="text-text-secondary text-sm">
                        {yearly ? "/jaar" : "/maand"}
                      </span>
                      {yearly && (
                        <p className="text-xs text-text-secondary mt-1">
                          &euro;{Math.round(price / 12)}/maand bij jaarlijkse
                          betaling
                        </p>
                      )}
                    </>
                  )}
                </div>

                <ul className="space-y-2.5 mb-7 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
                      <span className="text-sm text-text-primary">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={
                    isEnterprise
                      ? "mailto:info@dashportal.app?subject=Enterprise%20aanvraag"
                      : `/onboarding/plan?selected=${plan.id}`
                  }
                  className={`inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg font-medium text-sm transition-all duration-200 ${
                    plan.highlighted
                      ? "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20"
                      : "bg-surface-secondary text-text-primary border border-border hover:bg-border/50"
                  }`}
                >
                  {isEnterprise ? "Neem contact op" : "Start gratis proefperiode"}
                  <ArrowRight className="w-4 h-4" />
                </Link>

                {!isEnterprise && (
                  <p className="text-xs text-text-secondary text-center mt-3">
                    14 dagen gratis uitproberen
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ─── Vergelijkingstabel (Desktop) ─── */}
      <section className="hidden lg:block py-20 bg-surface border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-12"
          >
            <h2 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-text-primary">
              Plannen vergelijken
            </h2>
            <p className="text-text-secondary mt-3">
              Bekijk alle features per plan in detail
            </p>
          </motion.div>

          <div className="bg-background rounded-2xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-sm font-medium text-text-secondary p-4 w-[260px]">
                    Feature
                  </th>
                  {PLANS.map((plan) => (
                    <th
                      key={plan.id}
                      className={`text-center text-sm font-bold p-4 ${
                        plan.highlighted
                          ? "text-primary bg-primary/[0.03]"
                          : "text-text-primary"
                      }`}
                    >
                      <span className="font-[family-name:var(--font-syne)]">
                        {plan.name}
                      </span>
                      {plan.highlighted && (
                        <span className="block text-[10px] font-medium text-primary/70 mt-0.5">
                          Populairst
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_FEATURES.map((feature, idx) => (
                  <tr
                    key={feature.label}
                    className={
                      idx % 2 === 0
                        ? "bg-surface-secondary/30"
                        : "bg-background"
                    }
                  >
                    <td className="text-sm text-text-primary p-4 font-medium">
                      {feature.label}
                    </td>
                    {(["starter", "business", "scale", "enterprise"] as PlanId[]).map(
                      (planId) => {
                        const value = feature[planId];
                        const isHighlighted = planId === "business";

                        return (
                          <td
                            key={planId}
                            className={`text-center text-sm p-4 ${
                              isHighlighted ? "bg-primary/[0.03]" : ""
                            }`}
                          >
                            {value === true ? (
                              <Check className="w-4 h-4 text-success mx-auto" />
                            ) : value === false ? (
                              <X className="w-4 h-4 text-text-secondary/30 mx-auto" />
                            ) : (
                              <span className="text-text-primary font-medium">
                                {value}
                              </span>
                            )}
                          </td>
                        );
                      }
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-12"
          >
            <h2 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-text-primary">
              Veelgestelde vragen
            </h2>
            <p className="text-text-secondary mt-3">
              Heb je een andere vraag? Neem gerust contact met ons op.
            </p>
          </motion.div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item) => (
              <FAQAccordionItem
                key={item.question}
                question={item.question}
                answer={item.answer}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Dashboard Bouwen CTA ─── */}
      <DashboardBouwenCTA variant="banner" />
    </>
  );
}
