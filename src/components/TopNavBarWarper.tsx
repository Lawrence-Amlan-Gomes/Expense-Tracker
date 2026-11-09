"use client";
import { ReactNode } from "react";

interface TopNavBarWarperProps {
  children: ReactNode;
}

// The navbar is sticky (it takes its own space), so pages need no top offset.
export default function TopNavBarWarper({ children }: TopNavBarWarperProps) {
  return <main className="w-full flex-1">{children}</main>;
}
