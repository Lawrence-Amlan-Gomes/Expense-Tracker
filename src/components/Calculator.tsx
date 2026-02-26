"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/app/hooks/useTheme";

const buttons = [
  { label: "AC",  type: "action",   span: 1 },
  { label: "+/-", type: "action",   span: 1 },
  { label: "%",   type: "action",   span: 1 },
  { label: "÷",   type: "operator", span: 1 },
  { label: "7",   type: "number",   span: 1 },
  { label: "8",   type: "number",   span: 1 },
  { label: "9",   type: "number",   span: 1 },
  { label: "×",   type: "operator", span: 1 },
  { label: "4",   type: "number",   span: 1 },
  { label: "5",   type: "number",   span: 1 },
  { label: "6",   type: "number",   span: 1 },
  { label: "−",   type: "operator", span: 1 },
  { label: "1",   type: "number",   span: 1 },
  { label: "2",   type: "number",   span: 1 },
  { label: "3",   type: "number",   span: 1 },
  { label: "+",   type: "operator", span: 1 },
  { label: "0",   type: "number",   span: 2 },
  { label: ".",   type: "number",   span: 1 },
  { label: "=",   type: "equals",   span: 1 },
] as const;

type BtnLabel = (typeof buttons)[number]["label"];

export default function Calculator() {
  const { theme } = useTheme();

  const [display, setDisplay]               = useState("0");
  const [expression, setExpression]         = useState("");
  const [firstOperand, setFirstOperand]     = useState<string | null>(null);
  const [operator, setOperator]             = useState<string | null>(null);
  const [waitingForSecond, setWaitingForSecond] = useState(false);
  const [justEvaluated, setJustEvaluated]   = useState(false);
  const [pressedKey, setPressedKey]         = useState<BtnLabel | null>(null);
  const [history, setHistory]               = useState<{ expr: string; result: string }[]>([]);
  const [showHistory, setShowHistory]       = useState(false);

  const flash = (key: BtnLabel) => {
    setPressedKey(key);
    setTimeout(() => setPressedKey(null), 120);
  };

  const calculate = useCallback((a: string, b: string, op: string): string => {
    const fa = parseFloat(a);
    const fb = parseFloat(b);
    switch (op) {
      case "÷": return fb === 0 ? "Error" : String(parseFloat((fa / fb).toPrecision(10)));
      case "×": return String(parseFloat((fa * fb).toPrecision(10)));
      case "−": return String(parseFloat((fa - fb).toPrecision(10)));
      case "+": return String(parseFloat((fa + fb).toPrecision(10)));
      default:   return b;
    }
  }, []);

  const handleNumber = useCallback((num: string) => {
    flash(num as BtnLabel);
    if (num === "." && display.includes(".") && !waitingForSecond) return;

    if (waitingForSecond) {
      setDisplay(num === "." ? "0." : num);
      setWaitingForSecond(false);
      setJustEvaluated(false);
      return;
    }
    if (justEvaluated) {
      setDisplay(num === "." ? "0." : num);
      setJustEvaluated(false);
      setFirstOperand(null);
      setOperator(null);
      setExpression("");
      return;
    }
    setDisplay((prev) => {
      if (prev === "0" && num !== ".") return num;
      if (prev.length >= 12) return prev;
      return prev + num;
    });
  }, [display, waitingForSecond, justEvaluated]);

  const handleOperator = useCallback((op: string) => {
    flash(op as BtnLabel);
    setJustEvaluated(false);
    if (firstOperand !== null && !waitingForSecond) {
      const result = calculate(firstOperand, display, operator!);
      setDisplay(result);
      setFirstOperand(result);
      setExpression(`${result} ${op}`);
    } else {
      setFirstOperand(display);
      setExpression(`${display} ${op}`);
    }
    setOperator(op);
    setWaitingForSecond(true);
  }, [firstOperand, operator, display, waitingForSecond, calculate]);

  const handleEquals = useCallback(() => {
    flash("=" as BtnLabel);
    if (firstOperand === null || operator === null) return;
    const result = calculate(firstOperand, display, operator);
    const expr = `${expression} ${display}`;
    setHistory((prev) => [{ expr, result }, ...prev.slice(0, 9)]);
    setDisplay(result);
    setExpression(expr + " =");
    setFirstOperand(null);
    setOperator(null);
    setWaitingForSecond(false);
    setJustEvaluated(true);
  }, [firstOperand, operator, display, expression, calculate]);

  const handleAction = useCallback((action: string) => {
    flash(action as BtnLabel);
    if (action === "AC") {
      setDisplay("0");
      setExpression("");
      setFirstOperand(null);
      setOperator(null);
      setWaitingForSecond(false);
      setJustEvaluated(false);
    } else if (action === "+/-") {
      setDisplay((prev) =>
        prev.startsWith("-") ? prev.slice(1) : prev === "0" ? "0" : "-" + prev
      );
    } else if (action === "%") {
      setDisplay((prev) => String(parseFloat(prev) / 100));
    }
  }, []);

  const handleClick = useCallback((btn: (typeof buttons)[number]) => {
    if (btn.type === "number")   handleNumber(btn.label);
    else if (btn.type === "operator") handleOperator(btn.label);
    else if (btn.type === "equals")   handleEquals();
    else if (btn.type === "action")   handleAction(btn.label);
  }, [handleNumber, handleOperator, handleEquals, handleAction]);

  useEffect(() => {
    const keyMap: Record<string, string> = {
      "0":"0","1":"1","2":"2","3":"3","4":"4","5":"5","6":"6","7":"7","8":"8","9":"9",
      ".":".","Enter":"=","=":"=","+":"+","-":"−","*":"×","/":"÷",
      "Escape":"AC","Backspace":"AC","%":"%",
    };
    const handler = (e: KeyboardEvent) => {
      const mapped = keyMap[e.key];
      if (!mapped) return;
      e.preventDefault();
      const found = buttons.find((b) => b.label === mapped);
      if (found) handleClick(found);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleClick]);

  const formatDisplay = (val: string) => {
    if (val === "Error") return "Error";
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    if (Math.abs(num) >= 1e10) return num.toExponential(3);
    return val.length > 12 ? val.slice(0, 12) : val;
  };

  const displayFontSize =
    display.length > 9 ? "text-3xl" :
    display.length > 6 ? "text-4xl" :
    "text-5xl";

  // ─── Button class builders ───────────────────────────────────────────────
  const numBtnCls = (isPressed: boolean) =>
    `flex items-center justify-center h-[76px] w-full
     font-semibold text-xl select-none cursor-pointer
     transition-all duration-75 active:scale-95
     ${isPressed ? "scale-95" : ""}
     ${theme
       ? "bg-gray-100 hover:bg-gray-200 text-gray-800 active:bg-gray-300"
       : "bg-[#1e1e22] hover:bg-[#252528] text-gray-100 active:bg-[#2a2a2e]"
     }`;

  const actionBtnCls = (isPressed: boolean) =>
    `flex items-center justify-center h-[76px] w-full
     font-semibold text-lg select-none cursor-pointer
     transition-all duration-75 active:scale-95
     ${isPressed ? "scale-95" : ""}
     ${theme
       ? "bg-gray-300 hover:bg-gray-400 text-gray-700 active:bg-gray-400"
       : "bg-[#2a2a2e] hover:bg-[#323236] text-gray-300 active:bg-[#3a3a3e]"
     }`;

  const operatorBtnCls = (isPressed: boolean, isActive: boolean) =>
    `flex items-center justify-center h-[76px] w-full
     font-normal text-2xl select-none cursor-pointer
     transition-all duration-75 active:scale-95
     ${isPressed ? "scale-95" : ""}
     ${isActive
       ? theme
         ? "bg-orange-100 text-orange-500 ring-1 ring-inset ring-orange-300"
         : "bg-orange-500/10 text-orange-300 ring-1 ring-inset ring-orange-500/30"
       : theme
         ? "bg-gray-100 hover:bg-gray-200 text-orange-500 active:bg-gray-300"
         : "bg-[#1e1e22] hover:bg-[#252528] text-orange-400 active:bg-[#2a2a2e]"
     }`;

  const equalsBtnCls = (isPressed: boolean) =>
    `flex items-center justify-center h-[76px] w-full
     font-normal text-2xl select-none cursor-pointer
     transition-all duration-75 active:scale-95
     ${isPressed ? "scale-95" : ""}
     bg-gradient-to-br from-orange-400 to-orange-600
     hover:from-orange-300 hover:to-orange-500
     active:from-orange-500 active:to-orange-700
     text-white shadow-inner`;

  return (
    <div className="flex flex-col items-center gap-4 p-10 pt-20">

      {/* History Panel */}
      {showHistory && (
        <div className={`w-[340px] rounded-2xl p-4 max-h-[280px] overflow-y-auto
          scrollbar-thin scrollbar-thumb-orange-400/30 scrollbar-track-transparent
          ${theme
            ? "bg-white border border-gray-200 shadow-lg"
            : "bg-[#1a1a1e] border border-white/5 shadow-[0_16px_48px_rgba(0,0,0,0.6)]"
          }`}
        >
          <p className={`text-[10px] font-bold tracking-widest uppercase pb-2 mb-2 border-b
            ${theme ? "text-orange-400 border-gray-200" : "text-orange-500/50 border-white/5"}`}>
            History
          </p>
          {history.length === 0 ? (
            <p className={`text-center text-xs py-5 font-mono
              ${theme ? "text-gray-400" : "text-white/20"}`}>
              no calculations yet
            </p>
          ) : (
            history.map((h, i) => (
              <div key={i} className={`py-2 border-b last:border-b-0
                ${theme ? "border-gray-100" : "border-white/[0.04]"}`}>
                <p className={`text-right text-[11px] font-mono mb-0.5
                  ${theme ? "text-orange-400/60" : "text-orange-400/40"}`}>
                  {h.expr}
                </p>
                <p className={`text-right text-lg font-mono font-medium
                  ${theme ? "text-gray-800" : "text-gray-100/85"}`}>
                  {h.result}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* History Toggle Button */}
      <button
        onClick={() => setShowHistory((v) => !v)}
        className={`text-[11px] font-bold tracking-widest uppercase px-5 py-2 rounded-full
          border transition-all duration-200 cursor-pointer
          ${theme
            ? "border-orange-300 text-orange-400 hover:bg-orange-50 hover:border-orange-400"
            : "border-orange-500/20 text-orange-400/60 hover:bg-orange-500/8 hover:text-orange-400/90 hover:border-orange-500/40"
          }`}
      >
        {showHistory ? "Hide History" : "Show History"}
      </button>

      {/* Calculator Shell */}
      <div className={`w-[340px] rounded-[28px] p-[6px] relative overflow-hidden
        ${theme
          ? "bg-gradient-to-br from-gray-200 to-gray-300 shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_32px_64px_rgba(0,0,0,0.2)]"
          : "bg-gradient-to-br from-[#1a1a1e] to-[#111113] shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_32px_64px_rgba(0,0,0,0.8)]"
        }`}
      >
        {/* Glow rim at top */}
        <div className={`absolute -top-14 -left-14 -right-14 h-36 pointer-events-none
          ${theme
            ? "bg-[radial-gradient(ellipse_at_50%_0%,rgba(251,146,60,0.12)_0%,transparent_70%)]"
            : "bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,165,0,0.08)_0%,transparent_70%)]"
          }`}
        />

        {/* Inner shell */}
        <div className={`rounded-[23px] overflow-hidden border
          ${theme
            ? "bg-white border-gray-200"
            : "bg-[#131315] border-white/5"
          }`}
        >
          {/* ── Display ── */}
          <div className={`relative px-6 pt-6 pb-4 min-h-[130px] flex flex-col justify-end
            ${theme
              ? "bg-gradient-to-b from-gray-50 to-white border-b border-gray-100"
              : "bg-gradient-to-b from-[#0a0a0c] to-[#111113] border-b border-white/[0.04]"
            }`}
          >
            {/* Orange underline accent */}
            <div className={`absolute bottom-0 left-6 right-6 h-px
              ${theme
                ? "bg-gradient-to-r from-transparent via-orange-300/60 to-transparent"
                : "bg-gradient-to-r from-transparent via-orange-500/30 to-transparent"
              }`}
            />

            {/* Expression */}
            <p className={`text-right text-xs font-mono tracking-wide truncate mb-1 min-h-[18px]
              ${theme ? "text-orange-400/70" : "text-orange-400/50"}`}>
              {expression || "\u00A0"}
            </p>

            {/* Main number */}
            <p className={`text-right font-mono font-light leading-none tracking-tight
              truncate transition-all duration-150
              ${displayFontSize}
              ${theme ? "text-gray-900" : "text-gray-100"}`}>
              {formatDisplay(display)}
            </p>
          </div>

          {/* ── Buttons Grid ── */}
          <div className={`grid grid-cols-4 gap-px
            ${theme ? "bg-gray-200" : "bg-white/[0.04]"}`}
          >
            {buttons.map((btn, i) => {
              const isPressed  = pressedKey === btn.label;
              const isActiveOp = btn.type === "operator" && btn.label === operator && waitingForSecond;

              let cls = "";
              if (btn.type === "number")   cls = numBtnCls(isPressed);
              else if (btn.type === "action")   cls = actionBtnCls(isPressed);
              else if (btn.type === "operator") cls = operatorBtnCls(isPressed, isActiveOp);
              else if (btn.type === "equals")   cls = equalsBtnCls(isPressed);

              return (
                <button
                  key={i}
                  className={cls}
                  style={btn.span === 2
                    ? { gridColumn: "span 2", justifyContent: "flex-start", paddingLeft: "28px" }
                    : undefined
                  }
                  onClick={() => handleClick(btn)}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {btn.label}
                </button>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}