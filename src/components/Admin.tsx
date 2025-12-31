"use client";
import { useTheme } from "@/app/hooks/useTheme";
import { useAuth } from "@/app/hooks/useAuth";

export default function Admin() {
  const { theme } = useTheme();
  const { user: auth } = useAuth();
  return (
    <div
      className={`px-[10%] mt-[20%] sm:mt-[10%] text-3xl text-center sm:px-[10%] mb-[5%] pb-[5%] w-full ${
        theme ? "bg-[#ffffff] text-[#aaaaaaa]" : "bg-[#000000] text-[#eeeeee]"
      }`}
    >
      {" "}
      <div>{auth ? `Welcome, dear admin ${auth.name}` : ""} </div>
    </div>
  );
}
