// TopNavbar component
"use client";

import { findUserByEmail } from "@/app/actions";
import { useAuth } from "@/app/hooks/useAuth";
import { logout } from "@/store/features/auth/authSlice";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";
import ProfileIcon from "./ProfileIcon";
import ToogleTheme from "./ToogleTheme";

interface NavLink {
  href: string;
  label: string;
}

const NavItem = ({
  href,
  label,
  active,
  onClick,
  block = false,
}: NavLink & { active: boolean; onClick?: () => void; block?: boolean }) => (
  <Link
    href={href}
    onClick={onClick}
    aria-current={active ? "page" : undefined}
    className={`text-sm font-bold transition-colors ${
      block ? "block border-b border-hairline px-4 py-3" : "relative py-5"
    } ${active ? "text-brand" : "text-ink hover:text-brand"}`}
  >
    {label}
    {!block && active && (
      <span className="absolute inset-x-0 bottom-0 h-[3px] bg-primary" />
    )}
  </Link>
);

const TopNavbar = () => {
  const { user: auth, setAuth } = useAuth();
  const dispatch = useDispatch();
  const [firstTime, setFirstTime] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    setFirstTime(false);
  }, []);

  // Close the mobile menu whenever the page changes.
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

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
          setAuth({
            ...freshUser,
            paymentType: freshUser.paymentType ?? "Free One Week",
          });
        }
        if (!freshUser || !freshUser.money) {
          dispatch(logout());
          await signOut({ redirect: false });
        }
      } catch (err) {
        console.error("Failed to sync auth with DB:", err);
      }
    };

    syncAuthWithDB();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstTime]);

  // Auth-dependent UI waits for mount so server and client HTML match.
  const loggedIn = mounted && !!auth;

  const links: NavLink[] = loggedIn
    ? [
        { href: "/dashBoard", label: "Dashboard" },
        { href: "/stats", label: "Stats" },
        { href: "/calculator", label: "Calculator" },
        ...(auth?.isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
      ]
    : [
        { href: "/", label: "Home" },
        { href: "/testimonials", label: "Testimonials" },
      ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.toLowerCase().startsWith(href.toLowerCase());

  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-canvas">
      <nav className="mx-auto flex h-16 w-full max-w-container items-center justify-between gap-6 px-4 sm:px-6">
        <Link href="/" aria-label="Expense Tracker home">
          <Logo />
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-7 lg:flex">
          {links.map((l) => (
            <NavItem key={l.href} {...l} active={isActive(l.href)} />
          ))}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ToogleTheme />
          {loggedIn ? (
            <ProfileIcon active={pathname === "/profile" ? "profile" : undefined} />
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/login" className="btn-secondary !min-h-[40px] !px-4 !py-2">
                Sign in
              </Link>
              <Link href="/register" className="btn-primary !min-h-[40px] !px-4 !py-2">
                Sign up
              </Link>
            </div>
          )}
          <button
            type="button"
            onClick={() => setIsMenuOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-mint-50 lg:hidden"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="border-t border-hairline bg-canvas lg:hidden">
          {links.map((l) => (
            <NavItem
              key={l.href}
              {...l}
              block
              active={isActive(l.href)}
              onClick={() => setIsMenuOpen(false)}
            />
          ))}
          {!loggedIn && (
            <div className="flex gap-3 p-4 sm:hidden">
              <Link href="/login" className="btn-secondary flex-1">
                Sign in
              </Link>
              <Link href="/register" className="btn-primary flex-1">
                Sign up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default TopNavbar;
