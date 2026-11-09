"use client";

import Image from "next/image";
import { useState } from "react";

// The hero uses /public/hero.png. Until that file exists (or if it fails to
// load) a flat-vector illustration in the brand palette is shown instead,
// so the page never shows a broken image.
function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 400 400"
      className="h-full w-full"
      role="img"
      aria-label="Illustration of a spending dashboard with coins"
    >
      <rect width="400" height="400" fill="#e3faf2" />
      <circle cx="330" cy="70" r="54" fill="#b7ecda" />
      <circle cx="60" cy="340" r="70" fill="#effcf8" />

      {/* dashboard card */}
      <rect x="54" y="78" width="250" height="196" rx="8" fill="#ffffff" stroke="#d8d9da" />
      <rect x="74" y="98" width="90" height="10" fill="#d8d9da" />
      <rect x="74" y="118" width="130" height="18" fill="#008254" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect
          key={i}
          x={78 + i * 36}
          y={238 - [40, 62, 48, 86, 70, 104][i]}
          width="22"
          height={[40, 62, 48, 86, 70, 104][i]}
          fill={i === 5 ? "#008254" : "#b7ecda"}
        />
      ))}
      <line x1="74" y1="238" x2="284" y2="238" stroke="#ebebec" />

      {/* expert tip chip */}
      <rect x="196" y="40" width="150" height="48" rx="8" fill="#e8fdac" />
      <rect x="210" y="56" width="70" height="8" fill="#006642" />
      <rect x="210" y="70" width="104" height="6" fill="#008254" opacity="0.5" />

      {/* coin stack */}
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <ellipse cx="300" cy={318 - i * 18} rx="46" ry="14" fill="#6aa820" />
          <rect x="254" y={304 - i * 18} width="92" height="14" fill="#8dc63f" />
          <ellipse cx="300" cy={304 - i * 18} rx="46" ry="14" fill="#a8ea4c" />
        </g>
      ))}
      <ellipse cx="300" cy="232" rx="46" ry="14" fill="#9ae600" />
      <text x="300" y="237" textAnchor="middle" fontSize="16" fontWeight="700" fill="#00482f">
        $
      </text>

      {/* phone-like pill */}
      <rect x="64" y="296" width="120" height="44" rx="22" fill="#00482f" />
      <circle cx="88" cy="318" r="12" fill="#9ae600" />
      <rect x="108" y="308" width="60" height="8" fill="#ffffff" />
      <rect x="108" y="322" width="38" height="6" fill="#ffffff" opacity="0.6" />
    </svg>
  );
}

export default function HeroImage() {
  const [failed, setFailed] = useState(false);

  return (
    <div className="mx-auto w-full max-w-[520px] rounded-2xl bg-mint-100 p-3 sm:p-4">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-mint-50">
        {failed ? (
          <HeroIllustration />
        ) : (
          <Image
            src="/hero.png"
            alt="Expense Tracker dashboard with coins and charts"
            fill
            priority
            sizes="(max-width: 768px) 90vw, 520px"
            className="object-cover"
            onError={() => setFailed(true)}
          />
        )}
      </div>
    </div>
  );
}
