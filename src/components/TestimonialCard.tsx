"use client";
import Image from "next/image";
import { FaQuoteLeft } from "react-icons/fa";

// rate-card style: white card, hairline border, no shadow.
export default function TestimonialCard({
  clientName,
  clientImg,
  clientRole,
  clientQuote,
}: {
  clientName: string;
  clientImg: string;
  clientRole: string;
  clientQuote: string;
}) {
  return (
    <figure className="card relative mx-auto flex w-full flex-col justify-between p-6 sm:p-8">
      <div className="flex flex-grow flex-col">
        <FaQuoteLeft className="mb-4 text-xl text-brand" aria-hidden="true" />
        <blockquote className="mb-6 text-sm font-light leading-relaxed text-body sm:text-base">
          {clientQuote}
        </blockquote>
      </div>

      <figcaption className="mt-auto flex items-center gap-4 border-t border-hairline pt-4">
        <div className="relative h-12 w-12 overflow-hidden rounded-full bg-mint-100">
          <Image
            src={clientImg}
            alt={clientName}
            width={48}
            height={48}
            className="h-12 w-12 object-cover"
          />
        </div>
        <div>
          <h3 className="text-sm font-bold text-ink">{clientName}</h3>
          <p className="text-xs text-muted">{clientRole}</p>
        </div>
      </figcaption>
    </figure>
  );
}
