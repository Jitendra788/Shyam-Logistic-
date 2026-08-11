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
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              onClick={() => setOpen(isOpen ? null : faq.id)}
              aria-expanded={isOpen}
            >
              <span className="font-semibold text-navy">{faq.question}</span>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sand text-lg font-bold text-navy transition ${
                  isOpen ? "bg-red text-white" : ""
                }`}
              >
                {isOpen ? "−" : "+"}
              </span>
            </button>
            {isOpen && (
              <div className="border-t border-line px-5 py-4 text-sm leading-relaxed text-muted">
                {faq.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
