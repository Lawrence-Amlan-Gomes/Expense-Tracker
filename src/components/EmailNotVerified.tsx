"use client";
import {
  checkEmailVerificationStatus,
  resendVerificationEmail,
} from "@/app/actions";
import { useAuth } from "@/app/hooks/useAuth";
import { useTheme } from "@/app/hooks/useTheme";
import { useEffect, useState } from "react";

export default function EmailNotVerified() {
  const { theme } = useTheme();
  const { user: auth, setAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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
    } catch (error) {
      setMessage("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`h-screen w-full overflow-hidden flex justify-center items-center`}
    >
      <div>
        <div className="text-red-600 rounded-lg">
          Please verify your email to use Daily Routine!
        </div>
        <div
          className={`${
            theme ? "text-[#222222]" : "text-[#dddddd]"
          } text-center mt-3`}
        >
          Haven't received verification email yet?
        </div>

        {message && (
          <div
            className={`text-center mt-3 text-sm ${
              message.includes("success") ? "text-green-600" : "text-red-600"
            }`}
          >
            {message}
          </div>
        )}

        <div className="w-full mt-5 flex justify-center items-center">
          <button
            onClick={reSend}
            disabled={loading}
            className={`${
              theme
                ? "text-white bg-black hover:bg-white hover:text-black border-black"
                : "text-black bg-white hover:bg-black hover:text-white border-white"
            } px-3 py-2 rounded-md text-center border-[1px] disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
          >
            {loading ? "Sending..." : "Resend It"}
          </button>
        </div>

        <div
          className={`text-xs text-center mt-4 ${
            theme ? "text-gray-600" : "text-gray-400"
          }`}
        >
          Checking verification status automatically...
        </div>
      </div>
    </div>
  );
}
