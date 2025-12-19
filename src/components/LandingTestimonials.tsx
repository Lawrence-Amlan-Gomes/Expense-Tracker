"use client";
import colors from "@/app/color/color";
import { useTheme } from "@/app/hooks/useTheme";
import testimonials from "@/app/testimonials/testimonials";
import Link from "next/link";
import { useEffect, useState } from "react";
import TestimonialCard from "./TestimonialCard";

export default function LandingTestimonials() {
  const { theme } = useTheme();
  const [numtestimonials, setNumtestimonials] = useState(6);

  useEffect(() => {
    const updateNumtestimonials = () => {
      if (window.innerWidth < 768) {
        setNumtestimonials(2); // Mobile: slice(0, 2)
      } else if (window.innerWidth < 1024) {
        setNumtestimonials(4); // Medium: slice(0, 2)
      } else {
        setNumtestimonials(4); // Large: slice(0, 3)
      }
    };

    updateNumtestimonials(); // Initial check
    window.addEventListener("resize", updateNumtestimonials);

    return () => window.removeEventListener("resize", updateNumtestimonials);
  }, []);

  return (
    <div className="px-[5%] sm:px-[10%] mb-[5%] pb-[5%] w-full">
      <div className="mb-8">
        <div
          className={`flex items-center mb-5 gap-4 ${
            theme ? "text-[#333333]" : "text-[#dddddd]"
          }`}
        >
          <h1
            className={`text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 ${
              theme ? "text-[#333333]" : "text-[#dddddd]"
            }`}
          >
            Testimonials
          </h1>
          <div
            className="flex-grow h-[1px]"
            style={{
              backgroundImage: theme
                ? "linear-gradient(to right, rgba(51, 51, 51, 0), rgba(51, 51, 51, 1))"
                : "linear-gradient(to right, rgba(221, 221, 221, 0), rgba(221, 221, 221, 0.4))",
            }}
          />
        </div>
        <p
          className={`text-base lg:text-md w-full md:w-[50%] mt-2 ${
            theme ? "text-[#666666]" : "text-[#aaaaaa]"
          }`}
        >
          Here’s what job seekers are saying about Recruiter’s Reply. Their
          stories prove: one click turns cold outreach into warm conversations.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
        {testimonials.slice(0, numtestimonials).map((testimonial) => (
          <TestimonialCard
            key={testimonial.id}
            clientName={testimonial.clientName}
            clientImg={testimonial.clientImg}
            clientRole={testimonial.clientRole}
            clientQuote={testimonial.clientQuote}
          />
        ))}
      </div>
      <div className="flex justify-center mt-8">
        <Link href="/testimonials">
          <div
            className={`px-4 py-2 rounded-md text-sm sm:text-[15px] font-medium hover:cursor-pointer ${colors.keyBg} text-[#ffffff] hover:bg-transparent border-[1px] ${colors.keyBorder} ${colors.keyHoverText}`}
          >
            View All Feedbacks
          </div>
        </Link>
      </div>
    </div>
  );
}
