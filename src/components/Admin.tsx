"use client";
import { useAuth } from "@/app/hooks/useAuth";
import PageBand from "./PageBand";

export default function Admin() {
  const { user: auth } = useAuth();
  return (
    <div className="w-full">
      <PageBand
        crumb="Admin"
        title="Admin"
        lead={auth ? `Welcome, ${auth.name}.` : undefined}
      />
    </div>
  );
}
