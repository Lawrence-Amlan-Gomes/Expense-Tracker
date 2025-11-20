"use client";

import colors from "@/app/color/color";
import { useAuth } from "@/app/hooks/useAuth";
import { useTheme } from "@/app/hooks/useTheme";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

// ──────────────────────────────────────────────────────────────
//  ONLY ADDED: Props interface + type annotation
// ──────────────────────────────────────────────────────────────
interface ProfileIconProps {
  active?: string; // matches your usage: active === "profile"
}

const ProfileIcon = ({ active }: ProfileIconProps) => {
  const pathname = usePathname();
  const { theme } = useTheme();
  const { user: auth } = useAuth();

  // local fallback handling
  const [imgError, setImgError] = useState(false);

  // Choose the correct border & background color
  const baseStyle = `border-[1px] lg:h-[40px] lg:w-[40px] sm:w-[35px] sm:h-[35px] h-[30px] w-[30px] rounded-lg relative overflow-hidden`;

  const lightMode =
    active === "profile"
      ? `bg-transparent hover:bg-[#eeeeee] text-black ${colors.keyBorder}`
      : `bg-transparent hover:bg-[#eeeeee] text-black border-[#333333]`;

  const darkMode =
    active === "profile"
      ? `bg-[#000000] hover:bg-[#222222] text-white ${colors.keyBorder}`
      : `bg-[#000000] hover:bg-[#222222] text-white border-[#999999]`;

  const profileStyle = `${baseStyle} ${theme ? lightMode : darkMode}`;

  // Determine which image to display
  const defaultIcon = theme ? "/profileIconLight.png" : "/profileIconDark.png";
  const userPhoto = !imgError && auth?.photo ? auth.photo : defaultIcon;

  // Build the href link
  const linkHref = auth
    ? "/profile"
    : pathname === "/login"
    ? "/register"
    : "/login";

  return (
    <div>
      <Link href={linkHref}>
        <div className="flex justify-center items-center h-full">
          <div className={profileStyle}>
            <Image
              priority
              src={userPhoto}
              alt={
                auth
                  ? `${auth.name || "User"}'s profile picture`
                  : "Profile Icon"
              }
              fill // ← Use `fill` instead of fixed width/height
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 30vw"
              className="object-cover"
              onError={() => setImgError(true)}
            />
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProfileIcon;
