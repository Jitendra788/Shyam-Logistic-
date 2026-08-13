"use client";

import { useEffect } from "react";
import { installTbsPersist } from "@/lib/tbs/tbsPersist";

/** Installs browser fallback so save/delete work when Vercel disk is read-only. */
export function TbsPersist() {
  useEffect(() => {
    installTbsPersist();
  }, []);
  return null;
}
