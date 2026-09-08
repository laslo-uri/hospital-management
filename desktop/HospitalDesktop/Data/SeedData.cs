using HospitalDesktop.Domain;
using Microsoft.Data.Sqlite;

namespace HospitalDesktop.Data;

public static class SeedData
{
    public const string SchemaVersion = "3";

    public static void EnsureSeeded(HospitalDb db)
    {
        using var check = db.Connection.CreateCommand();
        check.CommandText = "SELECT value FROM meta WHERE key = 'schemaVersion'";
        var version = check.ExecuteScalar() as string;
        if (version == SchemaVersion) return;

        using var tx = db.Connection.BeginTransaction();
        Wipe(db.Connection, tx);

        void User(string username, string password, string first, string last, string role,
            string? specialty = null, string? blood = null, string allergens = "[]",
            string dob = "1990-01-01", string gender = "MALE")
        {
            using var cmd = db.Connection.CreateCommand();
            cmd.Transaction = tx;
            cmd.CommandText = """
                INSERT INTO users(username, password_hash, first_name, last_name, date_of_birth, gender, role, specialty, blood_type, allergens)
                VALUES ($u, $p, $f, $l, $dob, $g, $r, $s, $b, $a)
                """;
            cmd.Parameters.AddWithValue("$u", username);
            cmd.Parameters.AddWithValue("$p", BCrypt.Net.BCrypt.HashPassword(password));
            cmd.Parameters.AddWithValue("$f", first);
            cmd.Parameters.AddWithValue("$l", last);
            cmd.Parameters.AddWithValue("$dob", dob);
            cmd.Parameters.AddWithValue("$g", gender);
            cmd.Parameters.AddWithValue("$r", role);
            cmd.Parameters.AddWithValue("$s", (object?)specialty ?? DBNull.Value);
            cmd.Parameters.AddWithValue("$b", (object?)blood ?? DBNull.Value);
            cmd.Parameters.AddWithValue("$a", allergens);
            cmd.ExecuteNonQuery();
        }

        // Demo accounts (unchanged passwords)
        User("manager", "m", "Rastislav", "Kukucka", "MANAGER", dob: "1980-03-12", gender: "MALE");
        User("manager2", "m", "Ivana", "Horvat", "MANAGER", dob: "1982-06-01", gender: "FEMALE");
        User("secretary", "s", "Mihajlo", "Ostojic", "SECRETARY", dob: "1988-07-22", gender: "MALE");
        User("secretary2", "s", "Sara", "Nikolic", "SECRETARY", dob: "1991-04-14", gender: "FEMALE");
        User("doctor", "d", "Laslo", "Uri", "DOCTOR", "Internal medicine", dob: "1990-01-15");
        User("doctor2", "d", "Ana", "Petrovic", "DOCTOR", "Surgery", dob: "1985-11-02", gender: "FEMALE");
        User("doctor3", "d", "Marko", "Jovanovic", "DOCTOR", "Cardiology", dob: "1984-08-20");
        User("doctor4", "d", "Jelena", "Stojanovic", "DOCTOR", "Pediatrics", dob: "1989-02-11", gender: "FEMALE");
        User("doctor5", "d", "Nikola", "Ilic", "DOCTOR", "Orthopedics", dob: "1983-12-05");
        User("doctor6", "d", "Milica", "Djordjevic", "DOCTOR", "Neurology", dob: "1987-09-30", gender: "FEMALE");
        User("doctor7", "d", "Stefan", "Popovic", "DOCTOR", "Radiology", dob: "1986-05-17");
        User("doctor8", "d", "Tamara", "Simic", "DOCTOR", "Dermatology", dob: "1992-03-08", gender: "FEMALE");
        User("patient", "p", "Pera", "Peric", "PATIENT", blood: "A+", allergens: "[\"Penicillin\"]", dob: "1995-05-05");
        User("patient2", "p", "Milica", "Vucinic", "PATIENT", blood: "O-", dob: "1992-09-18", gender: "FEMALE");

        var firstNames = new[]
        {
            "Luka", "Maja", "Petar", "Nina", "Filip", "Iva", "Dusan", "Elena", "Goran", "Katarina",
            "Vladimir", "Sofija", "Bojan", "Teodora", "Aleksa", "Marija", "Nemanja", "Jovana", "Uros", "Anja",
            "Darko", "Ivana", "Sasa", "Olga", "Milos", "Danica", "Zoran", "Vesna", "Dejan", "Lidija",
            "Igor", "Sanja", "Branko", "Tatjana", "Radovan", "Dragana", "Slobodan", "Mirjana", "Predrag", "Natasa",
        };
        var lastNames = new[]
        {
            "Markovic", "Jankovic", "Nikolic", "Petrovic", "Djokovic", "Savic", "Kostic", "Tomic", "Pavlovic", "Stankovic",
        };
        var bloods = new[] { "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-" };
        var allergenOpts = new[] { "[]", "[\"Penicillin\"]", "[\"Pollen\"]", "[\"Latex\"]", "[\"Aspirin\"]", "[\"Peanuts\"]" };

        for (var i = 3; i <= 50; i++)
        {
            var fn = firstNames[(i - 3) % firstNames.Length];
            var ln = lastNames[(i - 3) % lastNames.Length];
            var gender = i % 2 == 0 ? "FEMALE" : "MALE";
            var year = 1965 + (i % 40);
            User($"patient{i}", "p", fn, ln, "PATIENT",
                blood: bloods[i % bloods.Length],
                allergens: allergenOpts[i % allergenOpts.Length],
                dob: $"{year}-{(i % 12) + 1:D2}-{(i % 27) + 1:D2}",
                gender: gender);
        }

        long Room(string code, string name, string type, int floor, int area, string status = "AVAILABLE")
        {
            using var cmd = db.Connection.CreateCommand();
            cmd.Transaction = tx;
            cmd.CommandText = """
                INSERT INTO rooms(code, name, type, floor, area_sqm, status)
                VALUES ($c, $n, $t, $f, $a, $st);
                SELECT last_insert_rowid();
                """;
            cmd.Parameters.AddWithValue("$c", code);
            cmd.Parameters.AddWithValue("$n", name);
            cmd.Parameters.AddWithValue("$t", type);
            cmd.Parameters.AddWithValue("$f", floor);
            cmd.Parameters.AddWithValue("$a", area);
            cmd.Parameters.AddWithValue("$st", status);
            return (long)cmd.ExecuteScalar()!;
        }

        var roomIds = new List<long>();
        for (var i = 1; i <= 12; i++)
            roomIds.Add(Room($"E{100 + i}", $"Exam room {i}", "EXAM", 1 + (i > 6 ? 1 : 0), 14 + (i % 6)));
        for (var i = 1; i <= 6; i++)
            roomIds.Add(Room($"OR{i}", $"Operating room {i}", "OR", 2, 36 + i * 2));
        for (var i = 1; i <= 8; i++)
            roomIds.Add(Room($"W{200 + i}", $"Ward {i}", "WARD", 2 + (i > 4 ? 1 : 0), 48 + i));
        for (var i = 1; i <= 4; i++)
            roomIds.Add(Room($"WH{i}", $"Warehouse {i}", "WAREHOUSE", 0, 60 + i * 10));
        for (var i = 1; i <= 6; i++)
            roomIds.Add(Room($"O{i}", $"Ordinary room {i}", "ORDINARY", 1, 12 + i));
        roomIds.Add(Room("REN1", "Ward under renovation", "WARD", 3, 50, "RENOVATION"));

        void Inv(long roomId, string name, string kind, int qty)
        {
            using var cmd = db.Connection.CreateCommand();
            cmd.Transaction = tx;
            cmd.CommandText = "INSERT INTO inventory_items(room_id, name, kind, quantity) VALUES ($r, $n, $k, $q)";
            cmd.Parameters.AddWithValue("$r", roomId);
            cmd.Parameters.AddWithValue("$n", name);
            cmd.Parameters.AddWithValue("$k", kind);
            cmd.Parameters.AddWithValue("$q", qty);
            cmd.ExecuteNonQuery();
        }

        var staticItems = new[] { "Examination table", "Surgical lamp", "Hospital bed", "Desk", "Monitor stand", "X-ray shield" };
        var dynamicItems = new[]
        {
            "Blood pressure cuff", "Wheelchair", "Stethoscope", "IV stand", "Gloves box", "Thermometer pack",
            "Defibrillator pads", "Oxygen tank", "Syringe pack", "Bandage kit", "ECG leads", "Pulse oximeter",
        };
        for (var i = 0; i < roomIds.Count; i++)
        {
            Inv(roomIds[i], staticItems[i % staticItems.Length], "STATIC", 1 + (i % 2));
            Inv(roomIds[i], dynamicItems[i % dynamicItems.Length], "DYNAMIC", 2 + (i % 8));
            if (i % 3 == 0)
                Inv(roomIds[i], dynamicItems[(i + 3) % dynamicItems.Length], "DYNAMIC", 5 + (i % 10));
        }

        string AddHours(int h) =>
            DateTime.Parse(AppClock.SeedClock).ToUniversalTime().AddHours(h).ToString("o");

        void Appt(string type, string doctor, string patient, long? room, string start, string end, string notes, string status = "SCHEDULED")
        {
            using var cmd = db.Connection.CreateCommand();
            cmd.Transaction = tx;
            cmd.CommandText = """
                INSERT INTO appointments(type, status, doctor_username, patient_username, room_id, starts_at, ends_at, notes, created_by)
                VALUES ($t, $st, $d, $p, $r, $s, $e, $n, 'secretary')
                """;
            cmd.Parameters.AddWithValue("$t", type);
            cmd.Parameters.AddWithValue("$st", status);
            cmd.Parameters.AddWithValue("$d", doctor);
            cmd.Parameters.AddWithValue("$p", patient);
            cmd.Parameters.AddWithValue("$r", (object?)room ?? DBNull.Value);
            cmd.Parameters.AddWithValue("$s", start);
            cmd.Parameters.AddWithValue("$e", end);
            cmd.Parameters.AddWithValue("$n", notes);
            cmd.ExecuteNonQuery();
        }

        var doctors = new[] { "doctor", "doctor2", "doctor3", "doctor4", "doctor5", "doctor6", "doctor7", "doctor8" };
        var types = new[] { "EXAM", "EXAM", "EXAM", "OPERATION", "EMERGENCY" };
        var statuses = new[] { "SCHEDULED", "SCHEDULED", "SCHEDULED", "COMPLETED", "CANCELLED" };
        for (var i = 0; i < 36; i++)
        {
            var doc = doctors[i % doctors.Length];
            var pat = i < 2 ? (i == 0 ? "patient" : "patient2") : $"patient{(i % 48) + 3}";
            var room = roomIds[i % roomIds.Count];
            var startH = 1 + (i * 2);
            Appt(types[i % types.Length], doc, pat, room, AddHours(startH), AddHours(startH + 1),
                $"Visit #{i + 1}", statuses[i % statuses.Length]);
        }

        using (var cmd = db.Connection.CreateCommand())
        {
            cmd.Transaction = tx;
            var sb = new System.Text.StringBuilder();
            sb.Append("INSERT INTO medical_records(patient_username, summary) VALUES ");
            sb.Append("('patient', 'Generally healthy. Penicillin allergy documented.'),");
            sb.Append("('patient2', 'Seasonal allergies. BP monitoring advised.')");
            for (var i = 3; i <= 50; i++)
            {
                sb.Append($",('patient{i}', 'Seed record for patient{i}. Last check-up within normal range.')");
            }
            sb.Append(';');
            cmd.CommandText = sb.ToString();
            cmd.ExecuteNonQuery();
        }

        using (var cmd = db.Connection.CreateCommand())
        {
            cmd.Transaction = tx;
            cmd.CommandText = """
                INSERT INTO medicines(code, name, description, status) VALUES
                ('IBU400', 'Ibuprofen 400mg', 'NSAID pain relief', 'APPROVED'),
                ('AMOX500', 'Amoxicillin 500mg', 'Antibiotic', 'APPROVED'),
                ('PARA500', 'Paracetamol 500mg', 'Analgesic / antipyretic', 'APPROVED'),
                ('METF500', 'Metformin 500mg', 'Type 2 diabetes', 'APPROVED'),
                ('ATOR20', 'Atorvastatin 20mg', 'Cholesterol', 'APPROVED'),
                ('OMEP20', 'Omeprazole 20mg', 'PPI for GERD', 'APPROVED'),
                ('LOS50', 'Losartan 50mg', 'Hypertension', 'APPROVED'),
                ('SER100', 'Sertraline 100mg', 'SSRI antidepressant', 'APPROVED'),
                ('LEV500', 'Levothyroxine 50mcg', 'Thyroid replacement', 'APPROVED'),
                ('CEF500', 'Cefalexin 500mg', 'Cephalosporin antibiotic', 'APPROVED'),
                ('DIC50', 'Diclofenac 50mg', 'NSAID', 'APPROVED'),
                ('AZI250', 'Azithromycin 250mg', 'Macrolide antibiotic', 'APPROVED'),
                ('INSULIN', 'Insulin glargine', 'Long-acting insulin', 'APPROVED'),
                ('SALB', 'Salbutamol inhaler', 'Bronchodilator', 'APPROVED'),
                ('WAR5', 'Warfarin 5mg', 'Anticoagulant', 'APPROVED'),
                ('PREDN20', 'Prednisone 20mg', 'Corticosteroid', 'APPROVED'),
                ('GAB300', 'Gabapentin 300mg', 'Neuropathic pain', 'APPROVED'),
                ('AMOXCLAV', 'Amoxicillin/clavulanate', 'Broad antibiotic', 'APPROVED'),
                ('NEW001', 'Novamed Experimental', 'Awaiting review', 'PENDING_REVIEW'),
                ('NEW002', 'CardioX Trial', 'Cardiology trial drug', 'PENDING_REVIEW'),
                ('NEW003', 'NeuroCalm Pilot', 'Neurology pilot compound', 'PENDING_REVIEW'),
                ('NEW004', 'DermClear Study', 'Dermatology study agent', 'PENDING_REVIEW'),
                ('REJ001', 'Rejected Compound A', 'Failed review', 'REJECTED'),
                ('REJ002', 'Rejected Compound B', 'Safety concerns', 'REJECTED');
                """;
            cmd.ExecuteNonQuery();
        }

        using (var cmd = db.Connection.CreateCommand())
        {
            cmd.Transaction = tx;
            cmd.CommandText = """
                INSERT INTO prescriptions(patient_username, doctor_username, medicine_id, dosage, instructions, issued_at)
                SELECT 'patient', 'doctor', id, '1 tablet every 8 hours', 'Take with food', $issued FROM medicines WHERE code = 'IBU400';
                INSERT INTO prescriptions(patient_username, doctor_username, medicine_id, dosage, instructions, issued_at)
                SELECT 'patient2', 'doctor3', id, '500 mg twice daily', 'Complete full course', $issued FROM medicines WHERE code = 'AMOX500';
                INSERT INTO prescriptions(patient_username, doctor_username, medicine_id, dosage, instructions, issued_at)
                SELECT 'patient3', 'doctor4', id, '1 tablet daily', 'Morning', $issued FROM medicines WHERE code = 'PARA500';
                INSERT INTO prescriptions(patient_username, doctor_username, medicine_id, dosage, instructions, issued_at)
                SELECT 'patient5', 'doctor', id, '500 mg with meals', 'Diabetes protocol', $issued FROM medicines WHERE code = 'METF500';
                INSERT INTO prescriptions(patient_username, doctor_username, medicine_id, dosage, instructions, issued_at)
                SELECT 'patient8', 'doctor5', id, '20 mg nightly', 'Cholesterol', $issued FROM medicines WHERE code = 'ATOR20';
                INSERT INTO prescriptions(patient_username, doctor_username, medicine_id, dosage, instructions, issued_at)
                SELECT 'patient12', 'doctor6', id, '50 mg daily', 'BP control', $issued FROM medicines WHERE code = 'LOS50';
                INSERT INTO prescriptions(patient_username, doctor_username, medicine_id, dosage, instructions, issued_at)
                SELECT 'patient20', 'doctor8', id, '2 puffs as needed', 'Asthma rescue', $issued FROM medicines WHERE code = 'SALB';
                INSERT INTO prescriptions(patient_username, doctor_username, medicine_id, dosage, instructions, issued_at)
                SELECT 'patient30', 'doctor2', id, 'as directed', 'Post-op pain', $issued FROM medicines WHERE code = 'DIC50';
                INSERT INTO announcements(title, body, author_username, created_at) VALUES
                ('Flu vaccination week', 'Walk-in vaccinations in Exam rooms E101–E104.', 'secretary', $issued),
                ('OR maintenance', 'Operating room OR3 closed Friday afternoon for lamp calibration.', 'manager', $issued),
                ('Blood drive', 'Voluntary blood donation in Ward W201 this Thursday.', 'secretary2', $issued),
                ('Parking update', 'Visitor parking levels B1–B2 reopen after resurfacing.', 'manager2', $issued),
                ('Pediatrics clinic hours', 'Pediatrics extended hours until 19:00 next week.', 'secretary', $issued),
                ('Lab results portal', 'Patients can request printed lab summaries at the secretary desk.', 'secretary2', $issued),
                ('Fire drill', 'Campus fire drill Monday 10:00 — expect short delays.', 'manager', $issued),
                ('New neurology slots', 'Dr. Djordjevic opened extra neurology exam slots.', 'secretary', $issued),
                ('Pharmacy restock', 'Common antibiotics restocked in Warehouse WH1.', 'manager', $issued),
                ('Visitor policy', 'One visitor per inpatient after 16:00 on weekdays.', 'manager2', $issued);
                INSERT INTO equipment_transfers(from_room_id, to_room_id, item_name, quantity, apply_at, applied, created_by)
                SELECT r1.id, r2.id, 'Monitor cart', 1, $soon, 0, 'manager'
                FROM rooms r1, rooms r2 WHERE r1.code = 'WH1' AND r2.code = 'E101';
                INSERT INTO equipment_transfers(from_room_id, to_room_id, item_name, quantity, apply_at, applied, created_by)
                SELECT r1.id, r2.id, 'IV stand', 2, $later, 0, 'manager2'
                FROM rooms r1, rooms r2 WHERE r1.code = 'WH1' AND r2.code = 'W201';
                INSERT INTO room_jobs(room_id, job_type, details, apply_at, applied, created_by)
                SELECT id, 'RENOVATION', 'Repaint ward walls', $soon, 0, 'manager' FROM rooms WHERE code = 'W201';
                INSERT INTO room_jobs(room_id, job_type, details, apply_at, applied, created_by)
                SELECT id, 'SPLIT', 'Split consult bay', $later, 0, 'manager2' FROM rooms WHERE code = 'E110' OR code = 'E101' LIMIT 1;
                INSERT INTO vacations(doctor_username, starts_at, ends_at, status, note, created_by) VALUES
                ('doctor2', $vacStart, $vacEnd, 'SCHEDULED', 'Annual leave', 'secretary'),
                ('doctor5', $vacStart2, $vacEnd2, 'SCHEDULED', 'Conference', 'secretary2');
                INSERT INTO hospitalizations(patient_username, room_id, reason, admitted_at, discharged_at)
                SELECT 'patient', id, 'Post-op observation', $admit, NULL FROM rooms WHERE code = 'W201' LIMIT 1;
                INSERT INTO hospitalizations(patient_username, room_id, reason, admitted_at, discharged_at)
                SELECT 'patient4', id, 'Pneumonia', $admitOld, $issued FROM rooms WHERE code = 'W202' OR code = 'W201' LIMIT 1;
                INSERT INTO referrals(patient_username, from_doctor, to_doctor, reason, created_at) VALUES
                ('patient2', 'doctor', 'doctor2', 'Surgical consult', $issued),
                ('patient5', 'doctor3', 'doctor', 'Internal medicine follow-up', $issued);
                INSERT INTO reminders(patient_username, medicine_name, remind_at, note) VALUES
                ('patient', 'Ibuprofen 400mg', $soon, 'Take with food'),
                ('patient2', 'Amoxicillin 500mg', $later, 'Complete course');
                INSERT INTO notifications(username, title, body, read, created_at) VALUES
                ('patient', 'Welcome', 'Your patient portal is ready.', 0, $issued),
                ('doctor', 'Referral inbox', 'You have new referrals.', 0, $issued),
                ('patient', 'Reminder', 'Medicine reminder set for today.', 0, $issued);
                INSERT INTO surveys(username, target_type, target_id, rating, comment, created_at) VALUES
                ('patient', 'HOSPITAL', 'main', 5, 'Smooth check-in.', $issued),
                ('patient2', 'DOCTOR', 'doctor', 4, 'Clear explanation.', $issued);
                INSERT INTO meta(key, value) VALUES ('schemaVersion', $ver), ('seedClock', $clock);
                """;
            cmd.Parameters.AddWithValue("$issued", AddHours(-24));
            cmd.Parameters.AddWithValue("$soon", AddHours(2));
            cmd.Parameters.AddWithValue("$later", AddHours(48));
            cmd.Parameters.AddWithValue("$vacStart", AddHours(24 * 14));
            cmd.Parameters.AddWithValue("$vacEnd", AddHours(24 * 21));
            cmd.Parameters.AddWithValue("$vacStart2", AddHours(24 * 30));
            cmd.Parameters.AddWithValue("$vacEnd2", AddHours(24 * 37));
            cmd.Parameters.AddWithValue("$admit", AddHours(-36));
            cmd.Parameters.AddWithValue("$admitOld", AddHours(-72));
            cmd.Parameters.AddWithValue("$clock", AppClock.SeedClock);
            cmd.Parameters.AddWithValue("$ver", SchemaVersion);
            cmd.ExecuteNonQuery();
        }

        tx.Commit();
    }

    static void Wipe(SqliteConnection connection, SqliteTransaction tx)
    {
        using var cmd = connection.CreateCommand();
        cmd.Transaction = tx;
        cmd.CommandText = """
            DELETE FROM surveys;
            DELETE FROM notifications;
            DELETE FROM reminders;
            DELETE FROM referrals;
            DELETE FROM hospitalizations;
            DELETE FROM vacations;
            DELETE FROM room_jobs;
            DELETE FROM equipment_transfers;
            DELETE FROM announcements;
            DELETE FROM prescriptions;
            DELETE FROM medicines;
            DELETE FROM medical_records;
            DELETE FROM appointments;
            DELETE FROM inventory_items;
            DELETE FROM rooms;
            DELETE FROM users;
            DELETE FROM meta;
            """;
        cmd.ExecuteNonQuery();
    }
}
