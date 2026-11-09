// src/components/login/Billing.tsx
"use client";

import { updatePaymentType } from "@/app/actions";
import { useAuth } from "@/app/hooks/useAuth";
import { usePrice } from "@/app/hooks/usePrice";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Billing() {
  const { user: auth, setAuth, hydrated } = useAuth();
  const { wantToPaymentType, wantToPaymentDuration } = usePrice();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    if (!auth) {
      router.push("/login");
    }
  }, [auth, hydrated, router]);

  const paymentString = `${wantToPaymentType} ${
    wantToPaymentDuration == "monthly" ? "Monthly" : "Annually"
  }`;

  const handleConfirm = async () => {
    if (!auth?.email) return;

    const expiredAt = new Date();
    if (wantToPaymentDuration == "monthly") {
      expiredAt.setDate(expiredAt.getDate() + 30);
    } else if (wantToPaymentDuration == "annual") {
      expiredAt.setDate(expiredAt.getDate() + 365);
    }

    try {
      await updatePaymentType(auth.email, paymentString, expiredAt);
      setAuth({
        ...auth,
        paymentType: paymentString,
        expiredAt: expiredAt.toISOString(),
      });
      alert("Payment successful!");
      router.push("/");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      alert("Payment failed. Please try again.");
    }
  };

  return (
    <div className="flex w-full flex-1 items-start justify-center bg-soft px-4 py-10 sm:py-16">
      <div className="card w-full max-w-md p-6 text-center sm:p-8">
        <h1 className="text-2xl sm:text-3xl">Confirm purchase</h1>

        <div className="mt-6 rounded-lg bg-mint-50 p-5">
          <p className="eyebrow">You are purchasing</p>
          <p className="mt-2 text-2xl font-bold text-ink">{paymentString}</p>
        </div>

        <div className="mt-6 space-y-3">
          <button onClick={handleConfirm} className="btn-primary w-full">
            Confirm &amp; pay
          </button>
          <Link href="/pricing" className="btn-secondary w-full">
            Go back
          </Link>
        </div>
      </div>
    </div>
  );
}
