"use client";

import { useEffect } from "react";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/scrollLock";

export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [active]);
}
