// TopNavbar component
"use client";

import colors from "@/app/color/color";
import { useAuth } from "@/app/hooks/useAuth";
import { useTheme } from "@/app/hooks/useTheme";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ProfileIcon from "./ProfileIcon";
import ToogleTheme from "./ToogleTheme";

// ──────────────────────────────────────────────────────────────
//  ONLY ADDED: Props interface + type annotation
// ──────────────────────────────────────────────────────────────
interface NavItemProps {
  href: string;
  label: string;
  active: boolean;
  onClick: () => void;
  theme: boolean;
}

const NavItem = ({ href, label, active, onClick, theme }: NavItemProps) => (
  <Link href={href}>
    <div
      className={`flex items-center h-full px-2 cursor-pointer transition-colors duration-200`}
      onClick={onClick}
    >
      <span
        className={`sm:text-[15px] font-sans tracking-wider ${
          theme
            ? active
              ? colors.keyText
              : "text-[#555555] hover:text-[#000000]"
            : active
            ? colors.keyText
            : "text-[#cccccc] hover:text-[#ffffff]"
        } `}
      >
        {label}
      </span>
    </div>
  </Link>
);

const TopNavbar = () => {
  const { theme } = useTheme();
  const { user: auth } = useAuth();
  const [active, setActive] = useState("home");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const trimedPathname = pathname.split("/").pop();

  // Define base navItems
  const baseNavItems = [
    { href: "/home", label: "Home", activeKey: "home" },
    { href: "/pricing", label: "Pricing", activeKey: "pricing" },
    { href: "/chat", label: "Chat", activeKey: "chat" },
    { href: "/history", label: "History", activeKey: "history" },
  ];

  // Conditionally add Admin route if user is admin
  const navItems = auth?.isAdmin
    ? [...baseNavItems, { href: "/admin", label: "Admin", activeKey: "admin" }]
    : baseNavItems;

  useEffect(() => {
    if (trimedPathname) {
      setActive(trimedPathname);
    } else {
      setActive("home");
    }
  }, [trimedPathname]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      {/* Desktop Navbar */}
      <nav
        className={`fixed top-0 z-50 w-[99%] h-12 sm:h-14 md:h-16 hidden sm:flex items-center justify-between border-b-[1px] px-[10%] bg-opacity-65 backdrop-blur-xl ${
          theme
            ? "bg-[#ffffff] border-[#dddddd]"
            : "bg-[#000000] border-[#222222]"
        }`}
      >
        {/* Logo */}
        <Link href="/home">
          <div
            className={`text-lg sm:text-lg md:text-xl lg:text-2xl font-bold tracking-wide ${
              theme ? "text-[#222222]" : "text-[#dadada]"
            }`}
          >
            Recruiter Reply
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {navItems.map((item) => (
            <NavItem
              key={item.activeKey}
              href={item.href}
              label={item.label}
              active={active === item.activeKey}
              onClick={() => setActive(item.activeKey)}
              theme={theme}
            />
          ))}
          <div className="flex items-center">
            <ToogleTheme />
            <ProfileIcon />
          </div>
        </div>
      </nav>

      {/* Mobile Navbar */}
      <nav
        className={`fixed top-0 z-50 w-full h-14 flex sm:hidden items-center justify-between px-[10%] bg-opacity-50 backdrop-blur-md ${
          theme
            ? "bg-[#ffffff] border-[#dddddd]"
            : "bg-[#000000] border-[#222222]"
        }`}
      >
        {/* Logo */}
        <Link href="/home">
          <div
            className={`text-[12px] font-bold tracking-wide ${
              theme ? "text-[#222222]" : "text-[#dadada]"
            }`}
          >
            Recruiter Reply
          </div>
        </Link>

        {/* Hamburger Menu Button */}
        <div className="flex items-center">
          <ToogleTheme />
          <ProfileIcon />
          <button
            onClick={toggleMenu}
            className={`focus:outline-none ml-2 ${
              theme ? "text-[#222222]" : "text-[#dadada]"
            }`}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d={
                  isMenuOpen
                    ? "M6 18L18 6M6 6l12 12"
                    : "M4 6h16M4 12h16M4 18h16"
                }
              />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div
          className={`fixed z-40 w-full top-14 bg-opacity-65 backdrop-blur-xl border-b-[1px] ${
            theme
              ? "bg-[#ffffff] border-[#dddddd]"
              : "bg-[#000000] border-[#222222]"
          }`}
        >
          <div className="flex flex-col items-center py-4 space-y-2">
            {navItems.map((item) => (
              <NavItem
                key={item.activeKey}
                href={item.href}
                label={item.label}
                active={active === item.activeKey}
                onClick={() => {
                  setActive(item.activeKey);
                  setIsMenuOpen(false);
                }}
                theme={theme}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default TopNavbar;
