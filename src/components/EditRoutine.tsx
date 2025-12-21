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

const getDurationMinutes = (fromStr: string, toStr: string): number => {
  const fromMins = timeToMinutes(fromStr);
  let toMins = timeToMinutes(toStr);

  if (fromMins === -1 || toMins === -1) return -1;

  const fromPeriod = fromStr.endsWith("AM") ? "AM" : "PM";
  const toPeriod = toStr.endsWith("AM") ? "AM" : "PM";
  const overnight = isOvernight(fromPeriod, toPeriod);

  if (overnight) {
    toMins += 1440;
  }

  return toMins - fromMins;
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

const parseTime = (timeStr: string) => {
  const match = timeStr.match(/(\d{1,2}):(\d{2}) (AM|PM)/);
  if (!match) return { hour: "", minute: "", period: "AM" as "AM" | "PM" };
  return {
    hour: match[1],
    minute: match[2],
    period: match[3] as "AM" | "PM",
  };
};

export default function EditRoutine({
  selectedDay,
  setSelectedDay,
  taskSearchQuery,
  setTaskSearchQuery,
}: {
  selectedDay: Day;
  setSelectedDay: React.Dispatch<React.SetStateAction<Day>>;
  taskSearchQuery: string;
  setTaskSearchQuery: React.Dispatch<React.SetStateAction<string>>;
}) {
  const { theme } = useTheme();
  const { user: auth, setAuth } = useAuth();

  const [tasks, setTasks] = useState<IRoutineItem[]>([]);
  const [isPortalOpen, setIsPortalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [newName, setNewName] = useState("");
  const [fromHour, setFromHour] = useState("");
  const [fromMinute, setFromMinute] = useState("");
  const [fromPeriod, setFromPeriod] = useState<"AM" | "PM">("AM");
  const [toHour, setToHour] = useState("");
  const [toMinute, setToMinute] = useState("");
  const [toPeriod, setToPeriod] = useState<"AM" | "PM">("AM");
  const [selectedDaysForMultiAdd, setSelectedDaysForMultiAdd] = useState<
    Set<Day>
  >(new Set());
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
    setEditingIndex(null);
  }, [selectedDay, auth?.routine]);

  const fromTimeStr = formatTimePart(fromHour, fromMinute, fromPeriod);
  const toTimeStr = formatTimePart(toHour, toMinute, toPeriod);
  const fromMins = timeToMinutes(fromTimeStr);
  const toMins = timeToMinutes(toTimeStr);
  const newOvernight = isOvernight(fromPeriod, toPeriod);
  const duration = getDurationMinutes(fromTimeStr, toTimeStr);

  // Validation for single day
  const singleDayValidationError = useMemo((): string | null => {
    if (!newName.trim()) return null;

    if (!isValidHour(fromHour)) return "Start hour must be 1–12";
    if (!isValidMinute(fromMinute)) return "Start minutes must be 00–59";
    if (!isValidHour(toHour)) return "End hour must be 1–12";
    if (!isValidMinute(toMinute)) return "End minutes must be 00–59";

    if (fromMins === -1 || toMins === -1) return "Invalid time format";

    // 1. If non-overnight and end time is before start time → this means it crosses midnight
    if (!newOvernight && fromMins >= toMins) {
      return "Tasks cannot cross midnight into the next day";
    }

    // 2. Max duration
    if (duration > 1439) return "Task cannot exceed 23 hours 59 minutes";

    // 3. Min duration
    if (duration < 5) return "Task must be at least 5 minutes long";

    // 4. Overnight (explicit PM → AM is allowed only if duration checks passed)
    if (newOvernight) {
      return "Tasks cannot cross midnight into the next day"; // disallow overnight
    }

    // 5. Check for duplicate name on current day
    const hasDuplicateName = tasks.some((task, idx) => {
      // Skip the task being edited
      if (editingIndex !== null && idx === editingIndex) return false;
      return task.name.toLowerCase() === newName.trim().toLowerCase();
    });

    if (hasDuplicateName)
      return "A task with this name already exists on this day";

    // 6. Overlap on current day
    const hasOverlap = tasks.some((task, idx) => {
      // Skip the task being edited
      if (editingIndex !== null && idx === editingIndex) return false;

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

    if (hasOverlap) return "Time overlaps with an existing task on this day";

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
    duration,
    editingIndex,
  ]);

  // Validation for multi-day add (only selected days)
  const multiDayValidationError = useMemo((): string | null => {
    if (!newName.trim()) return null;

    if (!isValidHour(fromHour)) return "Start hour must be 1–12";
    if (!isValidMinute(fromMinute)) return "Start minutes must be 00–59";
    if (!isValidHour(toHour)) return "End hour must be 1–12";
    if (!isValidMinute(toMinute)) return "End minutes must be 00–59";

    if (fromMins === -1 || toMins === -1) return "Invalid time format";

    if (!newOvernight && fromMins >= toMins) {
      return "Tasks cannot cross midnight into the next day";
    }

    if (duration > 1439) return "Task cannot exceed 23 hours 59 minutes";
    if (duration < 5) return "Task must be at least 5 minutes long";
    if (newOvernight) {
      return "Tasks cannot cross midnight into the next day";
    }

    if (selectedDaysForMultiAdd.size === 0) return null;

    if (auth?.routine) {
      // Check duplicate names on selected days
      const originalTaskName =
        editingIndex !== null ? tasks[editingIndex]?.name : null;

      const daysWithDuplicate = Array.from(selectedDaysForMultiAdd).filter(
        (day) => {
          const dayTasks = auth.routine?.[day] || [];
          return dayTasks.some((task) => {
            if (
              originalTaskName &&
              task.name.toLowerCase() === originalTaskName.toLowerCase()
            ) {
              return false;
            }
            return task.name.toLowerCase() === newName.trim().toLowerCase();
          });
        }
      );

      if (daysWithDuplicate.length > 0) {
        return `Task name already exists on ${daysWithDuplicate
          .map((d) => d.slice(0, 3))
          .join(", ")}`;
      }

      // Check time overlap on selected days
      const conflictingDays = Array.from(selectedDaysForMultiAdd).filter(
        (day) => {
          const dayTasks = auth.routine?.[day] || [];
          return dayTasks.some((task, idx) => {
            if (
              editingIndex !== null &&
              day === selectedDay &&
              idx === editingIndex
            )
              return false;

            const [eFromStr, eToStr] = task.time.split(" - ");
            const eFrom = timeToMinutes(eFromStr);
            const eTo = timeToMinutes(eToStr);
            if (eFrom === -1 || eTo === -1) return false;

            const eFromPeriod = eFromStr.endsWith("AM") ? "AM" : "PM";
            const eToPeriod = eToStr.endsWith("AM") ? "AM" : "PM";
            const eOvernight = isOvernight(
              eFromPeriod as "AM" | "PM",
              eToPeriod as "AM" | "PM"
            );

            return isOverlapping(
              fromMins,
              toMins,
              eFrom,
              eTo,
              newOvernight,
              eOvernight
            );
          });
        }
      );

      if (conflictingDays.length > 0) {
        return `Time overlaps on ${conflictingDays
          .map((d) => d.slice(0, 3))
          .join(", ")}`;
      }
    }

    return null;
  }, [
    newName,
    fromHour,
    fromMinute,
    fromPeriod,
    toHour,
    toMinute,
    toPeriod,
    auth?.routine,
    duration,
    editingIndex,
    selectedDay,
    tasks,
    selectedDaysForMultiAdd,
  ]);

  const filteredTasks = useMemo(() => {
    if (!taskSearchQuery.trim()) return tasks;

    const query = taskSearchQuery.trim().toLowerCase();
    return tasks.filter((task) => task.name.toLowerCase().includes(query));
  }, [tasks, taskSearchQuery]);

  const addTaskToMultipleDays = () => {
    if (
      selectedDaysForMultiAdd.size === 0 ||
      multiDayValidationError ||
      !newName.trim()
    )
      return;

    const fromTimeStr = formatTimePart(fromHour, fromMinute, fromPeriod);
    const toTimeStr = formatTimePart(toHour, toMinute, toPeriod);
    const fullTime = `${fromTimeStr} - ${toTimeStr}`;
    const newTask: IRoutineItem = { name: newName.trim(), time: fullTime };

    if (auth) {
      const updatedRoutine = { ...auth.routine };

      Array.from(selectedDaysForMultiAdd).forEach((day) => {
        const currentTasks = updatedRoutine[day] || [];
        const newTasks = [...currentTasks, newTask].sort(
          (a, b) =>
            timeToMinutes(a.time.split(" - ")[0]) -
            timeToMinutes(b.time.split(" - ")[0])
        );
        updatedRoutine[day] = newTasks;
      });

      setAuth({
        ...auth,
        routine: updatedRoutine,
      });

      // Refresh current day's view
      setTasks(updatedRoutine[selectedDay] || []);
    }
    setHasUnsavedChanges(true);

    // Reset form
    setNewName("");
    setFromHour("9");
    setFromMinute("00");
    setFromPeriod("AM");
    setToHour("10");
    setToMinute("00");
    setToPeriod("AM");
    setSelectedDaysForMultiAdd(new Set());
    setIsPortalOpen(false);
    setMessage({
      type: "success",
      text: `Added to ${selectedDaysForMultiAdd.size} day(s)!`,
    });
    setTimeout(() => setMessage(null), 2000);
  };

  const isAddDisabled = !newName.trim() || !!singleDayValidationError;

  const openEditPortal = (index: number) => {
    const task = tasks[index];
    const [fromTime, toTime] = task.time.split(" - ");

    const fromParsed = parseTime(fromTime);
    const toParsed = parseTime(toTime);

    setNewName(task.name);
    setFromHour(fromParsed.hour);
    setFromMinute(fromParsed.minute);
    setFromPeriod(fromParsed.period);
    setToHour(toParsed.hour);
    setToMinute(toParsed.minute);
    setToPeriod(toParsed.period);

    setEditingIndex(index);
  };

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
    setHasUnsavedChanges(true); // ← ADD THIS
    setNewName("");
    setFromHour("9");
    setFromMinute("00");
    setFromPeriod("AM");
    setToHour("10");
    setToMinute("00");
    setToPeriod("AM");
    setIsPortalOpen(false);
  };

  const editTask = () => {
    if (isAddDisabled || editingIndex === null) return;

    const fromTimeStr = formatTimePart(fromHour, fromMinute, fromPeriod);
    const toTimeStr = formatTimePart(toHour, toMinute, toPeriod);
    const fullTime = `${fromTimeStr} - ${toTimeStr}`;

    const updatedTask: IRoutineItem = { name: newName.trim(), time: fullTime };

    const updatedTasks = tasks
      .map((task, idx) => (idx === editingIndex ? updatedTask : task))
      .sort(
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
    setHasUnsavedChanges(true);
    setNewName("");
    setFromHour("");
    setFromMinute("");
    setFromPeriod("AM");
    setToHour("");
    setToMinute("");
    setToPeriod("AM");
    setEditingIndex(null);
  };

  const editTaskForEveryDay = () => {
    if (editingIndex === null || isAddDisabled) return;

    const originalTaskName = tasks[editingIndex].name;

    const fromTimeStr = formatTimePart(fromHour, fromMinute, fromPeriod);
    const toTimeStr = formatTimePart(toHour, toMinute, toPeriod);
    const fullTime = `${fromTimeStr} - ${toTimeStr}`;

    const updatedTask: IRoutineItem = {
      name: newName.trim(),
      time: fullTime,
    };

    if (auth) {
      const updatedRoutine = { ...auth.routine };

      // Find all days that have a task with the original name
      daysOfWeek.forEach((day) => {
        const currentTasks = updatedRoutine[day] || [];
        const hasTask = currentTasks.some((t) => t.name === originalTaskName);

        if (hasTask) {
          // Replace the old task with the new one
          const newTasks = currentTasks
            .map((t) => (t.name === originalTaskName ? updatedTask : t))
            .sort(
              (a, b) =>
                timeToMinutes(a.time.split(" - ")[0]) -
                timeToMinutes(b.time.split(" - ")[0])
            );
          updatedRoutine[day] = newTasks;
        }
      });

      setAuth({
        ...auth,
        routine: updatedRoutine,
      });

      // Refresh current view
      setTasks(updatedRoutine[selectedDay] || []);
    }

    setHasUnsavedChanges(true);

    // Reset form
    setNewName("");
    setFromHour("");
    setFromMinute("");
    setFromPeriod("AM");
    setToHour("");
    setToMinute("");
    setToPeriod("AM");
    setEditingIndex(null);

    setMessage({
      type: "success",
      text: "Task updated on all days it exists!",
    });
    setTimeout(() => setMessage(null), 2000);
  };

  const deleteTaskFromEveryDay = () => {
    if (editingIndex === null) return;
    let sure = confirm(
      `Are you sure you want to delete this task: ${tasks[editingIndex].name} from every day?`
    );
    if (!sure) return;
    const taskNameToDelete = tasks[editingIndex].name;
    if (auth) {
      const updatedRoutine = { ...auth.routine };

      daysOfWeek.forEach((day) => {
        const currentTasks = updatedRoutine[day] || [];
        const filteredTasks = currentTasks.filter(
          (task) => task.name !== taskNameToDelete
        );
        updatedRoutine[day] = filteredTasks;
      });

      setAuth({
        ...auth,
        routine: updatedRoutine,
      });

      setTasks(updatedRoutine[selectedDay] || []);
    }
    setHasUnsavedChanges(true);
    setNewName("");
    setFromHour("");
    setFromMinute("");
    setFromPeriod("AM");
    setToHour("");
    setToMinute("");
    setToPeriod("AM");
    setEditingIndex(null);
    setMessage({ type: "success", text: "Deleted from every day!" });
    setTimeout(() => setMessage(null), 2000);
  };

  const removeTask = (index: number, name: string) => {
    let sure = confirm(
      `Are you sure you want to delete this task: ${name} from ${selectedDay
        .charAt(0)
        .toUpperCase()}${selectedDay.slice(1)}?`
    );
    if (!sure) return;
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
    setHasUnsavedChanges(true);
  };

  const saveToDatabase = async () => {
    if (!auth?.email || !hasUnsavedChanges) return; // optional: early return if nothing to save

    setLoading(true);
    setMessage(null);

    try {
      await updateRoutine(auth.email, auth.routine);
      setMessage({ type: "success", text: "Saved!" });
      setHasUnsavedChanges(false); // ← IMPORTANT: Reset after save
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
                : "bg-[#222222] text-gray-300 hover:bg-[#111111]"
            }`}
          >
            {day.slice(0, 3)}
          </button>
        ))}
      </div>

      {/* Task Search for Current Day */}
      <div className="mx-3 mb-3 flex-shrink-0">
        <div className="relative">
          <input
            type="text"
            placeholder={`Search tasks on ${selectedDay
              .charAt(0)
              .toUpperCase()}${selectedDay.slice(1)}...`}
            value={taskSearchQuery}
            onChange={(e) => setTaskSearchQuery(e.target.value)}
            className={`w-full px-3 py-2 pr-10 text-sm rounded border transition ${
              theme
                ? "bg-white border-gray-300 focus:border-blue-700 placeholder-gray-500"
                : "bg-[#111111] border-[#333333] focus:border-blue-700 placeholder-[#999999] text-white"
            } outline-none`}
          />
          {taskSearchQuery && (
            <button
              onClick={() => setTaskSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#888888] hover:text-red-700 text-lg"
            >
              ×
            </button>
          )}
        </div>

        {taskSearchQuery.trim() && filteredTasks.length === 0 && (
          <p className="text-xs text-red-600 text-center mt-2">
            No tasks found
          </p>
        )}
        {taskSearchQuery.trim() && filteredTasks.length > 0 && (
          <p className="text-xs text-center mt-2 opacity-70">
            {filteredTasks.length} of {tasks.length} task
            {filteredTasks.length !== 1 ? "s" : ""} shown
          </p>
        )}
      </div>

      {/* Day title + Save button */}
      <div className="mx-3 flex items-center justify-between gap-2 mb-3 flex-shrink-0">
        <h3 className="text-sm font-medium capitalize">{selectedDay}</h3>
        <button
          onClick={saveToDatabase}
          disabled={loading || !hasUnsavedChanges}
          className={`text-[12px] font-medium py-1 px-2 rounded transition ${
            loading || !hasUnsavedChanges
              ? theme
                ? "bg-[#aaaaaa] text-[#444444] cursor-not-allowed"
                : "bg-[#444444] text-[#aaaaaa] cursor-not-allowed"
              : "bg-green-700 hover:bg-green-800 text-white"
          }`}
        >
          {loading ? "Saving..." : hasUnsavedChanges ? "Save •" : "Saved"}
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
        <div
          className={`space-y-2 overflow-y-auto scrollbar-thin h-full pr-3 ${
            theme
              ? "bg-[#ffffff] scrollbar-thumb-black scrollbar-track-[#f8f8f8]"
              : "bg-[#080808] scrollbar-thumb-white scrollbar-track-[#111111]"
          }`}
        >
          {/* Inline Add Form */}
          {editingIndex === null && (
            <>
              {isPortalOpen ? (
                <div
                  className={`p-3 rounded text-sm border ${
                    theme
                      ? "bg-white border-gray-200"
                      : "bg-[#222222] border-[#333333]"
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs font-medium opacity-70">
                      Add new task
                    </h4>
                    <button
                      onClick={() => setIsPortalOpen(false)}
                      className="text-white bg-red-600 hover:bg-red-700 text-xs border-[1px] px-1 font-bold flex justify-center items-center rounded-sm border-red-600"
                    >
                      Close
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
                            setToHour(
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

                  <div className="text-xs text-center opacity-70 mt-3">
                    Preview:{" "}
                    <span className="font-medium">
                      {previewFrom} - {previewTo}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    <button
                      onClick={addTask}
                      disabled={isAddDisabled}
                      className={`w-full text-sm font-medium py-2 rounded transition ${
                        isAddDisabled
                          ? theme
                            ? "bg-[#cccccc] text-gray-600 cursor-not-allowed"
                            : "bg-[#444444] text-[#aaaaaa] cursor-not-allowed"
                          : "bg-green-700 hover:bg-green-800 text-white"
                      }`}
                    >
                      Add Task
                    </button>

                    {/* Single-day error (above buttons) */}
                    {singleDayValidationError && (
                      <p className="text-xs text-red-600 text-center mt-3 font-medium">
                        {singleDayValidationError}
                      </p>
                    )}

                    {/* Multi-day selection pills */}
                    <div className="mt-4">
                      <div className="text-xs opacity-70 mb-2">
                        Select days to add to:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {daysOfWeek.map((day) => (
                          <button
                            key={day}
                            onClick={() => {
                              const newSet = new Set(selectedDaysForMultiAdd);
                              if (newSet.has(day)) {
                                newSet.delete(day);
                              } else {
                                newSet.add(day);
                              }
                              setSelectedDaysForMultiAdd(newSet);
                            }}
                            className={`px-2 py-1 text-xs rounded-md capitalize transition ${
                              selectedDaysForMultiAdd.has(day)
                                ? "bg-blue-700 text-white"
                                : theme
                                ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                : "bg-[#333333] text-gray-300 hover:bg-[#111111]"
                            }`}
                          >
                            {day.slice(0, 3)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Multi-day add button */}
                    <button
                      onClick={addTaskToMultipleDays}
                      disabled={
                        selectedDaysForMultiAdd.size === 0 ||
                        !!multiDayValidationError ||
                        !newName.trim()
                      }
                      className={`w-full text-sm font-medium py-2 rounded transition mt-3 ${
                        selectedDaysForMultiAdd.size === 0 ||
                        !!multiDayValidationError ||
                        !newName.trim()
                          ? theme
                            ? "bg-[#cccccc] text-gray-600 cursor-not-allowed"
                            : "bg-[#444444] text-[#aaaaaa] cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      Add Task in Multiple Days
                    </button>

                    {/* Multi-day error */}
                    {multiDayValidationError && (
                      <p className="text-xs text-red-600 text-center mt-3 font-medium">
                        {multiDayValidationError}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsPortalOpen(true)}
                  className={`w-full text-sm font-medium py-[12px] rounded border-dashed border-2 transition ${
                    theme
                      ? "border-gray-400 text-gray-700 hover:bg-gray-100"
                      : "border-[#555555] text-gray-300 hover:bg-[#111111]"
                  }`}
                >
                  + Add New Task
                </button>
              )}
            </>
          )}
          {filteredTasks.length === 0 ? (
            <p className="text-xs text-gray-500 italic">
              {taskSearchQuery.trim() ? "No matching tasks" : "No tasks"}
            </p>
          ) : (
            filteredTasks.map((task, index) => {
              // IMPORTANT: We need the original index in the full tasks array
              // for editing/deleting correctly
              const originalIndex = tasks.indexOf(task);
              return (
                <div key={originalIndex}>
                  {editingIndex === originalIndex ? (
                    // Edit Portal
                    <div
                      className={`p-3 rounded text-sm border ${
                        theme
                          ? "bg-white border-gray-200"
                          : "bg-[#222222] border-[#333333]"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xs font-medium opacity-70">
                          Edit task
                        </h4>
                        <button
                          onClick={() => setEditingIndex(null)}
                          className="text-white bg-red-600 hover:bg-red-700 text-xs border-[1px] px-1 font-bold flex justify-center items-center rounded-sm border-red-600"
                        >
                          Close
                        </button>
                      </div>

                      <input
                        type="text"
                        placeholder="Task name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && !isAddDisabled && editTask()
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
                                setToHour(
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

                      {/* Single-day error */}

                      <div className="text-xs text-center opacity-70 mt-3">
                        Preview:{" "}
                        <span className="font-medium">
                          {previewFrom} - {previewTo}
                        </span>
                      </div>

                      <div className="mt-3 space-y-2">
                        <button
                          onClick={editTask}
                          disabled={isAddDisabled}
                          className={`w-full text-sm font-medium py-2 rounded transition ${
                            isAddDisabled
                              ? theme
                                ? "bg-[#cccccc] text-gray-600 cursor-not-allowed"
                                : "bg-[#444444] text-[#aaaaaa] cursor-not-allowed"
                              : "bg-green-700 hover:bg-green-800 text-white"
                          }`}
                        >
                          Edit
                        </button>

                        {singleDayValidationError && (
                          <p className="text-xs text-red-600 text-center mt-3 font-medium">
                            {singleDayValidationError}
                          </p>
                        )}

                        {/* Edit for Every Day button */}
                        <button
                          onClick={editTaskForEveryDay}
                          disabled={isAddDisabled}
                          className={`w-full text-sm font-medium py-2 rounded transition mb-2 ${
                            isAddDisabled
                              ? theme
                                ? "bg-[#cccccc] text-gray-600 cursor-not-allowed"
                                : "bg-[#444444] text-[#aaaaaa] cursor-not-allowed"
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                          }`}
                        >
                          Edit for Every Day
                        </button>

                        <button
                          onClick={deleteTaskFromEveryDay}
                          className="w-full text-sm font-medium py-2 rounded transition bg-red-600 hover:bg-red-700 text-white"
                        >
                          Delete from Every Day
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Task Card
                    <div
                      onClick={() => openEditPortal(originalIndex)}
                      className={`flex items-center justify-between p-2 rounded text-sm cursor-pointer ${
                        theme ? "bg-white" : "bg-[#222222]"
                      } border ${
                        theme ? "border-gray-200" : "border-[#333333]"
                      }`}
                    >
                      <div>
                        <div className="font-medium">{task.name}</div>
                        <div className="text-xs opacity-70">{task.time}</div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTask(originalIndex, task.name);
                        }}
                        className="text-red-600 hover:text-white hover:bg-red-600 text-xs border-[1px] h-[15px] w-[15px] font-bold flex justify-center items-center rounded-sm border-red-600"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
