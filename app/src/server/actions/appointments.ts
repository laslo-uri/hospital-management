"use server";

import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { appointments, users } from "@/db/schema";
import {
  MAX_CHANGES_PER_DAY,
  nextSuspensionEnd,
  shouldSuspend,
} from "@/domain/anti-spam";
import { assertNoConflict } from "@/domain/scheduling";
import type { ActionResult } from "@/server/actions/auth";
import { requireUser } from "@/server/auth";

const slotSchema = z.object({
  type: z.enum(["EXAM", "OPERATION", "EMERGENCY"]),
  doctorUsername: z.string().trim().min(1),
  patientUsername: z.string().trim().min(1),
  roomId: z.number().int().positive().optional().nullable(),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  notes: z.string().optional().default(""),
});

function toIso(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toISOString();
}

function conflictsForDoctor(
  doctorUsername: string,
  startsAt: string,
  endsAt: string,
  excludeId?: number,
) {
  const rows = getDb()
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.doctorUsername, doctorUsername),
        ne(appointments.status, "CANCELLED"),
      ),
    )
    .all()
    .filter((row) => (excludeId ? row.id !== excludeId : true))
    .map((row) => ({ startsAt: row.startsAt, endsAt: row.endsAt }));
  assertNoConflict(rows, { startsAt, endsAt });
}

function bumpPatientSpam(username: string): ActionResult | null {
  const db = getDb();
  const row = db.select().from(users).where(eq(users.username, username)).get();
  if (!row) return { ok: false, error: "Patient not found." };
  const strikes = row.spamStrikes + 1;
  const patch: {
    spamStrikes: number;
    suspendedUntil?: string;
  } = { spamStrikes: strikes };
  if (shouldSuspend(strikes)) {
    patch.suspendedUntil = nextSuspensionEnd(new Date().toISOString());
    patch.spamStrikes = 0;
  }
  db.update(users).set(patch).where(eq(users.username, username)).run();
  if (patch.suspendedUntil) {
    return {
      ok: false,
      error: `Too many changes (max ${MAX_CHANGES_PER_DAY}/day). Account suspended until ${patch.suspendedUntil}.`,
    };
  }
  return null;
}

export async function createAppointment(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireUser(["SECRETARY", "DOCTOR"]);
    const roomRaw = String(formData.get("roomId") ?? "").trim();
    const parsed = slotSchema.safeParse({
      type: formData.get("type"),
      doctorUsername: formData.get("doctorUsername"),
      patientUsername: formData.get("patientUsername"),
      roomId: roomRaw ? Number(roomRaw) : null,
      startsAt: toIso(String(formData.get("startsAt") ?? "")),
      endsAt: toIso(String(formData.get("endsAt") ?? "")),
      notes: formData.get("notes") ?? "",
    });
    if (!parsed.success) {
      return { ok: false, error: "Check appointment fields." };
    }
    conflictsForDoctor(
      parsed.data.doctorUsername,
      parsed.data.startsAt,
      parsed.data.endsAt,
    );
    getDb()
      .insert(appointments)
      .values({
        type: parsed.data.type,
        status: "SCHEDULED",
        doctorUsername: parsed.data.doctorUsername,
        patientUsername: parsed.data.patientUsername,
        roomId: parsed.data.roomId ?? null,
        startsAt: parsed.data.startsAt,
        endsAt: parsed.data.endsAt,
        notes: parsed.data.notes ?? "",
      })
      .run();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not create appointment.",
    };
  }
}

export async function cancelAppointment(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireUser(["SECRETARY", "DOCTOR"]);
    const id = Number(formData.get("id"));
    if (!Number.isFinite(id)) return { ok: false, error: "Missing appointment." };
    getDb()
      .update(appointments)
      .set({ status: "CANCELLED" })
      .where(eq(appointments.id, id))
      .run();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Cancel failed.",
    };
  }
}

export async function completeAppointment(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await requireUser(["DOCTOR"]);
    const id = Number(formData.get("id"));
    const anamnesis = String(formData.get("anamnesis") ?? "");
    if (!Number.isFinite(id)) return { ok: false, error: "Missing appointment." };
    const row = getDb()
      .select()
      .from(appointments)
      .where(eq(appointments.id, id))
      .get();
    if (!row || row.doctorUsername !== user.username) {
      return { ok: false, error: "Appointment not found." };
    }
    getDb()
      .update(appointments)
      .set({ status: "COMPLETED", anamnesis })
      .where(eq(appointments.id, id))
      .run();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Complete failed.",
    };
  }
}

export async function patientBook(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await requireUser(["PATIENT"]);
    const roomRaw = String(formData.get("roomId") ?? "").trim();
    const parsed = slotSchema
      .omit({ patientUsername: true })
      .safeParse({
        type: formData.get("type") ?? "EXAM",
        doctorUsername: formData.get("doctorUsername"),
        roomId: roomRaw ? Number(roomRaw) : null,
        startsAt: toIso(String(formData.get("startsAt") ?? "")),
        endsAt: toIso(String(formData.get("endsAt") ?? "")),
        notes: formData.get("notes") ?? "",
      });
    if (!parsed.success) {
      return { ok: false, error: "Check booking fields." };
    }
    conflictsForDoctor(
      parsed.data.doctorUsername,
      parsed.data.startsAt,
      parsed.data.endsAt,
    );
    const spam = bumpPatientSpam(user.username);
    if (spam) return spam;
    getDb()
      .insert(appointments)
      .values({
        type: parsed.data.type,
        status: "SCHEDULED",
        doctorUsername: parsed.data.doctorUsername,
        patientUsername: user.username,
        roomId: parsed.data.roomId ?? null,
        startsAt: parsed.data.startsAt,
        endsAt: parsed.data.endsAt,
        notes: parsed.data.notes ?? "",
      })
      .run();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Booking failed.",
    };
  }
}

export async function patientCancel(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await requireUser(["PATIENT"]);
    const id = Number(formData.get("id"));
    const row = getDb()
      .select()
      .from(appointments)
      .where(eq(appointments.id, id))
      .get();
    if (!row || row.patientUsername !== user.username) {
      return { ok: false, error: "Appointment not found." };
    }
    const spam = bumpPatientSpam(user.username);
    if (spam) return spam;
    getDb()
      .update(appointments)
      .set({ status: "CANCELLED" })
      .where(eq(appointments.id, id))
      .run();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Cancel failed.",
    };
  }
}

export async function patientReschedule(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await requireUser(["PATIENT"]);
    const id = Number(formData.get("id"));
    const startsAt = toIso(String(formData.get("startsAt") ?? ""));
    const endsAt = toIso(String(formData.get("endsAt") ?? ""));
    if (!startsAt || !endsAt || Number.isNaN(Date.parse(startsAt))) {
      return { ok: false, error: "Provide new start and end." };
    }
    const row = getDb()
      .select()
      .from(appointments)
      .where(eq(appointments.id, id))
      .get();
    if (!row || row.patientUsername !== user.username) {
      return { ok: false, error: "Appointment not found." };
    }
    conflictsForDoctor(row.doctorUsername, startsAt, endsAt, id);
    const spam = bumpPatientSpam(user.username);
    if (spam) return spam;
    getDb()
      .update(appointments)
      .set({
        startsAt,
        endsAt,
        status: "RESCHEDULED",
      })
      .where(eq(appointments.id, id))
      .run();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Reschedule failed.",
    };
  }
}
