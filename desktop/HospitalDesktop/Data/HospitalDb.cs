using System.IO;
using HospitalDesktop.Domain;
using Microsoft.Data.Sqlite;

namespace HospitalDesktop.Data;

public sealed class HospitalDb : IDisposable
{
    private readonly SqliteConnection _connection;

    public HospitalDb(string dbPath)
    {
        var dir = global::System.IO.Path.GetDirectoryName(dbPath);
        if (!string.IsNullOrEmpty(dir))
            Directory.CreateDirectory(dir);
        DatabasePath = dbPath;
        _connection = new SqliteConnection($"Data Source={dbPath}");
        _connection.Open();
        using var pragma = _connection.CreateCommand();
        pragma.CommandText = "PRAGMA foreign_keys = ON;";
        pragma.ExecuteNonQuery();
        EnsureSchema();
    }

    public SqliteConnection Connection => _connection;
    public string DatabasePath { get; }

    public static string ResolveDefaultPath()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir != null)
        {
            if (Directory.Exists(System.IO.Path.Combine(dir.FullName, "_legacy-1.0.0")))
            {
                var data = System.IO.Path.Combine(dir.FullName, "data");
                Directory.CreateDirectory(data);
                return System.IO.Path.Combine(data, "hospital-desktop.db");
            }
            if (File.Exists(System.IO.Path.Combine(dir.FullName, "HospitalDesktop.csproj")))
            {
                var data = System.IO.Path.Combine(dir.Parent!.FullName, "data");
                Directory.CreateDirectory(data);
                return System.IO.Path.Combine(data, "hospital-desktop.db");
            }
            dir = dir.Parent;
        }

        var fallback = System.IO.Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "HospitalManagementSuite");
        Directory.CreateDirectory(fallback);
        return System.IO.Path.Combine(fallback, "hospital-desktop.db");
    }

    public static HospitalDb OpenDefault()
    {
        return new HospitalDb(ResolveDefaultPath());
    }

    public void EnsureSchema()
    {
        using var cmd = _connection.CreateCommand();
        cmd.CommandText = """
            CREATE TABLE IF NOT EXISTS meta (
              key TEXT PRIMARY KEY,
              value TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS users (
              username TEXT PRIMARY KEY,
              password_hash TEXT NOT NULL,
              first_name TEXT NOT NULL,
              last_name TEXT NOT NULL,
              date_of_birth TEXT NOT NULL,
              gender TEXT NOT NULL,
              role TEXT NOT NULL,
              specialty TEXT,
              blood_type TEXT,
              allergens TEXT NOT NULL DEFAULT '[]',
              spam_score INTEGER NOT NULL DEFAULT 0,
              suspended_until TEXT
            );
            CREATE TABLE IF NOT EXISTS rooms (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              code TEXT NOT NULL UNIQUE,
              name TEXT NOT NULL,
              type TEXT NOT NULL,
              floor INTEGER NOT NULL,
              area_sqm INTEGER NOT NULL,
              status TEXT NOT NULL DEFAULT 'AVAILABLE'
            );
            CREATE TABLE IF NOT EXISTS inventory_items (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              room_id INTEGER NOT NULL REFERENCES rooms(id),
              name TEXT NOT NULL,
              kind TEXT NOT NULL,
              quantity INTEGER NOT NULL DEFAULT 1
            );
            CREATE TABLE IF NOT EXISTS appointments (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              type TEXT NOT NULL,
              status TEXT NOT NULL DEFAULT 'SCHEDULED',
              doctor_username TEXT NOT NULL REFERENCES users(username),
              patient_username TEXT NOT NULL REFERENCES users(username),
              room_id INTEGER REFERENCES rooms(id),
              starts_at TEXT NOT NULL,
              ends_at TEXT NOT NULL,
              anamnesis TEXT NOT NULL DEFAULT '',
              notes TEXT NOT NULL DEFAULT '',
              created_by TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS medical_records (
              patient_username TEXT PRIMARY KEY REFERENCES users(username),
              summary TEXT NOT NULL DEFAULT ''
            );
            CREATE TABLE IF NOT EXISTS medicines (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              code TEXT NOT NULL UNIQUE,
              name TEXT NOT NULL,
              description TEXT NOT NULL DEFAULT '',
              status TEXT NOT NULL DEFAULT 'APPROVED'
            );
            CREATE TABLE IF NOT EXISTS prescriptions (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              patient_username TEXT NOT NULL REFERENCES users(username),
              doctor_username TEXT NOT NULL REFERENCES users(username),
              medicine_id INTEGER NOT NULL REFERENCES medicines(id),
              dosage TEXT NOT NULL,
              instructions TEXT NOT NULL DEFAULT '',
              issued_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS announcements (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              title TEXT NOT NULL,
              body TEXT NOT NULL,
              author_username TEXT NOT NULL REFERENCES users(username),
              created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS equipment_transfers (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              from_room_id INTEGER NOT NULL REFERENCES rooms(id),
              to_room_id INTEGER NOT NULL REFERENCES rooms(id),
              item_name TEXT NOT NULL,
              quantity INTEGER NOT NULL DEFAULT 1,
              apply_at TEXT NOT NULL,
              applied INTEGER NOT NULL DEFAULT 0,
              created_by TEXT NOT NULL REFERENCES users(username)
            );
            CREATE TABLE IF NOT EXISTS room_jobs (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              room_id INTEGER NOT NULL REFERENCES rooms(id),
              job_type TEXT NOT NULL,
              details TEXT NOT NULL DEFAULT '',
              apply_at TEXT NOT NULL,
              applied INTEGER NOT NULL DEFAULT 0,
              created_by TEXT NOT NULL REFERENCES users(username)
            );
            CREATE TABLE IF NOT EXISTS vacations (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              doctor_username TEXT NOT NULL REFERENCES users(username),
              starts_at TEXT NOT NULL,
              ends_at TEXT NOT NULL,
              status TEXT NOT NULL DEFAULT 'SCHEDULED',
              note TEXT NOT NULL DEFAULT '',
              created_by TEXT NOT NULL REFERENCES users(username)
            );
            CREATE TABLE IF NOT EXISTS hospitalizations (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              patient_username TEXT NOT NULL REFERENCES users(username),
              room_id INTEGER NOT NULL REFERENCES rooms(id),
              reason TEXT NOT NULL,
              admitted_at TEXT NOT NULL,
              discharged_at TEXT
            );
            CREATE TABLE IF NOT EXISTS referrals (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              patient_username TEXT NOT NULL REFERENCES users(username),
              from_doctor TEXT NOT NULL REFERENCES users(username),
              to_doctor TEXT NOT NULL REFERENCES users(username),
              reason TEXT NOT NULL,
              created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS reminders (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              patient_username TEXT NOT NULL REFERENCES users(username),
              medicine_name TEXT NOT NULL,
              remind_at TEXT NOT NULL,
              note TEXT NOT NULL DEFAULT ''
            );
            CREATE TABLE IF NOT EXISTS notifications (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              username TEXT NOT NULL REFERENCES users(username),
              title TEXT NOT NULL,
              body TEXT NOT NULL,
              read INTEGER NOT NULL DEFAULT 0,
              created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS surveys (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              username TEXT NOT NULL REFERENCES users(username),
              target_type TEXT NOT NULL,
              target_id TEXT NOT NULL,
              rating INTEGER NOT NULL,
              comment TEXT NOT NULL DEFAULT '',
              created_at TEXT NOT NULL
            );
            """;
        cmd.ExecuteNonQuery();
    }

    public void Dispose() => _connection.Dispose();
}
