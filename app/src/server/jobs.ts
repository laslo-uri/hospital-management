import { and, eq, lte } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  equipmentTransfers,
  inventoryItems,
  roomJobs,
  rooms,
} from "@/db/schema";
import { ensureAppReady, getSeedClock } from "@/server/auth";

/** Apply due equipment transfers and room jobs. Not a Server Action. */
export function applyDueJobs(nowIso = getSeedClock().toISOString()) {
  ensureAppReady();
  const db = getDb();
  const dueTransfers = db
    .select()
    .from(equipmentTransfers)
    .where(
      and(
        eq(equipmentTransfers.applied, false),
        lte(equipmentTransfers.applyAt, nowIso),
      ),
    )
    .all();

  for (const transfer of dueTransfers) {
    const source = db
      .select()
      .from(inventoryItems)
      .where(
        and(
          eq(inventoryItems.roomId, transfer.fromRoomId),
          eq(inventoryItems.name, transfer.itemName),
        ),
      )
      .get();
    if (source && source.quantity >= transfer.quantity) {
      const remaining = source.quantity - transfer.quantity;
      if (remaining <= 0) {
        db.delete(inventoryItems).where(eq(inventoryItems.id, source.id)).run();
      } else {
        db.update(inventoryItems)
          .set({ quantity: remaining })
          .where(eq(inventoryItems.id, source.id))
          .run();
      }
      const dest = db
        .select()
        .from(inventoryItems)
        .where(
          and(
            eq(inventoryItems.roomId, transfer.toRoomId),
            eq(inventoryItems.name, transfer.itemName),
          ),
        )
        .get();
      if (dest) {
        db.update(inventoryItems)
          .set({ quantity: dest.quantity + transfer.quantity })
          .where(eq(inventoryItems.id, dest.id))
          .run();
      } else {
        db.insert(inventoryItems)
          .values({
            roomId: transfer.toRoomId,
            name: transfer.itemName,
            kind: source.kind,
            quantity: transfer.quantity,
          })
          .run();
      }
      db.update(equipmentTransfers)
        .set({ applied: true })
        .where(eq(equipmentTransfers.id, transfer.id))
        .run();
    }
  }

  const dueJobs = db
    .select()
    .from(roomJobs)
    .where(and(eq(roomJobs.applied, false), lte(roomJobs.applyAt, nowIso)))
    .all();

  for (const job of dueJobs) {
    let status = "ACTIVE";
    if (job.jobType === "RENOVATION") status = "RENOVATION";
    if (job.jobType === "MERGE") status = "MERGED";
    if (job.jobType === "SPLIT") status = "SPLIT";
    db.update(rooms)
      .set({ status })
      .where(eq(rooms.id, job.roomId))
      .run();
    db.update(roomJobs)
      .set({ applied: true })
      .where(eq(roomJobs.id, job.id))
      .run();
  }

  return {
    transfers: dueTransfers.length,
    jobs: dueJobs.length,
  };
}
