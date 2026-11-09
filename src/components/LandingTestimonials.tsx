"use client";
import testimonials from "@/app/testimonials/testimonials";
import Link from "next/link";
import { useEffect, useState } from "react";
import TestimonialCard from "./TestimonialCard";

export default function LandingTestimonials() {
  const [count, setCount] = useState(4);

  useEffect(() => {
    const update = () => setCount(window.innerWidth < 768 ? 2 : 4);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <section className="mx-auto w-full max-w-container px-4 py-12 sm:px-6 md:py-16">
      <p className="eyebrow mb-2">Testimonials</p>
      <h2 className="mb-3 text-3xl sm:text-4xl">People like calm money months</h2>
      <p className="mb-8 max-w-2xl font-light text-body">
        Here&apos;s what early users say about Expense Tracker.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 sm:gap-6">
        {testimonials.slice(0, count).map((t) => (
          <TestimonialCard
            key={t.id}
            clientName={t.clientName}
            clientImg={t.clientImg}
            clientRole={t.clientRole}
            clientQuote={t.clientQuote}
          />
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <Link href="/testimonials" className="btn-outline">
          View all feedback
        </Link>
      </div>
    </section>
  );
}
