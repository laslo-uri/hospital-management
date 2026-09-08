import Link from "next/link";
import type { PublicUser, Role } from "@/domain/types";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui";
import { translate, type MessageKey } from "@/i18n/messages";
import { getLocale } from "@/i18n/server";
import { fullName } from "@/lib/utils";
import { logoutAction } from "@/server/actions/auth";

const NAV: Record<
  Role,
  { href: string; labelKey: MessageKey }[]
> = {
  MANAGER: [{ href: "/manager", labelKey: "navFacility" }],
  SECRETARY: [{ href: "/secretary", labelKey: "navScheduling" }],
  DOCTOR: [{ href: "/doctor", labelKey: "navClinic" }],
  PATIENT: [{ href: "/patient", labelKey: "navMyCare" }],
};

const ROLE_KEY: Record<Role, MessageKey> = {
  MANAGER: "roleManager",
  SECRETARY: "roleSecretary",
  DOCTOR: "roleDoctor",
  PATIENT: "rolePatient",
};

export async function DeskShell({
  user,
  children,
}: {
  user: PublicUser;
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const tr = (key: MessageKey) => translate(locale, key);

  const links = NAV[user.role].map((link) => ({
    href: link.href,
    label: tr(link.labelKey),
  }));

  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="border-b border-line bg-ink text-paper md:border-b-0 md:border-r md:border-line/20">
        <div className="px-5 py-6">
          <p className="font-display text-2xl font-semibold tracking-tight">
            {tr("brandName")}
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-paper/70">
            {tr("brandTaglineShort")}
          </p>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-3 pb-4 md:flex-col md:gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-semibold text-paper/90 hover:bg-white/10"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-white/10 px-5 py-4">
          <p className="text-sm font-semibold">
            {fullName(user.firstName, user.lastName)}
          </p>
          <p className="text-xs text-paper/70">
            {tr(ROLE_KEY[user.role])}
            {user.specialty ? ` · ${user.specialty}` : ""}
          </p>
          <div className="mt-3">
            <LanguageSwitcher variant="dark" />
          </div>
          <form action={logoutAction} className="mt-3">
            <Button
              type="submit"
              variant="secondary"
              className="w-full border-white/20 bg-white/10 text-paper hover:bg-white/20"
            >
              {tr("logOut")}
            </Button>
          </form>
        </div>
      </aside>
      <div className="px-4 py-6 sm:px-6 md:px-8 md:py-8">{children}</div>
    </div>
  );
}
