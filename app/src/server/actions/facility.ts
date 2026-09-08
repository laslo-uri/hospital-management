"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  equipmentTransfers,
  inventoryItems,
  roomJobs,
  rooms,
} from "@/db/schema";
import type { ActionResult } from "@/server/actions/auth";
import { requireUser } from "@/server/auth";
import { applyDueJobs } from "@/server/jobs";

export async function createRoom(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireUser(["MANAGER"]);
    const parsed = z
      .object({
        code: z.string().trim().min(1),
        name: z.string().trim().min(1),
        type: z.enum(["ORDINARY", "OR", "EXAM", "WARD", "WAREHOUSE"]),
        floor: z.coerce.number().int(),
        areaSqm: z.coerce.number().int().positive(),
      })
      .safeParse({
        code: formData.get("code"),
        name: formData.get("name"),
        type: formData.get("type"),
        floor: formData.get("floor"),
        areaSqm: formData.get("areaSqm"),
      });
    if (!parsed.success) return { ok: false, error: "Check room fields." };
    getDb()
      .insert(rooms)
      .values({ ...parsed.data, status: "ACTIVE" })
      .run();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not create room.",
    };
  }
}

export async function updateRoom(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireUser(["MANAGER"]);
    const id = Number(formData.get("id"));
    const name = String(formData.get("name") ?? "").trim();
    const status = String(formData.get("status") ?? "");
    if (!Number.isFinite(id) || !name) {
      return { ok: false, error: "Room id and name required." };
    }
    getDb()
      .update(rooms)
      .set({
        name,
        ...(status
          ? {
              status: status as
                | "ACTIVE"
                | "RENOVATION"
                | "MERGED"
                | "SPLIT",
            }
          : {}),
      })
      .where(eq(rooms.id, id))
      .run();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Update failed.",
    };
  }
}

export async function addInventory(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireUser(["MANAGER"]);
    const roomId = Number(formData.get("roomId"));
    const name = String(formData.get("name") ?? "").trim();
    const kind = String(formData.get("kind") ?? "DYNAMIC");
    const quantity = Number(formData.get("quantity") ?? 1);
    if (!Number.isFinite(roomId) || !name || !Number.isFinite(quantity)) {
      return { ok: false, error: "Check inventory fields." };
    }
    getDb()
      .insert(inventoryItems)
      .values({
        roomId,
        name,
        kind: kind === "STATIC" ? "STATIC" : "DYNAMIC",
        quantity,
      })
      .run();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Inventory add failed.",
    };
  }
}

export async function scheduleTransfer(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await requireUser(["MANAGER"]);
    const fromRoomId = Number(formData.get("fromRoomId"));
    const toRoomId = Number(formData.get("toRoomId"));
    const itemName = String(formData.get("itemName") ?? "").trim();
    const quantity = Number(formData.get("quantity") ?? 1);
    const applyAt = String(formData.get("applyAt") ?? "");
    if (
      !Number.isFinite(fromRoomId) ||
      !Number.isFinite(toRoomId) ||
      !itemName ||
      !applyAt
    ) {
      return { ok: false, error: "Check transfer fields." };
    }
    getDb()
      .insert(equipmentTransfers)
      .values({
        fromRoomId,
        toRoomId,
        itemName,
        quantity,
        applyAt: new Date(applyAt).toISOString(),
        applied: false,
        createdBy: user.username,
      })
      .run();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Transfer schedule failed.",
    };
  }
}

export async function scheduleRoomJob(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await requireUser(["MANAGER"]);
    const roomId = Number(formData.get("roomId"));
    const jobType = String(formData.get("jobType") ?? "");
    const details = String(formData.get("details") ?? "");
    const applyAt = String(formData.get("applyAt") ?? "");
    if (
      !Number.isFinite(roomId) ||
      !["RENOVATION", "SPLIT", "MERGE"].includes(jobType) ||
      !applyAt
    ) {
      return { ok: false, error: "Check room job fields." };
    }
    getDb()
      .insert(roomJobs)
      .values({
        roomId,
        jobType,
        details,
        applyAt: new Date(applyAt).toISOString(),
        applied: false,
        createdBy: user.username,
      })
      .run();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Job schedule failed.",
    };
  }
}

export async function applyDueJobsAction(
  prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  void prev;
  void formData;
  try {
    await requireUser(["MANAGER"]);
    applyDueJobs(new Date().toISOString());
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Apply failed.",
    };
  }
}
