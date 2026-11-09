import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

// hero-band for inner pages: breadcrumb, headline, lead.
// After this band the page drops straight to the light canvas.
export default function PageBand({
  crumb,
  title,
  lead,
  children,
}: {
  crumb: string;
  title: string;
  lead?: string;
  children?: ReactNode;
}) {
  return (
    <section className="hero-band">
      <div className="mx-auto w-full max-w-container px-4 py-8 sm:px-6 md:py-12">
        <nav
          aria-label="Breadcrumb"
          className="mb-3 flex items-center gap-1 text-xs font-medium text-white/85"
        >
          <Link href="/" className="hover:underline">
            Home
          </Link>
          <ChevronRight size={12} aria-hidden="true" />
          <span>{crumb}</span>
        </nav>
        <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl md:text-[40px]">
          {title}
        </h1>
        {lead && (
          <p className="mt-3 max-w-2xl text-base font-light text-white/90 sm:text-lg">
            {lead}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
