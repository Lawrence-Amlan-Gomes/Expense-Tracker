"use client";

import { useAuth } from "@/app/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LandingPage from "./Landing";

// "/" rule:
//   logged in  → go to /dashBoard
//   logged out → show the landing page
// An inline script in <head> sets data-has-auth="1" before paint when saved
// credentials exist, so a signed-in user never sees the landing flash.
export default function HomeGate() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace("/dashBoard");
      return;
    }

    let hasStored = false;
    try {
      hasStored = !!(
        localStorage.getItem("authUser") || localStorage.getItem("authToken")
      );
    } catch {
      hasStored = false;
    }

    const root = document.documentElement;
    if (!hasStored) {
      root.removeAttribute("data-has-auth");
      return;
    }
    // A saved token may still be verifying. If it never turns into a user,
    // stop waiting and show the landing page.
    const t = setTimeout(() => root.removeAttribute("data-has-auth"), 3000);
    return () => clearTimeout(t);
  }, [user, router]);

  return (
    <>
      <div className="landing-splash" role="status" aria-label="Loading">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-mint-200 border-t-primary" />
      </div>
      <div className="landing-root">
        <LandingPage />
      </div>
    </>
  );
}
