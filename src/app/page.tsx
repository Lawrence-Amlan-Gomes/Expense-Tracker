// src/app/page.tsx
// "/" → dashboard when logged in, landing page when not (see HomeGate).
import HomeGate from "@/components/HomeGate";

export default function RootPage() {
  return <HomeGate />;
}
