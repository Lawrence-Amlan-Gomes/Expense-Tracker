"use client";
import colors from "@/app/color/color";
import { useTheme } from "@/app/hooks/useTheme";
import Image from "next/image";
import { FaQuoteLeft } from "react-icons/fa";

export default function TestimonialCard({
  clientName,
  clientImg,
  clientRole,
  clientQuote,
}) {
  const { theme } = useTheme();

  return (
    <div
      className={`w-full mx-auto p-8 rounded-2xl hover:cursor-pointer border-[1px] flex flex-col justify-between relative ${
        theme
          ? `bg-[#ffffff] hover:bg-[#fafafa] text-[#aaaaaa] ${colors.keyBorder}`
          : `bg-[#000000] hover:bg-[#060606] text-[#eeeeee] ${colors.keyBorder}`
      }`}
    >
      <div className="flex flex-col flex-grow">
        {/* Quote Icon */}
        <FaQuoteLeft
          className={`text-xl mb-4 ${
            theme ? "text-[#666666]" : "text-[#aaaaaa]"
          }`}
        />

        {/* Quote Text */}
        <p
          className={`lg:text-md text-sm leading-relaxed text-justify mb-6 ${
            theme ? "text-[#666666]" : "text-[#aaaaaa]"
          }`}
        >
          {clientQuote}
        </p>
      </div>

      {/* Author Section - Pinned to Bottom */}
      <div className="flex items-center gap-4 mt-auto">
        <div className="relative w-12 h-12 rounded-lg overflow-hidden">
          <Image
            src={clientImg}
            alt={clientName}
            width={50}
            height={50}
            className="object-cover"
          />
        </div>
        <div>
          <h3
            className={`font-semibold lg:text-md text-sm ${
              theme ? "text-[#333333]" : "text-[#dddddd]"
            }`}
          >
            {clientName}
          </h3>
          <p
            className={`text-sm ${theme ? "text-[#666666]" : "text-[#aaaaaa]"}`}
          >
            {clientRole}
          </p>
        </div>
      </div>
    </div>
  );
}
