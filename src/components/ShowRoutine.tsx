// src/components/ShowRoutine.tsx
"use client";

import { useTheme } from "@/app/hooks/useTheme";
import { useAuth } from "@/app/hooks/useAuth";
import { IRoutineItem } from "@/store/features/auth/authSlice";
import { useEffect, useState } from "react";

const daysOfWeek = [
  { full: "Sunday", short: "Sun" },
  { full: "Monday", short: "Mon" },
  { full: "Tuesday", short: "Tue" },
  { full: "Wednesday", short: "Wed" },
  { full: "Thursday", short: "Thu" },
  { full: "Friday", short: "Fri" },
  { full: "Saturday", short: "Sat" },
] as const;

const getMinutesPerSlot = (zoom: number) => {
  if (zoom <= 1) return 60;
  if (zoom <= 2) return 30;
  if (zoom <= 4) return 15;
  if (zoom <= 7) return 10;
  return 5; // 9-10x → 5 min slots
};

export default function ShowRoutine() {
  const { theme } = useTheme();
  const { user: auth } = useAuth();
  const [zoomLevel, setZoomLevel] = useState(3); // 1 to 10

  const pxPerMinute = zoomLevel;
  const hourHeight = 60 * pxPerMinute;

  const minutesPerSlot = getMinutesPerSlot(zoomLevel);
  const slotsPerHour = 60 / minutesPerSlot;

  // Generate dynamic time slots
  const timeSlots: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let min = 0; min < 60; min += minutesPerSlot) {
      const h = hour % 12 || 12;
      const ampm = hour < 12 ? "AM" : "PM";
      const m = min.toString().padStart(2, "0");
      timeSlots.push(`${h}:${m} ${ampm}`);
    }
  }

  if (!auth) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-lg opacity-70">
          Please log in to view your routine.
        </p>
      </div>
    );
  }

  useEffect(() => {
    console.log(`Zoom level changed to: ${zoomLevel}`);
  }, [zoomLevel]);

  const routine = auth.routine;

  return (
    <div
      className={`h-full relative scrollbar overflow-auto px-[10px] pt-[64px] pb-[30px] ${
        theme
          ? "bg-[#ffffff] scrollbar-thumb-black scrollbar-track-[#eeeeee]"
          : "bg-[#000000] scrollbar-thumb-white scrollbar-track-[#222222]"
      }`}
    >
      {/* Sticky header */}
      <div className={`sticky top-0 left-0 right-0 z-20 bg-inherit`}>
        <div
          id="nav"
          className={`h-[50px] w-full border-b-[1px] flex items-center justify-center gap-4 ${
            theme ? "border-[#888888]" : "border-[#888888]"
          }`}
        >
          <button
            onClick={() => setZoomLevel((p) => Math.max(1, p - 1))}
            className={`px-2 rounded
              ${
                theme
                  ? zoomLevel === 1
                    ? "bg-[#888888] text-[#bbbbbb] cursor-not-allowed"
                    : "bg-[#000000] text-white hover:bg-[#333333]"
                  : zoomLevel === 1
                  ? "bg-[#888888] text-[#444444] cursor-not-allowed"
                  : "bg-[#ffffff] text-black hover:bg-[#dddddd]"
              }`}
          >
            -
          </button>
          <span
            className={`font-semibold ${
              theme ? "text-gray-900" : "text-white"
            }`}
          >
            Zoom: {zoomLevel}×
          </span>
          <button
            onClick={() => setZoomLevel((p) => Math.min(10, p + 1))}
            className={`px-2 rounded
              ${
                theme
                  ? zoomLevel === 10
                    ? "bg-[#888888] text-[#bbbbbb] cursor-not-allowed"
                    : "bg-[#000000] text-white hover:bg-[#333333]"
                  : zoomLevel === 10
                  ? "bg-[#888888] text-[#444444] cursor-not-allowed"
                  : "bg-[#ffffff] text-black hover:bg-[#dddddd]"
              }`}
          >
            +
          </button>
        </div>
        <div
          className={`h-[50px] w-full border-b-[1px] ${
            theme ? "border-[#888888]" : "border-[#888888]"
          }`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-8 mx-auto">
            <div className={`overflow-hidden`}>
              <div
                className={`p-3 text-center font-semibold ${
                  theme ? "text-gray-900" : "text-white"
                }`}
              >
                Time
              </div>
            </div>

            {daysOfWeek.map((day) => (
              <div
                key={day.full}
                className={`overflow-hidden border-l-[1px] ${
                  theme ? "border-[#888888]" : "border-[#888888]"
                }`}
              >
                <div
                  className={`p-3 text-center font-semibold ${
                    theme ? "text-gray-900" : "text-white"
                  }`}
                >
                  {day.full}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid content */}
      <div className="grid grid-cols-1 sm:grid-cols-8 mx-auto">
        {/* Time column */}
        <div
          className={`font-bold text-lg pt-[20px] ${
            theme ? "text-gray-900" : "text-white"
          }`}
        >
          {timeSlots.map((time) => (
            <div
              key={time}
              className={`w-full text-[13px] border-t-[1px] border-blue-600`}
              style={{ height: `${hourHeight / slotsPerHour}px` }}
            >
              <div className={`flex justify-center items-center`}>
                <div
                  className={`absolute px-2 rounded-md border-[1px] border-blue-600 ${
                    theme ? "bg-[#ffffff]" : "bg-[#000000]"
                  }`}
                >
                  {time}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Days */}
        {daysOfWeek.map((day) => {
          const dayKey = day.full.toLowerCase() as keyof typeof routine;
          const tasks: IRoutineItem[] = routine[dayKey] || [];

          return (
            <div
              key={day.full}
              className={`overflow-hidden border-l-[1px] pt-[20px] ${
                theme ? "border-[#888888]" : " border-[#888888]"
              }`}
            >
              <div className="">
                <ul className="">
                  {tasks.map((task, i) => (
                    <li
                      key={i}
                      className={`p-2 text-sm border-t-[1px] border-blue-600 ${
                        theme
                          ? "bg-[#e0e0e0] text-gray-800"
                          : "bg-[#222222] text-gray-200"
                      }`}
                    >
                      <div className="font-medium">{task.name}</div>
                      <div className="text-xs opacity-75 mt-1">{task.time}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
