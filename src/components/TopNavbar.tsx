/* eslint-disable @next/next/no-img-element */
// TopNavbar component
"use client";

import { findUserByEmail } from "@/app/actions";
import colors from "@/app/color/color";
import { useAuth } from "@/app/hooks/useAuth";
import { useTheme } from "@/app/hooks/useTheme";
import { logout } from "@/store/features/auth/authSlice";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
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
  const { user: auth, setAuth } = useAuth();
  const dispatch = useDispatch();
  const [active, setActive] = useState("home");
  const [firstTime, setFirstTime] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const trimedPathname = pathname.split("/").pop();

  // Define base navItems
  const baseNavItems = [
    { href: "/home", label: "Home", activeKey: "home" },
    { href: "/dashBoard", label: "DashBoard", activeKey: "dashBoard" },
    { href: "/stats", label: "Stats", activeKey: "stats" },
    { href: "/calculator", label: "Calculator", activeKey: "calculator" },
  ];

  // Conditionally add Admin route if user is admin
  const navItems = auth?.isAdmin
    ? [...baseNavItems, { href: "/admin", label: "Admin", activeKey: "admin" }]
    : baseNavItems;

  useEffect(() => {
    setFirstTime(false);
  }, []);

  // ──────────────────────────────────────────────────────────────
  // Fetch fresh user data from DB **only once** on first render
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const syncAuthWithDB = async () => {
      if (!auth) return; // no user logged in → skip
      if (!auth.money) {
        dispatch(logout());
        await signOut({ redirect: false });
        return;
      }

      try {
        const freshUser = await findUserByEmail(auth.email);

        if (freshUser) {
          // Only update if something changed (optional optimization)
          console.log("Syncing auth with DB:", freshUser);
          // You can compare fields if you want, but usually just set it
          setAuth({
            ...freshUser,
            paymentType: freshUser.paymentType ?? "Free One Week", // ← or "Basic", "Expired", whatever your default should be
          });
        }
        if (!freshUser || !freshUser.money) {
          dispatch(logout());
          await signOut({ redirect: false });
        }
      } catch (err) {
        console.error("Failed to sync auth with DB:", err);
        // Optionally show toast or ignore silently
      }
    };

    syncAuthWithDB();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstTime]); // ← empty deps = run only once on mount

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
        className={`fixed top-0 z-50 w-[99%] h-12 sm:h-14 md:h-16 hidden lg:flex items-center justify-between border-b-[1px] pl-[10%] pr-[11%] bg-opacity-65 backdrop-blur-xl ${
          theme
            ? "bg-[#ffffff] border-gray-200"
            : "bg-[#000000] border-[#222222]"
        }`}
      >
        {/* Logo */}
        <Link href="/home">
          <div className="flex items-center gap-2 sm:gap-3">
            <img
              src="/Icon.png"
              alt="Expense Tracker Logo"
              className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 object-contain"
            />
            <div
              className={`text-lg sm:text-lg md:text-xl lg:text-2xl font-bold tracking-wide ${
                theme ? "text-[#222222]" : "text-[#dadada]"
              }`}
            >
              Expense Tracker
            </div>
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
            <ProfileIcon
              active={active === "profile" ? "profile" : undefined}
            />
          </div>
        </div>
      </nav>

      {/* Mobile Navbar */}
      <nav
        className={`fixed top-0 z-50 w-full h-14 flex lg:hidden border-b-[1px] items-center justify-between px-[10%] bg-opacity-50 backdrop-blur-md ${
          theme
            ? "bg-[#ffffff] border-gray-200"
            : "bg-[#000000] border-[#222222]"
        }`}
      >
        {/* Logo */}
        <Link href="/home">
          <div className="flex items-center gap-2">
            <img
              src="/Icon.png"
              alt="Expense Tracker Logo"
              className="h-6 w-6 sm:h-7 sm:w-7 object-contain"
            />
            <div
              className={`text-[12px] sm:text-[18px] font-bold tracking-wide ${
                theme ? "text-[#222222]" : "text-[#dadada]"
              }`}
            >
              Expense Tracker
            </div>
          </div>
        </Link>

        {/* Hamburger Menu Button */}
        <div className="flex items-center">
          <ToogleTheme />
          <ProfileIcon active={active === "profile" ? "profile" : undefined} />
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
