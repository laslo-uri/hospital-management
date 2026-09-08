import fs from "node:fs";
import { hashSync } from "bcryptjs";
import { eq } from "drizzle-orm";
import { SCHEMA_VERSION, SEED_CLOCK } from "@/domain/types";
import { addHours } from "@/lib/utils";
import {
  ensureSchema,
  getDb,
  getDbPath,
  getSqlite,
  resetDbConnection,
} from "./client";
import {
  allergens,
  announcements,
  appointments,
  equipmentTransfers,
  feedback,
  hospitalizations,
  inventoryItems,
  medicalRecords,
  medicines,
  meta,
  notifications,
  prescriptions,
  referrals,
  reminders,
  roomJobs,
  rooms,
  surveys,
  users,
  vacations,
} from "./schema";

function hash(password: string) {
  return hashSync(password, 10);
}

const FIRST_NAMES = [
  "Marko",
  "Ivana",
  "Nikola",
  "Sara",
  "Stefan",
  "Milica",
  "Luka",
  "Teodora",
  "Petar",
  "Jovana",
  "Dusan",
  "Marija",
  "Aleksa",
  "Katarina",
  "Nemanja",
  "Sofija",
  "Vuk",
  "Anja",
  "Milos",
  "Tamara",
  "Bojan",
  "Elena",
  "Filip",
  "Nina",
  "Goran",
];

const LAST_NAMES = [
  "Jovanovic",
  "Nikolic",
  "Stojanovic",
  "Djordjevic",
  "Ilic",
  "Pavlovic",
  "Popovic",
  "Simic",
  "Lazic",
  "Tomic",
  "Ristic",
  "Milosevic",
  "Kostic",
  "Zivkovic",
  "Savic",
  "Vasic",
  "Petrov",
  "Matic",
  "Radovic",
  "Stankovic",
];

const SPECIALTIES = [
  "Internal medicine",
  "Cardiology",
  "Orthopedics",
  "Pediatrics",
  "Neurology",
  "Dermatology",
  "Radiology",
  "Surgery",
];

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const ALLERGEN_NAMES = [
  "Penicillin",
  "Pollen",
  "Latex",
  "Peanuts",
  "Aspirin",
  "Dust mites",
  "Shellfish",
  "Iodine contrast",
  "Sulfa drugs",
  "Eggs",
];

const STATIC_ITEMS = [
  "Exam table",
  "Operating table",
  "Hospital bed",
  "Surgical lamp",
  "X-ray machine",
  "Ultrasound unit",
  "Cabinet",
  "Desk",
  "Sink station",
  "Defibrillator mount",
];

const DYNAMIC_ITEMS = [
  "Stethoscope",
  "IV stand",
  "Gloves box",
  "Monitor cart",
  "Wheelchair",
  "Blood pressure cuff",
  "Thermometer pack",
  "Syringe pack",
  "Oxygen tank",
  "Crash cart",
  "Bandage kit",
  "Pulse oximeter",
];

const MEDICINE_DEFS: Array<{
  code: string;
  name: string;
  status: "APPROVED" | "PENDING_REVIEW" | "REJECTED";
}> = [
  { code: "AMOX-500", name: "Amoxicillin", status: "APPROVED" },
  { code: "IBU-400", name: "Ibuprofen", status: "APPROVED" },
  { code: "PARA-500", name: "Paracetamol", status: "APPROVED" },
  { code: "METF-850", name: "Metformin", status: "APPROVED" },
  { code: "ATOR-20", name: "Atorvastatin", status: "APPROVED" },
  { code: "OMEP-20", name: "Omeprazole", status: "APPROVED" },
  { code: "LORA-10", name: "Loratadine", status: "APPROVED" },
  { code: "AZITH-250", name: "Azithromycin", status: "APPROVED" },
  { code: "CIPRO-500", name: "Ciprofloxacin", status: "APPROVED" },
  { code: "PREDN-5", name: "Prednisone", status: "APPROVED" },
  { code: "WARF-5", name: "Warfarin", status: "APPROVED" },
  { code: "INSUL-NPH", name: "Insulin NPH", status: "APPROVED" },
  { code: "SALB-INH", name: "Salbutamol inhaler", status: "APPROVED" },
  { code: "FURO-40", name: "Furosemide", status: "APPROVED" },
  { code: "NEW-ABX", name: "NewAntibiotic", status: "PENDING_REVIEW" },
  { code: "TRIAL-CV", name: "CardiovascTrial", status: "PENDING_REVIEW" },
  { code: "NEURO-X1", name: "Neurolex Experimental", status: "PENDING_REVIEW" },
  { code: "PAIN-XR", name: "PainRelief XR", status: "PENDING_REVIEW" },
  { code: "IMMUNO-Z", name: "ImmunoBoost Z", status: "PENDING_REVIEW" },
  { code: "REJECT-A", name: "FlawedAnalgesic", status: "REJECTED" },
  { code: "REJECT-B", name: "UnsafeSedative", status: "REJECTED" },
  { code: "REJECT-C", name: "ContaminatedSerum", status: "REJECTED" },
  { code: "REJECT-D", name: "UnprovenAntiviral", status: "REJECTED" },
  { code: "REJECT-E", name: "ToxicCompound Y", status: "REJECTED" },
];

function pick<T>(list: T[], index: number): T {
  return list[index % list.length]!;
}

function patientUsername(i: number) {
  return i === 0 ? "patient" : i === 1 ? "patient2" : `patient${i + 1}`;
}

function doctorUsername(i: number) {
  if (i === 0) return "doctor";
  if (i === 1) return "doctor2";
  return `doctor${i + 1}`;
}

export function seedDatabase(options?: { force?: boolean }) {
  ensureSchema();
  const db = getDb();
  const existing = db
    .select()
    .from(meta)
    .where(eq(meta.key, "schemaVersion"))
    .get();
  if (
    existing &&
    existing.value === String(SCHEMA_VERSION) &&
    !options?.force
  ) {
    return { seeded: false as const };
  }

  const sqlite = getSqlite();
  sqlite.exec(`
    DELETE FROM feedback;
    DELETE FROM surveys;
    DELETE FROM reminders;
    DELETE FROM notifications;
    DELETE FROM announcements;
    DELETE FROM prescriptions;
    DELETE FROM medicine_reviews;
    DELETE FROM medicines;
    DELETE FROM vacations;
    DELETE FROM referrals;
    DELETE FROM hospitalizations;
    DELETE FROM therapies;
    DELETE FROM allergens;
    DELETE FROM medical_records;
    DELETE FROM appointments;
    DELETE FROM room_jobs;
    DELETE FROM equipment_transfers;
    DELETE FROM inventory_items;
    DELETE FROM rooms;
    DELETE FROM sessions;
    DELETE FROM users;
    DELETE FROM meta;
  `);

  db.insert(meta)
    .values([
      { key: "schemaVersion", value: String(SCHEMA_VERSION) },
      { key: "seedClock", value: SEED_CLOCK },
    ])
    .run();

  const managerHash = hash("m");
  const secretaryHash = hash("s");
  const doctorHash = hash("d");
  const patientHash = hash("p");

  const userRows: Array<{
    username: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: "MALE" | "FEMALE";
    role: "MANAGER" | "SECRETARY" | "DOCTOR" | "PATIENT";
    specialty?: string;
    phone: string;
    email: string;
  }> = [
    {
      username: "manager",
      passwordHash: managerHash,
      firstName: "Alice",
      lastName: "Novak",
      dateOfBirth: "1980-03-12",
      gender: "FEMALE",
      role: "MANAGER",
      phone: "+3811110001",
      email: "alice.novak@hospital.demo",
    },
    {
      username: "manager2",
      passwordHash: managerHash,
      firstName: "Boris",
      lastName: "Horvat",
      dateOfBirth: "1978-06-30",
      gender: "MALE",
      role: "MANAGER",
      phone: "+3811110011",
      email: "boris.horvat@hospital.demo",
    },
    {
      username: "secretary",
      passwordHash: secretaryHash,
      firstName: "Mira",
      lastName: "Kovacs",
      dateOfBirth: "1988-07-22",
      gender: "FEMALE",
      role: "SECRETARY",
      phone: "+3811110002",
      email: "mira.kovacs@hospital.demo",
    },
    {
      username: "secretary2",
      passwordHash: secretaryHash,
      firstName: "Tina",
      lastName: "Balog",
      dateOfBirth: "1991-02-14",
      gender: "FEMALE",
      role: "SECRETARY",
      phone: "+3811110012",
      email: "tina.balog@hospital.demo",
    },
  ];

  for (let i = 0; i < 8; i++) {
    const username = doctorUsername(i);
    const firstName =
      i === 0 ? "Laslo" : i === 1 ? "Ana" : pick(FIRST_NAMES, i + 3);
    const lastName =
      i === 0 ? "Uri" : i === 1 ? "Petrovic" : pick(LAST_NAMES, i + 5);
    userRows.push({
      username,
      passwordHash: doctorHash,
      firstName,
      lastName,
      dateOfBirth: `198${i % 10}-${String((i % 12) + 1).padStart(2, "0")}-15`,
      gender: i % 2 === 0 ? "MALE" : "FEMALE",
      role: "DOCTOR",
      specialty: SPECIALTIES[i]!,
      phone: `+38111100${String(20 + i).padStart(2, "0")}`,
      email: `${username}@hospital.demo`,
    });
  }

  for (let i = 0; i < 50; i++) {
    const username = patientUsername(i);
    const firstName =
      i === 0 ? "Pera" : i === 1 ? "Jelena" : pick(FIRST_NAMES, i + 7);
    const lastName =
      i === 0 ? "Peric" : i === 1 ? "Markovic" : pick(LAST_NAMES, i + 11);
    userRows.push({
      username,
      passwordHash: patientHash,
      firstName,
      lastName,
      dateOfBirth: `19${70 + (i % 30)}-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 27) + 1).padStart(2, "0")}`,
      gender: i % 2 === 0 ? "MALE" : "FEMALE",
      role: "PATIENT",
      phone: `+38111101${String(i).padStart(2, "0")}`,
      email: `${username}@patient.demo`,
    });
  }

  db.insert(users).values(userRows).run();

  const roomDefs: Array<{
    code: string;
    name: string;
    type: "ORDINARY" | "OR" | "EXAM" | "WARD" | "WAREHOUSE";
    floor: number;
    areaSqm: number;
    status: "ACTIVE" | "RENOVATION";
  }> = [];

  for (let i = 1; i <= 12; i++) {
    roomDefs.push({
      code: `EX-${100 + i}`,
      name: `Exam ${i}`,
      type: "EXAM",
      floor: 1,
      areaSqm: 16 + (i % 5),
      status: "ACTIVE",
    });
  }
  for (let i = 1; i <= 6; i++) {
    roomDefs.push({
      code: `OR-${i}`,
      name: `Operating room ${i}`,
      type: "OR",
      floor: 2,
      areaSqm: 36 + i,
      status: i === 6 ? "RENOVATION" : "ACTIVE",
    });
  }
  for (let i = 1; i <= 10; i++) {
    roomDefs.push({
      code: `W-${200 + i}`,
      name: `Ward ${i}`,
      type: "WARD",
      floor: 2 + (i % 2),
      areaSqm: 50 + i * 2,
      status: "ACTIVE",
    });
  }
  for (let i = 1; i <= 4; i++) {
    roomDefs.push({
      code: `WH-${i}`,
      name: `Warehouse ${i}`,
      type: "WAREHOUSE",
      floor: 0,
      areaSqm: 70 + i * 10,
      status: "ACTIVE",
    });
  }
  for (let i = 1; i <= 3; i++) {
    roomDefs.push({
      code: `OFF-${i}`,
      name: `Office ${i}`,
      type: "ORDINARY",
      floor: 3,
      areaSqm: 14 + i,
      status: "ACTIVE",
    });
  }

  db.insert(rooms).values(roomDefs).run();

  const roomRows = db.select().from(rooms).all();
  const byCode = Object.fromEntries(roomRows.map((r) => [r.code, r.id]));
  const examRoomIds = roomRows
    .filter((r) => r.type === "EXAM")
    .map((r) => r.id);
  const orRoomIds = roomRows.filter((r) => r.type === "OR").map((r) => r.id);
  const wardRoomIds = roomRows
    .filter((r) => r.type === "WARD")
    .map((r) => r.id);
  const warehouseRoomIds = roomRows
    .filter((r) => r.type === "WAREHOUSE")
    .map((r) => r.id);

  const inventoryRows: Array<{
    roomId: number;
    name: string;
    kind: "STATIC" | "DYNAMIC";
    quantity: number;
  }> = [];

  for (const room of roomRows) {
    if (room.type === "EXAM") {
      inventoryRows.push(
        {
          roomId: room.id,
          name: pick(STATIC_ITEMS, 0),
          kind: "STATIC",
          quantity: 1,
        },
        {
          roomId: room.id,
          name: pick(DYNAMIC_ITEMS, room.id),
          kind: "DYNAMIC",
          quantity: 2 + (room.id % 3),
        },
      );
    } else if (room.type === "OR") {
      inventoryRows.push(
        {
          roomId: room.id,
          name: "Operating table",
          kind: "STATIC",
          quantity: 1,
        },
        {
          roomId: room.id,
          name: "Surgical lamp",
          kind: "STATIC",
          quantity: 2,
        },
        {
          roomId: room.id,
          name: "Crash cart",
          kind: "DYNAMIC",
          quantity: 1,
        },
      );
    } else if (room.type === "WARD") {
      inventoryRows.push(
        {
          roomId: room.id,
          name: "Hospital bed",
          kind: "STATIC",
          quantity: 4 + (room.id % 3),
        },
        {
          roomId: room.id,
          name: "IV stand",
          kind: "DYNAMIC",
          quantity: 4,
        },
      );
    } else if (room.type === "WAREHOUSE") {
      for (let k = 0; k < 4; k++) {
        inventoryRows.push({
          roomId: room.id,
          name: pick(DYNAMIC_ITEMS, room.id + k),
          kind: "DYNAMIC",
          quantity: 10 + k * 5,
        });
      }
    } else {
      inventoryRows.push({
        roomId: room.id,
        name: "Desk",
        kind: "STATIC",
        quantity: 1,
      });
    }
  }

  // Top up toward ~70 items if room loops landed short.
  let filler = 0;
  while (inventoryRows.length < 70) {
    inventoryRows.push({
      roomId: pick(warehouseRoomIds, filler),
      name: pick(DYNAMIC_ITEMS, filler + 3),
      kind: "DYNAMIC",
      quantity: 5 + (filler % 8),
    });
    filler += 1;
  }

  db.insert(inventoryItems).values(inventoryRows).run();

  db.insert(medicines).values(MEDICINE_DEFS).run();

  const medicineRows = db.select().from(medicines).all();
  const approvedMedicines = medicineRows.filter((m) => m.status === "APPROVED");

  const doctorUsernames = Array.from({ length: 8 }, (_, i) =>
    doctorUsername(i),
  );
  const patientUsernames = Array.from({ length: 50 }, (_, i) =>
    patientUsername(i),
  );

  const appointmentRows: Array<{
    type: "EXAM" | "OPERATION" | "EMERGENCY";
    status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "RESCHEDULED";
    doctorUsername: string;
    patientUsername: string;
    roomId: number;
    startsAt: string;
    endsAt: string;
    notes: string;
  }> = [];

  const statuses = [
    "SCHEDULED",
    "SCHEDULED",
    "SCHEDULED",
    "COMPLETED",
    "CANCELLED",
    "RESCHEDULED",
  ] as const;

  for (let i = 0; i < 36; i++) {
    const isOperation = i % 9 === 0;
    const isEmergency = i % 11 === 0 && !isOperation;
    const type = isOperation
      ? "OPERATION"
      : isEmergency
        ? "EMERGENCY"
        : "EXAM";
    const hourOffset = -48 + i * 3;
    const startsAt = addHours(SEED_CLOCK, hourOffset);
    const duration = type === "OPERATION" ? 2 : 1;
    const roomId =
      type === "OPERATION"
        ? pick(orRoomIds, i)
        : pick(examRoomIds.length ? examRoomIds : wardRoomIds, i);
    appointmentRows.push({
      type,
      status: statuses[i % statuses.length]!,
      doctorUsername: pick(doctorUsernames, i),
      patientUsername: pick(patientUsernames, i * 2),
      roomId,
      startsAt,
      endsAt: addHours(startsAt, duration),
      notes:
        type === "OPERATION"
          ? `Scheduled procedure #${i + 1}`
          : type === "EMERGENCY"
            ? `Urgent assessment #${i + 1}`
            : `Clinic visit #${i + 1}`,
    });
  }

  db.insert(appointments).values(appointmentRows).run();

  db.insert(medicalRecords)
    .values(
      patientUsernames.map((username, i) => ({
        patientUsername: username,
        bloodType: pick(BLOOD_TYPES, i),
        notes:
          i === 0
            ? "Generally healthy."
            : i === 1
              ? "Watch blood pressure."
              : `Chart notes for ${username}.`,
      })),
    )
    .run();

  const allergenRows: Array<{ patientUsername: string; name: string }> = [];
  for (let i = 0; i < patientUsernames.length; i++) {
    if (i % 3 !== 0) continue;
    allergenRows.push({
      patientUsername: patientUsernames[i]!,
      name: pick(ALLERGEN_NAMES, i),
    });
    if (i % 6 === 0) {
      allergenRows.push({
        patientUsername: patientUsernames[i]!,
        name: pick(ALLERGEN_NAMES, i + 4),
      });
    }
  }
  db.insert(allergens).values(allergenRows).run();

  const prescriptionRows = Array.from({ length: 8 }, (_, i) => ({
    patientUsername: pick(patientUsernames, i * 3),
    doctorUsername: pick(doctorUsernames, i),
    medicineId: pick(approvedMedicines, i).id,
    dosage: `${250 + i * 50} mg ${i % 2 === 0 ? "twice" : "once"} daily`,
  }));
  db.insert(prescriptions).values(prescriptionRows).run();

  const announcementTitles = [
    "Welcome to Hospital Management Suite 2.0",
    "Flu season vaccination desk open",
    "OR-6 renovation schedule",
    "New cardiology clinic hours",
    "Warehouse restock complete",
    "Fire drill on Thursday",
    "Patient portal maintenance window",
    "Updated triage protocol",
    "Blood drive this weekend",
    "Staff parking lot resurfacing",
  ];

  db.insert(announcements)
    .values(
      announcementTitles.map((title, i) => ({
        title,
        body:
          i === 0
            ? "Demo desks for manager, secretary, doctor, and patient are ready."
            : `${title}. Details posted at the main desk.`,
        authorUsername: i % 2 === 0 ? "secretary" : "secretary2",
      })),
    )
    .run();

  const notificationRows: Array<{
    username: string;
    title: string;
    body: string;
    read: boolean;
  }> = [
    {
      username: "patient",
      title: "Appointment reminder",
      body: "You have an exam today with Dr. Uri.",
      read: false,
    },
    {
      username: "doctor",
      title: "Medicine review",
      body: "NewAntibiotic awaits review.",
      read: false,
    },
  ];
  for (let i = 0; i < 18; i++) {
    notificationRows.push({
      username: pick(
        [...doctorUsernames, ...patientUsernames.slice(0, 12), "manager"],
        i,
      ),
      title: i % 2 === 0 ? "Schedule update" : "Desk notice",
      body: `Automated notice #${i + 1} for demo traffic.`,
      read: i % 3 === 0,
    });
  }
  db.insert(notifications).values(notificationRows).run();

  db.insert(reminders)
    .values(
      Array.from({ length: 12 }, (_, i) => ({
        patientUsername: pick(patientUsernames, i * 2),
        medicineName: pick(approvedMedicines, i).name,
        remindAt: addHours(SEED_CLOCK, 2 + i * 5),
        note: i % 2 === 0 ? "Take with food" : "Take after meals",
      })),
    )
    .run();

  db.insert(surveys)
    .values(
      Array.from({ length: 14 }, (_, i) => ({
        username: pick(patientUsernames, i),
        targetType: (i % 3 === 0 ? "DOCTOR" : "HOSPITAL") as
          | "DOCTOR"
          | "HOSPITAL",
        targetId: i % 3 === 0 ? pick(doctorUsernames, i) : "main",
        rating: 3 + (i % 3),
        comment:
          i === 0 ? "Smooth check-in." : `Survey response ${i + 1}.`,
      })),
    )
    .run();

  db.insert(feedback)
    .values(
      Array.from({ length: 10 }, (_, i) => ({
        username: pick(patientUsernames, i + 1),
        message:
          i === 0
            ? "Waiting room was calm."
            : `Feedback note ${i + 1} about visit experience.`,
        rating: 3 + (i % 3),
      })),
    )
    .run();

  db.insert(equipmentTransfers)
    .values([
      {
        fromRoomId: byCode["WH-1"] ?? warehouseRoomIds[0]!,
        toRoomId: byCode["EX-101"] ?? examRoomIds[0]!,
        itemName: "Monitor cart",
        quantity: 1,
        applyAt: addHours(SEED_CLOCK, -2),
        applied: false,
        createdBy: "manager",
      },
      {
        fromRoomId: byCode["WH-2"] ?? warehouseRoomIds[1]!,
        toRoomId: byCode["OR-1"] ?? orRoomIds[0]!,
        itemName: "Crash cart",
        quantity: 1,
        applyAt: addHours(SEED_CLOCK, 6),
        applied: false,
        createdBy: "manager2",
      },
      {
        fromRoomId: byCode["WH-1"] ?? warehouseRoomIds[0]!,
        toRoomId: byCode["W-201"] ?? wardRoomIds[0]!,
        itemName: "IV stand",
        quantity: 3,
        applyAt: addHours(SEED_CLOCK, 12),
        applied: false,
        createdBy: "manager",
      },
      {
        fromRoomId: byCode["WH-3"] ?? warehouseRoomIds[2]!,
        toRoomId: byCode["EX-105"] ?? examRoomIds[4]!,
        itemName: "Wheelchair",
        quantity: 2,
        applyAt: addHours(SEED_CLOCK, -8),
        applied: true,
        createdBy: "manager2",
      },
    ])
    .run();

  db.insert(roomJobs)
    .values([
      {
        roomId: byCode["W-201"] ?? wardRoomIds[0]!,
        jobType: "RENOVATION",
        details: "Repaint ward walls",
        applyAt: addHours(SEED_CLOCK, -1),
        applied: false,
        createdBy: "manager",
      },
      {
        roomId: byCode["OR-6"] ?? orRoomIds[orRoomIds.length - 1]!,
        jobType: "RENOVATION",
        details: "Replace flooring and lights",
        applyAt: addHours(SEED_CLOCK, 24),
        applied: false,
        createdBy: "manager2",
      },
      {
        roomId: byCode["EX-110"] ?? examRoomIds[9]!,
        jobType: "SPLIT",
        details: "Split into two consult bays",
        applyAt: addHours(SEED_CLOCK, 48),
        applied: false,
        createdBy: "manager",
      },
      {
        roomId: byCode["OFF-1"] ?? roomRows.find((r) => r.type === "ORDINARY")!.id,
        jobType: "MERGE",
        details: "Merge adjacent admin offices",
        applyAt: addHours(SEED_CLOCK, 72),
        applied: false,
        createdBy: "manager2",
      },
    ])
    .run();

  const wardId = byCode["W-201"] ?? wardRoomIds[0]!;
  const wardId2 = byCode["W-202"] ?? wardRoomIds[1] ?? wardId;
  db.insert(hospitalizations)
    .values([
      {
        patientUsername: "patient",
        roomId: wardId,
        reason: "Post-op observation",
        admittedAt: addHours(SEED_CLOCK, -36),
        dischargedAt: null,
      },
      {
        patientUsername: "patient4",
        roomId: wardId2,
        reason: "Pneumonia",
        admittedAt: addHours(SEED_CLOCK, -72),
        dischargedAt: addHours(SEED_CLOCK, -12),
      },
      {
        patientUsername: "patient8",
        roomId: wardId,
        reason: "Cardiac monitoring",
        admittedAt: addHours(SEED_CLOCK, -10),
        dischargedAt: null,
      },
    ])
    .run();

  db.insert(referrals)
    .values([
      {
        patientUsername: "patient2",
        fromDoctor: "doctor",
        toDoctor: "doctor2",
        reason: "Surgical consult for hernia",
      },
      {
        patientUsername: "patient5",
        fromDoctor: "doctor3",
        toDoctor: "doctor",
        reason: "Internal medicine follow-up",
      },
      {
        patientUsername: "patient10",
        fromDoctor: "doctor",
        toDoctor: "doctor4",
        reason: "Cardiology referral",
      },
    ])
    .run();

  db.insert(vacations)
    .values([
      {
        doctorUsername: "doctor2",
        startsAt: addHours(SEED_CLOCK, 24 * 14),
        endsAt: addHours(SEED_CLOCK, 24 * 21),
        status: "SCHEDULED",
        note: "Annual leave",
        createdBy: "secretary",
      },
      {
        doctorUsername: "doctor5",
        startsAt: addHours(SEED_CLOCK, 24 * 30),
        endsAt: addHours(SEED_CLOCK, 24 * 37),
        status: "SCHEDULED",
        note: "Conference week",
        createdBy: "secretary2",
      },
      {
        doctorUsername: "doctor3",
        startsAt: addHours(SEED_CLOCK, -24 * 10),
        endsAt: addHours(SEED_CLOCK, -24 * 3),
        status: "CANCELLED",
        note: "Cancelled travel",
        createdBy: "secretary",
      },
    ])
    .run();

  return { seeded: true as const };
}

const isDirectRun = process.argv[1]?.includes("seed.ts");
if (isDirectRun) {
  const reset = process.argv.includes("--reset");
  const dbPath = getDbPath();
  if (reset) {
    resetDbConnection();
    try {
      for (const suffix of ["", "-wal", "-shm"]) {
        const p = `${dbPath}${suffix}`;
        if (fs.existsSync(p)) fs.unlinkSync(p);
      }
    } catch (err) {
      const code =
        err && typeof err === "object" && "code" in err
          ? String(err.code)
          : "";
      console.warn(
        `Could not delete DB (${code || "busy"}); wiping tables instead.`,
      );
    }
  }
  const result = seedDatabase({ force: reset });
  if (result.seeded) {
    console.log(`Seeded ${dbPath}`, result);
  } else {
    console.log(`Already seeded at ${dbPath}; use --reset to wipe and reseed.`);
  }
}
