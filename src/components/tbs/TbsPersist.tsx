"use client";

import { useEffect } from "react";
import { installTbsPersist } from "@/lib/tbs/tbsPersist";

/** Drops leftover IndexedDB copies; admin lists come from the server database. */
export function TbsPersist() {
  useEffect(() => {
    installTbsPersist();
  }, []);
  return null;
}
