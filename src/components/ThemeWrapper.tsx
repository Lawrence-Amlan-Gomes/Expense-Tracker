// app/components/ThemeWrapper.tsx
"use client";

import { useTheme } from "@/app/hooks/useTheme";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

interface ThemeWrapperProps {
  children: ReactNode;
}

// true = light, false = dark (same meaning as before).
// Colours themselves now come from CSS variables keyed on <html data-theme>.
export default function ThemeWrapper({ children }: ThemeWrapperProps) {
  const { theme, setTheme } = useTheme();
  const [ready, setReady] = useState(false);

  // 1) On first mount: saved choice wins, otherwise follow the system.
  useEffect(() => {
    let light = true;
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "light" || saved === "dark") {
        light = saved === "light";
      } else {
        light = !window.matchMedia("(prefers-color-scheme: dark)").matches;
      }
    } catch {
      light = true;
    }
    setTheme(light);
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) Keep <html data-theme> in sync once the real theme is known.
  useEffect(() => {
    if (!ready) return;
    document.documentElement.setAttribute(
      "data-theme",
      theme ? "light" : "dark",
    );
  }, [theme, ready]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-canvas text-body">
      {children}
    </div>
  );
}
