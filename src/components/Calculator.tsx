"use client";

import { useState, useEffect, useCallback } from "react";
import PageBand from "./PageBand";

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

  // Slightly more mobile-friendly font scaling
  const displayFontSize =
    display.length > 11 ? "text-2xl" :
    display.length > 8  ? "text-3xl sm:text-4xl" :
    display.length > 5  ? "text-4xl sm:text-5xl" :
                          "text-5xl sm:text-6xl";

  // ─── Button classes (design tokens; no theme ternaries needed) ───
  const baseBtn =
    "flex items-center justify-center h-16 sm:h-20 font-bold select-none transition-colors duration-75 active:bg-mint-200 touch-manipulation";

  const numBtnCls = (isPressed: boolean) =>
    `${baseBtn} text-xl sm:text-2xl bg-surface text-ink hover:bg-mint-50 ${isPressed ? "bg-mint-100" : ""}`;

  const actionBtnCls = (isPressed: boolean) =>
    `${baseBtn} text-lg sm:text-xl bg-soft text-body hover:bg-mint-50 ${isPressed ? "bg-mint-100" : ""}`;

  const operatorBtnCls = (isPressed: boolean, isActive: boolean) =>
    `${baseBtn} text-2xl sm:text-3xl ${
      isActive
        ? "bg-primary text-on-primary"
        : `bg-mint-50 text-brand hover:bg-mint-100 ${isPressed ? "bg-mint-200" : ""}`
    }`;

  const equalsBtnCls = (isPressed: boolean) =>
    `${baseBtn} text-2xl sm:text-3xl bg-primary text-on-primary hover:bg-primary-hover ${isPressed ? "bg-primary-hover" : ""}`;

  return (
    <div className="w-full">
      <PageBand
        crumb="Calculator"
        title="Calculator"
        lead="A quick calculator with history. Keyboard works too."
      />

      <section className="flex flex-col items-center gap-4 px-4 py-10 sm:py-14">
        {/* History Panel */}
        {showHistory && (
          <div className="card max-h-[50vh] w-full max-w-[400px] overflow-y-auto p-4 sm:max-h-[320px]">
            <p className="eyebrow mb-2 border-b border-hairline pb-2">History</p>
            {history.length === 0 ? (
              <p className="py-5 text-center text-sm text-muted">
                No calculations yet
              </p>
            ) : (
              history.map((h, i) => (
                <div
                  key={i}
                  className="border-b border-hairline py-2 text-sm last:border-b-0"
                >
                  <p className="mb-0.5 text-right font-mono text-xs text-muted">
                    {h.expr}
                  </p>
                  <p className="text-right font-mono font-medium text-ink">
                    {h.result}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* History toggle */}
        <button
          onClick={() => setShowHistory((v) => !v)}
          className="btn-outline"
        >
          {showHistory ? "Hide history" : "Show history"}
        </button>

        {/* Calculator shell */}
        <div className="card w-full max-w-[400px] overflow-hidden">
          {/* Display */}
          <div className="flex min-h-[110px] flex-col justify-end border-b border-hairline bg-mint-50 px-5 pb-4 pt-6 sm:min-h-[130px] sm:px-6">
            <p className="mb-1 min-h-[18px] truncate text-right font-mono text-xs tracking-wide text-muted sm:text-sm">
              {expression || "\u00A0"}
            </p>
            <p
              className={`truncate text-right font-mono font-light leading-none tracking-tight text-ink transition-all duration-150 ${displayFontSize}`}
            >
              {formatDisplay(display)}
            </p>
          </div>

          {/* Buttons grid */}
          <div className="grid grid-cols-4 gap-px bg-hairline">
            {buttons.map((btn, i) => {
              const isPressed = pressedKey === btn.label;
              const isActiveOp =
                btn.type === "operator" &&
                btn.label === operator &&
                waitingForSecond;

              let cls = "";
              if (btn.type === "number") cls = numBtnCls(isPressed);
              else if (btn.type === "action") cls = actionBtnCls(isPressed);
              else if (btn.type === "operator")
                cls = operatorBtnCls(isPressed, isActiveOp);
              else if (btn.type === "equals") cls = equalsBtnCls(isPressed);

              return (
                <button
                  key={i}
                  className={cls}
                  style={
                    btn.span === 2
                      ? {
                          gridColumn: "span 2",
                          justifyContent: "flex-start",
                          paddingLeft: "1.5rem",
                          paddingRight: "1.5rem",
                        }
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
      </section>
    </div>
  );
}
