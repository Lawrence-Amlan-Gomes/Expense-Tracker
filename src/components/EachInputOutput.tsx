"use client";
import { useTheme } from "@/app/hooks/useTheme";
import { motion } from "framer-motion";
import { CgCopy } from "react-icons/cg";
import { useState } from "react";

export default function EachInputOutput({ pair, isLast, isLoading }) {
  const { theme } = useTheme();
  const [copiedUser, setCopiedUser] = useState(false);
  const [copiedAI, setCopiedAI] = useState(false);

  // Parse bold (**text**)
  const renderTextWithBold = (text) => {
    const regex = /\*\*(.*?)\*\*/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const before = text.slice(lastIndex, match.index);
      if (before) parts.push({ text: before, isBold: false });
      parts.push({ text: match[1], isBold: true });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push({ text: text.slice(lastIndex), isBold: false });
    }

    return parts.map((part, i) => (
      <span key={i} className={part.isBold ? "font-bold" : ""}>
        {part.text}
      </span>
    ));
  };

  // Render text with line breaks preserved
  const renderTextWithLineBreaks = (text) => {
    return text.split('\n').map((line, index, array) => (
      <span key={index}>
        {renderTextWithBold(line)}
        {index < array.length - 1 && <br />}
      </span>
    ));
  };

  // ✅ Detect heading level — handles ** and #
  const detectHeadingLevel = (text) => {
    const trimmed = text.trim();
    if (/^#{3,}\s*\**/.test(trimmed)) return 3;
    if (/^#{2}\s*\**/.test(trimmed)) return 2;
    if (/^#{1}\s*\**/.test(trimmed)) return 1;
    if (/^\s*\*\*.*\*\*\s*$/.test(trimmed)) return 1; // pure bold line = heading
    return 0;
  };

  // ✅ Remove all leading hashes and spaces
  const cleanHeadingText = (text) => text.replace(/^#{1,6}\s*/, "").trim();

  // ✅ Get clean text without markdown formatting
  const getCleanText = (text) => {
    return text
      .split("[/n]") // Split by [/n] first
      .filter((p) => p.trim() !== "") // Remove empty paragraphs
      .map((p) =>
        p
          .replace(/\*\*/g, "") // Remove bold markers
          .replace(/^#{1,6}\s*/gm, "") // Remove heading markers
          .trim()
      )
      .join("\n\n"); // Join with double newline (one blank line between paragraphs)
  };

  // ✅ Copy handler for user text
  const handleCopyUser = async () => {
    try {
      await navigator.clipboard.writeText(pair[0]);
      setCopiedUser(true);
      setTimeout(() => setCopiedUser(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // ✅ Copy handler for AI response
  const handleCopyAI = async () => {
    const cleanText = getCleanText(pair[1]);
    try {
      await navigator.clipboard.writeText(cleanText);
      setCopiedAI(true);
      setTimeout(() => setCopiedAI(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const typingVariants = {
    animate: {
      opacity: [0, 1, 0],
      transition: {
        opacity: { repeat: Infinity, duration: 0.5, ease: "easeInOut" },
      },
    },
  };

  const fontSizes = {
    0: "text-[12px] sm:text-[16px]",
    1: "text-[14px] sm:text-[18px]",
    2: "text-[16px] sm:text-[20px]",
    3: "text-[15px] sm:text-[18px]",
  };

  const spacing = {
    0: "sm:mb-3 mb-2",
    1: "mt-3 mb-1 sm:mt-4 sm:mb-1",
    2: "mt-4 mb-2 sm:mt-5 sm:mb-3",
    3: "mt-3 mb-2 sm:mt-4 sm:mb-2",
  };

  return (
    <div className="w-full relative">
      {/* User Input */}
      <div className="relative w-full">
        <div
          className={`border-[1px] ${
            theme
              ? "bg-[#ffffff] text-black border-[#333333]"
              : "bg-[#000000] text-[#cccccc] border-[#444444]"
          } w-[78%] ml-[20%] text-justify py-2 px-3 rounded-md sm:mb-5 mr-[2%] text-[12px] sm:text-[16px] mb-3 whitespace-pre-wrap`}
        >
          {renderTextWithLineBreaks(pair[0])}
        </div>

        {/* Copy Button for User Text - Outside left margin */}
        <button
          onClick={handleCopyUser}
          className={`absolute top-0 left-8 sm:left-10 p-1.5 rounded transition-all duration-200 ${
            copiedUser
              ? "text-green-500"
              : theme
              ? "text-gray-600 hover:text-purple-700 hover:bg-gray-100"
              : "text-gray-400 hover:text-purple-500 hover:bg-[#222222]"
          }`}
          title={copiedUser ? "Copied!" : "Copy user text"}
        >
          {copiedUser ? (
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <CgCopy className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </button>
      </div>

      {/* AI Response */}
      <div
        className={`w-[78%] mr-[20%] ml-[2%] ${
          theme ? "text-[#111111]" : "text-[#dddddd]"
        } text-justify pr-3 pl-2 rounded-md sm:mb-10 mb-6 relative`}
      >
        {isLast && isLoading ? (
          <motion.div
            className="flex items-center space-x-2"
            variants={typingVariants}
            animate="animate"
          >
            <motion.span className="inline-block w-2 h-2 bg-current rounded-full"></motion.span>
            <motion.span className="inline-block w-2 h-2 bg-current rounded-full"></motion.span>
            <motion.span className="inline-block w-2 h-2 bg-current rounded-full"></motion.span>
          </motion.div>
        ) : (
          <>
            {pair[1]
              .split("[/n]")
              .filter((p) => p.trim() !== "")
              .map((paragraph, index) => {
                const level = detectHeadingLevel(paragraph);
                const cleanText = cleanHeadingText(paragraph);

                const colorClass = level > 0 ? "text-purple-700 font-bold" : "";

                return (
                  <p
                    key={index}
                    className={`${fontSizes[level]} ${spacing[level]} ${colorClass}`}
                  >
                    {renderTextWithBold(cleanText)}
                  </p>
                );
              })}
          </>
        )}

        {/* Copy Button for AI Response */}
        {!isLoading && (
          <button
            onClick={handleCopyAI}
            className={`absolute top-0 -right-8 sm:-right-10 p-1.5 rounded transition-all duration-200 ${
              copiedAI
                ? "text-green-500"
                : theme
                ? "text-gray-600 hover:text-purple-700 hover:bg-gray-100"
                : "text-gray-400 hover:text-purple-500 hover:bg-[#222222]"
            }`}
            title={copiedAI ? "Copied!" : "Copy response"}
          >
            {copiedAI ? (
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <CgCopy className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}