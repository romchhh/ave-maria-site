"use client";

import { createContext, useContext, type ReactNode } from "react";
import { ukMessages, type Messages } from "@/lib/i18n/messages";

const I18nContext = createContext<Messages | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  return (
    <I18nContext.Provider value={ukMessages}>{children}</I18nContext.Provider>
  );
}

export function useI18n() {
  const t = useContext(I18nContext);
  if (!t) throw new Error("useI18n must be used within I18nProvider");
  return { t };
}
