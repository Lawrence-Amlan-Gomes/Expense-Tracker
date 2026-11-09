// Wordmark: a green "E" with a lime coin, then the product name in brand green.
// Colours come from tokens so it works in light and dark mode.
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect x="3" y="4" width="22" height="6" className="fill-primary" />
      <rect x="3" y="17" width="16" height="6" className="fill-primary" />
      <rect x="3" y="30" width="22" height="6" className="fill-primary" />
      <rect x="3" y="4" width="6" height="32" className="fill-primary" />
      <circle cx="30" cy="22" r="8" className="fill-lime-logo" />
      <path
        d="M30 17.5v9M32.4 19.3c-.5-.8-1.4-1.1-2.4-1.1-1.3 0-2.3.6-2.3 1.7 0 2.3 4.9 1.2 4.9 3.5 0 1.1-1.1 1.8-2.6 1.8-1.1 0-2.1-.4-2.6-1.2"
        stroke="#00482f"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2">
      <LogoMark size={size} />
      <span className="text-lg font-bold tracking-tight text-brand sm:text-xl">
        Expense Tracker
      </span>
    </span>
  );
}
