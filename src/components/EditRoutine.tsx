// src/components/EditRoutine.tsx
"use client";

import { updateRoutine } from "@/app/actions";
import { useTheme } from "@/app/hooks/useTheme";
import { useAuth } from "@/app/hooks/useAuth";
import { useEffect, useState, useMemo } from "react";
import { IRoutine, IRoutineItem } from "@/store/features/auth/authSlice";

const daysOfWeek = [
  "saturday",
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
] as const;

type Day = (typeof daysOfWeek)[number];

const formatTimePart = (
  hour: string,
  minute: string,
  period: "AM" | "PM"
): string => {
  const h = hour.padStart(2, "0");
  const m = minute.padStart(2, "0");
  return `${h}:${m} ${period}`;
};

const timeToMinutes = (formattedTime: string): number => {
  const match = formattedTime.match(/(0?[1-9]|1[0-2]):([0-5][0-9]) (AM|PM)/i);
  if (!match) return -1;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (hours === 12) hours = 0;
  hours += period === "PM" ? 12 : 0;

  return hours * 60 + minutes;
};

const isOvernight = (
  startPeriod: "AM" | "PM",
  endPeriod: "AM" | "PM"
): boolean => {
  return startPeriod === "PM" && endPeriod === "AM";
};

const isOverlapping = (
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
  aOvernight: boolean,
  bOvernight: boolean
): boolean => {
  const aEndNorm = aOvernight ? aEnd + 1440 : aEnd;
  const bEndNorm = bOvernight ? bEnd + 1440 : bEnd;

  return aStart < bEndNorm && bStart < aEndNorm;
};

const isValidHour = (h: string): boolean => {
  if (h === "") return false;
  const num = parseInt(h, 10);
  return num >= 1 && num <= 12;
};

const isValidMinute = (m: string): boolean => {
  if (m === "") return false;
  const num = parseInt(m, 10);
  return num >= 0 && num <= 59;
};

export default function EditRoutine() {
  const { theme } = useTheme();
  const { user: auth, setAuth } = useAuth();

  const [selectedDay, setSelectedDay] = useState<Day>("saturday");
  const [tasks, setTasks] = useState<IRoutineItem[]>([]);
  const [isPortalOpen, setIsPortalOpen] = useState(false);

  const [newName, setNewName] = useState("");
  const [fromHour, setFromHour] = useState("");
  const [fromMinute, setFromMinute] = useState("");
  const [fromPeriod, setFromPeriod] = useState<"AM" | "PM">("AM");
  const [toHour, setToHour] = useState("");
  const [toMinute, setToMinute] = useState("");
  const [toPeriod, setToPeriod] = useState<"AM" | "PM">("AM");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (auth?.routine?.[selectedDay]) {
      const dayTasks = [...auth.routine[selectedDay]];
      dayTasks.sort((a, b) => {
        const startA = timeToMinutes(a.time.split(" - ")[0]);
        const startB = timeToMinutes(b.time.split(" - ")[0]);
        return startA - startB;
      });
      setTasks(dayTasks);
    } else {
      setTasks([]);
    }

    setNewName("");
    setFromHour("");
    setFromMinute("");
    setFromPeriod("AM");
    setToHour("");
    setToMinute("");
    setToPeriod("AM");
    setIsPortalOpen(false);
  }, [selectedDay, auth?.routine]);

  const validationError = useMemo((): string | null => {
    if (!newName.trim()) return null;

    if (!isValidHour(fromHour)) return "Start hour must be 1–12";
    if (!isValidMinute(fromMinute)) return "Start minutes must be 00–59";
    if (!isValidHour(toHour)) return "End hour must be 1–12";
    if (!isValidMinute(toMinute)) return "End minutes must be 00–59";

    const fromTimeStr = formatTimePart(fromHour, fromMinute, fromPeriod);
    const toTimeStr = formatTimePart(toHour, toMinute, toPeriod);

    const fromMins = timeToMinutes(fromTimeStr);
    const toMins = timeToMinutes(toTimeStr);

    if (fromMins === -1 || toMins === -1) return "Invalid time format";

    // Check if the range itself is valid (end after start, allowing overnight)
    const newOvernight = isOvernight(fromPeriod, toPeriod);
    if (!newOvernight && fromMins >= toMins) {
      return "End time must be after start time";
    }

    const hasOverlap = tasks.some((task) => {
      const [existingFrom, existingTo] = task.time.split(" - ");
      const eFrom = timeToMinutes(existingFrom);
      const eTo = timeToMinutes(existingTo);

      if (eFrom === -1 || eTo === -1) return false;

      const existingFromPeriod = existingFrom.endsWith("AM") ? "AM" : "PM";
      const existingToPeriod = existingTo.endsWith("AM") ? "AM" : "PM";
      const existingOvernight = isOvernight(
        existingFromPeriod as "AM" | "PM",
        existingToPeriod as "AM" | "PM"
      );

      return isOverlapping(
        fromMins,
        toMins,
        eFrom,
        eTo,
        newOvernight,
        existingOvernight
      );
    });

    if (hasOverlap) return "Time overlaps with an existing task";

    return null;
  }, [
    newName,
    fromHour,
    fromMinute,
    fromPeriod,
    toHour,
    toMinute,
    toPeriod,
    tasks,
  ]);

  const isAddDisabled = !newName.trim() || !!validationError;

  const addTask = () => {
    if (isAddDisabled) return;

    const fromTimeStr = formatTimePart(fromHour, fromMinute, fromPeriod);
    const toTimeStr = formatTimePart(toHour, toMinute, toPeriod);
    const fullTime = `${fromTimeStr} - ${toTimeStr}`;

    const newTask: IRoutineItem = { name: newName.trim(), time: fullTime };

    const updatedTasks = [...tasks, newTask].sort(
      (a, b) =>
        timeToMinutes(a.time.split(" - ")[0]) -
        timeToMinutes(b.time.split(" - ")[0])
    );

    setTasks(updatedTasks);

    if (auth) {
      setAuth({
        ...auth,
        routine: {
          ...auth.routine,
          [selectedDay]: updatedTasks,
        },
      });
    }

    setNewName("");
    setFromHour("9");
    setFromMinute("00");
    setFromPeriod("AM");
    setToHour("10");
    setToMinute("00");
    setToPeriod("AM");
    setIsPortalOpen(false);
  };

  const removeTask = (index: number) => {
    const updatedTasks = tasks.filter((_, i) => i !== index);
    setTasks(updatedTasks);

    if (auth) {
      setAuth({
        ...auth,
        routine: {
          ...auth.routine,
          [selectedDay]: updatedTasks,
        },
      });
    }
  };

  const saveToDatabase = async () => {
    if (!auth?.email) return;

    setLoading(true);
    setMessage(null);

    try {
      await updateRoutine(auth.email, auth.routine);
      setMessage({ type: "success", text: "Saved!" });
    } catch (err) {
      setMessage({ type: "error", text: "Save failed" });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 2000);
    }
  };

  if (!auth) {
    return <div className="p-4 text-center text-sm">Log in to edit</div>;
  }

  const previewFrom = formatTimePart(
    fromHour || "HH",
    fromMinute || "MM",
    fromPeriod
  );
  const previewTo = formatTimePart(toHour || "HH", toMinute || "MM", toPeriod);
  return (
    <div
      className={`w-full h-full flex flex-col ${
        theme
          ? "bg-gray-50 border-gray-200"
          : "bg-[#080808] text-white border-[#222222]"
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-inherit flex-shrink-0">
        <h2 className="text-lg font-bold text-center pt-1">Edit Routine</h2>
      </div>

      {/* Day Pills */}
      <div className="flex flex-wrap gap-1 p-3 flex-shrink-0">
        {daysOfWeek.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-2 py-1 text-xs rounded-md capitalize transition ${
              selectedDay === day
                ? "bg-blue-700 text-white"
                : theme
                ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                : "bg-[#222222] text-gray-300 hover:bg-gray-600"
            }`}
          >
            {day.slice(0, 3)}
          </button>
        ))}
      </div>

      {/* Day title + Save button */}
      <div className="mx-3 flex items-center justify-between gap-2 mb-3 flex-shrink-0">
        <h3 className="text-sm font-medium capitalize">{selectedDay}</h3>
        <button
          onClick={saveToDatabase}
          disabled={loading}
          className={`text-[12px] font-medium py-1 px-2 rounded transition ${
            loading
              ? theme
                ? "bg-[#888888] text-gray-300 cursor-not-allowed"
                : "bg-[#444444] text-[#888888] cursor-not-allowed"
              : "bg-green-700 hover:bg-green-800 text-white"
          }`}
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>

      {message && (
        <div
          className={`text-xs text-center py-2 mx-3 mb-3 rounded ${
            message.type === "success"
              ? theme
                ? "bg-green-100 text-green-800"
                : "bg-green-900 text-green-300"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Scrollable Task List */}
      <div className="flex-1 overflow-hidden pl-3 pb-5">
        {" "}
        {/* This is the flex parent */}
        <div
          className={`space-y-2 overflow-y-auto scrollbar-thin h-full pr-3 ${
            theme
              ? "bg-[#ffffff] scrollbar-thumb-black scrollbar-track-[#f8f8f8]"
              : "bg-[#080808] scrollbar-thumb-white scrollbar-track-[#111111]"
          }`}
        >
          {" "}
          {/* This now scrolls */}
          {tasks.length === 0 ? (
            <p className="text-xs text-gray-500 italic">No tasks</p>
          ) : (
            tasks.map((task, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-2 rounded text-sm ${
                  theme ? "bg-white" : "bg-[#222222]"
                } border ${theme ? "border-gray-200" : "border-[#333333]"}`}
              >
                <div>
                  <div className="font-medium">{task.name}</div>
                  <div className="text-xs opacity-70">{task.time}</div>
                </div>
                <button
                  onClick={() => removeTask(index)}
                  className="text-red-600 hover:text-white hover:bg-red-600 text-xs border-[1px] h-[15px] w-[15px] font-bold flex justify-center items-center rounded-sm border-red-600"
                >
                  ×
                </button>
              </div>
            ))
          )}
          {/* Inline Add Form (inside the scrollable list) */}
          {isPortalOpen ? (
            <div
              className={`p-3 rounded text-sm border ${
                theme
                  ? "bg-white border-gray-200"
                  : "bg-[#222222] border-[#333333]"
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-medium opacity-70">Add new task</h4>
                <button
                  onClick={() => setIsPortalOpen(false)}
                  className="text-red-600 hover:text-white hover:bg-red-600 text-xs border-[1px] h-[15px] w-[15px] font-bold flex justify-center items-center rounded-sm border-red-600"
                >
                  ×
                </button>
              </div>

              <input
                type="text"
                placeholder="Task name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !isAddDisabled && addTask()
                }
                className={`w-full px-3 py-2 text-sm rounded border mb-3 ${
                  theme
                    ? "bg-white border-gray-300 focus:border-blue-700"
                    : "bg-[#080808] border-[#111111] focus:border-blue-700"
                } outline-none`}
              />

              <div className="space-y-3 text-sm">
                {/* From */}
                <div>
                  <div className="text-xs opacity-70 mb-1">From</div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="HH"
                      maxLength={2}
                      value={fromHour}
                      onChange={(e) =>
                        setFromHour(
                          e.target.value.replace(/\D/g, "").slice(0, 2)
                        )
                      }
                      className={`w-14 px-2 py-1 border-[1px] focus:border-blue-700 text-center rounded ${
                        theme
                          ? "bg-white border-gray-300"
                          : "bg-[#080808] focus:outline-none border-[#111111]"
                      }`}
                    />
                    <input
                      type="text"
                      maxLength={2}
                      placeholder="MM"
                      value={fromMinute}
                      onChange={(e) =>
                        setFromMinute(
                          e.target.value.replace(/\D/g, "").slice(0, 2)
                        )
                      }
                      className={`w-14 px-2 py-1 border-[1px] focus:border-blue-700 text-center rounded ${
                        theme
                          ? "bg-white border-gray-300"
                          : "bg-[#080808] focus:outline-none border-[#111111]"
                      }`}
                    />
                    <select
                      value={fromPeriod}
                      onChange={(e) =>
                        setFromPeriod(e.target.value as "AM" | "PM")
                      }
                      className={`px-2 py-1 border-[1px] focus:border-blue-700 text-center rounded ${
                        theme
                          ? "bg-white border-gray-300"
                          : "bg-[#080808] focus:outline-none border-[#111111]"
                      }`}
                    >
                      <option>AM</option>
                      <option>PM</option>
                    </select>
                  </div>
                </div>

                {/* To */}
                <div>
                  <div className="text-xs opacity-70 mb-1">To</div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={2}
                      placeholder="HH"
                      value={toHour}
                      onChange={(e) =>
                        setToHour(e.target.value.replace(/\D/g, "").slice(0, 2))
                      }
                      className={`w-14 px-2 py-1 border-[1px] focus:border-blue-700 text-center rounded ${
                        theme
                          ? "bg-white border-gray-300"
                          : "bg-[#080808] focus:outline-none border-[#111111]"
                      }`}
                    />
                    <input
                      type="text"
                      maxLength={2}
                      placeholder="MM"
                      value={toMinute}
                      onChange={(e) =>
                        setToMinute(
                          e.target.value.replace(/\D/g, "").slice(0, 2)
                        )
                      }
                      className={`w-14 px-2 py-1 border-[1px] focus:border-blue-700 text-center rounded ${
                        theme
                          ? "bg-white border-gray-300"
                          : "bg-[#080808] focus:outline-none border-[#111111]"
                      }`}
                    />
                    <select
                      value={toPeriod}
                      onChange={(e) =>
                        setToPeriod(e.target.value as "AM" | "PM")
                      }
                      className={`px-2 py-1 border-[1px] focus:border-blue-700 text-center rounded ${
                        theme
                          ? "bg-white border-gray-300"
                          : "bg-[#080808] focus:outline-none border-[#111111]"
                      }`}
                    >
                      <option>AM</option>
                      <option>PM</option>
                    </select>
                  </div>
                </div>
              </div>

              {validationError && (
                <p className="text-xs text-red-600 text-center mt-3 font-medium">
                  {validationError}
                </p>
              )}

              <div className="text-xs text-center opacity-70 mt-3">
                Preview:{" "}
                <span className="font-medium">
                  {previewFrom} - {previewTo}
                </span>
              </div>

              <button
                onClick={addTask}
                disabled={isAddDisabled}
                className={`w-full mt-3 text-sm font-medium py-2 rounded transition ${
                  isAddDisabled
                    ? theme
                      ? "bg-[#cccccc] text-gray-600 cursor-not-allowed"
                      : "bg-[#444444] text-[#aaaaaa] cursor-not-allowed"
                    : "bg-green-700 hover:bg-green-800 text-white"
                }`}
              >
                Add Task
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsPortalOpen(true)}
              className={`w-full text-sm font-medium py-3 rounded border-dashed border-2 transition ${
                theme
                  ? "border-gray-400 text-gray-700 hover:bg-gray-100"
                  : "border-[#555555] text-gray-300 hover:bg-[#111111]"
              }`}
            >
              + Add New Task
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
