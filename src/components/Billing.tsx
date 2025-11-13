// src/components/login/Billing.tsx
"use client";

import { useAuth } from "@/app/hooks/useAuth";
import { useTheme } from "@/app/hooks/useTheme";
import { usePrice } from "@/app/hooks/usePrice";
import Link from "next/link";
import { useEffect } from "react";
import { updatePaymentType } from "@/app/actions";
import colors from "@/app/color/color";
import { useRouter } from "next/navigation";

export default function Billing() {
  const { user: auth } = useAuth();
  const { theme } = useTheme();
  const { wantToPaymentType, wantToPaymentDuration } = usePrice();
  const router = useRouter();

  useEffect(() => {
    if (!auth) {
      router.push("/login");
    }
  }, [auth, router]);

  const paymentString = `${wantToPaymentType} ${wantToPaymentDuration === "annual" ? "Annual" : "Monthly"}`;

  const handleConfirm = async () => {
    if (!auth?.email) return;

    try {
      await updatePaymentType(auth.email, paymentString);
      alert("Payment successful!");
      router.push("/");
    } catch (err) {
      alert("Payment failed. Please try again.");
    }
  };

  return (
    <div
      className={`h-full sm:pt-[10%] w-full flex flex-col items-center justify-center p-4 sm:p-6 ${
        theme ? "bg-[#ffffff] text-[#0a0a0a]" : "bg-[#000000] text-[#ebebeb]"
      }`}
    >
      <div className="max-w-md w-full">
        <h1
          className={`text-2xl sm:text-3xl font-bold mb-4 text-center ${
            theme ? "text-[#0a0a0a]" : "text-[#ebebeb]"
          }`}
        >
          Confirm Purchase
        </h1>

        <div className="text-center mb-6">
          <p className="text-lg sm:text-xl font-medium">
            You are purchasing:
          </p>
          <p className={`text-2xl sm:text-3xl font-bold mt-2 ${theme ? "text-[#0a0a0a]" : "text-[#ebebeb]"}`}>
            {paymentString}
          </p>
        </div>

        <button
          onClick={handleConfirm}
          className={`w-full p-2 sm:p-3 rounded-lg text-sm sm:text-base font-medium ${colors.keyColorBg} text-white hover:bg-blue-800`}
        >
          Confirm & Pay
        </button>

        <div className="mt-4 text-center">
          <button
            className={`p-2 sm:p-3 rounded-lg text-sm sm:text-base font-medium ${
              theme
                ? "bg-gray-200 text-[#0a0a0a] hover:bg-gray-300"
                : "bg-[#222222] text-[#ebebeb] hover:bg-[#2a2a2a]"
            }`}
          >
            <Link href="/payment">Go Back</Link>
          </button>
        </div>
      </div>
    </div>
  );
}