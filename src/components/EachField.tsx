"use client";

import { useEffect, useState } from "react";

interface EachFieldProps {
  label: string;
  isReal: boolean;
  name: string;
  type: string;
  placeholder?: string;
  value: string;
  setValue: (value: string) => void;
  iserror: boolean;
  error?: string;
}

// text-input from DESIGN.md: square corners, hairline border, green focus.
const EachField = ({
  label,
  isReal,
  name,
  type,
  placeholder,
  value,
  setValue,
  iserror,
  error,
}: EachFieldProps) => {
  const [firstTime, setFirstTime] = useState(true);

  useEffect(() => {
    setFirstTime(value === "");
  }, [value]);

  if (!isReal) {
    // Hidden twin field that keeps browser autofill happy.
    return (
      <input
        className="h-[1px] w-[1px] opacity-0"
        type={type}
        value={value}
        name={name}
        tabIndex={-1}
        aria-hidden="true"
        onChange={() => {}}
        placeholder={placeholder}
      />
    );
  }

  const id = `${name}-${label.replace(/\s+/g, "-").toLowerCase()}`;
  const stateClass = firstTime
    ? ""
    : iserror
      ? "!border-error"
      : "!border-primary";

  return (
    <div className="text-left">
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-body">
        {label}
      </label>
      <input
        id={id}
        className={`field ${stateClass}`}
        type={type}
        value={value}
        name={name}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        aria-invalid={!firstTime && iserror}
      />
      {iserror && !firstTime && error && (
        <p className="mt-1 text-xs font-medium text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default EachField;
