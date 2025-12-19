"use client";

import colors from "@/app/color/color";
import { useAuth } from "@/app/hooks/useAuth";
import { useTheme } from "@/app/hooks/useTheme";
import Link from "next/link";
import { useState, useRef } from "react";

export default function Hero() {
  const { theme } = useTheme();
  const { user: auth } = useAuth();
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleUnmute = () => {
    if (videoRef.current && isMuted) {
      videoRef.current.muted = false;
      videoRef.current.currentTime = 0; // Start from beginning
      setIsMuted(false);
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  return (
    <div className="w-full px-[10%] mb-[10%] flex flex-col md:flex-row items-start justify-between">
      <div className="w-full md:w-1/2 sm:pr-[5%] flex flex-col justify-center items-start space-y-6">
        <h1
          className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight ${
            theme ? "text-[#0a0a0a]" : "text-[#ebebeb]"
          }`}
        >
          Make Your <span className={`${colors.keyText}`}>Daily Routine</span>{" "}
          And Utilize Your Time Better
        </h1>
        <p
          className={`text-md sm:text-lg lg:text-xl ${
            theme ? "text-gray-600" : "text-gray-300"
          }`}
        >
          Save time and stand out with tailored, professional email responses to
          recruiters, generated in seconds.
        </p>
        <div className="flex space-x-4">
          <Link
            href="/chat"
            className={`px-6 py-2 rounded-lg text-sm md:text-lg font-semibold transition-all duration-300 flex justify-center items-center ${colors.keyBg} ${colors.keyHoverBg} text-white`}
          >
            Get Started
          </Link>
          <Link
            href="/pricing"
            className={`px-6 py-2 rounded-lg text-sm md:text-lg font-semibold transition-all duration-300 border flex justify-center items-center ${
              theme
                ? "border-[#0a0a0a] text-[#0a0a0a] hover:bg-[#0a0a0a] hover:text-white"
                : "border-[#ebebeb] text-[#ebebeb] hover:bg-[#ebebeb] hover:text-[#0a0a0a]"
            }`}
          >
            Pricing
          </Link>
        </div>
      </div>

      <div className="w-full md:w-1/2 mt-8 md:mt-0 flex justify-center">
        <div
          className={`w-full max-w-[600px] aspect-[16/9] rounded-lg border-[1px] ${
            colors.keyBorder
          } ${
            theme ? "bg-gray-100" : "bg-[#111111]"
          } overflow-hidden relative group`}
        >
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/video.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          
          {/* Controls Container */}
          <div className="absolute bottom-4 right-4 flex items-center space-x-2">
            {/* Play/Pause Button - Visible on hover */}
            <button
              onClick={togglePlayPause}
              className={`p-3 rounded-full transition-all duration-300 ${
                theme
                  ? "bg-white/90 hover:bg-white text-gray-800"
                  : "bg-black/90 hover:bg-black text-white"
              } shadow-lg opacity-0 group-hover:opacity-100`}
              aria-label={isPlaying ? "Pause video" : "Play video"}
            >
              {isPlaying ? (
                // Pause Icon
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                // Play Icon
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Unmute Button - Only visible when muted */}
            {isMuted && (
              <button
                onClick={handleUnmute}
                className={`p-3 rounded-full transition-all duration-300 ${
                  theme
                    ? "bg-white/90 hover:bg-white text-gray-800"
                    : "bg-black/90 hover:bg-black text-white"
                } shadow-lg`}
                aria-label="Unmute video"
              >
                {/* Muted Icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}