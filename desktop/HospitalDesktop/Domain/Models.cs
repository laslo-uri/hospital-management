namespace HospitalDesktop.Domain;

public enum Role
{
    Manager,
    Secretary,
    Doctor,
    Patient
}

public sealed class User
{
    public string Username { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public string DateOfBirth { get; set; } = "";
    public string Gender { get; set; } = "OTHER";
    public Role Role { get; set; }
    public string? Specialty { get; set; }
    public string? BloodType { get; set; }
    public string AllergensJson { get; set; } = "[]";
    public int SpamScore { get; set; }
    public string? SuspendedUntil { get; set; }

    public string DisplayName => $"{FirstName} {LastName}";
}

public sealed class Appointment
{
    public long Id { get; set; }
    public string Type { get; set; } = "EXAM";
    public string Status { get; set; } = "SCHEDULED";
    public string DoctorUsername { get; set; } = "";
    public string PatientUsername { get; set; } = "";
    public long? RoomId { get; set; }
    public string StartsAt { get; set; } = "";
    public string EndsAt { get; set; } = "";
    public string Anamnesis { get; set; } = "";
    public string Notes { get; set; } = "";
}

public sealed class Room
{
    public long Id { get; set; }
    public string Code { get; set; } = "";
    public string Name { get; set; } = "";
    public string Type { get; set; } = "EXAM";
    public int Floor { get; set; }
    public int AreaSqm { get; set; }
    public string Status { get; set; } = "AVAILABLE";
}

public sealed class Medicine
{
    public long Id { get; set; }
    public string Code { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string Status { get; set; } = "APPROVED";
}

public sealed class Prescription
{
    public long Id { get; set; }
    public string PatientUsername { get; set; } = "";
    public string DoctorUsername { get; set; } = "";
    public long MedicineId { get; set; }
    public string MedicineName { get; set; } = "";
    public string Dosage { get; set; } = "";
    public string Instructions { get; set; } = "";
    public string IssuedAt { get; set; } = "";
}

public sealed class InventoryItem
{
    public long Id { get; set; }
    public long RoomId { get; set; }
    public string RoomCode { get; set; } = "";
    public string Name { get; set; } = "";
    public string Kind { get; set; } = "DYNAMIC";
    public int Quantity { get; set; }
}

public sealed class Announcement
{
    public long Id { get; set; }
    public string Title { get; set; } = "";
    public string Body { get; set; } = "";
    public string AuthorUsername { get; set; } = "";
    public string CreatedAt { get; set; } = "";
}

public sealed class Vacation
{
    public long Id { get; set; }
    public string DoctorUsername { get; set; } = "";
    public string StartsAt { get; set; } = "";
    public string EndsAt { get; set; } = "";
    public string Status { get; set; } = "SCHEDULED";
    public string Note { get; set; } = "";
}

public sealed class Hospitalization
{
    public long Id { get; set; }
    public string PatientUsername { get; set; } = "";
    public long RoomId { get; set; }
    public string RoomCode { get; set; } = "";
    public string Reason { get; set; } = "";
    public string AdmittedAt { get; set; } = "";
    public string? DischargedAt { get; set; }
}

public sealed class Referral
{
    public long Id { get; set; }
    public string PatientUsername { get; set; } = "";
    public string FromDoctor { get; set; } = "";
    public string ToDoctor { get; set; } = "";
    public string Reason { get; set; } = "";
    public string CreatedAt { get; set; } = "";
}

public sealed class EquipmentTransfer
{
    public long Id { get; set; }
    public long FromRoomId { get; set; }
    public long ToRoomId { get; set; }
    public string FromRoomCode { get; set; } = "";
    public string ToRoomCode { get; set; } = "";
    public string ItemName { get; set; } = "";
    public int Quantity { get; set; }
    public string ApplyAt { get; set; } = "";
    public bool Applied { get; set; }
}

public sealed class RoomJob
{
    public long Id { get; set; }
    public long RoomId { get; set; }
    public string RoomCode { get; set; } = "";
    public string JobType { get; set; } = "";
    public string Details { get; set; } = "";
    public string ApplyAt { get; set; } = "";
    public bool Applied { get; set; }
}

public sealed class Reminder
{
    public long Id { get; set; }
    public string PatientUsername { get; set; } = "";
    public string MedicineName { get; set; } = "";
    public string RemindAt { get; set; } = "";
    public string Note { get; set; } = "";
}

public sealed class Notification
{
    public long Id { get; set; }
    public string Username { get; set; } = "";
    public string Title { get; set; } = "";
    public string Body { get; set; } = "";
    public bool Read { get; set; }
    public string CreatedAt { get; set; } = "";
}

public sealed class Survey
{
    public long Id { get; set; }
    public string Username { get; set; } = "";
    public string TargetType { get; set; } = "";
    public string TargetId { get; set; } = "";
    public int Rating { get; set; }
    public string Comment { get; set; } = "";
}

public static class AppClock
{
    public const string SeedClock = "2026-09-07T09:00:00.000Z";
    public const int SpamThreshold = 5;
    public const int SuspensionDays = 14;
}
