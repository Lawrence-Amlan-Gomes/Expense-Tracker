"use client";

import Link from "next/link";
import { BadgeCheck, CreditCard, Lock, Sparkles } from "lucide-react";
import HeroImage from "./HeroImage";

// hero-band: the only saturated plane on the page.
export default function Hero() {
  return (
    <section className="hero-band">
      <div className="mx-auto grid max-w-container items-center gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 md:gap-12 md:py-20">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-lime-panel">
            <BadgeCheck size={14} /> Free for 7 days · No card needed
          </span>

          <h1 className="text-4xl font-bold leading-[1.15] text-white sm:text-5xl lg:text-[52px]">
            Master your <span className="text-lime-hero">money</span>, month by
            month
          </h1>

          <p className="max-w-xl text-base font-light leading-relaxed text-white/90 sm:text-lg">
            Track every bank, cash balance and daily spending — and finally see
            where your money really goes.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link href="/register" className="btn-lime">
              Get started free
            </Link>
            <Link
              href="/login"
              className="btn rounded-sm border border-white/60 text-white hover:bg-white/10"
            >
              Sign in
            </Link>
          </div>

          <ul className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-xs font-medium text-white/85">
            <li className="flex items-center gap-1.5">
              <Lock size={14} className="text-lime-panel" /> Your data stays yours
            </li>
            <li className="flex items-center gap-1.5">
              <CreditCard size={14} className="text-lime-panel" /> Banks &amp; cash in one view
            </li>
            <li className="flex items-center gap-1.5">
              <Sparkles size={14} className="text-lime-panel" /> Light &amp; dark mode
            </li>
          </ul>
        </div>

        <HeroImage />
      </div>
    </section>
  );
}
