"use client";
import colors from "@/app/color/color";
import { useTheme } from "@/app/hooks/useTheme";
import testimonials from "@/app/testimonials/testimonials";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";
import Footer from "./Footer";
import TestimonialCard from "./TestimonialCard";

export default function Testimonials() {
  const { theme } = useTheme();

  return (
    <div
      className={`w-full pt-[20%] sm:pt-[13%] ${
        theme ? "bg-[#ffffff] text-[#aaaaaaa]" : "bg-[#000000] text-[#eeeeee]"
      }`}
    >
      <div className="w-[90%] sm:w-[80%] md:w-[60%] mx-auto mb-[5%] px-[5%] sm:px-0">
        <div className="mb-8">
          <div
            className={`flex items-center mb-5 gap-4 ${
              theme ? "text-[#333333]" : "text-[#dddddd]"
            }`}
          >
            <h1
              className={`text-2xl sm:text-3xl lg:text-5xl font-bold mb-2 ${
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
            className={`text-sm sm:text-base lg:text-md w-full sm:w-[70%] mt-2 ${
              theme ? "text-[#666666]" : "text-[#aaaaaa]"
            }`}
          >
            Here’s what early users are saying about Expense Tracker. These
            testimonials show how simple daily planning helps people stay
            consistent, reduce stress, and take control of their day —
            effortlessly.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {testimonials.map((testimonial) => (
            <TestimonialCard
              key={testimonial.id}
              clientName={testimonial.clientName}
              clientImg={testimonial.clientImg}
              clientRole={testimonial.clientRole}
              clientQuote={testimonial.clientQuote}
            />
          ))}
        </div>
        <div className="fixed right-[5%] md:right-[11%] top-[80px] sm:top-[110px] md:top-[150px] transform -translate-y-1/2 flex flex-row gap-3 md:flex-col sm:gap-4 z-50">
          <Link
            href="/home"
            className={`p-2 sm:p-3 rounded-lg text-md sm:text-xl md:hidden block ${
              theme
                ? `bg-[#ffffff] text-[#0a0a0a] border-[1px] ${colors.keyBorder} ${colors.keyHoverBg} hover:text-[#ffffff]`
                : `bg-[#1a1a1a] text-[#ebebeb] border-[1px] ${colors.keyBorder} ${colors.keyHoverBg} hover:text-[#ffffff]`
            }`}
            title="Back to Projects"
          >
            <FaArrowLeft />
          </Link>
        </div>
        <div className="md:fixed hidden left-[26%] sm:left-[4%] top-[80px] sm:top-[125px] transform -translate-y-1/2 md:flex flex-col gap-3 sm:gap-4 z-50">
          <Link
            href="/home"
            className={`p-2 sm:p-3 rounded-lg text-md sm:text-xl ${
              theme
                ? `bg-[#ffffff] text-[#0a0a0a] border-[1px] ${colors.keyBorder} ${colors.keyHoverBg} hover:text-[#ffffff]`
                : `bg-[#1a1a1a] text-[#ebebeb] border-[1px] ${colors.keyBorder} ${colors.keyHoverBg} hover:text-[#ffffff]`
            }`}
            title="Back to Projects"
          >
            <FaArrowLeft />
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
