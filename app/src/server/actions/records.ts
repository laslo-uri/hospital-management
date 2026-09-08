"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  allergens,
  medicalRecords,
  medicineReviews,
  medicines,
  prescriptions,
  therapies,
} from "@/db/schema";
import type { ActionResult } from "@/server/actions/auth";
import { requireUser } from "@/server/auth";

export async function updateRecord(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireUser(["DOCTOR"]);
    const patientUsername = String(formData.get("patientUsername") ?? "");
    const bloodType = String(formData.get("bloodType") ?? "");
    const notes = String(formData.get("notes") ?? "");
    if (!patientUsername) return { ok: false, error: "Patient required." };
    const db = getDb();
    const existing = db
      .select()
      .from(medicalRecords)
      .where(eq(medicalRecords.patientUsername, patientUsername))
      .get();
    if (existing) {
      db.update(medicalRecords)
        .set({ bloodType, notes })
        .where(eq(medicalRecords.id, existing.id))
        .run();
    } else {
      db.insert(medicalRecords)
        .values({ patientUsername, bloodType, notes })
        .run();
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Update failed.",
    };
  }
}

export async function addAllergen(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireUser(["DOCTOR"]);
    const patientUsername = String(formData.get("patientUsername") ?? "");
    const name = String(formData.get("name") ?? "").trim();
    if (!patientUsername || !name) {
      return { ok: false, error: "Patient and allergen name required." };
    }
    getDb()
      .insert(allergens)
      .values({ patientUsername, name })
      .run();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not add allergen.",
    };
  }
}

export async function addTherapy(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireUser(["DOCTOR"]);
    const patientUsername = String(formData.get("patientUsername") ?? "");
    const description = String(formData.get("description") ?? "").trim();
    const startedAt = String(formData.get("startedAt") ?? new Date().toISOString());
    if (!patientUsername || !description) {
      return { ok: false, error: "Patient and description required." };
    }
    getDb()
      .insert(therapies)
      .values({
        patientUsername,
        description,
        startedAt,
        endedAt: null,
      })
      .run();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not add therapy.",
    };
  }
}

export async function createPrescription(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await requireUser(["DOCTOR"]);
    const patientUsername = String(formData.get("patientUsername") ?? "");
    const medicineId = Number(formData.get("medicineId"));
    const dosage = String(formData.get("dosage") ?? "").trim();
    if (!patientUsername || !Number.isFinite(medicineId) || !dosage) {
      return { ok: false, error: "Check prescription fields." };
    }
    const med = getDb()
      .select()
      .from(medicines)
      .where(eq(medicines.id, medicineId))
      .get();
    if (!med || med.status !== "APPROVED") {
      return { ok: false, error: "Medicine must be approved." };
    }
    getDb()
      .insert(prescriptions)
      .values({
        patientUsername,
        doctorUsername: user.username,
        medicineId,
        dosage,
      })
      .run();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Prescription failed.",
    };
  }
}

export async function reviewMedicine(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await requireUser(["DOCTOR"]);
    const medicineId = Number(formData.get("medicineId"));
    const decision = String(formData.get("decision") ?? "");
    const comment = String(formData.get("comment") ?? "");
    if (!Number.isFinite(medicineId) || !["APPROVE", "REJECT"].includes(decision)) {
      return { ok: false, error: "Invalid review." };
    }
    const db = getDb();
    db.insert(medicineReviews)
      .values({
        medicineId,
        doctorUsername: user.username,
        decision,
        comment,
      })
      .run();
    db.update(medicines)
      .set({
        status: decision === "APPROVE" ? "APPROVED" : "REJECTED",
      })
      .where(eq(medicines.id, medicineId))
      .run();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Review failed.",
    };
  }
}

export async function proposeMedicine(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireUser(["DOCTOR", "MANAGER"]);
    const parsed = z
      .object({
        code: z.string().trim().min(1),
        name: z.string().trim().min(1),
      })
      .safeParse({
        code: formData.get("code"),
        name: formData.get("name"),
      });
    if (!parsed.success) {
      return { ok: false, error: "Code and name required." };
    }
    getDb()
      .insert(medicines)
      .values({
        code: parsed.data.code,
        name: parsed.data.name,
        status: "PENDING_REVIEW",
      })
      .run();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not propose medicine.",
    };
  }
}
