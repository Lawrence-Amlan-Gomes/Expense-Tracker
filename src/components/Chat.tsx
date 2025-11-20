"use client";

import { updateHistory, updatePaymentType } from "@/app/actions";
import colors from "@/app/color/color";
import { useAuth } from "@/app/hooks/useAuth";
import { useResponse } from "@/app/hooks/useResponse";
import { useTheme } from "@/app/hooks/useTheme";
import { response } from "@/app/server";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FaHistory } from "react-icons/fa";
import EachInputOutput from "./EachInputOutput";
import PromptInput from "./PromptInput";

export default function Chat() {
  const {
    generationLimit,
    myText,
    setMyText,
    aiResponse,
    setAiResponse,
    inputOutputPair,
    setInputOutputPair,
    clickedDate,
  } = useResponse();

  const router = useRouter();
  const [isTyping, setIsTyping] = useState(true);
  const { user, setAuth } = useAuth();
  const { theme } = useTheme();
  const [firstTime, setFirstTime] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);
  const [request, setRequest] = useState(false);
  const [tempMyText, setTempMyText] = useState("");
  const [showLimitPopup, setShowLimitPopup] = useState(false);
  const [isPromptBoxLong, setIsPromptBoxLong] = useState(false);
  const [showPopupMessage, setShowPopupMessage] = useState(
    "Your daily limit is over. Please try again tomorrow"
  );

  const chatRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);

  const today = new Date().toLocaleDateString("en-CA");
  const targetDate = clickedDate || today;

  // Helper function to get subscription type from paymentType
  const getSubscriptionType = (
    paymentType: string
  ): keyof typeof generationLimit => {
    const type = paymentType.split(" ")[0].toLowerCase();
    if (type === "standard") return "standard";
    if (type === "premium") return "premium";
    return "free";
  };

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const spring = {
    type: "spring",
    stiffness: 300,
    damping: 30,
  };

  const transition = hasMounted ? spring : false;

  const height = {
    short: { sm: "105px", mobile: "60px" },
    long: { sm: "200px", mobile: "120px" },
  };

  // Initialize today's entry if it doesn't exist
  useEffect(() => {
    if (!user?.history) return;

    const todayExists = user.history.some((e) => {
      const clean = e.date.includes("T") ? e.date.split("T")[0] : e.date;
      return clean === today;
    });

    if (!todayExists) {
      const subscription = getSubscriptionType(user?.paymentType ?? "free");
      const limit = generationLimit[subscription] ?? generationLimit.free;

      const tempHistory = JSON.parse(JSON.stringify(user.history));
      tempHistory.push({
        date: today,
        title: "",
        context: [],
        generation: String(limit),
      });

      setAuth({ ...user, history: tempHistory });
      updateHistory(user.email, tempHistory);
    }
  }, [user, today]);

  // Load context for targetDate
  useEffect(() => {
    if (!user?.history || !targetDate) return;

    const entry = user.history.find((e) => {
      const clean = e.date.includes("T") ? e.date.split("T")[0] : e.date;
      return clean === targetDate;
    });

    setInputOutputPair(entry?.context || []);
  }, [user?.history, targetDate, setInputOutputPair]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    router.refresh();
  }, [router]);

  const getResponse = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (user.paymentType === "Expired") {
      setShowPopupMessage("Your subscription has expired. Please ");
      setShowLimitPopup(true);
      return;
    }

    if (user.expiredAt && new Date(user.expiredAt) < new Date()) {
      setShowPopupMessage("Your subscription has expired. Please ");
      setShowLimitPopup(true);
      setAuth({ ...user, paymentType: "Expired" });
      await updatePaymentType(user.email, "Expired", user.expiredAt);
      return;
    }

    if (!myText.trim()) return;

    const subscription = getSubscriptionType(user?.paymentType ?? "free");
    const limit = generationLimit[subscription] ?? generationLimit.free;

    const todayEntry = user?.history?.find((e) => {
      const clean = e.date.includes("T") ? e.date.split("T")[0] : e.date;
      return clean === today;
    });

    let todayRemaining = todayEntry ? Number(todayEntry.generation) : limit;
    if (isNaN(todayRemaining)) todayRemaining = limit;

    if (todayRemaining <= 0) {
      setShowPopupMessage(
        "Your daily limit is over. Please try again tomorrow"
      );
      setShowLimitPopup(true);
      return;
    }

    setIsTyping(false);
    setRequest(true);
    setTempMyText(myText);
    setInputOutputPair([...inputOutputPair, [myText, "loading"]]);
    setMyText("");
    setTimeout(scrollToBottom, 0);
  };

  useEffect(() => {
    setTimeout(scrollToBottom, 100);
  }, [inputOutputPair, request]);

  useEffect(() => {
    if (inputOutputPair.length) setFirstTime(false);
  }, [inputOutputPair]);

  useEffect(() => {
    async function fetchData() {
      if (!request || isUpdatingRef.current || !user) return;
      isUpdatingRef.current = true;

      const tempHistory = user?.history
        ? JSON.parse(JSON.stringify(user.history))
        : [];
      const subscription = getSubscriptionType(user?.paymentType ?? "free");
      const limit = generationLimit[subscription] ?? generationLimit.free;

      try {
        const res = await response(tempMyText, inputOutputPair);
        setAiResponse(res);

        const finalPair: [string, string][] = [...inputOutputPair];
        finalPair[finalPair.length - 1] = [tempMyText, res];
        setInputOutputPair(finalPair);

        const todayIdx = tempHistory.findIndex((e: any) => {
          const clean = e.date.includes("T") ? e.date.split("T")[0] : e.date;
          return clean === today;
        });

        const targetIdx = tempHistory.findIndex((e: any) => {
          const clean = e.date.includes("T") ? e.date.split("T")[0] : e.date;
          return clean === targetDate;
        });

        const isToday = targetDate === today;

        // Calculate new generation count
        const newTodayGen =
          todayIdx === -1
            ? limit - 1
            : Math.max(0, Number(tempHistory[todayIdx].generation) - 1);

        // If target date is today, handle in one object
        if (isToday) {
          if (todayIdx !== -1) {
            // Update existing today entry
            tempHistory[todayIdx] = {
              ...tempHistory[todayIdx],
              context: finalPair,
              generation: String(newTodayGen),
            };
          } else {
            // Create new today entry
            tempHistory.push({
              date: today,
              title: "",
              context: finalPair,
              generation: String(newTodayGen),
            });
          }
        } else {
          // Handle today's generation count separately
          if (todayIdx !== -1) {
            tempHistory[todayIdx] = {
              ...tempHistory[todayIdx],
              generation: String(newTodayGen),
            };
          } else {
            tempHistory.push({
              date: today,
              title: "",
              context: [],
              generation: String(newTodayGen),
            });
          }

          // Handle target date (different from today)
          if (targetIdx !== -1) {
            tempHistory[targetIdx] = {
              ...tempHistory[targetIdx],
              context: finalPair,
              generation: "0",
            };
          } else {
            tempHistory.push({
              date: targetDate,
              title: "",
              context: finalPair,
              generation: "0",
            });
          }
        }

        const updatedUser = { ...user, history: tempHistory };
        setAuth(updatedUser);
        await updateHistory(user.email, tempHistory);
      } catch (err) {
        console.error(err);
        setAiResponse("Error: Try again later.");

        const finalPair: [string, string][] = [...inputOutputPair];
        finalPair[finalPair.length - 1] = [
          tempMyText,
          "Error: Could not fetch response",
        ];
        setInputOutputPair(finalPair);

        const todayIdx = tempHistory.findIndex((e: any) => {
          const clean = e.date.includes("T") ? e.date.split("T")[0] : e.date;
          return clean === today;
        });

        const targetIdx = tempHistory.findIndex((e: any) => {
          const clean = e.date.includes("T") ? e.date.split("T")[0] : e.date;
          return clean === targetDate;
        });

        const isToday = targetDate === today;

        const newTodayGen =
          todayIdx === -1
            ? limit - 1
            : Math.max(
                0,
                Number(tempHistory[todayIdx]?.generation || limit) - 1
              );

        if (isToday) {
          if (todayIdx !== -1) {
            tempHistory[todayIdx] = {
              ...tempHistory[todayIdx],
              context: finalPair,
              generation: String(newTodayGen),
            };
          } else {
            tempHistory.push({
              date: today,
              title: "",
              context: finalPair,
              generation: String(newTodayGen),
            });
          }
        } else {
          if (todayIdx !== -1) {
            tempHistory[todayIdx] = {
              ...tempHistory[todayIdx],
              generation: String(newTodayGen),
            };
          } else {
            tempHistory.push({
              date: today,
              title: "",
              context: [],
              generation: String(newTodayGen),
            });
          }

          if (targetIdx !== -1) {
            tempHistory[targetIdx] = {
              ...tempHistory[targetIdx],
              context: finalPair,
              generation: "0",
            };
          } else {
            tempHistory.push({
              date: targetDate,
              title: "",
              context: finalPair,
              generation: "0",
            });
          }
        }

        const updatedUser = { ...user, history: tempHistory };
        setAuth(updatedUser);
        await updateHistory(user.email, tempHistory);
      } finally {
        setRequest(false);
        isUpdatingRef.current = false;
      }
    }

    fetchData();
  }, [
    request,
    tempMyText,
    inputOutputPair,
    user,
    generationLimit,
    targetDate,
    today,
    setAiResponse,
    setInputOutputPair,
    setAuth,
  ]);

  return (
    <>
      {firstTime || inputOutputPair.length === 0 ? (
        <div
          className={`w-full h-screen flex sm:px-0 px-[5%] justify-center items-center overflow-hidden relative ${
            theme
              ? "bg-[#ffffff] text-[#0a0a0a]"
              : "bg-[#000000] text-[#ebebeb]"
          }`}
        >
          <div className="w-full">
            <div className="w-full text-center mb-[10px]">
              <h2 className="text-3xl sm:text-5xl font-extrabold mb-6">
                Craft Perfect{" "}
                <span className={`${colors.keyText}`}>Replies </span>
                to Recruiters
              </h2>
              <p className="text-lg mb-8">
                Save time and impress recruiters with professional, tailored
                email responses generated in seconds.
              </p>
            </div>
            <div className="w-full">
              <div
                className={`w-[96%] ml-[2%] sm:w-[60%] sm:ml-[20%] flex justify-center relative overflow-hidden items-center h-full ${
                  theme
                    ? "bg-[#ffffff] text-[#0a0a0a]"
                    : "bg-[#000000] text-[#ebebeb]"
                }`}
              >
                <div className="w-full overflow-hidden relative">
                  <div className="w-full flex justify-center overflow-hidden relative items-center float-left h-[110px] sm:h-[140px]">
                    <PromptInput
                      myText={myText}
                      setMyText={setMyText}
                      getResponse={getResponse}
                      setIsTyping={setIsTyping}
                      aiResponse={aiResponse}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`h-screen w-full relative overflow-hidden ${
            theme
              ? "bg-[#ffffff] text-[#0a0a0a]"
              : "bg-[#000000] text-[#ebebeb]"
          }`}
        >
          <div
            ref={chatRef}
            className={`w-full h-screen pt-[2%] relative overflow-x-hidden overflow-y-auto scrollbar ${
              theme
                ? "scrollbar-thumb-black scrollbar-track-[#eeeeee]"
                : "scrollbar-thumb-white scrollbar-track-[#222222]"
            }`}
          >
            <div className="h-[95%] sm:px-[20%] pt-[20%] sm:pt-[10%] relative w-full">
              {inputOutputPair.map((pair, i) => (
                <EachInputOutput
                  key={i}
                  pair={pair}
                  isLast={i === inputOutputPair.length - 1}
                  isLoading={request && i === inputOutputPair.length - 1}
                />
              ))}
              <div className="w-full sm:h-[45%] h-[30%]" ref={bottomRef} />
            </div>
          </div>

          <div
            className={`absolute h-[30px] flex justify-center items-center w-[30px] sm:hidden ${colors.keyBorder} border-[1px] right-[10px] rounded-md bottom-[120px]`}
          >
            <Link href="/history">
              <FaHistory
                size={17}
                className={`${colors.keyText} hover:opacity-70`}
              />
            </Link>
          </div>

          <motion.div
            className={`flex justify-center overflow-hidden items-center absolute bottom-0 left-0 w-[98%] mr-[2%] pb-0 sm:pb-[2%] ${
              theme ? "bg-white" : "bg-black"
            }`}
            initial={{ height: height.short.mobile }}
            animate={{
              height: isPromptBoxLong
                ? window.innerWidth >= 640
                  ? height.long.sm
                  : height.long.mobile
                : window.innerWidth >= 640
                ? height.short.sm
                : height.short.mobile,
            }}
            transition={transition}
            onMouseEnter={() => setIsPromptBoxLong(true)}
            onMouseLeave={() => setIsPromptBoxLong(false)}
            onTouchStart={() => setIsPromptBoxLong(true)}
            onTouchEnd={() => setIsPromptBoxLong(false)}
          >
            <div className="h-full pt-[2%] pb-[2%] sm:pb-0 sm:mt-0 w-full sm:mx-[20%] mx-[5%] relative sm:pl-0">
              <PromptInput
                myText={myText}
                setMyText={setMyText}
                getResponse={getResponse}
                setIsTyping={setIsTyping}
                aiResponse={aiResponse}
              />
            </div>
          </motion.div>
        </div>
      )}

      {showLimitPopup && (
        <div
          className={`fixed inset-0 flex items-center justify-center z-50 ${
            theme ? "bg-black/50" : "bg-black/70"
          }`}
        >
          <div
            className={`p-6 rounded-lg shadow-lg max-w-sm w-full text-center ${
              theme ? "bg-white text-black" : "bg-black text-white"
            }`}
          >
            <h3 className="text-xl font-semibold mb-4">Daily Limit Exceeded</h3>
            <p className="mb-4">
              {showPopupMessage}
              {user?.paymentType === "Expired" && (
                <>
                  <Link
                    href="/payment"
                    className="underline text-blue-600 hover:text-blue-700"
                  >
                    Upgrade
                  </Link>{" "}
                  to continue.
                </>
              )}
            </p>
            <button
              onClick={() => setShowLimitPopup(false)}
              className={`px-4 py-2 rounded ${
                theme
                  ? "bg-red-700 text-white hover:bg-red-800"
                  : "bg-red-700 text-white hover:bg-red-800"
              }`}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
