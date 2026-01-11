"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/app/hooks/useTheme";

// Define the props interface
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
  const { theme } = useTheme();

  useEffect(() => {
    if (value === "") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFirstTime(true);
    } else {
      setFirstTime(false);
    }
  }, [value]); // Removed setFirstTime from deps — it's stable

  return (
    <>
      {isReal ? (
        <div>
          <div className="text-[12px] lg:text-[16px] mx-[2%] mb-1 text-start mt-5">
            {value !== "" ? label : ""}
          </div>
          <input
            className={`p-3 border-[2px] text-[12px] lg:text-[16px] box-border w-[96%] mx-[2%] rounded-md focus:outline-none focus:outline-[1px] focus:shadow-none bg-transparent placeholder:text-neutral-500 ${
              firstTime
                ? theme
                  ? "border-black"
                  : "border-[#eeeeee]"
                : !iserror
                ? "border-green-700 text-green-600 focus:outline-green-600"
                : "border-red-600 text-red-600 focus:outline-red-600"
            }`}
            type={type}
            value={value}
            name={name}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            autoComplete="off"
          />
          {iserror && (
            <div className="text-red-600 mt-1 text-start text-[10px] lg:text-[14px] w-[96%] mx-[2%]">
              {firstTime ? "" : error}
            </div>
          )}
        </div>
      ) : (
        <div>
          <input
            className="h-[1px] w-[1px] float-left opacity-0"
            type={type}
            value={value}
            name={name}
            onChange={() => console.log("hidden field")}
            placeholder={placeholder}
          />
        </div>
      )}
    </>
  );
};

export default EachField;