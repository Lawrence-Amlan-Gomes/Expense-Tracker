"use client";
import {
  checkEmailVerificationStatus,
  resendVerificationEmail,
} from "@/app/actions";
import { useAuth } from "@/app/hooks/useAuth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function EmailNotVerified() {
  const { user: auth, setAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    if(!auth){
      router.push("/login");
    }
  }, [auth, router]);

  // Poll for verification status every 5 seconds
  useEffect(() => {
    const checkVerification = async () => {
      if (!auth?.email) return;

      const result = await checkEmailVerificationStatus(auth.email);

      if (result.success && result.isEmailVerified) {
        // Update Redux state
        setAuth({
          ...auth,
          isEmailVerified: true,
        });
      }
    };

    // Check immediately
    checkVerification();

    // Then check every 5 seconds
    const interval = setInterval(checkVerification, 5000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.email]);

  async function reSend() {
    if (!auth?.email || !auth?.name) return;

    setLoading(true);
    setMessage("");

    try {
      const result = await resendVerificationEmail(auth.email, auth.name);

      if (result.success) {
        setMessage("Verification email sent successfully! Check your inbox.");
      } else {
        setMessage(result.error || "Failed to send email");
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setMessage("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full flex-1 items-center justify-center bg-soft px-4 py-16">
      <div className="card w-full max-w-md p-6 text-center sm:p-8">
        <h1 className="text-2xl">Please verify your email</h1>
        <p className="mt-3 text-sm font-light text-body">
          Verify your email to start using Expense Tracker. Haven&apos;t received
          the email yet?
        </p>

        {message && (
          <p
            role="status"
            className={`mt-4 text-sm font-medium ${
              message.includes("success") ? "text-brand" : "text-error"
            }`}
          >
            {message}
          </p>
        )}

        <button
          onClick={reSend}
          disabled={loading}
          className="btn-primary mt-6 w-full"
        >
          {loading ? "Sending…" : "Resend it"}
        </button>

        <p className="mt-4 text-xs text-muted">
          Checking verification status automatically…
        </p>
      </div>
    </div>
  );
}
