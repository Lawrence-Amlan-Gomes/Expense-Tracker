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
// `hydrated` (from the auth store) says when saved credentials are resolved.
export default function HomeGate() {
  const { user, hydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until saved credentials have been read (and a saved token verified).
    if (!hydrated) return;

    if (user) {
      router.replace("/dashBoard");
      return;
    }
    // Not signed in: show the landing page.
    document.documentElement.removeAttribute("data-has-auth");
  }, [user, hydrated, router]);

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
