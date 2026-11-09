import type { ReactNode } from "react";

// Shared frame for login / register / change-password.
export default function AuthShell({
  title,
  subtitle,
  children,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="flex w-full flex-1 items-start justify-center bg-soft px-4 py-10 sm:py-16">
      <div
        className={`card w-full p-6 sm:p-8 ${wide ? "max-w-xl" : "max-w-md"}`}
      >
        <h1 className="text-2xl sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-2 text-sm font-light text-body">{subtitle}</p>}
        <div className="mt-6 space-y-4">{children}</div>
      </div>
    </div>
  );
}
