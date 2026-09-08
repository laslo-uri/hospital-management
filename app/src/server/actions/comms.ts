"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  announcements,
  feedback,
  notifications,
  reminders,
  surveys,
} from "@/db/schema";
import type { ActionResult } from "@/server/actions/auth";
import { requireUser } from "@/server/auth";

export async function createAnnouncement(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await requireUser(["SECRETARY", "MANAGER"]);
    const title = String(formData.get("title") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();
    if (!title || !body) return { ok: false, error: "Title and body required." };
    getDb()
      .insert(announcements)
      .values({
        title,
        body,
        authorUsername: user.username,
      })
      .run();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Announcement failed.",
    };
  }
}

export async function markNotificationRead(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const id = Number(formData.get("id"));
    const row = getDb()
      .select()
      .from(notifications)
      .where(eq(notifications.id, id))
      .get();
    if (!row || row.username !== user.username) {
      return { ok: false, error: "Notification not found." };
    }
    getDb()
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id))
      .run();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not mark read.",
    };
  }
}

export async function createReminder(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await requireUser(["PATIENT", "DOCTOR"]);
    const patientUsername =
      user.role === "PATIENT"
        ? user.username
        : String(formData.get("patientUsername") ?? "");
    const medicineName = String(formData.get("medicineName") ?? "").trim();
    const remindAt = String(formData.get("remindAt") ?? "");
    const note = String(formData.get("note") ?? "");
    if (!patientUsername || !medicineName || !remindAt) {
      return { ok: false, error: "Check reminder fields." };
    }
    getDb()
      .insert(reminders)
      .values({
        patientUsername,
        medicineName,
        remindAt: new Date(remindAt).toISOString(),
        note,
      })
      .run();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Reminder failed.",
    };
  }
}

export async function submitSurvey(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await requireUser(["PATIENT"]);
    const parsed = z
      .object({
        targetType: z.enum(["HOSPITAL", "DOCTOR"]),
        targetId: z.string().trim().min(1),
        rating: z.coerce.number().int().min(1).max(5),
        comment: z.string().optional().default(""),
      })
      .safeParse({
        targetType: formData.get("targetType"),
        targetId: formData.get("targetId"),
        rating: formData.get("rating"),
        comment: formData.get("comment") ?? "",
      });
    if (!parsed.success) return { ok: false, error: "Check survey fields." };
    getDb()
      .insert(surveys)
      .values({
        username: user.username,
        ...parsed.data,
      })
      .run();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Survey failed.",
    };
  }
}

export async function submitFeedback(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await requireUser(["PATIENT"]);
    const message = String(formData.get("message") ?? "").trim();
    const rating = Number(formData.get("rating") ?? 0);
    if (!message || !Number.isFinite(rating)) {
      return { ok: false, error: "Message and rating required." };
    }
    getDb()
      .insert(feedback)
      .values({
        username: user.username,
        message,
        rating,
      })
      .run();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Feedback failed.",
    };
  }
}
