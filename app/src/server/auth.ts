import { randomBytes } from "node:crypto";
import { compareSync } from "bcryptjs";
import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { ensureSchema, getDb } from "@/db/client";
import { seedDatabase } from "@/db/seed";
import { meta, sessions, users } from "@/db/schema";
import { SEED_CLOCK, type PublicUser, type Role } from "@/domain/types";

const SESSION_COOKIE = "hospital_session";
const SESSION_DAYS = 7;

function toPublicUser(row: typeof users.$inferSelect): PublicUser {
  return {
    username: row.username,
    firstName: row.firstName,
    lastName: row.lastName,
    dateOfBirth: row.dateOfBirth,
    gender: row.gender as PublicUser["gender"],
    role: row.role as Role,
    specialty: row.specialty,
    phone: row.phone,
    email: row.email,
    suspendedUntil: row.suspendedUntil,
    spamStrikes: row.spamStrikes,
  };
}

export function ensureAppReady() {
  ensureSchema();
  seedDatabase();
}

export function homeForRole(role: Role | string) {
  switch (role) {
    case "MANAGER":
      return "/manager";
    case "SECRETARY":
      return "/secretary";
    case "DOCTOR":
      return "/doctor";
    case "PATIENT":
      return "/patient";
    default:
      return "/login";
  }
}

export function getSeedClock(): Date {
  ensureAppReady();
  const row = getDb()
    .select()
    .from(meta)
    .where(eq(meta.key, "seedClock"))
    .get();
  return new Date(row?.value ?? SEED_CLOCK);
}

export async function createSession(username: string) {
  ensureAppReady();
  const db = getDb();
  const id = randomBytes(24).toString("hex");
  const expires = new Date();
  expires.setDate(expires.getDate() + SESSION_DAYS);
  db.insert(sessions)
    .values({
      id,
      username,
      expiresAt: expires.toISOString(),
    })
    .run();
  const jar = await cookies();
  jar.set(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function destroySession() {
  ensureAppReady();
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (id) {
    getDb().delete(sessions).where(eq(sessions.id, id)).run();
  }
  jar.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  ensureAppReady();
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (!id) return null;
  const db = getDb();
  const now = new Date().toISOString();
  const row = db
    .select({
      user: users,
      sessionId: sessions.id,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.username, users.username))
    .where(and(eq(sessions.id, id), gt(sessions.expiresAt, now)))
    .get();
  if (!row) {
    jar.delete(SESSION_COOKIE);
    return null;
  }
  if (row.user.deleted) {
    db.delete(sessions).where(eq(sessions.id, id)).run();
    jar.delete(SESSION_COOKIE);
    return null;
  }
  if (
    row.user.suspendedUntil &&
    new Date(row.user.suspendedUntil).getTime() > Date.now()
  ) {
    return null;
  }
  return toPublicUser(row.user);
}

export async function requireUser(roles?: Role[]) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("You must be signed in.");
  }
  if (roles && !roles.includes(user.role)) {
    throw new Error("You do not have permission for this action.");
  }
  return user;
}

export function authenticate(username: string, password: string) {
  ensureAppReady();
  const row = getDb()
    .select()
    .from(users)
    .where(eq(users.username, username))
    .get();
  if (!row || row.deleted) return null;
  if (
    row.suspendedUntil &&
    new Date(row.suspendedUntil).getTime() > Date.now()
  ) {
    return null;
  }
  if (!compareSync(password, row.passwordHash)) return null;
  return toPublicUser(row);
}
