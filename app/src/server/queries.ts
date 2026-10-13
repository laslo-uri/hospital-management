import { and, asc, desc, eq, gte, lt, ne } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  allergens,
  announcements,
  appointments,
  equipmentTransfers,
  hospitalizations,
  inventoryItems,
  medicalRecords,
  medicines,
  notifications,
  prescriptions,
  referrals,
  reminders,
  roomJobs,
  rooms,
  therapies,
  users,
  vacations,
} from "@/db/schema";
import { dayBounds } from "@/lib/utils";
import { ensureAppReady, getSeedClock } from "@/server/auth";
import { applyDueJobs } from "@/server/jobs";

export function listDoctors() {
  ensureAppReady();
  return getDb()
    .select()
    .from(users)
    .where(and(eq(users.role, "DOCTOR"), eq(users.deleted, false)))
    .all();
}

export function listPatients() {
  ensureAppReady();
  return getDb()
    .select()
    .from(users)
    .where(and(eq(users.role, "PATIENT"), eq(users.deleted, false)))
    .all();
}

export function listRooms() {
  ensureAppReady();
  applyDueJobs();
  return getDb().select().from(rooms).orderBy(asc(rooms.code)).all();
}

export function listInventory() {
  ensureAppReady();
  applyDueJobs();
  return getDb()
    .select({
      id: inventoryItems.id,
      roomId: inventoryItems.roomId,
      name: inventoryItems.name,
      kind: inventoryItems.kind,
      quantity: inventoryItems.quantity,
      roomCode: rooms.code,
    })
    .from(inventoryItems)
    .innerJoin(rooms, eq(inventoryItems.roomId, rooms.id))
    .all();
}

export function listPendingTransfers() {
  ensureAppReady();
  applyDueJobs();
  return getDb()
    .select()
    .from(equipmentTransfers)
    .where(eq(equipmentTransfers.applied, false))
    .all();
}

export function listPendingRoomJobs() {
  ensureAppReady();
  applyDueJobs();
  return getDb()
    .select()
    .from(roomJobs)
    .where(eq(roomJobs.applied, false))
    .all();
}

export function listMedicines() {
  ensureAppReady();
  return getDb().select().from(medicines).orderBy(asc(medicines.name)).all();
}

export function listPendingMedicines() {
  ensureAppReady();
  return getDb()
    .select()
    .from(medicines)
    .where(eq(medicines.status, "PENDING_REVIEW"))
    .all();
}

export function listApprovedMedicines() {
  ensureAppReady();
  return getDb()
    .select()
    .from(medicines)
    .where(eq(medicines.status, "APPROVED"))
    .all();
}

export function listAppointmentsForUser(username: string, role: string) {
  ensureAppReady();
  const db = getDb();
  if (role === "DOCTOR") {
    return db
      .select()
      .from(appointments)
      .where(eq(appointments.doctorUsername, username))
      .orderBy(asc(appointments.startsAt))
      .all();
  }
  if (role === "PATIENT") {
    return db
      .select()
      .from(appointments)
      .where(eq(appointments.patientUsername, username))
      .orderBy(asc(appointments.startsAt))
      .all();
  }
  return db
    .select()
    .from(appointments)
    .orderBy(asc(appointments.startsAt))
    .all();
}

export function listAppointmentsForDay(day: Date, doctorUsername?: string) {
  ensureAppReady();
  const { start, end } = dayBounds(day);
  const rows = getDb()
    .select()
    .from(appointments)
    .where(
      and(
        gte(appointments.startsAt, start),
        lt(appointments.startsAt, end),
        ne(appointments.status, "CANCELLED"),
      ),
    )
    .orderBy(asc(appointments.startsAt))
    .all();
  if (doctorUsername) {
    return rows.filter((r) => r.doctorUsername === doctorUsername);
  }
  return rows;
}

export function listAnnouncements() {
  ensureAppReady();
  return getDb()
    .select()
    .from(announcements)
    .orderBy(desc(announcements.createdAt))
    .all();
}

export function listNotifications(username: string) {
  ensureAppReady();
  return getDb()
    .select()
    .from(notifications)
    .where(eq(notifications.username, username))
    .orderBy(desc(notifications.createdAt))
    .all();
}

export function listReminders(patientUsername: string) {
  ensureAppReady();
  return getDb()
    .select()
    .from(reminders)
    .where(eq(reminders.patientUsername, patientUsername))
    .orderBy(asc(reminders.remindAt))
    .all();
}

export function getPatientRecord(patientUsername: string) {
  ensureAppReady();
  const record = getDb()
    .select()
    .from(medicalRecords)
    .where(eq(medicalRecords.patientUsername, patientUsername))
    .get();
  const allergenRows = getDb()
    .select()
    .from(allergens)
    .where(eq(allergens.patientUsername, patientUsername))
    .all();
  const therapyRows = getDb()
    .select()
    .from(therapies)
    .where(eq(therapies.patientUsername, patientUsername))
    .all();
  return { record, allergens: allergenRows, therapies: therapyRows };
}

export function listPrescriptionsForDoctor(doctorUsername: string) {
  ensureAppReady();
  return getDb()
    .select({
      id: prescriptions.id,
      patientUsername: prescriptions.patientUsername,
      dosage: prescriptions.dosage,
      createdAt: prescriptions.createdAt,
      medicineName: medicines.name,
    })
    .from(prescriptions)
    .innerJoin(medicines, eq(prescriptions.medicineId, medicines.id))
    .where(eq(prescriptions.doctorUsername, doctorUsername))
    .orderBy(desc(prescriptions.createdAt))
    .all();
}

export function listVacations() {
  ensureAppReady();
  return getDb()
    .select()
    .from(vacations)
    .orderBy(asc(vacations.startsAt))
    .all();
}

export function listHospitalizations(activeOnly = false) {
  ensureAppReady();
  const db = getDb();
  const rows = db
    .select({
      id: hospitalizations.id,
      patientUsername: hospitalizations.patientUsername,
      roomId: hospitalizations.roomId,
      roomCode: rooms.code,
      reason: hospitalizations.reason,
      admittedAt: hospitalizations.admittedAt,
      dischargedAt: hospitalizations.dischargedAt,
    })
    .from(hospitalizations)
    .innerJoin(rooms, eq(hospitalizations.roomId, rooms.id))
    .orderBy(desc(hospitalizations.admittedAt))
    .all();
  if (activeOnly) return rows.filter((r) => !r.dischargedAt);
  return rows;
}

export function listReferrals(forDoctor?: string) {
  ensureAppReady();
  const rows = getDb()
    .select()
    .from(referrals)
    .orderBy(desc(referrals.createdAt))
    .all();
  if (!forDoctor) return rows;
  return rows.filter(
    (r) => r.fromDoctor === forDoctor || r.toDoctor === forDoctor,
  );
}

export function listWardRooms() {
  ensureAppReady();
  return getDb()
    .select()
    .from(rooms)
    .where(eq(rooms.type, "WARD"))
    .orderBy(asc(rooms.code))
    .all();
}

export function demoDay() {
  return getSeedClock();
}
