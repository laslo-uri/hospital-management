import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const meta = sqliteTable("meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const users = sqliteTable("users", {
  username: text("username").primaryKey(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  gender: text("gender").notNull(),
  role: text("role").notNull(),
  specialty: text("specialty"),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  suspendedUntil: text("suspended_until"),
  spamStrikes: integer("spam_strikes").notNull().default(0),
  deleted: integer("deleted", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  username: text("username")
    .notNull()
    .references(() => users.username),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const rooms = sqliteTable("rooms", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  floor: integer("floor").notNull().default(1),
  areaSqm: integer("area_sqm").notNull().default(20),
  status: text("status").notNull().default("ACTIVE"),
});

export const inventoryItems = sqliteTable("inventory_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  roomId: integer("room_id")
    .notNull()
    .references(() => rooms.id),
  name: text("name").notNull(),
  kind: text("kind").notNull(),
  quantity: integer("quantity").notNull().default(1),
});

export const equipmentTransfers = sqliteTable("equipment_transfers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fromRoomId: integer("from_room_id")
    .notNull()
    .references(() => rooms.id),
  toRoomId: integer("to_room_id")
    .notNull()
    .references(() => rooms.id),
  itemName: text("item_name").notNull(),
  quantity: integer("quantity").notNull().default(1),
  applyAt: text("apply_at").notNull(),
  applied: integer("applied", { mode: "boolean" }).notNull().default(false),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.username),
});

export const roomJobs = sqliteTable("room_jobs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  roomId: integer("room_id")
    .notNull()
    .references(() => rooms.id),
  jobType: text("job_type").notNull(),
  details: text("details").notNull().default(""),
  applyAt: text("apply_at").notNull(),
  applied: integer("applied", { mode: "boolean" }).notNull().default(false),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.username),
});

export const appointments = sqliteTable("appointments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull(),
  status: text("status").notNull().default("SCHEDULED"),
  doctorUsername: text("doctor_username")
    .notNull()
    .references(() => users.username),
  patientUsername: text("patient_username")
    .notNull()
    .references(() => users.username),
  roomId: integer("room_id").references(() => rooms.id),
  startsAt: text("starts_at").notNull(),
  endsAt: text("ends_at").notNull(),
  notes: text("notes").notNull().default(""),
  anamnesis: text("anamnesis").notNull().default(""),
});

export const medicalRecords = sqliteTable("medical_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  patientUsername: text("patient_username")
    .notNull()
    .unique()
    .references(() => users.username),
  bloodType: text("blood_type").notNull().default(""),
  notes: text("notes").notNull().default(""),
});

export const allergens = sqliteTable("allergens", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  patientUsername: text("patient_username")
    .notNull()
    .references(() => users.username),
  name: text("name").notNull(),
});

export const therapies = sqliteTable("therapies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  patientUsername: text("patient_username")
    .notNull()
    .references(() => users.username),
  description: text("description").notNull(),
  startedAt: text("started_at").notNull(),
  endedAt: text("ended_at"),
});

export const hospitalizations = sqliteTable("hospitalizations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  patientUsername: text("patient_username")
    .notNull()
    .references(() => users.username),
  roomId: integer("room_id")
    .notNull()
    .references(() => rooms.id),
  reason: text("reason").notNull(),
  admittedAt: text("admitted_at").notNull(),
  dischargedAt: text("discharged_at"),
});

export const referrals = sqliteTable("referrals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  patientUsername: text("patient_username")
    .notNull()
    .references(() => users.username),
  fromDoctor: text("from_doctor")
    .notNull()
    .references(() => users.username),
  toDoctor: text("to_doctor")
    .notNull()
    .references(() => users.username),
  reason: text("reason").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const vacations = sqliteTable("vacations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  doctorUsername: text("doctor_username")
    .notNull()
    .references(() => users.username),
  startsAt: text("starts_at").notNull(),
  endsAt: text("ends_at").notNull(),
  status: text("status").notNull().default("SCHEDULED"),
  note: text("note").notNull().default(""),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.username),
});

export const medicines = sqliteTable("medicines", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  status: text("status").notNull().default("PENDING_REVIEW"),
});

export const medicineReviews = sqliteTable("medicine_reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  medicineId: integer("medicine_id")
    .notNull()
    .references(() => medicines.id),
  doctorUsername: text("doctor_username")
    .notNull()
    .references(() => users.username),
  decision: text("decision").notNull(),
  comment: text("comment").notNull().default(""),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const prescriptions = sqliteTable("prescriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  patientUsername: text("patient_username")
    .notNull()
    .references(() => users.username),
  doctorUsername: text("doctor_username")
    .notNull()
    .references(() => users.username),
  medicineId: integer("medicine_id")
    .notNull()
    .references(() => medicines.id),
  dosage: text("dosage").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const announcements = sqliteTable("announcements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  authorUsername: text("author_username")
    .notNull()
    .references(() => users.username),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username")
    .notNull()
    .references(() => users.username),
  title: text("title").notNull(),
  body: text("body").notNull(),
  read: integer("read", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const reminders = sqliteTable("reminders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  patientUsername: text("patient_username")
    .notNull()
    .references(() => users.username),
  medicineName: text("medicine_name").notNull(),
  remindAt: text("remind_at").notNull(),
  note: text("note").notNull().default(""),
});

export const surveys = sqliteTable("surveys", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username")
    .notNull()
    .references(() => users.username),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull().default(""),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const feedback = sqliteTable("feedback", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username")
    .notNull()
    .references(() => users.username),
  message: text("message").notNull(),
  rating: integer("rating").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});
