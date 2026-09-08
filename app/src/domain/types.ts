export type Role = "MANAGER" | "SECRETARY" | "DOCTOR" | "PATIENT";

export type Gender = "MALE" | "FEMALE";

export type RoomType = "ORDINARY" | "OR" | "EXAM" | "WARD" | "WAREHOUSE";

export type RoomStatus = "ACTIVE" | "RENOVATION" | "MERGED" | "SPLIT";

export type InventoryKind = "STATIC" | "DYNAMIC";

export type RoomJobType = "RENOVATION" | "SPLIT" | "MERGE";

export type AppointmentType = "EXAM" | "OPERATION" | "EMERGENCY";

export type AppointmentStatus =
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELLED"
  | "RESCHEDULED";

export type MedicineStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED";

export type MedicineDecision = "APPROVE" | "REJECT";

export type SurveyTargetType = "HOSPITAL" | "DOCTOR";

export type VacationStatus = "SCHEDULED" | "CANCELLED";

export type PublicUser = {
  username: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  role: Role;
  specialty: string | null;
  phone: string;
  email: string;
  suspendedUntil: string | null;
  spamStrikes: number;
};

export const SCHEMA_VERSION = 3;

/** Fixed demo clock so calendars stay populated year-round. */
export const SEED_CLOCK = "2026-09-07T08:00:00.000Z";
