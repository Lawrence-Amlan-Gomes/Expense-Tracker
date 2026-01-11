"use client";
import { useTheme } from "@/app/hooks/useTheme";

export default function TermsAndConditions() {
  const { theme } = useTheme();
  return (
    <div
      className={`px-[10%] mt-[20%] sm:mt-[10%] text-3xl text-center sm:px-[10%] mb-[5%] pb-[5%] w-full ${
        theme ? "bg-[#ffffff] text-[#aaaaaaa]" : "bg-[#000000] text-[#eeeeee]"
      }`}
    >
      Terms and Conditions
    </div>
  );
}
