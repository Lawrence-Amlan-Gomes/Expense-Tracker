// src/components/ShowRoutine.tsx
"use client";

import { useTheme } from "@/app/hooks/useTheme";
import { useAuth } from "@/app/hooks/useAuth";
import { IRoutineItem } from "@/store/features/auth/authSlice";
import { useEffect, useState } from "react";
import { useRef } from "react";
import { set } from "mongoose";

const getMinutesPerSlot = (zoom: number) => {
  if (zoom <= 1.5) return 30;
  if (zoom <= 3) return 15;
  if (zoom <= 3.5) return 10;
  return 5; // 9-10x → 5 min slots
};

const getDurationFromTimeRange = (timeRange: string): number => {
  const regex = /^(\d{1,2}:\d{2} (?:AM|PM)) - (\d{1,2}:\d{2} (?:AM|PM))$/i;
  const match = timeRange.trim().match(regex);

  if (!match) {
    throw new Error(
      `Invalid time range format: "${timeRange}". Expected: "HH:MM AM/PM - HH:MM AM/PM"`
    );
  }

  const [, startStr, endStr] = match;

  // Convert "12:00 AM" → minutes since midnight
  const timeToMinutes = (time: string): number => {
    const [timePart, period] = time.split(" ");
    const [hours, minutes] = timePart.split(":").map(Number);

    let h = hours;
    if (period.toUpperCase() === "PM" && h !== 12) h += 12;
    if (period.toUpperCase() === "AM" && h === 12) h = 0;

    return h * 60 + minutes;
  };

  const startMinutes = timeToMinutes(startStr);
  const endMinutes = timeToMinutes(endStr);

  let duration = endMinutes - startMinutes;

  // Handle overnight tasks (end time before start time, e.g., 11:00 PM - 02:00 AM)
  if (duration < 0) {
    duration += 24 * 60; // add 24 hours
  }

  return duration;
};

export default function ShowRoutine({
  isSidebarOpen,
  setIsSidebarOpen,
  setSelectedDay,
  setTaskSearchQuery,
}: {
  isSidebarOpen?: boolean;
  setIsSidebarOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedDay?: React.Dispatch<React.SetStateAction<Day>>;
  setTaskSearchQuery: React.Dispatch<React.SetStateAction<string>>;
}) {
  const { theme } = useTheme();
  const { user: auth } = useAuth();
  const [zoomLevel, setZoomLevel] = useState(3.5); // 1 to 10
  const [daysOfWeek, setDaysOfWeek] = useState([
    { full: "Saturday", short: "Sat" },
    { full: "Sunday", short: "Sun" },
    { full: "Monday", short: "Mon" },
    { full: "Tuesday", short: "Tue" },
    { full: "Wednesday", short: "Wed" },
    { full: "Thursday", short: "Thu" },
    { full: "Friday", short: "Fri" },
  ]);
  const [nowHeight, setNowHeight] = useState(183);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const pxPerMinute = zoomLevel;
  const hourHeight = 60 * pxPerMinute;

  const minutesPerSlot = getMinutesPerSlot(zoomLevel);
  const slotsPerHour = 60 / minutesPerSlot;

  const rotateWeekLeft = () => {
    setDaysOfWeek((prev) => {
      const newDays = [...prev];
      const last = newDays.pop()!; // remove last day
      newDays.unshift(last); // put it at the front
      return newDays;
    });
  };

  const scrollToNow = () => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;

    // Calculate scroll position so nowHeight is in the middle of the viewport
    const scrollTop = nowHeight - clientHeight / 2 + 20; // +20px offset for better centering

    // Clamp to valid range
    const maxScroll = Math.max(0, scrollHeight - clientHeight);
    const safeScroll = Math.min(maxScroll, Math.max(0, scrollTop));

    // Smooth scroll
    container.scrollTo({
      top: safeScroll,
      behavior: "smooth",
    });
  };

  // Set up the interval (runs every 1 minute)
  useEffect(() => {
    // Calculate and set height immediately
    const updateHeight = () => {
      const now = new Date();
      const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
      const newHeight = minutesSinceMidnight * zoomLevel + 183;
      setNowHeight(newHeight);
    };

    updateHeight(); // First update right away

    // Set interval to run every 60 seconds (1 minute)
    const intervalId = setInterval(updateHeight, 60000);

    // Cleanup: stop interval when component unmounts or zoom changes
    return () => clearInterval(intervalId);
  }, [zoomLevel]); // Re-run when zoomLevel changes

  const rotateWeekRight = () => {
    setDaysOfWeek((prev) => {
      const newDays = [...prev];
      const first = newDays.shift()!; // remove first day
      newDays.push(first); // add it to the end
      return newDays;
    });
  };

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
      ref={scrollContainerRef}
      className={`h-full relative scrollbar overflow-auto px-[10px] md:pt-[62px] sm:pt-[54px] pb-[30px] ${
        theme
          ? "bg-[#ffffff] scrollbar-thumb-black scrollbar-track-[#eeeeee]"
          : "bg-[#000000] scrollbar-thumb-white scrollbar-track-[#222222]"
      }`}
    >
      {/* Sticky header */}

      <div className={`sticky top-0 left-0 right-0 z-30 bg-inherit`}>
        <div
          id="nav"
          className={`h-[50px] w-full border-b-[1px] flex items-center justify-between px-6 ${
            theme ? "border-[#888888]" : "border-[#888888]"
          }`}
        >
          {/* Left side: Zoom controls */}
          <div className="flex items-center">
            <button
              onClick={() => setZoomLevel((p) => Math.max(1, p - 0.5))}
              className={`px-2 rounded mr-5
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
              className={`font-semibold w-[100px] ${
                theme ? "text-gray-900" : "text-white"
              }`}
            >
              Zoom: {zoomLevel}×
            </span>
            <button
              onClick={() => setZoomLevel((p) => Math.min(8, p + 0.5))}
              className={`px-2 rounded
        ${
          theme
            ? zoomLevel === 8
              ? "bg-[#888888] text-[#bbbbbb] cursor-not-allowed"
              : "bg-[#000000] text-white hover:bg-[#333333]"
            : zoomLevel === 8
            ? "bg-[#888888] text-[#444444] cursor-not-allowed"
            : "bg-[#ffffff] text-black hover:bg-[#dddddd]"
        }`}
            >
              +
            </button>
          </div>
          {/* Middle: Now button */}
          <button
            onClick={scrollToNow}
            className={`px-4 py-1 rounded font-medium text-base
      ${
        theme
          ? "bg-green-700 text-white hover:bg-green-800"
          : "bg-green-700 text-white hover:bg-green-800"
      }`}
          >
            {`Go to Now: ${new Date()
              .toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })
              .replace(/AM|PM/, (match) => match.toUpperCase())}`}
          </button>
          {/* Right side: Week rotation controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={rotateWeekRight}
              className={`px-[7px] flex justify-center items-center rounded text-lg font-bold
        ${
          theme
            ? "bg-[#000000] text-white hover:bg-[#333333]"
            : "bg-[#ffffff] text-black hover:bg-[#dddddd]"
        }`}
            >
              ←
            </button>

            <span
              className={`font-medium ${
                theme ? "text-gray-900" : "text-white"
              }`}
            >
              Rotate the Week
            </span>

            <button
              onClick={rotateWeekLeft}
              className={`px-[7px] flex justify-center items-center rounded text-lg font-bold
        ${
          theme
            ? "bg-[#000000] text-white hover:bg-[#333333]"
            : "bg-[#ffffff] text-black hover:bg-[#dddddd]"
        }`}
            >
              →
            </button>
          </div>
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
                Timeline
              </div>
            </div>

            {daysOfWeek.map((day) => (
              <div
                key={day.full}
                onClick={() => {
                  setIsSidebarOpen(true);
                  setSelectedDay(day.full.toLowerCase() as Day);
                }}
                className={`overflow-hidden border-l-[1px] cursor-pointer ${
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
          className={`text-lg pt-[20px] ${
            theme ? "text-gray-900" : "text-white"
          }`}
        >
          {timeSlots.map((time) => (
            <div
              key={time}
              className={`w-full text-[13px] border-t-[1px] border-blue-600`}
              style={{ height: `${hourHeight / slotsPerHour}px` }}
            >
              <div className={`flex relative justify-center items-center`}>
                <div
                  className={`absolute px-2 left-0 rounded-md ${
                    theme ? "bg-[#ffffff]" : "bg-[#000000]"
                  }`}
                >
                  {time}
                </div>
                {zoomLevel <= 1.5 ? (
                  // When zoomLevel <= 1.5 → render 30 lines
                  <>
                    {Array.from({ length: 6 }).map((_, index) => (
                      <div
                        key={index}
                        className="w-[10%] absolute right-0 text-[13px] border-t-[1px] border-blue-600"
                        style={{
                          top: `${
                            (hourHeight / slotsPerHour / 6) * index - 1
                          }px`,
                        }}
                      />
                    ))}
                  </>
                ) : zoomLevel <= 3 ? (
                  // When zoomLevel <= 1.5 → render 30 lines
                  <>
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div
                        key={index}
                        className="w-[10%] absolute right-0 text-[13px] border-t-[1px] border-blue-600"
                        style={{
                          top: `${
                            (hourHeight / slotsPerHour / 3) * index - 1
                          }px`,
                        }}
                      />
                    ))}
                  </>
                ) : zoomLevel == 3.5 ? (
                  // When zoomLevel <= 1.5 → render 30 lines
                  <>
                    {Array.from({ length: 10 }).map((_, index) => (
                      <div
                        key={index}
                        className="w-[10%] absolute right-0 text-[13px] border-t-[1px] border-blue-600"
                        style={{
                          top: `${
                            (hourHeight / slotsPerHour / 10) * index - 1
                          }px`,
                        }}
                      />
                    ))}
                  </>
                ) : zoomLevel >= 4 ? (
                  // When zoomLevel <= 1.5 → render 30 lines
                  <>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div
                        key={index}
                        className="w-[10%] absolute right-0 text-[13px] border-t-[1px] border-blue-600"
                        style={{
                          top: `${
                            (hourHeight / slotsPerHour / 5) * index - 1
                          }px`,
                        }}
                      />
                    ))}
                  </>
                ) : (
                  // When zoomLevel > 1.5 → render 30 lines (same as above)
                  <></>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Days */}
        {daysOfWeek.map((day) => {
          const dayKey = day.full.toLowerCase() as keyof typeof routine;
          const tasks: IRoutineItem[] = routine[dayKey] || [];

          // Helper: Convert "12:00 AM" → minutes since midnight
          const timeToMinutes = (timeStr: string): number => {
            const [time, period] = timeStr.trim().split(" ");
            const [hours, minutes] = time.split(":").map(Number);
            let h = hours;
            if (period.toUpperCase() === "PM" && h !== 12) h += 12;
            if (period.toUpperCase() === "AM" && h === 12) h = 0;
            return h * 60 + minutes;
          };

          // Helper: Convert minutes back to "HH:MM AM/PM" format
          const minutesToTime = (minutes: number): string => {
            let h = Math.floor(minutes / 60);
            const m = minutes % 60;
            const ampm = h < 12 ? "AM" : "PM";
            if (h > 12) h -= 12;
            if (h === 0) h = 12;
            return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
          };

          // Sort real tasks by start time
          const sortedTasks = [...tasks].sort((a, b) => {
            const aStart = timeToMinutes(a.time.split(" - ")[0]);
            const bStart = timeToMinutes(b.time.split(" - ")[0]);
            return aStart - bStart;
          });

          // Create sortedTasksWithGap: insert dummy tasks for gaps
          const sortedTasksWithGap: IRoutineItem[] = [];
          let previousEndMinutes = 0; // Start from midnight (or adjust if day starts later)

          sortedTasks.forEach((task, i) => {
            const [startTimeStr, endTimeStr] = task.time.split(" - ");
            const startMinutes = timeToMinutes(startTimeStr);
            const durationMinutes = getDurationFromTimeRange(task.time);
            const endMinutes = startMinutes + durationMinutes;

            // Add gap dummy task if there's space before this task
            if (startMinutes > previousEndMinutes) {
              const gapStartMinutes = previousEndMinutes;
              const gapEndMinutes = startMinutes;
              const gapDuration = gapEndMinutes - gapStartMinutes;

              sortedTasksWithGap.push({
                name: "dummy",
                time: `${minutesToTime(gapStartMinutes)} - ${minutesToTime(
                  gapEndMinutes
                )}`,
                // Add any other required fields with defaults if needed
              } as IRoutineItem);
            }

            // Add the real task
            sortedTasksWithGap.push(task);

            // Update previous end time
            previousEndMinutes = endMinutes;
          });

          return (
            <div
              key={day.full}
              className={`overflow-hidden border-l-[1px] pt-[20px] ${
                theme ? "border-[#888888]" : " border-[#888888]"
              }`}
            >
              <div className="">
                {sortedTasksWithGap.map((task, i) => {
                  let minutes = getDurationFromTimeRange(task.time);
                  let height = minutes * pxPerMinute;
                  return (
                    <div
                      key={i}
                      onClick={() => {
                        setSelectedDay(day.full.toLowerCase() as Day);

                        if (task.name !== "dummy") {
                          setIsSidebarOpen(true);
                          setTaskSearchQuery(task.name);
                        }else{
                          setTaskSearchQuery("");
                        }
                      }}
                      className={`text-sm overflow-hidden border-t-[1px] pr-1 border-blue-600  ${
                        theme
                          ? task.name === "dummy"
                            ? "bg-transparent"
                            : "bg-[#eeeeee] text-black cursor-pointer"
                          : task.name === "dummy"
                          ? "bg-transparent"
                          : "bg-[#222222] text-gray-200 cursor-pointer"
                      }`}
                      style={{
                        // Only add +1px for real tasks, keep exact height for dummies
                        height: `${height}px`,
                      }}
                    >
                      {height < 10 ? (
                        // Very short: name and time in ONE line
                        <></>
                      ) : height < 16 ? (
                        // Medium: name on line 1, time on line 2 (truncated)
                        <div className="font-medium text-[7px] truncate ml-2 mt-[-3px]">
                          {task.name !== "dummy" ? (
                            <>
                              {task.name}
                              <span className="text-[7px] opacity-75 ml-2">
                                ({task.time})
                              </span>
                            </>
                          ) : (
                            ""
                          )}
                        </div>
                      ) : height < 30 ? (
                        // Medium: name on line 1, time on line 2 (truncated)
                        <div className="font-medium text-[9px] truncate ml-2">
                          {task.name !== "dummy" ? (
                            <>
                              {task.name}
                              <span className="text-[8px] opacity-75 ml-2">
                                ({task.time})
                              </span>
                            </>
                          ) : (
                            ""
                          )}
                        </div>
                      ) : height < 50 ? (
                        // Medium: name on line 1, time on line 2 (truncated)
                        <div className="font-medium text-[10px] truncate ml-2 mt-1">
                          {task.name !== "dummy" ? (
                            <>
                              {task.name}
                              <span className="text-[9px] opacity-75 ml-2">
                                ({task.time})
                              </span>
                            </>
                          ) : (
                            ""
                          )}
                        </div>
                      ) : height < 90 ? (
                        // Medium: name on line 1, time on line 2 (truncated)
                        <>
                          <div className="text-[13px] font-medium truncate ml-2 mt-1">
                            {task.name !== "dummy" ? task.name : ""}
                          </div>
                          <div className="text-[11px] opacity-75 truncate ml-2">
                            {task.name !== "dummy" ? task.time : ""}
                          </div>
                        </>
                      ) : (
                        // Tall: full name and time on separate lines
                        <>
                          <div className="font-medium ml-2 mt-2">
                            {task.name !== "dummy" ? task.name : ""}
                          </div>
                          <div className="text-xs opacity-75 ml-2">
                            {task.name !== "dummy" ? task.time : ""}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {/* "Now" line - INSIDE the scrollable grid */}
        <div
          className={`absolute w-[88.5%] ml-[10%] h-[2px] border-t-[2px] border-green-700 z-20`}
          style={{ top: `${nowHeight - 1.5}px` }}
        />

        {/* "Now" label */}
        <div
          className={`absolute text-[12px] font-bold px-1 rounded-sm left-[8.5%] z-20 border-[2px] border-green-700 ${
            theme ? "bg-green-700 text-white" : "bg-green-700 text-white"
          }`}
          style={{ top: `${nowHeight - 11}px` }}
        >
          Now
        </div>
      </div>
    </div>
  );
}
