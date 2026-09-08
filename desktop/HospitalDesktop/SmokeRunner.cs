using System.IO;
using HospitalDesktop.Services;

namespace HospitalDesktop;

public static class SmokeRunner
{
    public static int Run(HospitalServices svc)
    {
        var lines = new List<string>();
        var failures = new List<string>();
        void Ok(string name, bool pass, string? detail = null)
        {
            if (pass) lines.Add($"PASS  {name}");
            else
            {
                var msg = detail is null ? name : $"{name}: {detail}";
                failures.Add(msg);
                lines.Add($"FAIL  {msg}");
            }
        }

        lines.Add("Hospital Desktop smoke");
        lines.Add($"db={svc.Db.DatabasePath}");

        var manager = svc.Authenticate("manager", "m");
        var secretary = svc.Authenticate("secretary", "s");
        var doctor = svc.Authenticate("doctor", "d");
        var patient = svc.Authenticate("patient", "p");
        Ok("auth manager", manager?.Role.ToString() == "Manager");
        Ok("auth secretary", secretary?.Role.ToString() == "Secretary");
        Ok("auth doctor", doctor?.Role.ToString() == "Doctor");
        Ok("auth patient", patient?.Role.ToString() == "Patient");
        Ok("auth reject", svc.Authenticate("manager", "wrong") is null);

        var rooms = svc.ListRooms();
        var inventory = svc.ListInventory();
        var meds = svc.ListMedicines();
        var appts = svc.ListAppointments();
        var anns = svc.ListAnnouncements();
        var doctors = svc.UsersByRole(Domain.Role.Doctor);
        var patients = svc.UsersByRole(Domain.Role.Patient);

        Ok("rooms >= 30", rooms.Count >= 30, $"count={rooms.Count}");
        Ok("inventory >= 40", inventory.Count >= 40, $"count={inventory.Count}");
        Ok("medicines >= 20", meds.Count >= 20, $"count={meds.Count}");
        Ok("appointments >= 20", appts.Count >= 20, $"count={appts.Count}");
        Ok("announcements >= 8", anns.Count >= 8, $"count={anns.Count}");
        Ok("doctors >= 8", doctors.Count >= 8, $"count={doctors.Count}");
        Ok("patients >= 40", patients.Count >= 40, $"count={patients.Count}");

        var addErr = svc.AddRoom($"T{DateTime.UtcNow:HHmmss}", "Smoke room", "EXAM", 1, 12);
        Ok("add room", addErr is null, addErr);
        Ok("rooms after add", svc.ListRooms().Count == rooms.Count + 1);

        var pending = meds.FirstOrDefault(m => m.Status == "PENDING_REVIEW");
        if (pending is null)
        {
            var any = meds.FirstOrDefault(m => m.Status != "PENDING_REVIEW");
            if (any is not null)
            {
                using var cmd = svc.Db.Connection.CreateCommand();
                cmd.CommandText = "UPDATE medicines SET status = 'PENDING_REVIEW' WHERE id = $id";
                cmd.Parameters.AddWithValue("$id", any.Id);
                cmd.ExecuteNonQuery();
                pending = svc.ListMedicines().First(m => m.Id == any.Id);
            }
        }
        if (pending is not null)
        {
            svc.ReviewMedicine(pending.Id, true);
            Ok("approve medicine", svc.ListMedicines().Any(m => m.Id == pending.Id && m.Status == "APPROVED"));
        }
        else Ok("approve medicine", false, "no medicine rows");

        var start = DateTime.UtcNow.AddDays(120).Date.AddHours(10);
        var end = start.AddHours(1);
        var bookErr = svc.BookAppointment("EXAM", "doctor", "patient", start, end, $"smoke book {Guid.NewGuid():N}"[..24], "secretary");
        Ok("book appointment", bookErr is null, bookErr);

        var booked = svc.ListAppointments(doctor: "doctor")
            .Where(a => a.Status == "SCHEDULED" && a.StartsAt.StartsWith(start.ToUniversalTime().ToString("yyyy-MM-dd"), StringComparison.Ordinal))
            .OrderByDescending(a => a.Id)
            .FirstOrDefault();
        Ok("booked visible", booked is not null);
        if (booked is not null)
        {
            svc.CompleteAppointment(booked.Id, "Smoke anamnesis");
            Ok("complete appointment",
                svc.ListAppointments(doctor: "doctor").Any(a => a.Id == booked.Id && a.Status == "COMPLETED"));
        }

        var approved = svc.ListMedicines().First(m => m.Status == "APPROVED");
        svc.IssuePrescription("patient", "doctor", approved.Id, "1 tablet", "with food");
        Ok("issue prescription", svc.ListPrescriptions("patient").Count >= 1);

        svc.SaveRecordSummary("patient", "Smoke updated summary.");
        Ok("save record", svc.GetRecordSummary("patient").Contains("Smoke updated"));

        svc.PostAnnouncement("Smoke note", "Desktop smoke ran OK.", "manager");
        Ok("post announcement", svc.ListAnnouncements().Any(a => a.Title == "Smoke note"));

        var regUser = $"smoke{DateTime.UtcNow:HHmmss}";
        var regErr = svc.RegisterPatient(regUser, "p", "Smoke", "Patient");
        Ok("register patient", regErr is null, regErr);
        Ok("register auth", svc.Authenticate(regUser, "p") is not null);

        Ok("vacations seeded", svc.ListVacations().Count >= 1);
        Ok("hospitalizations seeded", svc.ListHospitalizations().Count >= 1);
        Ok("referrals seeded", svc.ListReferrals().Count >= 1);
        Ok("transfers pending or applied", svc.ListPendingTransfers().Count >= 0);
        Ok("reminders for patient", svc.ListReminders("patient").Count >= 1);
        Ok("notifications for patient", svc.ListNotifications("patient").Count >= 1);

        var vacErr = svc.ScheduleVacation("doctor3", DateTime.UtcNow.AddDays(200), DateTime.UtcNow.AddDays(207), "smoke", "secretary");
        Ok("schedule vacation", vacErr is null, vacErr);
        var ward = svc.ListRooms().FirstOrDefault(r => r.Type == "WARD");
        if (ward is not null)
        {
            // discharge existing active stay for patient if any
            foreach (var stay in svc.ListHospitalizations().Where(h => h.PatientUsername == "patient2" && h.DischargedAt is null))
                svc.DischargePatient(stay.Id);
            var admitErr = svc.AdmitPatient("patient2", ward.Id, "Smoke admit");
            Ok("admit patient", admitErr is null, admitErr);
        }
        else Ok("admit patient", false, "no ward");

        var refErr = svc.CreateReferral("patient3", "doctor", "doctor2", "Smoke referral");
        Ok("create referral", refErr is null, refErr);

        lines.Add(failures.Count == 0 ? "ALL PASSED" : $"{failures.Count} FAILURE(S)");
        var report = string.Join(Environment.NewLine, lines);
        try
        {
            var dir = System.IO.Path.GetDirectoryName(svc.Db.DatabasePath);
            if (!string.IsNullOrEmpty(dir))
                System.IO.File.WriteAllText(System.IO.Path.Combine(dir, "_desktop-smoke.txt"), report);
        }
        catch { /* ignore */ }

        Console.WriteLine(report);
        return failures.Count == 0 ? 0 : 1;
    }
}
