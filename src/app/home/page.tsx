// src/app/home/page.tsx
// Old landing route. "/" now handles both cases.
import { redirect } from "next/navigation";

export default function LandingPageHome() {
  redirect("/");
}
