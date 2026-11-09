"use client";
import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  Calculator,
  CalendarDays,
  ChevronDown,
  Landmark,
  Receipt,
} from "lucide-react";
import Hero from "./Hero";
import Footer from "./Footer";

const features = [
  {
    icon: Landmark,
    title: "Accounts",
    text: "Keep every bank and your cash in one view. Deposit, withdraw and transfer.",
  },
  {
    icon: CalendarDays,
    title: "Monthly timeline",
    text: "Each month gets its own page, so you always know where you stand.",
  },
  {
    icon: Receipt,
    title: "Spending log",
    text: "Add daily spendings with item-by-item costs. Search them in seconds.",
  },
  {
    icon: BarChart3,
    title: "Stats & insights",
    text: "Charts for trends, categories, income and balance — plus simple tips.",
  },
  {
    icon: Calculator,
    title: "Calculator",
    text: "A quick calculator with history, right inside the app.",
  },
];

const steps = [
  { n: "1", title: "Add your accounts", text: "Enter your banks and the cash you hold today." },
  { n: "2", title: "Log your spendings", text: "Add what you spent each day. Break it into items if you like." },
  { n: "3", title: "Review your month", text: "Open Stats to see trends, top categories and tips." },
];

const faqs = [
  {
    q: "Is Expense Tracker free?",
    a: "You can try it free for 7 days. No card needed.",
  },
  {
    q: "What can I track?",
    a: "Bank accounts, cash in hand, and every daily spending — with item-by-item costs — grouped by month.",
  },
  {
    q: "Do I need to verify my email?",
    a: "Yes. We send a verification link when you register. You can ask for a new one any time.",
  },
  {
    q: "Does it work on my phone?",
    a: "Yes. The layout adapts to phones, tablets and desktops, in light or dark mode.",
  },
];

const slogans = [
  "Track your banks",
  "Log every spending",
  "See your trends",
  "Plan your month",
  "Know where it goes",
];

function Ribbon() {
  const row = [...slogans, ...slogans];
  return (
    <div className="overflow-hidden py-6" aria-hidden="true">
      <div className="-mx-4 -rotate-1 overflow-hidden bg-gradient-to-r from-lime-ribbon to-lime-accent py-3">
        <div className="marquee-track flex gap-8 whitespace-nowrap">
          {[...row, ...row].map((s, i) => (
            <span
              key={i}
              className="flex items-center gap-8 text-sm font-bold uppercase tracking-wide text-forest"
            >
              {s} <span>✦</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="w-full">
      <Hero />

      {/* Feature tiles on a mint panel */}
      <section className="mx-auto w-full max-w-container px-4 py-12 sm:px-6 md:py-16">
        <div className="panel-mint p-5 sm:p-8">
          <p className="eyebrow mb-2">What you get</p>
          <h2 className="mb-8 max-w-2xl text-3xl sm:text-4xl">
            Everything you need to run your month
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {features.map(({ icon: Icon, title, text }) => (
              <Link
                key={title}
                href="/register"
                className="group relative flex flex-col gap-3 rounded-xl border border-transparent bg-surface p-5 transition-colors hover:border-primary"
              >
                <ArrowUpRight
                  size={18}
                  className="absolute right-4 top-4 text-faint group-hover:text-brand"
                  aria-hidden="true"
                />
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-mint-50 text-brand transition-colors group-hover:bg-primary group-hover:text-on-primary">
                  <Icon size={22} />
                </span>
                <h3 className="text-lg text-ink">{title}</h3>
                <p className="text-sm font-light leading-relaxed text-muted">{text}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works + expert tip panel */}
      <section className="mx-auto grid w-full max-w-container gap-10 px-4 pb-12 sm:px-6 md:grid-cols-2 md:pb-16">
        <div>
          <p className="eyebrow mb-2">How it works</p>
          <h2 className="mb-6 text-3xl sm:text-4xl">Know your month in 3 steps</h2>
          <ol className="space-y-5">
            {steps.map((s) => (
              <li key={s.n} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary">
                  {s.n}
                </span>
                <div>
                  <h3 className="text-lg text-ink">{s.title}</h3>
                  <p className="text-sm font-light text-body">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="tip-panel self-start p-5 sm:p-6">
          <p className="mb-2 text-sm font-bold text-ink">→ EXPERT TIP</p>
          <p className="mb-5 font-light text-ink">
            Close each month with a five-minute review. Compare it with the
            month before and pick one habit to improve.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-primary-deep p-4 text-white">
              <div className="text-2xl font-bold">৳ 42,500</div>
              <div className="mt-1 text-xs font-medium text-white/80">Spent this month</div>
            </div>
            <div className="rounded-lg bg-surface p-4">
              <div className="text-2xl font-bold text-brand">−8%</div>
              <div className="mt-1 text-xs font-medium text-muted">vs. last month</div>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-body">Example numbers, for illustration.</p>
        </div>
      </section>

      <Ribbon />

      {/* FAQ accordion */}
      <section className="mx-auto w-full max-w-3xl px-4 pb-12 sm:px-6 md:pb-16">
        <p className="eyebrow mb-2 text-center">FAQ</p>
        <h2 className="mb-6 text-center text-3xl sm:text-4xl">Good questions</h2>
        <div className="divide-y divide-hairline rounded-lg border border-hairline-strong bg-surface">
          {faqs.map((f) => (
            <details key={f.q} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-ink">
                {f.q}
                <ChevronDown
                  size={18}
                  className="shrink-0 text-brand transition-transform group-open:rotate-180"
                />
              </summary>
              <p className="mt-3 text-sm font-light leading-relaxed text-body">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Closing call to action */}
      <section className="mx-auto w-full max-w-container px-4 pb-14 sm:px-6 md:pb-20">
        <div className="panel-mint flex flex-col items-center gap-5 px-6 py-10 text-center sm:py-14">
          <h2 className="max-w-xl text-3xl sm:text-4xl">
            Ready to see where your money goes?
          </h2>
          <p className="max-w-lg font-light text-body">
            Start free for 7 days. No card needed.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/register" className="btn-primary">
              Create free account
            </Link>
            <Link href="/login" className="btn-secondary">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
