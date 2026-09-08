"use client";

import {
  LOCALES,
  LOCALE_LABELS,
  LOCALE_NAMES,
  type Locale,
} from "@/i18n/messages";
import { usePreferences } from "@/i18n/preferences";

export function LanguageSwitcher({
  variant = "light",
}: {
  variant?: "light" | "dark";
}) {
  const { locale, setLocale, t } = usePreferences();
  const isDark = variant === "dark";

  return (
    <label className="inline-flex items-center gap-2 text-xs">
      <span
        className={
          isDark
            ? "font-semibold uppercase tracking-wide text-paper/70"
            : "font-semibold uppercase tracking-wide text-muted"
        }
      >
        {t("language")}
      </span>
      <select
        aria-label={t("language")}
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className={
          isDark
            ? "rounded border border-white/20 bg-white/10 px-2 py-1 text-xs font-semibold text-paper"
            : "rounded border border-line bg-field px-2 py-1 text-xs font-semibold text-ink"
        }
      >
        {LOCALES.map((code) => (
          <option key={code} value={code}>
            {LOCALE_LABELS[code]} · {LOCALE_NAMES[code]}
          </option>
        ))}
      </select>
    </label>
  );
}
