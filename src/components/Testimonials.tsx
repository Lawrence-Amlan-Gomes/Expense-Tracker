"use client";
import testimonials from "@/app/testimonials/testimonials";
import Footer from "./Footer";
import PageBand from "./PageBand";
import TestimonialCard from "./TestimonialCard";

export default function Testimonials() {
  return (
    <div className="w-full">
      <PageBand
        crumb="Testimonials"
        title="What early users say"
        lead="Real words about how Expense Tracker helps people stay consistent and in control."
      />

      <section className="mx-auto w-full max-w-container px-4 py-10 sm:px-6 md:py-14">
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
          {testimonials.map((t) => (
            <TestimonialCard
              key={t.id}
              clientName={t.clientName}
              clientImg={t.clientImg}
              clientRole={t.clientRole}
              clientQuote={t.clientQuote}
            />
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
