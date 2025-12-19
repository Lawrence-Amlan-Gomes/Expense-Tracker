"use client";

import colors from "@/app/color/color";
import { useAuth } from "@/app/hooks/useAuth";
import { useTheme } from "@/app/hooks/useTheme";
import { AnimatePresence, motion } from "framer-motion";
import { use, useEffect, useState } from "react";
import {
  MdKeyboardDoubleArrowLeft,
  MdKeyboardDoubleArrowRight,
} from "react-icons/md";
import Chat from "./Chat";
import EmailNotVerified from "./EmailNotVerified";
import { useRouter } from "next/navigation";

export default function DashBoard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const { theme } = useTheme();
  const { user: auth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if(auth === null){
      router.push("/login");
    } 
  }, []);
  // --------------------------------------------------------------
  // 1. Mark component as mounted after first render
  // --------------------------------------------------------------
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // --------------------------------------------------------------
  // 2. Spring config – used **only** on desktop toggles
  // --------------------------------------------------------------
  const spring = {
    type: "spring",
    stiffness: 320,
    damping: 32,
    mass: 1,
  };

  // --------------------------------------------------------------
  // 3. Width values
  // --------------------------------------------------------------
  const sidebar = { closed: "5%", open: "20%" };
  const main = { closed: "95%", open: "80%" };

  // --------------------------------------------------------------
  // 4. Conditional transition – **false** on mount AND on mobile
  // --------------------------------------------------------------
  const transition = hasMounted ? spring : false;

  return auth?.isEmailVerified ? (
    <div className="h-full w-full overflow-hidden fixed">
      {/* -------------------- SIDEBAR (desktop only) -------------------- */}
      <motion.div
        className={`
          h-full float-left hidden sm:block 
          ${
            theme
              ? "bg-white border-r-[1px] border-[#dddddd]"
              : "bg-black border-r-[1px] border-[#222222]"
          }`}
        initial={{ width: sidebar.closed }}
        animate={{
          width: isSidebarOpen ? sidebar.open : sidebar.closed,
        }}
        transition={transition}
      >
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="h-full w-full pt-[150px]"
            >
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ------------------- TOGGLE ARROW (desktop only) ------------------- */}
      <motion.div
        onClick={() => setIsSidebarOpen((prev) => !prev)}
        className={`
          hidden sm:flex
          absolute h-[30px] w-[30px] justify-center items-center
          cursor-pointer border-[1px] ${colors.keyBorder} ${colors.keyHoverBg} ${colors.keyText} hover:text-white
          rounded-md top-[80px] left-[1.25%] z-10
        `}
        whileTap={{ scale: 0.92 }}
      >
        {isSidebarOpen ? (
          <MdKeyboardDoubleArrowLeft size={20} />
        ) : (
          <MdKeyboardDoubleArrowRight size={20} />
        )}
      </motion.div>

      {/* ----------------------- MAIN (Chat) ----------------------- */}
      <motion.div
        className="h-full relative float-left sm:float-left sm:block hidden"
        initial={{ width: "100%" }} // mobile = full width instantly
        animate={{
          width: isSidebarOpen ? main.open : main.closed,
        }}
        // On mobile we **force** width 100% and **disable** animation
        style={{ width: "100%" }} // overrides animation on <sm
        transition={transition}
      >
        
      </motion.div>

      <motion.div className="h-full w-full relative float-left sm:float-left block sm:hidden">
        
      </motion.div>
    </div>
  ) : (
    <EmailNotVerified />
  );
}
