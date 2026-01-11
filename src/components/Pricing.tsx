// src/components/Pricing.tsx
"use client";

import colors from "@/app/color/color";
import { useAuth } from "@/app/hooks/useAuth";
import { usePrice } from "@/app/hooks/usePrice";
import { useTheme } from "@/app/hooks/useTheme";
import Link from "next/link";
import { useEffect } from "react";

export default function Pricing() {
  const { theme } = useTheme();
  const { user: auth } = useAuth();

  const {
    billingPeriod,
    selectedPlan,
    isFreeTierExpired,
    setBillingPeriod,
    setSelectedPlan,
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
      description: "Perfect for trying out AI replies",
      priceMonthly: 0,
      priceAnnual: 0,
      features: [
        { name: "replies", value: "3 replies per day" },
        { name: "history", value: "Last 10 replies saved" },
        { name: "tone", value: "Standard tone only" },
        // { name: "support", value: "Community help" },
      ],
      cta: "Start Free",
      isMostPopular: false,
    },
    {
      id: "standard",
      title: "Standard",
      description: "Ideal for active job seekers",
      priceMonthly: 9,
      priceAnnual: 90,
      features: [
        { name: "replies", value: "10 replies per day" },
        { name: "history", value: "Unlimited history" },
        { name: "tone", value: "3 tone variants" },
        { name: "export", value: "Copy & download" },
        { name: "support", value: "Email support" },
      ],
      cta: "Go Standard",
      isMostPopular: true,
      badge: "Most Popular",
    },
    {
      id: "premium",
      title: "Premium",
      description: "For power users & career switchers",
      priceMonthly: 19,
      priceAnnual: 190,
      features: [
        { name: "replies", value: "30 replies per day" },
        { name: "history", value: "Unlimited + search" },
        { name: "tone", value: "All tones + custom" },
        { name: "export", value: "PDF, Word, Email" },
        { name: "priority", value: "Faster AI generation" },
        { name: "support", value: "Priority chat support" },
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
    <div
      className={`h-full py-8 sm:pt-[8%] pt-[15%] px-4 sm:px-6 overflow-auto scrollbar relative ${
        theme
          ? "bg-[#ffffff] scrollbar-thumb-black scrollbar-track-[#eeeeee]"
          : "bg-[#000000] scrollbar-thumb-white scrollbar-track-[#222222]"
      }`}
    >
      <div className="max-w-4xl mb-[5%] sm:max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1
            className={`text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 ${
              theme ? "text-[#0a0a0a]" : "text-[#ebebeb]"
            }`}
          >
            Choose Your Plan
          </h1>
          <p
            className={`text-base sm:text-xl ${
              theme ? "text-[#0a0a0a]" : "text-[#ebebeb]"
            }`}
          >
            Select a plan to get started.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex justify-center mb-4 sm:mb-6">
          <div
            className={`flex rounded-full p-1 sm:p-2 ${
              theme ? "bg-black" : "bg-white"
            }`}
          >
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-4 sm:px-5 py-1 sm:py-2 rounded-full text-sm sm:text-base font-medium transition-all ${
                billingPeriod === "monthly"
                  ? theme
                    ? "bg-[#ffffff] text-[#0a0a0a] shadow-sm"
                    : "bg-[#000000] text-[#ebebeb] shadow-sm"
                  : theme
                  ? "text-[#ffffff]"
                  : "text-[#000000]"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("annual")}
              className={`px-4 sm:px-5 py-1 sm:py-2 rounded-full text-sm sm:text-base font-medium transition-all ${
                billingPeriod === "annual"
                  ? theme
                    ? "bg-[#ffffff] text-[#0a0a0a] shadow-sm"
                    : "bg-[#000000] text-[#ebebeb] shadow-sm"
                  : theme
                  ? "text-[#ffffff]"
                  : "text-[#000000]"
              }`}
            >
              Annually
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {plans.map((plan) => {
            const priceLabel = getPriceLabel(plan.id);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const isSelected = selectedPlan === plan.id;

            return (
              <div
                key={plan.id}
                className={`p-4 sm:p-6 rounded-lg ${
                  theme
                    ? plan.isMostPopular
                      ? `bg-[#ffffff] border-2 ${colors.keyBorder} hover:cursor-pointer`
                      : "bg-[#ffffff] border border-[#cccccc] hover:border-[#999999] hover:cursor-pointer"
                    : plan.isMostPopular
                    ? `bg-[#000000] border-2 ${colors.keyBorder} hover:cursor-pointer`
                    : `bg-[#000000] border border-[#444444] hover:border-[#666666] hover:cursor-pointer`
                }`}
                onMouseEnter={() => setSelectedPlan(plan.id)}
                onMouseLeave={() => setSelectedPlan(null)}
              >
                {/* Title + Badge */}
                <div className="flex justify-center items-center mb-2 sm:mb-3">
                  <h3
                    className={`text-xl sm:text-2xl font-bold ${
                      theme ? "text-[#0a0a0a]" : "text-[#ebebeb]"
                    }`}
                  >
                    {plan.title}
                  </h3>
                  {plan.isMostPopular && (
                    <div className="ml-3 sm:ml-4">
                      <span
                        className={`inline-block px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-xs sm:text-sm font-semibold ${
                          theme
                            ? `${colors.keyBg} text-[#ffffff]`
                            : `${colors.keyBg} text-[#ffffff]`
                        }`}
                      >
                        Most Popular
                      </span>
                    </div>
                  )}
                </div>

                {/* Description + Price + CTA */}
                <div className="text-center mb-4 sm:mb-5">
                  <p
                    className={`text-sm sm:text-base ${
                      theme ? "text-[#0a0a0a]" : "text-[#ebebeb]"
                    }`}
                  >
                    {plan.description}
                  </p>
                  <div className="mt-2 sm:mt-3">
                    <div
                      className={`text-2xl sm:text-3xl font-bold ${
                        theme ? "text-[#0a0a0a]" : "text-[#ebebeb]"
                      }`}
                    >
                      {priceLabel}
                    </div>

                    {/* Free plan handling */}
                    {plan.id === "free" ? (
                      isFreeTierExpired ? (
                        <div className="w-full mt-3 sm:mt-5 py-1.5 sm:py-2 rounded-md text-sm sm:text-base font-medium bg-red-700 text-white">
                          Your Free Limit is Expired
                        </div>
                      ) : (
                        <button
                          className={`w-full py-1.5 sm:py-2 rounded-md mt-5 text-sm sm:text-base font-medium ${
                            theme
                              ? "bg-gray-200 text-[#0a0a0a] hover:bg-gray-300"
                              : "bg-[#222222] text-[#ebebeb] hover:bg-[#2a2a2a]"
                          }`}
                        >
                          <Link href={auth ? "/" : "/login"}>Use Now</Link>
                        </button>
                      )
                    ) : (
                      <Link href="/billing">
                        <button
                          onClick={() => {
                            setWantToPayment(plan.title, billingPeriod);
                          }}
                          className={`w-full mt-3 sm:mt-5 py-1.5 sm:py-2 rounded-md text-sm sm:text-base font-medium ${
                            plan.isMostPopular
                              ? `${colors.keyBg} text-white hover:bg-blue-800`
                              : theme
                              ? "bg-gray-200 text-[#0a0a0a] hover:bg-gray-300"
                              : "bg-[#222222] text-[#ebebeb] hover:bg-[#2a2a2a]"
                          }`}
                        >
                          {plan.isMostPopular ? "Get Started" : "Buy Plan"}
                        </button>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Features list */}
                <ul className="space-y-1 sm:space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <div
                        className={`w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full mr-1.5 sm:mr-2 ${
                          theme ? "bg-green-600" : "bg-green-600"
                        }`}
                      />
                      <span
                        className={`text-sm sm:text-base ${
                          theme ? "text-[#0a0a0a]" : "text-[#ebebeb]"
                        }`}
                      >
                        {feature.value}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
