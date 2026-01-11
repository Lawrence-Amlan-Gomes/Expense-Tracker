"use client";
import { useTheme } from "@/app/hooks/useTheme";
import Hero from "./Hero";
import Footer from "./Footer";

export default function LandingPage() {
  const {theme} = useTheme();
  return (
    <div
      className={`w-[99%] sm:pt-[15%] pt-[20%] ${
        theme ? "bg-[#ffffff] text-[#aaaaaaa]" : "bg-[#000000] text-[#eeeeee]"
      }`}
    >
      <Hero/>
      <Footer/>
    </div>
  );
}