// src/components/ShowRoutine.tsx
"use client";

import { useTheme } from "@/app/hooks/useTheme";
import { useAuth } from "@/app/hooks/useAuth";
import { IRoutineItem } from "@/store/features/auth/authSlice";

const daysOfWeek = [
  { full: "Sunday", short: "Sun" },
  { full: "Monday", short: "Mon" },
  { full: "Tuesday", short: "Tue" },
  { full: "Wednesday", short: "Wed" },
  { full: "Thursday", short: "Thu" },
  { full: "Friday", short: "Fri" },
  { full: "Saturday", short: "Sat" },
] as const;

export default function ShowRoutine() {
  const { theme } = useTheme();
  const { user: auth } = useAuth();

  if (!auth) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-lg opacity-70">
          Please log in to view your routine.
        </p>
      </div>
    );
  }

  const routine = auth.routine;

  return (
    <div className="h-full overflow-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-8">My Weekly Routine</h1>

      {/* 7-Column Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 max-w-7xl mx-auto">
        {daysOfWeek.map((day, index) => {
          const dayKey = day.full.toLowerCase() as keyof typeof routine;
          const tasks: IRoutineItem[] = routine[dayKey] || [];

          return (
            <div
              key={day.full}
              className={`rounded-xl shadow-md overflow-hidden ${
                theme
                  ? "bg-white border border-gray-200"
                  : "bg-gray-800 border border-gray-700"
              }`}
            >
              {/* Day Header */}
              <div
                className={`px-4 py-3 text-center font-semibold text-white ${
                  index === 0 || index === 6
                    ? "bg-red-600" // Weekend highlight
                    : "bg-blue-600"
                }`}
              >
                <div className="hidden sm:block">{day.full}</div>
                <div className="sm:hidden">{day.short}</div>
              </div>

              {/* Tasks List */}
              <div className="p-4 min-h-[200px]">
                {tasks.length === 0 ? (
                  <p className="text-center text-sm opacity-50 italic">
                    No tasks
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {tasks.map((task, i) => (
                      <li
                        key={i}
                        className={`p-3 rounded-lg text-sm ${
                          theme
                            ? "bg-gray-100 text-gray-800"
                            : "bg-gray-700 text-gray-200"
                        }`}
                      >
                        <div className="font-medium">{task.name}</div>
                        <div className="text-xs opacity-75 mt-1">
                          {task.time}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Optional: Legend for mobile */}
      <div className="mt-8 text-center text-xs opacity-60 sm:hidden">
        Swipe or scroll horizontally to see all days
      </div>
    </div>
  );
}
