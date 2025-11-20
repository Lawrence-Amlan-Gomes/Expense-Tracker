"use client";

import { updateHistory } from "@/app/actions";
import colors from "@/app/color/color";
import { useAuth } from "@/app/hooks/useAuth";
import { useResponse } from "@/app/hooks/useResponse";
import { useTheme } from "@/app/hooks/useTheme";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FaEdit } from "react-icons/fa";
import { MdDeleteForever } from "react-icons/md";

export default function History({ whichSide }: { whichSide: string }) {
  const { user: auth, setAuth } = useAuth();
  const { theme } = useTheme();
  const { setInputOutputPair, setClickedDate, clickedDate } = useResponse();
  const [sortedHistory, setSortedHistory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Sort history by date (newest first)
  useEffect(() => {
    if (!auth?.history?.length) {
      setSortedHistory([]);
      return;
    }
    const sorted = [...auth.history].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setSortedHistory(sorted);
  }, [auth?.history]);

  // Format date
  const formatDate = (d: any) => {
    try {
      const date = new Date(d);
      return isNaN(date.getTime())
        ? d
        : new Intl.DateTimeFormat("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }).format(date);
    } catch {
      return d;
    }
  };

  // Last user message
  const lastPrompt = (ctx: [string, string][]) => {
    if (!ctx?.length) return "No prompt";
    const last = ctx[ctx.length - 1];
    const txt = Array.isArray(last) ? last[0] || "" : "";
    return txt.length > 50 ? txt.slice(0, 50) + "..." : txt;
  };

  // Get title
  const getTitle = (entry: any) => {
    if (entry.title && entry.title.trim()) {
      return entry.title;
    }
    return lastPrompt(entry.context);
  };

  // CLICK HANDLER
  const handleClick = (entry: any) => {
    setInputOutputPair(entry.context ?? []);
    setClickedDate(entry.date);
  };

  // DELETE HANDLER
  const handleDelete = async (date: string) => {
    if (!auth) return;

    const tempHistory = JSON.parse(JSON.stringify(auth.history));
    const updatedHistory = tempHistory.filter((entry: any) => {
      const clean = entry.date.includes("T")
        ? entry.date.split("T")[0]
        : entry.date;
      const targetClean = date.includes("T") ? date.split("T")[0] : date;
      return clean !== targetClean;
    });

    setAuth({ ...auth, history: updatedHistory });
    await updateHistory(auth.email, updatedHistory);

    // If deleted item was selected, clear selection
    if (clickedDate === date) {
      setClickedDate("");
      setInputOutputPair([]);
    }

    setShowDeleteAlert(false);
    setDeleteTarget(null);
  };

  // EDIT TITLE HANDLER
  const handleEditTitle = (date: string, currentTitle: string) => {
    setEditingDate(date);
    setEditTitle(currentTitle);
  };

  // SAVE TITLE HANDLER
  const handleSaveTitle = async (date: string) => {
    if (!auth) return;

    const tempHistory = JSON.parse(JSON.stringify(auth.history));
    const entryIndex = tempHistory.findIndex((entry: any) => {
      const clean = entry.date.includes("T")
        ? entry.date.split("T")[0]
        : entry.date;
      const targetClean = date.includes("T") ? date.split("T")[0] : date;
      return clean === targetClean;
    });

    if (entryIndex !== -1) {
      tempHistory[entryIndex].title = editTitle.trim();
      setAuth({ ...auth, history: tempHistory });
      await updateHistory(auth.email, tempHistory);
    }

    setEditingDate(null);
    setEditTitle("");
  };

  // CANCEL EDIT
  const handleCancelEdit = () => {
    setEditingDate(null);
    setEditTitle("");
  };

  // SEARCH FILTER
  const filteredHistory = useMemo(() => {
    if (!searchTerm.trim()) return sortedHistory;

    const lower = searchTerm.toLowerCase();
    return sortedHistory.filter((entry) => {
      const dateStr = formatDate(entry.date).toLowerCase();
      const title = getTitle(entry).toLowerCase();
      return dateStr.includes(lower) || title.includes(lower);
    });
  }, [sortedHistory, searchTerm]);

  const isInsideChat = whichSide === "insideTheChat";

  return (
    <>
      <div
        className={`h-full w-full ${
          isInsideChat
            ? "sm:pt-[100px] sm:pb-[100px]"
            : "pt-[80px] pb-[80px] sm:pt-[150px] sm:pb-[150px]"
        } flex flex-col items-center overflow-y-auto scrollbar-thin ${
          theme
            ? "bg-white text-black scrollbar-thumb-black scrollbar-track-gray-100"
            : "bg-black text-gray-100 scrollbar-thumb-white scrollbar-track-[#111111]"
        }`}
      >
        {/* TITLE + SEARCH */}
        <div
          className={`w-full ${
            isInsideChat
              ? "flex flex-col items-center"
              : "flex items-center justify-between"
          } px-[5%] sm:px-[15%] mb-6`}
        >
          <h2 className="sm:text-xl ml-4 sm:ml-[4%] text-md font-bold">
            History
          </h2>

          {/* SEARCH INPUT */}
          <input
            type="text"
            placeholder="Search by date or message..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`
              ${
                isInsideChat
                  ? "mt-4 w-full max-w-xs px-5"
                  : "mt-0 mr-[4%] w-full sm:w-52 ml-4 px-4"
              }
              py-2 text-sm rounded-md border transition-colors
              ${
                theme
                  ? "bg-white border-gray-300 text-black focus:border-purple-700"
                  : "bg-[#111111] border-[#222222] text-gray-100 focus:border-purple-700"
              }
              focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50
            `}
          />
        </div>

        {/* HISTORY LIST */}
        {filteredHistory.length === 0 ? (
          <p className="sm:text-md text-sm opacity-70 px-[5%] sm:px-[15%]">
            {searchTerm ? "No matching history." : "No conversation history."}
          </p>
        ) : (
          <div
            className={`w-full space-y-2 ${
              isInsideChat ? "px-[8%] sm:px-[12%]" : "px-[8%] sm:px-[18%]"
            }`}
          >
            {filteredHistory.map((entry, i) => {
              const isSelected = entry.date === clickedDate;
              const isEditing = editingDate === entry.date;

              const content = (
                <div
                  className={`
                    sm:p-4 p-2 rounded-lg transition-all duration-200
                    ${
                      theme
                        ? "bg-gray-100 hover:bg-gray-200"
                        : "bg-[#111111] hover:bg-[#222222]"
                    }
                    ${isSelected ? colors.keyBorder : ""}
                    ${
                      isSelected ? "ring-2 ring-purple-500 ring-opacity-50" : ""
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="sm:text-sm text-xs font-medium truncate">
                        {formatDate(entry.date)}
                      </p>
                      {isEditing ? (
                        <div className="mt-1 flex items-center gap-2">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className={`
                              flex-1 sm:text-xs text-[10px] px-2 py-1 rounded border
                              ${
                                theme
                                  ? "bg-white border-gray-300 text-black"
                                  : "bg-[#222222] border-[#333333] text-gray-100"
                              }
                              focus:outline-none focus:ring-1 focus:ring-purple-500
                            `}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleSaveTitle(entry.date);
                              } else if (e.key === "Escape") {
                                handleCancelEdit();
                              }
                            }}
                          />
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleSaveTitle(entry.date);
                            }}
                            className="text-green-500 hover:text-green-600 sm:text-xs text-[10px] font-medium"
                          >
                            Save
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleCancelEdit();
                            }}
                            className="text-red-500 hover:text-red-600 sm:text-xs text-[10px] font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <p className="mt-1 sm:text-xs text-[10px] opacity-75 truncate">
                          {getTitle(entry)}
                        </p>
                      )}
                    </div>

                    {!isEditing && !isInsideChat && (
                      <div className="flex items-center gap-2 ml-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEditTitle(entry.date, entry.title || "");
                          }}
                          className={`
                            p-1.5 rounded transition-colors
                            ${
                              theme
                                ? "hover:bg-gray-300 text-blue-600"
                                : "hover:bg-[#333333] text-blue-400"
                            }
                          `}
                          title="Edit title"
                        >
                          <FaEdit className="sm:text-sm text-xs" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDeleteTarget(entry.date);
                            setShowDeleteAlert(true);
                          }}
                          className={`
                            p-1.5 rounded transition-colors
                            ${
                              theme
                                ? "hover:bg-gray-300 text-red-600"
                                : "hover:bg-[#333333] text-red-400"
                            }
                          `}
                          title="Delete"
                        >
                          <MdDeleteForever className="sm:text-base text-sm" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );

              return isInsideChat ? (
                <div
                  key={i}
                  onClick={() => !isEditing && handleClick(entry)}
                  className={!isEditing ? "cursor-pointer" : ""}
                >
                  {content}
                </div>
              ) : (
                <Link
                  key={i}
                  href={isEditing ? "#" : `/chat?selectedDate=${entry.date}`}
                  onClick={(e) => {
                    if (isEditing) {
                      e.preventDefault();
                      return;
                    }
                    setInputOutputPair(entry.context ?? []);
                    setClickedDate(entry.date);
                  }}
                  className="block"
                >
                  {content}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* DELETE CONFIRMATION ALERT */}
      {showDeleteAlert && deleteTarget && (
        <div
          className={`fixed inset-0 flex items-center justify-center z-50 ${
            theme ? "bg-black/50" : "bg-black/70"
          }`}
        >
          <div
            className={`p-6 rounded-lg shadow-lg max-w-sm w-full mx-4 ${
              theme ? "bg-white text-black" : "bg-[#111111] text-white"
            }`}
          >
            <h3 className="text-xl font-semibold mb-4">Delete Conversation</h3>
            <p className="mb-6">
              Are you sure you want to delete this conversation from{" "}
              <span className="font-medium">{formatDate(deleteTarget)}</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteAlert(false);
                  setDeleteTarget(null);
                }}
                className={`px-4 py-2 rounded transition-colors ${
                  theme
                    ? "bg-gray-200 hover:bg-gray-300 text-black"
                    : "bg-[#222222] hover:bg-[#333333] text-white"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteTarget && handleDelete(deleteTarget)}
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
