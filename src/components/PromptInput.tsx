"use client";

import colors from "@/app/color/color";
import { useTheme } from "@/app/hooks/useTheme";
import { useEffect, useState } from "react";
import { FaArrowUp } from "react-icons/fa";

export default function PromptInput({
  myText,
  setMyText,
  getResponse,
  setIsTyping,
  aiResponse,
}) {
  const [iAmThinking, setIAmThinking] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setIAmThinking(false);
  }, [aiResponse]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (myText !== "") {
        setIAmThinking(true);
        getResponse();
      }
    }
  };

  return (
    <div
      className={`relative w-full h-full overflow-hidden p-[1%] border-[1px] rounded-lg ${
        theme
          ? "bg-[#ffffff] border-[#333333]"
          : "bg-[#000000] border-[#444444]"
      }`}
    >
      <textarea
        className={`w-full h-full text-[12px] sm:text-[16px] pl-[3%] pr-[15%] py-[1%] sm:pl-[2%] rounded-lg resize-none overflow-y-auto outline-none scrollbar-thin ${
          theme
            ? "bg-white text-black placeholder:text-[#666666] scrollbar-thumb-[#222222] scrollbar-track-[#f8f8f8]"
            : "bg-black text-[#eeeeee] placeholder:text-[#888888] scrollbar-thumb-[#eeeeee] scrollbar-track-[#0f0f0f]"
        }`}
        placeholder={
          iAmThinking
            ? "I am thinking..."
            : "Ask me anything about Daily Routine..."
        }
        value={myText}
        onChange={(e) => {
          setMyText(e.target.value);
          setIsTyping(true);
        }}
        onKeyDown={handleKeyDown}
      ></textarea>
      <FaArrowUp
        onClick={() => {
          if (myText !== "") {
            setIAmThinking(true);
            getResponse();
          }
        }}
        className={`absolute bottom-2 right-2 sm:bottom-3 sm:right-3 cursor-pointer hover:text-white hover:border-[1px] ${colors.keyHoverBg} ${colors.keyText} ${colors.keyBorder} border-[1px] rounded-md p-1 text-[25px] sm:text-[25px] hover:cursor-pointer`}
      />
    </div>
  );
}
