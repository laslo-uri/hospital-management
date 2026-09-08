"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  authenticate,
  createSession,
  destroySession,
  homeForRole,
} from "@/server/auth";

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function loginAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Enter a username and password." };
  }
  const user = authenticate(parsed.data.username, parsed.data.password);
  if (!user) {
    return {
      ok: false,
      error: "Invalid credentials or account suspended.",
    };
  }
  await createSession(user.username);
  redirect(homeForRole(user.role));
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
