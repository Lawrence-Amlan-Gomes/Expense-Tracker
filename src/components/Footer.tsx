"use client";
import colors from "@/app/color/color";
import { useTheme } from "@/app/hooks/useTheme";
import Link from "next/link";

function Footer() {
  const { theme } = useTheme();

  return (
    <footer
      className={`w-full px-[5%] sm:px-[10%] py-[3%] bg-opacity-50 relative ${
        theme
          ? "bg-[#ffffff] border-t border-[#dddddd]"
          : "bg-[#000000] border-t border-[#222222]"
      }`}
    >
      <div className="w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
        <div className="flex flex-col sm:flex-row items-center space-x-0 sm:space-x-2 text-center sm:text-left">
          <span
            className={`text-base sm:text-lg font-bold ${
              theme ? "text-[#0a0a0a]" : "text-[#ebebeb]"
            }`}
          >
            Daily Routine
          </span>
          <span className="hidden sm:inline text-xs sm:text-sm">|</span>
          <span
            className={`text-xs sm:text-sm ${
              theme ? "text-[#555555]" : "text-[#cccccc]"
            }`}
          >
            © {new Date().getFullYear()} All rights reserved.
          </span>
        </div>
        <div className="flex items-center space-x-4 relative">
          <Link href="/privacy-policy">
            <div
              className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-[15px] font-medium hover:cursor-pointer hover:bg-transparent border-[1px] ${
                theme
                  ? "bg-black text-white hover:text-black border-black"
                  : "bg-white text-black hover:text-white border-white"
              }`}
            >
              Privacy Policy
            </div>
          </Link>
          <Link href="/terms-and-conditions">
            <div
              className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-[15px] font-medium hover:cursor-pointer
                    ${colors.keyBg} text-[#ffffff] hover:bg-transparent border-[1px] ${colors.keyBorder} ${colors.keyHoverText}`}
            >
              Terms & Conditions
            </div>
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
