"use client";

import colors from "@/app/color/color";
import { useAuth } from "@/app/hooks/useAuth";
import { useTheme } from "@/app/hooks/useTheme";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface ProfileIconProps {
  active?: string; // e.g. "profile" when on profile page
}

const ProfileIcon = ({ active }: ProfileIconProps) => {
  const pathname = usePathname();
  const { theme } = useTheme();
  const { user: auth } = useAuth();

  // Choose border & background style based on active state and theme
  const baseStyle = `border-[1px] lg:h-[40px] lg:w-[40px] sm:w-[35px] sm:h-[35px] h-[30px] w-[30px] rounded-lg relative overflow-hidden flex items-center justify-center font-medium text-lg`;

  const lightMode =
    active === "profile"
      ? `bg-transparent hover:bg-[#f8f8f8] text-black ${colors.keyBorder} border-[1px]`
      : `bg-transparent hover:bg-[#f8f8f8] text-black border-gray-400 hover:border-gray-400 border-[1px]`;

  const darkMode =
    active === "profile"
      ? `bg-transparent hover:bg-[#111111] text-white ${colors.keyBorder} border-[1px]`
      : `bg-transparent hover:bg-[#111111] text-white border-gray-800 hover:border-gray-700 border-[1px]`;

  const profileStyle = `${baseStyle} ${theme ? lightMode : darkMode}`;

  // ───────────────────────────────────────────────
  // Decide what to show inside the circle
  // ───────────────────────────────────────────────
  let content;

  if (auth && auth.name && auth.name.trim()) {
    // Show first letter of name (uppercase)
    const firstLetter = auth.name.trim()[0].toUpperCase();
    content = <span>{firstLetter}</span>;
  } else if (!auth) {
    // Not logged in → show default icon
    const defaultIcon = theme ? "/profileIconLight.png" : "/profileIconDark.png";
    content = (
      <Image
        priority
        src={defaultIcon}
        alt="Profile Icon"
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 30vw"
        className="object-cover"
      />
    );
  } else {
    // Edge case: logged in but no name → show "?"
    content = <span>?</span>;
  }

  // Where to redirect
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
            {content}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProfileIcon;