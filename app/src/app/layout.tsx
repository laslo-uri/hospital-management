import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { PreferencesProvider } from "@/i18n/preferences";
import { getLocale } from "@/i18n/server";
import { ensureAppReady } from "@/server/auth";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700"],
});

const body = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Hospital Management Suite",
  description:
    "Four-role hospital desk: manager, secretary, doctor, and patient.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  ensureAppReady();
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body className={`${display.variable} ${body.variable} antialiased`}>
        <PreferencesProvider locale={locale}>{children}</PreferencesProvider>
      </body>
    </html>
  );
}
