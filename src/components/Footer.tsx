"use client";
import Link from "next/link";
import { useTheme } from "@/app/hooks/useTheme";
import { FaLinkedin, FaGithub } from "react-icons/fa";
import { SiGmail } from "react-icons/si";
import { BsTwitterX } from "react-icons/bs";
import { useState } from "react";
import { TiTick } from "react-icons/ti";

function Footer() {
  const { theme } = useTheme();

  return (
    <>
      {" "}
      <Link
        className="absolute top-[0%] z-50 left-0 w-1 h-1"
        href="/comments"
      ></Link>
      <footer
        className={`w-full px-[5%] sm:px-[10%] py-[3%] bg-opacity-50 relative ${
          theme
            ? "bg-[#ffffff] border-t border-[#dddddd]"
            : "bg-[#000000] border-t border-[#222222]"
        }`}
      >
        <div className="w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
          <div className="W-full mx-auto">
            <span
              className={`text-base sm:text-lg font-bold ${
                theme ? "text-[#0a0a0a]" : "text-[#ebebeb]"
              }`}
            >
              Recruiter Reply
            </span>
            <span className="hidden sm:inline text-xs sm:text-sm mx-2">|</span>
            <span
              className={`text-xs sm:text-sm ${
                theme ? "text-[#555555]" : "text-[#cccccc]"
              }`}
            >
              © {new Date().getFullYear()} Recruiter Reply. All rights reserved.
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}

export default Footer;
