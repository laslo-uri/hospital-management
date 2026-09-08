import { redirect } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button, Table } from "@/components/ui";
import { translate, type MessageKey } from "@/i18n/messages";
import { getLocale } from "@/i18n/server";
import { loginAction } from "@/server/actions/auth";
import { getCurrentUser, homeForRole } from "@/server/auth";

const DEMOS: {
  username: string;
  password: string;
  roleKey: MessageKey;
}[] = [
  { username: "manager", password: "m", roleKey: "roleManager" },
  { username: "secretary", password: "s", roleKey: "roleSecretary" },
  { username: "doctor", password: "d", roleKey: "roleDoctor" },
  { username: "doctor2", password: "d", roleKey: "roleDoctor" },
  { username: "patient", password: "p", roleKey: "rolePatient" },
  { username: "patient2", password: "p", roleKey: "rolePatient" },
];

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(homeForRole(user.role));

  const locale = await getLocale();
  const tr = (key: MessageKey) => translate(locale, key);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(15,110,122,0.22),_transparent_55%),linear-gradient(135deg,#0f172a_0%,#0f6e7a_48%,#334155_100%)]"
      />
      <div className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 py-12 lg:grid-cols-2 lg:gap-16">
        <div className="text-paper">
          <p className="font-display text-5xl font-semibold tracking-tight sm:text-6xl md:text-7xl">
            {tr("brandName")}
          </p>
          <p className="mt-2 text-sm font-semibold uppercase tracking-[0.22em] text-paper/70">
            {tr("brandTagline")}
          </p>
          <h1 className="mt-8 max-w-md font-display text-3xl font-semibold leading-tight sm:text-4xl">
            {tr("loginHeroTitle")}
          </h1>
          <p className="mt-4 max-w-md text-base text-paper/80">
            {tr("loginHeroBody")}
          </p>
        </div>

        <div className="rounded-2xl border border-white/20 bg-card/95 p-6 shadow-xl backdrop-blur sm:p-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-semibold text-ink">
                {tr("signIn")}
              </h2>
              <p className="mt-1 text-sm text-muted">{tr("loginHint")}</p>
            </div>
            <LanguageSwitcher variant="light" />
          </div>
          <ActionForm action={loginAction} className="mt-6 space-y-4">
            <label className="block text-sm font-semibold" htmlFor="username">
              <span className="mb-1.5 block text-muted">{tr("username")}</span>
              <input
                id="username"
                name="username"
                required
                className="w-full rounded-md border border-line bg-field px-3 py-2.5"
              />
            </label>
            <label className="block text-sm font-semibold" htmlFor="password">
              <span className="mb-1.5 block text-muted">{tr("password")}</span>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full rounded-md border border-line bg-field px-3 py-2.5"
              />
            </label>
            <Button type="submit" className="w-full py-2.5">
              {tr("signIn")}
            </Button>
          </ActionForm>

          <div className="mt-8">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              {tr("demoAccounts")}
            </p>
            <Table headers={[tr("username"), tr("password"), tr("role")]}>
              {DEMOS.map((row) => (
                <tr key={row.username}>
                  <td className="px-3 py-2 font-mono text-xs">{row.username}</td>
                  <td className="px-3 py-2 font-mono text-xs">{row.password}</td>
                  <td className="px-3 py-2 text-xs">{tr(row.roleKey)}</td>
                </tr>
              ))}
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
