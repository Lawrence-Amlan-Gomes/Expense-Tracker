// src/components/Pricing.tsx
"use client";

import { useAuth } from "@/app/hooks/useAuth";
import { usePrice } from "@/app/hooks/usePrice";
import Link from "next/link";
import { useEffect } from "react";
import { Check } from "lucide-react";
import PageBand from "./PageBand";
import Footer from "./Footer";

export default function Pricing() {
  const { user: auth } = useAuth();

  const {
    billingPeriod,
    isFreeTierExpired,
    setBillingPeriod,
    setWantToPayment,
    setFreeTierExpired,
  } = usePrice();

  // ---- keep free-tier UI in sync with auth.paymentType ----
  useEffect(() => {
    if (auth && auth.paymentType === "Expired") {
      setFreeTierExpired(true);
    } else {
      setFreeTierExpired(false);
    }
  }, [auth, setFreeTierExpired]);

  const plans = [
    {
      id: "free",
      title: "Free",
      description: "Perfect for building your routine",
      priceMonthly: 0,
      priceAnnual: 0,
      features: [
        { name: "time", value: "Free for 7 days only" },
        { name: "routine", value: "Full routine editor & visual timeline" },
        { name: "multi-day", value: "Add/edit tasks across multiple days" },
        { name: "shift", value: "Shift tasks time on selected days" },
        { name: "free-time", value: "Click free gaps to add tasks" },
      ],
      cta: "Start Free",
      isMostPopular: false,
    },
    {
      id: "standard",
      title: "Standard",
      description: "Ideal for serious routine planning",
      priceMonthly: 4,
      priceAnnual: 36,
      features: [
        { name: "routine", value: "Full routine editor & visual timeline" },
        { name: "multi-day", value: "Add/edit tasks across multiple days" },
        { name: "shift", value: "Shift tasks time on selected days" },
        { name: "free-time", value: "Click free gaps to add tasks" },
      ],
      cta: "Go Standard",
      isMostPopular: true,
      badge: "Most Popular",
    },
    {
      id: "premium",
      title: "Premium",
      description: "Routine builder + unlimited AI assistant",
      priceMonthly: 7,
      priceAnnual: 72,
      features: [
        { name: "routine", value: "Full routine editor & visual timeline" },
        { name: "multi-day", value: "Add/edit tasks across multiple days" },
        { name: "shift", value: "Shift tasks time on selected days" },
        { name: "free-time", value: "Click free gaps to add tasks" },
        { name: "ai", value: "AI routine suggestions" },
        { name: "ai-responses", value: "30 AI responses per day" },
      ],
      cta: "Go Premium",
      isMostPopular: false,
    },
  ];

  const getPrice = (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    return billingPeriod === "annual" ? plan!.priceAnnual : plan!.priceMonthly;
  };

  const getPriceLabel = (planId: string) => {
    const price = getPrice(planId);
    return `$${price}/${billingPeriod === "annual" ? "year" : "month"}`;
  };

  return (
    <div className="w-full">
      <PageBand
        crumb="Pricing"
        title="Choose your plan"
        lead="Start free for 7 days. Upgrade when you are ready."
      />

      <section className="mx-auto w-full max-w-container px-4 py-10 sm:px-6 md:py-14">
        {/* Billing toggle */}
        <div className="mb-10 flex justify-center">
          <div
            role="group"
            aria-label="Billing period"
            className="inline-flex rounded-lg bg-mint-50 p-1"
          >
            {(["monthly", "annual"] as const).map((period) => (
              <button
                key={period}
                onClick={() => setBillingPeriod(period)}
                aria-pressed={billingPeriod === period}
                className={`rounded-md px-5 py-2 text-sm font-bold transition-colors ${
                  billingPeriod === period
                    ? "bg-primary text-on-primary"
                    : "text-brand hover:bg-mint-100"
                }`}
              >
                {period === "monthly" ? "Monthly" : "Annually"}
              </button>
            ))}
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {plans.map((plan) => {
            const priceLabel = getPriceLabel(plan.id);
            const ctaHref = auth ? "/billing" : "/login";
            const onPick = () => setWantToPayment(plan.title, billingPeriod);

            return (
              <article
                key={plan.id}
                className={`card relative flex flex-col p-6 pt-10 ${
                  plan.isMostPopular ? "!border-2 !border-primary" : ""
                }`}
              >
                {plan.isMostPopular && (
                  <span className="award-pill absolute left-0 top-0">
                    Most popular
                  </span>
                )}

                <h2 className="text-2xl">{plan.title}</h2>
                <p className="mt-1 min-h-[40px] text-sm font-light text-body">
                  {plan.description}
                </p>

                <p className="mt-4 text-3xl font-bold text-ink">{priceLabel}</p>

                <div className="mt-5">
                  {plan.id === "free" ? (
                    isFreeTierExpired ? (
                      <div className="btn bg-error/10 text-error" aria-disabled="true">
                        Free limit expired
                      </div>
                    ) : (
                      <Link
                        href={auth ? "/dashBoard" : "/login"}
                        className="btn-secondary w-full"
                      >
                        Use now
                      </Link>
                    )
                  ) : (
                    <Link
                      href={ctaHref}
                      onClick={onPick}
                      className={`w-full ${
                        plan.isMostPopular ? "btn-primary" : "btn-secondary"
                      }`}
                    >
                      {plan.isMostPopular ? "Get started" : "Buy plan"}
                    </Link>
                  )}
                </div>

                <ul className="mt-6 space-y-3 border-t border-hairline pt-5">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-body">
                      <Check size={16} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
                      <span className="font-light">{feature.value}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </section>

      <Footer />
    </div>
  );
}
