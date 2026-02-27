"use client";
import { useTheme } from "@/app/hooks/useTheme";
import Image from "next/image";
import { useEffect } from "react";

function ToogleTheme() {
  const { theme, toggleTheme, setTheme } = useTheme();

  useEffect(() => {
    // Runs once on client-side mount
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    console.log(
      "Dark matches:",
      window.matchMedia("(prefers-color-scheme: dark)").matches,
    );
    console.log(
      "Light matches:",
      window.matchMedia("(prefers-color-scheme: light)").matches,
    );
    console.log(
      "No preference:",
      window.matchMedia("(prefers-color-scheme: no-preference)").matches,
    );
    setTheme(!prefersDark); // true = light, false = dark
  }, [setTheme]);

  return (
    <div className="flex justify-center items-center h-full mr-3">
      <div
        className={`rounded-lg border-[1px] bg-transparent lg:h-[40px] lg:w-[40px] sm:w-[35px] sm:h-[35px] h-[30px] w-[30px] relative ${
          theme
            ? "border-gray-400 hover:border-gray-400 hover:bg-[#eeeeee]/50"
            : "border-gray-800 hover:border-gray-700 hover:bg-[#111111]/50"
        }`}
        style={{ cursor: "pointer" }}
        onClick={toggleTheme}
      >
        <div className="h-full w-full relative">
          <Image
            priority
            src={theme ? "/Moon.png" : "/Sun.png"}
            alt={theme ? "moon" : "sun"}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 30vw"
            className="object-cover hover:cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}

export default ToogleTheme;
