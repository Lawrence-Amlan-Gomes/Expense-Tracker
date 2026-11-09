"use client";
import Link from "next/link";
import Logo from "./Logo";

const columns = [
  {
    title: "Product",
    links: [
      { href: "/testimonials", label: "Testimonials" },
      { href: "/calculator", label: "Calculator" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Sign in" },
      { href: "/register", label: "Create account" },
      { href: "/profile", label: "Profile" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy-policy", label: "Privacy Policy" },
      { href: "/terms-and-conditions", label: "Terms & Conditions" },
    ],
  },
];

function Footer() {
  return (
    <footer className="w-full border-t border-hairline bg-soft">
      <div className="mx-auto grid max-w-container gap-10 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm font-light leading-relaxed text-body">
            Track every bank, cash balance and daily spending in one calm place.
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="eyebrow mb-3 !tracking-wider">{col.title}</h3>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm font-light text-body underline-offset-4 hover:text-brand hover:underline"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-hairline">
        <p className="mx-auto max-w-container px-4 py-5 text-xs text-muted sm:px-6">
          © {new Date().getFullYear()} Expense Tracker. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
