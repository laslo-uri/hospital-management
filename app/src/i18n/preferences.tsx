"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import {
  translate,
  type Locale,
  type MessageKey,
} from "./messages";

type Preferences = {
  locale: Locale;
  t: (key: MessageKey, vars?: Record<string, string>) => string;
  setLocale: (locale: Locale) => void;
};

const PreferencesContext = createContext<Preferences | null>(null);

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${value};path=/;max-age=31536000;samesite=lax`;
}

export function PreferencesProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const router = useRouter();
  const value = useMemo<Preferences>(
    () => ({
      locale,
      t: (key, vars) => translate(locale, key, vars),
      setLocale: (next) => {
        writeCookie("hospital_locale", next);
        document.documentElement.lang = next;
        router.refresh();
      },
    }),
    [locale, router],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used inside PreferencesProvider");
  }
  return context;
}
