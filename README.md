# Hospital Management Suite

<p align="center">
  <img src="docs/assets/logo.png" alt="Hospital Management Suite" width="96">
</p>

Four-role hospital desk: manager, secretary, doctor, and patient.

The program’s own name is **Bolnica**. English: **Hospital Management Suite**. Serbian: **Bolnica**. Hungarian: **Kórházkezelő rendszer**. Current software version: **2.0.0** (web + desktop).

## Run 2.0.0 desktop (WPF)

Same family as 1.0.0 (Windows desktop), modernized: **WPF on .NET 8**, English identifiers, **SQLite** + bcrypt instead of JSON + plaintext.

Requirements: **.NET 8 SDK**.

From the repo root: `run-desktop-2.0.0.bat`. By hand:

```text
cd desktop\HospitalDesktop
dotnet build -c Release
bin\Release\net8.0-windows\HospitalDesktop.exe
```

Demo accounts match the web app (`manager`/`m`, `secretary`/`s`, `doctor`/`d`, `patient`/`p`). Database: `data/hospital-desktop.db`.

## Run 2.0.0 web

Requirements: **Node.js 22+**.

```text
cd app
npm install
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Script | What it does |
|---|---|
| `npm run dev` | Next.js development server |
| `npm run check` | Lint + Vitest |
| `npm run ci:local` | Lint + Vitest + production build |
| `npm run test:e2e` | Playwright smoke tests |
| `npm run db:reset` | Wipe and reseed SQLite |

Persistence is SQLite at `data/hospital.db` (`schemaVersion` 1). Passwords are bcrypt-hashed. Sessions are httpOnly cookies. Code identifiers and seed data are English only. Appointment “today” uses a fixed **seed clock** (`2026-09-07`) so calendars stay populated.

### Demo accounts

| Username | Password | Role |
|---|---|---|
| `manager` | `m` | Manager |
| `secretary` | `s` | Secretary |
| `doctor` | `d` | Doctor |
| `doctor2` | `d` | Doctor (Cardiology) |
| `patient` | `p` | Patient |
| `patient2` | `p` | Patient |

### What 2.0.0 does

- Role desks for manager, secretary, doctor, and patient
- Appointments (exam / operation / emergency) with conflict checks
- Medical records, therapies, referrals, prescriptions
- Medicine catalogue with doctor review queue
- Rooms, inventory, equipment transfers, and room jobs (applied when due vs seed clock)
- Announcements, notifications, medication reminders, surveys, feedback
- Patient anti-spam suspension after repeated self-booking / reschedule

Stack: **Next.js 16**, React 19, TypeScript, Tailwind v4, Drizzle ORM, better-sqlite3, Vitest, Playwright.

## Archive 1.0.0

The 2021 FTN course freeze stays under [`_legacy-1.0.0/`](_legacy-1.0.0/) at git commit `5b69c9c` (21 June 2021). It is a fork of [kukuckarastislav/SIMS_IS_Bolnica](https://github.com/kukuckarastislav/SIMS_IS_Bolnica). One WPF executable (`.NET Framework 4.7.2`) with nineteen JSON files. It is not the runtime for 2.0.0.

On Windows, from the repo root: `run-1.0.0.bat`. Details: [technical dossier 1.0.0](docs/markdown/technical-dossier.en.md).

### 1.0.0 demo accounts (plaintext as shipped)

| Username | Password | Role |
|---|---|---|
| `rastislavkukucka` | `sifra` | Manager |
| `mihajloostojic` | `sifra` | Secretary |
| `LasloUri` | `laci` | Doctor |
| `peraperic` | `pera` | Patient |

## Authors

| Role | Author | Index |
|---|---|---|
| Upravnik (manager) | Rastislav Kukučka | RA 129/2018 |
| Sekretar (secretary) | Mihajlo Ostojić | RA 134/2018 |
| Lekar (doctor) | Laslo Uri | RA 135/2018 |
| Pacijent (patient) | Milica Vučinić | RA 139/2018 |

Faculty of Technical Sciences, University of Novi Sad, Computing and Control Engineering.

## Technical dossier 1.0.0

| File | Contents |
|---|---|
| [docs/pdf/technical-dossier-1.0.0.pdf](docs/pdf/technical-dossier-1.0.0.pdf) | English + Serbian + Hungarian |
| [docs/pdf/technical-dossier-1.0.0.en.pdf](docs/pdf/technical-dossier-1.0.0.en.pdf) | English |
| [docs/pdf/technical-dossier-1.0.0.sr.pdf](docs/pdf/technical-dossier-1.0.0.sr.pdf) | Serbian |
| [docs/pdf/technical-dossier-1.0.0.hu.pdf](docs/pdf/technical-dossier-1.0.0.hu.pdf) | Hungarian |

## Layout

```text
app/                             2.0.0 web (Next.js)
desktop/HospitalDesktop/         2.0.0 desktop (WPF .NET 8)
data/                            SQLite DBs (gitignored)
_legacy-1.0.0/BolnicaProjekat/   WPF 1.0.0 freeze (.NET Framework 4.7.2)
_legacy-1.0.0/Dijagrami/         PowerDesigner drawings
_legacy-1.0.0/Revizije/          KT4 peer notes
docs/                            technical dossier 1.0.0
run-1.0.0.bat                    legacy WPF
run-desktop-2.0.0.bat            desktop 2.0.0
```
