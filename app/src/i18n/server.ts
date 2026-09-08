import { cookies } from "next/headers";
import {
  isLocale,
  translate,
  type Locale,
  type MessageKey,
} from "./messages";

export const LOCALE_COOKIE = "hospital_locale";

export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : "en";
}

export async function t(key: MessageKey, vars?: Record<string, string>) {
  return translate(await getLocale(), key, vars);
}
