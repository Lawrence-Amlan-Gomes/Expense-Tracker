"use client";
import { useTheme } from "@/app/hooks/useTheme";
import { Moon, Sun } from "lucide-react";

function ToogleTheme() {
  const { theme, toggleTheme } = useTheme();

  const onClick = () => {
    try {
      // theme === true means light right now, so the next value is dark.
      localStorage.setItem("theme", theme ? "dark" : "light");
    } catch {
      /* storage blocked: the toggle still works for this visit */
    }
    toggleTheme();
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={theme ? "Switch to dark mode" : "Switch to light mode"}
      title={theme ? "Dark mode" : "Light mode"}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-mint-50 text-brand transition-colors hover:bg-mint-100"
    >
      {theme ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}

export default ToogleTheme;
