using HospitalDesktop.Data;
using HospitalDesktop.Domain;
using Microsoft.Data.Sqlite;

namespace HospitalDesktop.Services;

public sealed class HospitalServices
{
    public HospitalServices(HospitalDb db)
    {
        Db = db;
        SeedData.EnsureSeeded(db);
    }

    public HospitalDb Db { get; }

    public User? Authenticate(string username, string password)
    {
        var user = GetUser(username);
        if (user is null) return null;
        return BCrypt.Net.BCrypt.Verify(password, user.PasswordHash) ? user : null;
    }

    public User? GetUser(string username)
    {
        using var cmd = Db.Connection.CreateCommand();
        cmd.CommandText = "SELECT * FROM users WHERE username = $u";
        cmd.Parameters.AddWithValue("$u", username);
        using var r = cmd.ExecuteReader();
        if (!r.Read()) return null;
        return MapUser(r);
    }

    public List<User> UsersByRole(Role role)
    {
        using var cmd = Db.Connection.CreateCommand();
        cmd.CommandText = "SELECT * FROM users WHERE role = $r ORDER BY last_name";
        cmd.Parameters.AddWithValue("$r", role.ToString().ToUpperInvariant());
        return ReadUsers(cmd);
    }

    public List<Appointment> ListAppointments(string? doctor = null, string? patient = null)
    {
        using var cmd = Db.Connection.CreateCommand();
        cmd.CommandText = """
            SELECT id, type, status, doctor_username, patient_username, room_id, starts_at, ends_at, anamnesis, notes
            FROM appointments
            WHERE ($d IS NULL OR doctor_username = $d)
              AND ($p IS NULL OR patient_username = $p)
            ORDER BY starts_at
            """;
        cmd.Parameters.AddWithValue("$d", (object?)doctor ?? DBNull.Value);
        cmd.Parameters.AddWithValue("$p", (object?)patient ?? DBNull.Value);
        using var r = cmd.ExecuteReader();
        var list = new List<Appointment>();
        while (r.Read())
        {
            list.Add(new Appointment
            {
                Id = r.GetInt64(0),
                Type = r.GetString(1),
                Status = r.GetString(2),
                DoctorUsername = r.GetString(3),
                PatientUsername = r.GetString(4),
                RoomId = r.IsDBNull(5) ? null : r.GetInt64(5),
                StartsAt = r.GetString(6),
                EndsAt = r.GetString(7),
                Anamnesis = r.GetString(8),
                Notes = r.GetString(9),
            });
        }
        return list;
    }

    public string? BookAppointment(string type, string doctor, string patient, DateTime start, DateTime end, string notes, string createdBy)
    {
        if (end <= start) return "End time must be after start time.";
        var startIso = start.ToUniversalTime().ToString("o");
        var endIso = end.ToUniversalTime().ToString("o");

        foreach (var existing in ListAppointments(doctor: doctor))
        {
            if (existing.Status is "CANCELLED" or "NO_SHOW") continue;
            if (startIso.CompareTo(existing.EndsAt) < 0 && existing.StartsAt.CompareTo(endIso) < 0)
                return "That slot conflicts with another appointment.";
        }

        if (createdBy == patient)
        {
            var user = GetUser(patient)!;
            if (user.SuspendedUntil is not null &&
                string.CompareOrdinal(user.SuspendedUntil, AppClock.SeedClock) > 0)
                return $"Booking suspended until {user.SuspendedUntil}.";

            var score = user.SpamScore + 1;
            string? suspended = null;
            if (score >= AppClock.SpamThreshold)
            {
                suspended = DateTime.Parse(AppClock.SeedClock).ToUniversalTime()
                    .AddDays(AppClock.SuspensionDays).ToString("o");
                score = 0;
                UpdateSpam(patient, score, suspended);
                return $"Too many booking changes. Suspended until {suspended}.";
            }
            UpdateSpam(patient, score, null);
        }

        using var cmd = Db.Connection.CreateCommand();
        cmd.CommandText = """
            INSERT INTO appointments(type, status, doctor_username, patient_username, starts_at, ends_at, notes, created_by)
            VALUES ($t, 'SCHEDULED', $d, $p, $s, $e, $n, $c)
            """;
        cmd.Parameters.AddWithValue("$t", type);
        cmd.Parameters.AddWithValue("$d", doctor);
        cmd.Parameters.AddWithValue("$p", patient);
        cmd.Parameters.AddWithValue("$s", startIso);
        cmd.Parameters.AddWithValue("$e", endIso);
        cmd.Parameters.AddWithValue("$n", notes);
        cmd.Parameters.AddWithValue("$c", createdBy);
        cmd.ExecuteNonQuery();
        return null;
    }

    public void CancelAppointment(long id)
    {
        using var cmd = Db.Connection.CreateCommand();
        cmd.CommandText = "UPDATE appointments SET status = 'CANCELLED' WHERE id = $id";
        cmd.Parameters.AddWithValue("$id", id);
        cmd.ExecuteNonQuery();
    }

    public void CompleteAppointment(long id, string anamnesis)
    {
        using var cmd = Db.Connection.CreateCommand();
        cmd.CommandText = "UPDATE appointments SET status = 'COMPLETED', anamnesis = $a WHERE id = $id";
        cmd.Parameters.AddWithValue("$a", anamnesis);
        cmd.Parameters.AddWithValue("$id", id);
        cmd.ExecuteNonQuery();
    }

    public List<Room> ListRooms()
    {
        using var cmd = Db.Connection.CreateCommand();
        cmd.CommandText = "SELECT id, code, name, type, floor, area_sqm, status FROM rooms ORDER BY code";
        using var r = cmd.ExecuteReader();
        var list = new List<Room>();
        while (r.Read())
        {
            list.Add(new Room
            {
                Id = r.GetInt64(0),
                Code = r.GetString(1),
                Name = r.GetString(2),
                Type = r.GetString(3),
                Floor = r.GetInt32(4),
                AreaSqm = r.GetInt32(5),
                Status = r.GetString(6),
            });
        }
        return list;
    }

    public string? AddRoom(string code, string name, string type, int floor, int area)
    {
        try
        {
            using var cmd = Db.Connection.CreateCommand();
            cmd.CommandText = """
                INSERT INTO rooms(code, name, type, floor, area_sqm, status)
                VALUES ($c, $n, $t, $f, $a, 'AVAILABLE')
                """;
            cmd.Parameters.AddWithValue("$c", code);
            cmd.Parameters.AddWithValue("$n", name);
            cmd.Parameters.AddWithValue("$t", type);
            cmd.Parameters.AddWithValue("$f", floor);
            cmd.Parameters.AddWithValue("$a", area);
            cmd.ExecuteNonQuery();
            return null;
        }
        catch
        {
            return "Room code already exists.";
        }
    }

    public List<InventoryItem> ListInventory()
    {
        using var cmd = Db.Connection.CreateCommand();
        cmd.CommandText = """
            SELECT i.id, i.room_id, r.code, i.name, i.kind, i.quantity
            FROM inventory_items i JOIN rooms r ON r.id = i.room_id
            ORDER BY r.code, i.name
            """;
        using var r = cmd.ExecuteReader();
        var list = new List<InventoryItem>();
        while (r.Read())
        {
            list.Add(new InventoryItem
            {
                Id = r.GetInt64(0),
                RoomId = r.GetInt64(1),
                RoomCode = r.GetString(2),
                Name = r.GetString(3),
                Kind = r.GetString(4),
                Quantity = r.GetInt32(5),
            });
        }
        return list;
    }

    public List<Medicine> ListMedicines()
    {
        using var cmd = Db.Connection.CreateCommand();
        cmd.CommandText = "SELECT id, code, name, description, status FROM medicines ORDER BY name";
        using var r = cmd.ExecuteReader();
        var list = new List<Medicine>();
        while (r.Read())
        {
            list.Add(new Medicine
            {
                Id = r.GetInt64(0),
                Code = r.GetString(1),
                Name = r.GetString(2),
                Description = r.GetString(3),
                Status = r.GetString(4),
            });
        }
        return list;
    }

    public void ReviewMedicine(long id, bool approve)
    {
        using var cmd = Db.Connection.CreateCommand();
        cmd.CommandText = "UPDATE medicines SET status = $s WHERE id = $id";
        cmd.Parameters.AddWithValue("$s", approve ? "APPROVED" : "REJECTED");
        cmd.Parameters.AddWithValue("$id", id);
        cmd.ExecuteNonQuery();
    }

    public void IssuePrescription(string patient, string doctor, long medicineId, string dosage, string instructions)
    {
        using var cmd = Db.Connection.CreateCommand();
        cmd.CommandText = """
            INSERT INTO prescriptions(patient_username, doctor_username, medicine_id, dosage, instructions, issued_at)
            VALUES ($p, $d, $m, $dos, $i, $issued)
            """;
        cmd.Parameters.AddWithValue("$p", patient);
        cmd.Parameters.AddWithValue("$d", doctor);
        cmd.Parameters.AddWithValue("$m", medicineId);
        cmd.Parameters.AddWithValue("$dos", dosage);
        cmd.Parameters.AddWithValue("$i", instructions);
        cmd.Parameters.AddWithValue("$issued", DateTime.UtcNow.ToString("o"));
        cmd.ExecuteNonQuery();
    }

    public List<Prescription> ListPrescriptions(string? patient = null)
    {
        using var cmd = Db.Connection.CreateCommand();
        cmd.CommandText = """
            SELECT p.id, p.patient_username, p.doctor_username, p.medicine_id, m.name, p.dosage, p.instructions, p.issued_at
            FROM prescriptions p JOIN medicines m ON m.id = p.medicine_id
            WHERE ($u IS NULL OR p.patient_username = $u)
            ORDER BY p.issued_at DESC
            """;
        cmd.Parameters.AddWithValue("$u", (object?)patient ?? DBNull.Value);
        using var r = cmd.ExecuteReader();
        var list = new List<Prescription>();
        while (r.Read())
        {
            list.Add(new Prescription
            {
                Id = r.GetInt64(0),
                PatientUsername = r.GetString(1),
                DoctorUsername = r.GetString(2),
                MedicineId = r.GetInt64(3),
                MedicineName = r.GetString(4),
                Dosage = r.GetString(5),
                Instructions = r.GetString(6),
                IssuedAt = r.GetString(7),
            });
        }
        return list;
    }

    public string GetRecordSummary(string patient)
    {
        using var cmd = Db.Connection.CreateCommand();
        cmd.CommandText = "SELECT summary FROM medical_records WHERE patient_username = $u";
        cmd.Parameters.AddWithValue("$u", patient);
        return cmd.ExecuteScalar() as string ?? "";
    }

    public void SaveRecordSummary(string patient, string summary)
    {
        using var cmd = Db.Connection.CreateCommand();
        cmd.CommandText = """
            INSERT INTO medical_records(patient_username, summary) VALUES ($u, $s)
            ON CONFLICT(patient_username) DO UPDATE SET summary = excluded.summary
            """;
        cmd.Parameters.AddWithValue("$u", patient);
        cmd.Parameters.AddWithValue("$s", summary);
        cmd.ExecuteNonQuery();
    }

    public List<Announcement> ListAnnouncements()
    {
        using var cmd = Db.Connection.CreateCommand();
        cmd.CommandText = "SELECT id, title, body, author_username, created_at FROM announcements ORDER BY created_at DESC";
        using var r = cmd.ExecuteReader();
        var list = new List<Announcement>();
        while (r.Read())
        {
            list.Add(new Announcement
            {
                Id = r.GetInt64(0),
                Title = r.GetString(1),
                Body = r.GetString(2),
                AuthorUsername = r.GetString(3),
                CreatedAt = r.GetString(4),
            });
        }
        return list;
    }

    public void PostAnnouncement(string title, string body, string author)
    {
        using var cmd = Db.Connection.CreateCommand();
        cmd.CommandText = """
            INSERT INTO announcements(title, body, author_username, created_at)
            VALUES ($t, $b, $a, $c)
            """;
        cmd.Parameters.AddWithValue("$t", title);
        cmd.Parameters.AddWithValue("$b", body);
        cmd.Parameters.AddWithValue("$a", author);
        cmd.Parameters.AddWithValue("$c", DateTime.UtcNow.ToString("o"));
        cmd.ExecuteNonQuery();
    }

    public string? RegisterPatient(string username, string password, string first, string last)
    {
        if (GetUser(username) is not null) return "Username already taken.";
        using var cmd = Db.Connection.CreateCommand();
        cmd.CommandText = """
            INSERT INTO users(username, password_hash, first_name, last_name, date_of_birth, gender, role)
            VALUES ($u, $p, $f, $l, '2000-01-01', 'OTHER', 'PATIENT');
            INSERT INTO medical_records(patient_username, summary) VALUES ($u, 'New patient record.');
            """;
        cmd.Parameters.AddWithValue("$u", username);
        cmd.Parameters.AddWithValue("$p", BCrypt.Net.BCrypt.HashPassword(password));
        cmd.Parameters.AddWithValue("$f", first);
        cmd.Parameters.AddWithValue("$l", last);
        cmd.ExecuteNonQuery();
        return null;
    }

    public void ApplyDueJobs(string? nowIso = null)
    {
        var now = nowIso ?? DateTime.UtcNow.ToString("o");
        using (var cmd = Db.Connection.CreateCommand())
        {
            cmd.CommandText = """
                SELECT id, to_room_id, item_name, quantity
                FROM equipment_transfers
                WHERE applied = 0 AND apply_at <= $now
                """;
            cmd.Parameters.AddWithValue("$now", now);
            using var r = cmd.ExecuteReader();
            var due = new List<(long Id, long To, string Name, int Qty)>();
            while (r.Read())
                due.Add((r.GetInt64(0), r.GetInt64(1), r.GetString(2), r.GetInt32(3)));
            r.Close();
            foreach (var t in due)
            {
                using var move = Db.Connection.CreateCommand();
                move.CommandText = """
                    UPDATE equipment_transfers SET applied = 1 WHERE id = $id;
                    INSERT INTO inventory_items(room_id, name, kind, quantity)
                    VALUES ($to, $n, 'DYNAMIC', $q);
                    """;
                move.Parameters.AddWithValue("$id", t.Id);
                move.Parameters.AddWithValue("$to", t.To);
                move.Parameters.AddWithValue("$n", t.Name);
                move.Parameters.AddWithValue("$q", t.Qty);
                move.ExecuteNonQuery();
            }
        }
        using (var cmd = Db.Connection.CreateCommand())
        {
            cmd.CommandText = """
                SELECT id, room_id, job_type FROM room_jobs WHERE applied = 0 AND apply_at <= $now
                """;
            cmd.Parameters.AddWithValue("$now", now);
            using var r = cmd.ExecuteReader();
            var jobs = new List<(long Id, long RoomId, string Type)>();
            while (r.Read()) jobs.Add((r.GetInt64(0), r.GetInt64(1), r.GetString(2)));
            r.Close();
            foreach (var j in jobs)
            {
                if (j.Type == "RENOVATION")
                {
                    using var up = Db.Connection.CreateCommand();
                    up.CommandText = "UPDATE rooms SET status = 'RENOVATION' WHERE id = $r";
                    up.Parameters.AddWithValue("$r", j.RoomId);
                    up.ExecuteNonQuery();
                }
                using var mark = Db.Connection.CreateCommand();
                mark.CommandText = "UPDATE room_jobs SET applied = 1 WHERE id = $id";
                mark.Parameters.AddWithValue("$id", j.Id);
                mark.ExecuteNonQuery();
            }
        }
    }

    public List<EquipmentTransfer> ListPendingTransfers()
    {
        ApplyDueJobs();
        using var cmd = Db.Connection.CreateCommand();
        cmd.CommandText = """
            SELECT t.id, t.from_room_id, t.to_room_id, f.code, d.code, t.item_name, t.quantity, t.apply_at, t.applied
            FROM equipment_transfers t
            JOIN rooms f ON f.id = t.from_room_id
            JOIN rooms d ON d.id = t.to_room_id
            WHERE t.applied = 0
            ORDER BY t.apply_at
            """;
        using var r = cmd.ExecuteReader();
        var list = new List<EquipmentTransfer>();
        while (r.Read())
        {
            list.Add(new EquipmentTransfer
            {
                Id = r.GetInt64(0),
                FromRoomId = r.GetInt64(1),
                ToRoomId = r.GetInt64(2),
                FromRoomCode = r.GetString(3),
                ToRoomCode = r.GetString(4),
                ItemName = r.GetString(5),
                Quantity = r.GetInt32(6),
                ApplyAt = r.GetString(7),
                Applied = r.GetInt32(8) != 0,
            });
        }
        return list;
    }

    public string? ScheduleTransfer(long fromRoomId, long toRoomId, string itemName, int qty, DateTime applyAt, string createdBy)
    {
        if (fromRoomId == toRoomId) return "Rooms must differ.";
        if (qty < 1) return "Quantity must be positive.";
        using var cmd = Db.Connection.CreateCommand();
        cmd.CommandText = """
            INSERT INTO equipment_transfers(from_room_id, to_room_id, item_name, quantity, apply_at, applied, created_by)
            VALUES ($f, $t, $n, $q, $a, 0, $c)
            """;
        cmd.Parameters.AddWithValue("$f", fromRoomId);
        cmd.Parameters.AddWithValue("$t", toRoomId);
        cmd.Parameters.AddWithValue("$n", itemName);
        cmd.Parameters.AddWithValue("$q", qty);
        cmd.Parameters.AddWithValue("$a", applyAt.ToUniversalTime().ToString("o"));
        cmd.Parameters.AddWithValue("$c", createdBy);
        cmd.ExecuteNonQuery();
        return null;
    }

    public List<RoomJob> ListPendingRoomJobs()
    {
        ApplyDueJobs();
        using var cmd = Db.Connection.CreateCommand();
        cmd.CommandText = """
            SELECT j.id, j.room_id, r.code, j.job_type, j.details, j.apply_at, j.applied
            FROM room_jobs j JOIN rooms r ON r.id = j.room_id
            WHERE j.applied = 0
            ORDER BY j.apply_at
            """;
        using var r = cmd.ExecuteReader();
        var list = new List<RoomJob>();
        while (r.Read())
        {
            list.Add(new RoomJob
            {
                Id = r.GetInt64(0),
                RoomId = r.GetInt64(1),
                RoomCode = r.GetString(2),
                JobType = r.GetString(3),
                Details = r.GetString(4),
                ApplyAt = r.GetString(5),
                Applied = r.GetInt32(6) != 0,
            });
        }
        return list;
    }

    public string? ScheduleRoomJob(long roomId, string jobType, string details, DateTime applyAt, string createdBy)
    {
        using var cmd = Db.Connection.CreateCommand();
        cmd.CommandText = """
            INSERT INTO room_jobs(room_id, job_type, details, apply_at, applied, created_by)
            VALUES ($r, $t, $d, $a, 0, $c)
            """;
        cmd.Parameters.AddWithValue("$r", roomId);
        cmd.Parameters.AddWithValue("$t", jobType);
        cmd.Parameters.AddWithValue("$d", details);
        cmd.Parameters.AddWithValue("$a", applyAt.ToUniversalTime().ToString("o"));
        cmd.Parameters.AddWithValue("$c", createdBy);
        cmd.ExecuteNonQuery();
        return null;
    }

    public List<Vacation> ListVacations()
    {
        using var cmd = Db.Connection.CreateCommand();
        cmd.CommandText = "SELECT id, doctor_username, starts_at, ends_at, status, note FROM vacations ORDER BY starts_at";
        using var r = cmd.ExecuteReader();
        var list = new List<Vacation>();
        while (r.Read())
        {
            list.Add(new Vacation
            {
                Id = r.GetInt64(0),
                DoctorUsername = r.GetString(1),
                StartsAt = r.GetString(2),
                EndsAt = r.GetString(3),
                Status = r.GetString(4),
                Note = r.GetString(5),
            });
        }
        return list;
    }

    public string? ScheduleVacation(string doctor, DateTime start, DateTime end, string note, string createdBy)
    {
        if (end <= start) return "End must be after start.";
        using var cmd = Db.Connection.CreateCommand();
        cmd.CommandText = """
            INSERT INTO vacations(doctor_username, starts_at, ends_at, status, note, created_by)
            VALUES ($d, $s, $e, 'SCHEDULED', $n, $c)
            """;
        cmd.Parameters.AddWithValue("$d", doctor);
        cmd.Parameters.AddWithValue("$s", start.ToUniversalTime().ToString("o"));
        cmd.Parameters.AddWithValue("$e", end.ToUniversalTime().ToString("o"));
        cmd.Parameters.AddWithValue("$n", note);
        cmd.Parameters.AddWithValue("$c", createdBy);
        cmd.ExecuteNonQuery();
        return null;
    }

    public void CancelVacation(long id)
    {
        using var cmd = Db.Connection.CreateCommand();
        cmd.CommandText = "UPDATE vacations SET status = 'CANCELLED' WHERE id = $id";
        cmd.Parameters.AddWithValue("$id", id);
        cmd.ExecuteNonQuery();
    }

    public List<Hospitalization> ListHospitalizations()
    {
        using var cmd = Db.Connection.CreateCommand();
        cmd.CommandText = """
            SELECT h.id, h.patient_username, h.room_id, r.code, h.reason, h.admitted_at, h.discharged_at
            FROM hospitalizations h JOIN rooms r ON r.id = h.room_id
            ORDER BY h.admitted_at DESC
            """;
        using var r = cmd.ExecuteReader();
        var list = new List<Hospitalization>();
        while (r.Read())
        {
            list.Add(new Hospitalization
            {
                Id = r.GetInt64(0),
                PatientUsername = r.GetString(1),
                RoomId = r.GetInt64(2),
                RoomCode = r.GetString(3),
                Reason = r.GetString(4),
                AdmittedAt = r.GetString(5),
                DischargedAt = r.IsDBNull(6) ? null : r.GetString(6),
            });
        }
        return list;
    }

    public string? AdmitPatient(string patient, long roomId, string reason)
    {
        using var check = Db.Connection.CreateCommand();
        check.CommandText = "SELECT 1 FROM hospitalizations WHERE patient_username = $p AND discharged_at IS NULL";
        check.Parameters.AddWithValue("$p", patient);
        if (check.ExecuteScalar() is not null) return "Patient already hospitalized.";
        using var cmd = Db.Connection.CreateCommand();
        cmd.CommandText = """
            INSERT INTO hospitalizations(patient_username, room_id, reason, admitted_at, discharged_at)
            VALUES ($p, $r, $reason, $a, NULL);
            INSERT INTO notifications(username, title, body, read, created_at)
            VALUES ($p, 'Hospital admission', $reason, 0, $a);
            """;
        cmd.Parameters.AddWithValue("$p", patient);
        cmd.Parameters.AddWithValue("$r", roomId);
        cmd.Parameters.AddWithValue("$reason", reason);
        cmd.Parameters.AddWithValue("$a", DateTime.UtcNow.ToString("o"));
        cmd.ExecuteNonQuery();
        return null;
    }

    public void DischargePatient(long id)
    {
        using var cmd = Db.Connection.CreateCommand();
        cmd.CommandText = """
            UPDATE hospitalizations SET discharged_at = $d WHERE id = $id AND discharged_at IS NULL;
            INSERT INTO notifications(username, title, body, read, created_at)
            SELECT patient_username, 'Discharged', 'Your hospital stay was closed.', 0, $d
            FROM hospitalizations WHERE id = $id;
            """;
        cmd.Parameters.AddWithValue("$d", DateTime.UtcNow.ToString("o"));
        cmd.Parameters.AddWithValue("$id", id);
        cmd.ExecuteNonQuery();
    }

    public List<Referral> ListReferrals(string? doctor = null)
    {
        using var cmd = Db.Connection.CreateCommand();
        cmd.CommandText = """
            SELECT id, patient_username, from_doctor, to_doctor, reason, created_at
            FROM referrals
            WHERE ($d IS NULL OR from_doctor = $d OR to_doctor = $d)
            ORDER BY created_at DESC
            """;
        cmd.Parameters.AddWithValue("$d", (object?)doctor ?? DBNull.Value);
        using var r = cmd.ExecuteReader();
        var list = new List<Referral>();
        while (r.Read())
        {
            list.Add(new Referral
            {
                Id = r.GetInt64(0),
                PatientUsername = r.GetString(1),
                FromDoctor = r.GetString(2),
                ToDoctor = r.GetString(3),
                Reason = r.GetString(4),
                CreatedAt = r.GetString(5),
            });
        }
        return list;
    }

    public string? CreateReferral(string patient, string fromDoctor, string toDoctor, string reason)
    {
        if (fromDoctor == toDoctor) return "Refer to another doctor.";
        using var cmd = Db.Connection.CreateCommand();
        cmd.CommandText = """
            INSERT INTO referrals(patient_username, from_doctor, to_doctor, reason, created_at)
            VALUES ($p, $f, $t, $r, $c);
            INSERT INTO notifications(username, title, body, read, created_at)
            VALUES ($t, 'New referral', $r, 0, $c);
            INSERT INTO notifications(username, title, body, read, created_at)
            VALUES ($p, 'Referral created', $r, 0, $c);
            """;
        cmd.Parameters.AddWithValue("$p", patient);
        cmd.Parameters.AddWithValue("$f", fromDoctor);
        cmd.Parameters.AddWithValue("$t", toDoctor);
        cmd.Parameters.AddWithValue("$r", reason);
        cmd.Parameters.AddWithValue("$c", DateTime.UtcNow.ToString("o"));
        cmd.ExecuteNonQuery();
        return null;
    }

    public string? RescheduleAppointment(long id, DateTime start, DateTime end, string patientUsername)
    {
        if (end <= start) return "End time must be after start time.";
        var appt = ListAppointments(patient: patientUsername).FirstOrDefault(a => a.Id == id);
        if (appt is null) return "Appointment not found.";
        if (appt.Status is "CANCELLED" or "COMPLETED") return "Cannot reschedule this appointment.";

        var user = GetUser(patientUsername)!;
        if (user.SuspendedUntil is not null &&
            string.CompareOrdinal(user.SuspendedUntil, AppClock.SeedClock) > 0)
            return $"Booking suspended until {user.SuspendedUntil}.";
        var score = user.SpamScore + 1;
        if (score >= AppClock.SpamThreshold)
        {
            var suspended = DateTime.Parse(AppClock.SeedClock).ToUniversalTime()
                .AddDays(AppClock.SuspensionDays).ToString("o");
            UpdateSpam(patientUsername, 0, suspended);
            return $"Too many booking changes. Suspended until {suspended}.";
        }
        UpdateSpam(patientUsername, score, null);

        using var cmd = Db.Connection.CreateCommand();
        cmd.CommandText = """
            UPDATE appointments
            SET starts_at = $s, ends_at = $e, status = 'RESCHEDULED'
            WHERE id = $id
            """;
        cmd.Parameters.AddWithValue("$s", start.ToUniversalTime().ToString("o"));
        cmd.Parameters.AddWithValue("$e", end.ToUniversalTime().ToString("o"));
        cmd.Parameters.AddWithValue("$id", id);
        cmd.ExecuteNonQuery();
        return null;
    }

    public List<Reminder> ListReminders(string patient)
    {
        using var cmd = Db.Connection.CreateCommand();
        cmd.CommandText = """
            SELECT id, patient_username, medicine_name, remind_at, note
            FROM reminders WHERE patient_username = $p ORDER BY remind_at
            """;
        cmd.Parameters.AddWithValue("$p", patient);
        using var r = cmd.ExecuteReader();
        var list = new List<Reminder>();
        while (r.Read())
        {
            list.Add(new Reminder
            {
                Id = r.GetInt64(0),
                PatientUsername = r.GetString(1),
                MedicineName = r.GetString(2),
                RemindAt = r.GetString(3),
                Note = r.GetString(4),
            });
        }
        return list;
    }

    public void AddReminder(string patient, string medicine, DateTime remindAt, string note)
    {
        using var cmd = Db.Connection.CreateCommand();
        cmd.CommandText = """
            INSERT INTO reminders(patient_username, medicine_name, remind_at, note)
            VALUES ($p, $m, $r, $n)
            """;
        cmd.Parameters.AddWithValue("$p", patient);
        cmd.Parameters.AddWithValue("$m", medicine);
        cmd.Parameters.AddWithValue("$r", remindAt.ToUniversalTime().ToString("o"));
        cmd.Parameters.AddWithValue("$n", note);
        cmd.ExecuteNonQuery();
    }

    public List<Notification> ListNotifications(string username)
    {
        using var cmd = Db.Connection.CreateCommand();
        cmd.CommandText = """
            SELECT id, username, title, body, read, created_at
            FROM notifications WHERE username = $u ORDER BY created_at DESC
            """;
        cmd.Parameters.AddWithValue("$u", username);
        using var r = cmd.ExecuteReader();
        var list = new List<Notification>();
        while (r.Read())
        {
            list.Add(new Notification
            {
                Id = r.GetInt64(0),
                Username = r.GetString(1),
                Title = r.GetString(2),
                Body = r.GetString(3),
                Read = r.GetInt32(4) != 0,
                CreatedAt = r.GetString(5),
            });
        }
        return list;
    }

    public void MarkNotificationRead(long id)
    {
        using var cmd = Db.Connection.CreateCommand();
        cmd.CommandText = "UPDATE notifications SET read = 1 WHERE id = $id";
        cmd.Parameters.AddWithValue("$id", id);
        cmd.ExecuteNonQuery();
    }

    public void SubmitSurvey(string username, string targetType, string targetId, int rating, string comment)
    {
        using var cmd = Db.Connection.CreateCommand();
        cmd.CommandText = """
            INSERT INTO surveys(username, target_type, target_id, rating, comment, created_at)
            VALUES ($u, $t, $i, $r, $c, $now)
            """;
        cmd.Parameters.AddWithValue("$u", username);
        cmd.Parameters.AddWithValue("$t", targetType);
        cmd.Parameters.AddWithValue("$i", targetId);
        cmd.Parameters.AddWithValue("$r", rating);
        cmd.Parameters.AddWithValue("$c", comment);
        cmd.Parameters.AddWithValue("$now", DateTime.UtcNow.ToString("o"));
        cmd.ExecuteNonQuery();
    }

    void UpdateSpam(string username, int score, string? suspendedUntil)
    {
        using var cmd = Db.Connection.CreateCommand();
        cmd.CommandText = "UPDATE users SET spam_score = $s, suspended_until = $u WHERE username = $n";
        cmd.Parameters.AddWithValue("$s", score);
        cmd.Parameters.AddWithValue("$u", (object?)suspendedUntil ?? DBNull.Value);
        cmd.Parameters.AddWithValue("$n", username);
        cmd.ExecuteNonQuery();
    }

    static User MapUser(SqliteDataReader r) => new()
    {
        Username = r.GetString(r.GetOrdinal("username")),
        PasswordHash = r.GetString(r.GetOrdinal("password_hash")),
        FirstName = r.GetString(r.GetOrdinal("first_name")),
        LastName = r.GetString(r.GetOrdinal("last_name")),
        DateOfBirth = r.GetString(r.GetOrdinal("date_of_birth")),
        Gender = r.GetString(r.GetOrdinal("gender")),
        Role = Enum.Parse<Role>(ToTitle(r.GetString(r.GetOrdinal("role"))), true),
        Specialty = r.IsDBNull(r.GetOrdinal("specialty")) ? null : r.GetString(r.GetOrdinal("specialty")),
        BloodType = r.IsDBNull(r.GetOrdinal("blood_type")) ? null : r.GetString(r.GetOrdinal("blood_type")),
        AllergensJson = r.GetString(r.GetOrdinal("allergens")),
        SpamScore = r.GetInt32(r.GetOrdinal("spam_score")),
        SuspendedUntil = r.IsDBNull(r.GetOrdinal("suspended_until")) ? null : r.GetString(r.GetOrdinal("suspended_until")),
    };

    static string ToTitle(string role) =>
        string.Concat(role.ToLowerInvariant().Split('_').Select(p => char.ToUpperInvariant(p[0]) + p[1..]));

    static List<User> ReadUsers(SqliteCommand cmd)
    {
        using var r = cmd.ExecuteReader();
        var list = new List<User>();
        while (r.Read()) list.Add(MapUser(r));
        return list;
    }
}
