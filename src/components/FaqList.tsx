"use client";

import { useState } from "react";
import type { FaqItem } from "@/lib/types";

export function FaqList({ faqs }: { faqs: FaqItem[] }) {
  const [open, setOpen] = useState<string | null>(faqs[0]?.id ?? null);

  return (
    <div className="space-y-3">
      {faqs.map((faq) => {
        const isOpen = open === faq.id;
        return (
          <div
            key={faq.id}
            className="overflow-hidden rounded-xl border border-line bg-white"
          >
            <button
              type="button"
              className="flex w-full items-start justify-between gap-3 px-3.5 py-3.5 text-left sm:items-center sm:gap-4 sm:px-5 sm:py-4"
              onClick={() => setOpen(isOpen ? null : faq.id)}
              aria-expanded={isOpen}
            >
              <span className="min-w-0 text-sm font-semibold leading-snug text-navy sm:text-base">
                {faq.question}
              </span>
              <span
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sand text-lg font-bold text-navy transition ${
                  isOpen ? "bg-red text-white" : ""
                }`}
              >
                {isOpen ? "−" : "+"}
              </span>
            </button>
            {isOpen && (
              <div className="border-t border-line px-3.5 py-3.5 text-sm leading-relaxed text-muted sm:px-5 sm:py-4">
                {faq.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
