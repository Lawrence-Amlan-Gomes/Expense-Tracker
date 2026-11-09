"use client";

import { useAuth } from "@/app/hooks/useAuth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { User } from "lucide-react";

interface ProfileIconProps {
  active?: string; // "profile" when on the profile page
}

// icon-circle-active / icon-circle-inactive from DESIGN.md
const ProfileIcon = ({ active }: ProfileIconProps) => {
  const pathname = usePathname();
  const { user: auth } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isActive = active === "profile";
  const circle = `flex h-10 w-10 items-center justify-center rounded-full text-base font-bold transition-colors ${
    isActive
      ? "bg-primary text-on-primary"
      : "bg-mint-50 text-brand hover:bg-mint-100"
  }`;

  const loggedIn = mounted && !!auth;
  const firstLetter = loggedIn && auth?.name?.trim() ? auth.name.trim()[0].toUpperCase() : "";

  const href = loggedIn ? "/profile" : pathname === "/login" ? "/register" : "/login";

  return (
    <Link href={href} aria-label={loggedIn ? "Your profile" : "Sign in"}>
      <div className={circle}>
        {firstLetter ? <span>{firstLetter}</span> : <User size={18} />}
      </div>
    </Link>
  );
};

export default ProfileIcon;
