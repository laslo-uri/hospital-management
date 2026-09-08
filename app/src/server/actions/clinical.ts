"use server";

import { hashSync } from "bcryptjs";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  hospitalizations,
  medicalRecords,
  notifications,
  referrals,
  users,
  vacations,
} from "@/db/schema";
import type { ActionResult } from "@/server/actions/auth";
import { requireUser } from "@/server/auth";

function toIso(local: string): string | null {
  const trimmed = local.trim();
  if (!trimmed) return null;
  const d = new Date(trimmed.includes("T") ? trimmed : trimmed.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export async function registerPatient(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireUser(["SECRETARY"]);
    const parsed = z
      .object({
        username: z.string().trim().min(2).max(32),
        password: z.string().min(1),
        firstName: z.string().trim().min(1),
        lastName: z.string().trim().min(1),
        email: z.string().trim().optional(),
        phone: z.string().trim().optional(),
      })
      .safeParse({
        username: formData.get("username"),
        password: formData.get("password"),
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        email: formData.get("email") ?? "",
        phone: formData.get("phone") ?? "",
      });
    if (!parsed.success) {
      return { ok: false, error: "Check registration fields." };
    }
    const emailRaw = parsed.data.email ?? "";
    if (emailRaw && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
      return { ok: false, error: "Invalid email." };
    }
    const db = getDb();
    const existing = db
      .select()
      .from(users)
      .where(eq(users.username, parsed.data.username))
      .get();
    if (existing) return { ok: false, error: "Username already taken." };
    db.insert(users)
      .values({
        username: parsed.data.username,
        passwordHash: hashSync(parsed.data.password, 10),
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        dateOfBirth: "2000-01-01",
        gender: "MALE",
        role: "PATIENT",
        specialty: null,
        phone: parsed.data.phone ?? "",
        email: emailRaw || `${parsed.data.username}@hospital.demo`,
        suspendedUntil: null,
        spamStrikes: 0,
        deleted: false,
      })
      .run();
    db.insert(medicalRecords)
      .values({
        patientUsername: parsed.data.username,
        bloodType: "",
        notes: "New patient record.",
      })
      .run();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Registration failed.",
    };
  }
}

export async function scheduleVacation(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await requireUser(["SECRETARY", "MANAGER"]);
    const doctorUsername = String(formData.get("doctorUsername") ?? "");
    const startsAt = toIso(String(formData.get("startsAt") ?? ""));
    const endsAt = toIso(String(formData.get("endsAt") ?? ""));
    const note = String(formData.get("note") ?? "").trim();
    if (!doctorUsername || !startsAt || !endsAt) {
      return { ok: false, error: "Doctor and dates required." };
    }
    if (endsAt <= startsAt) {
      return { ok: false, error: "End must be after start." };
    }
    const doctor = getDb()
      .select()
      .from(users)
      .where(and(eq(users.username, doctorUsername), eq(users.role, "DOCTOR")))
      .get();
    if (!doctor) return { ok: false, error: "Doctor not found." };
    getDb()
      .insert(vacations)
      .values({
        doctorUsername,
        startsAt,
        endsAt,
        status: "SCHEDULED",
        note,
        createdBy: user.username,
      })
      .run();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not schedule vacation.",
    };
  }
}

export async function cancelVacation(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireUser(["SECRETARY", "MANAGER"]);
    const id = Number(formData.get("id"));
    if (!Number.isFinite(id)) return { ok: false, error: "Invalid vacation." };
    getDb()
      .update(vacations)
      .set({ status: "CANCELLED" })
      .where(eq(vacations.id, id))
      .run();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not cancel vacation.",
    };
  }
}

export async function admitPatient(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireUser(["DOCTOR", "SECRETARY"]);
    const patientUsername = String(formData.get("patientUsername") ?? "");
    const roomId = Number(formData.get("roomId"));
    const reason = String(formData.get("reason") ?? "").trim();
    const admittedAt =
      toIso(String(formData.get("admittedAt") ?? "")) ?? new Date().toISOString();
    if (!patientUsername || !Number.isFinite(roomId) || !reason) {
      return { ok: false, error: "Patient, room, and reason required." };
    }
    const open = getDb()
      .select()
      .from(hospitalizations)
      .where(
        and(
          eq(hospitalizations.patientUsername, patientUsername),
          isNull(hospitalizations.dischargedAt),
        ),
      )
      .get();
    if (open) return { ok: false, error: "Patient already hospitalized." };
    getDb()
      .insert(hospitalizations)
      .values({
        patientUsername,
        roomId,
        reason,
        admittedAt,
        dischargedAt: null,
      })
      .run();
    getDb()
      .insert(notifications)
      .values({
        username: patientUsername,
        title: "Hospital admission",
        body: `Admitted: ${reason}`,
        read: false,
      })
      .run();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Admission failed.",
    };
  }
}

export async function dischargePatient(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireUser(["DOCTOR", "SECRETARY"]);
    const id = Number(formData.get("id"));
    if (!Number.isFinite(id)) return { ok: false, error: "Invalid stay." };
    const row = getDb()
      .select()
      .from(hospitalizations)
      .where(eq(hospitalizations.id, id))
      .get();
    if (!row) return { ok: false, error: "Stay not found." };
    if (row.dischargedAt) return { ok: false, error: "Already discharged." };
    getDb()
      .update(hospitalizations)
      .set({ dischargedAt: new Date().toISOString() })
      .where(eq(hospitalizations.id, id))
      .run();
    getDb()
      .insert(notifications)
      .values({
        username: row.patientUsername,
        title: "Discharged",
        body: "Your hospital stay was closed.",
        read: false,
      })
      .run();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Discharge failed.",
    };
  }
}

export async function createReferral(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await requireUser(["DOCTOR"]);
    const patientUsername = String(formData.get("patientUsername") ?? "");
    const toDoctor = String(formData.get("toDoctor") ?? "");
    const reason = String(formData.get("reason") ?? "").trim();
    if (!patientUsername || !toDoctor || !reason) {
      return { ok: false, error: "Patient, target doctor, and reason required." };
    }
    if (toDoctor === user.username) {
      return { ok: false, error: "Refer to another doctor." };
    }
    getDb()
      .insert(referrals)
      .values({
        patientUsername,
        fromDoctor: user.username,
        toDoctor,
        reason,
      })
      .run();
    getDb()
      .insert(notifications)
      .values({
        username: toDoctor,
        title: "New referral",
        body: `${patientUsername}: ${reason}`,
        read: false,
      })
      .run();
    getDb()
      .insert(notifications)
      .values({
        username: patientUsername,
        title: "Referral created",
        body: `Referred to ${toDoctor}: ${reason}`,
        read: false,
      })
      .run();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Referral failed.",
    };
  }
}
