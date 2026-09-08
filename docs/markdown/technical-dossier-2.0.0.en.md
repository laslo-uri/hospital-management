## Document control

| Field | Value |
|---|---|
| Title | Technical Dossier 2.0.0, Hospital Management Suite 2.0.0 |
| Dossier version | 2.0.0 |
| Software version | 2.0.0 |
| Display brand | **Hospital** / Hospital Management Suite (cyan `#009CDE`, doctor burgundy `#630000`) |
| Predecessor | Technical dossier 1.0.0 / software 1.0.0 (**Bolnica**), git freeze `5b69c9c` |
| Rewrite | 7 September 2026 |
| Compiled | 7 September 2026 |
| Authors | Rastislav Kukučka (RA 129/2018), Mihajlo Ostojić (RA 134/2018), Laslo Uri (RA 135/2018), Milica Vučinić (RA 139/2018) |
| Archive remote | [github.com/laslo-uri/HospitalManagementSuite](https://github.com/laslo-uri/HospitalManagementSuite) |
| Institution | Faculty of Technical Sciences, University of Novi Sad, Computing and Control Engineering |

## 1. Purpose

This is the **2.0.0** technical dossier. It describes **Hospital Management Suite** after the rewrite: the same four roles as 1.0.0 (manager, secretary, doctor, patient), with English identifiers, a Next.js 16 web desk, a .NET 8 WPF desktop desk, SQLite (`schemaVersion` / `SCHEMA_VERSION` **2**), hashed web auth, and EN / SR / HU UI.

It is the pair of [technical dossier 1.0.0](technical-dossier.en.md). That document is the freeze under `_legacy-1.0.0/` (branded **Bolnica**). This one is the system that replaced it for day-to-day demos.

Built and checked on 7 September 2026 on Windows. Web: `npm run check` and production build. Desktop: Release build and `--smoke` runner.

## 2. Identification

| Item | Detail |
|---|---|
| Display name | Hospital Management Suite |
| Archive / course name | Bolnica (1.0.0 freeze only) |
| English product name | Hospital Management Suite |
| Serbian product name | Bolnica / upravljanje bolnicom |
| Hungarian product name | Kórházkezelő rendszer |
| Web entry | `app/` Next.js App Router |
| Desktop entry | `desktop/HospitalDesktop/` (.NET 8 WPF) |
| Kind | Multi-role web app + matching Windows desktop client |
| UI | React 19 + Tailwind v4 (web); WPF frameless chrome (desktop) |
| Runtime | Node.js `>=22` (web); .NET 8 (desktop) |
| Persistence | SQLite — web `app/data/`, desktop local DB; seed version **2** |
| Auth | Web: POST login, bcrypt, httpOnly session cookie; desktop: local session after login |
| UI languages | English (default), Serbian, Hungarian |
| Visual language | 1.0.0 cyan / burgundy / cream, original role icons, polished layout |

## 3. Relationship to 1.0.0

| 1.0.0 | 2.0.0 |
|---|---|
| Brand **Bolnica**, Serbian chrome | Brand **Hospital**, EN/SR/HU strings |
| `_legacy-1.0.0/` WPF .NET Framework 4.7.2 | `app/` Next.js 16 + `desktop/` .NET 8 |
| Nineteen JSON files under `podaci/` | SQLite + seed version 2 (~10× denser demo) |
| Plaintext passwords | Web: bcrypt; desktop: demo accounts with local store |
| Mixed Serbian identifiers | English identifiers only in new code |
| Single OS + in-app chrome quirks | Frameless desktop caption bar; close = sign out |

The 1.0.0 tree stays runnable via `run-1.0.0.bat`. 2.0.0 does not call it. Launch 2.0.0 desktop with `run-desktop-2.0.0.bat`; web with `app/` (`npm run dev` / production start).

## 4. Scope

Local multi-role hospital desk: rooms and inventory, medicines review, appointments, announcements, patient self-service. Web is richer (room jobs, transfers, surveys, reminders, reschedule). Desktop mirrors the 1.0.0 four-window workflow with the same visual language.

**Honest gap vs full 1.0.0:** some legacy areas (vacations, hospitalizations, referrals, and a few secretary/doctor side flows) are still missing or thinner on desktop. Core four-role booking and facility loops work.

## 5. User interface — desktop 2.0.0

Screens captured from the .NET 8 WPF client on 7 September 2026.

![Login desktop 2.0.0](../assets/screenshots/10-login-2.0.0.png)

*Figure 1. Desktop login — cyan field, EN/SR/HU switcher, demo accounts.*

![Manager desktop 2.0.0](../assets/screenshots/11-manager-2.0.0.png)

*Figure 2. Manager desk — rooms, inventory, medicines, announcements.*

![Secretary desktop 2.0.0](../assets/screenshots/12-secretary-2.0.0.png)

*Figure 3. Secretary desk — appointments and patient register.*

![Doctor desktop 2.0.0](../assets/screenshots/13-doctor-2.0.0.png)

*Figure 4. Doctor desk — burgundy shell, calendar and medicine review.*

![Patient desktop 2.0.0](../assets/screenshots/14-patient-2.0.0.png)

*Figure 5. Patient desk — own appointments and notifications.*

## 6. User interface — web 2.0.0

Screens captured from Next.js against a local production build on 7 September 2026.

![Login web 2.0.0](../assets/screenshots/15-web-login-2.0.0.png)

*Figure 6. Web login — same brand colours and language switcher.*

![Manager web 2.0.0](../assets/screenshots/16-web-manager-2.0.0.png)

*Figure 7. Manager web desk — facility, jobs, inventory, medicines.*

![Secretary web 2.0.0](../assets/screenshots/17-web-secretary-2.0.0.png)

*Figure 8. Secretary web desk — schedule and communications.*

![Doctor web 2.0.0](../assets/screenshots/18-web-doctor-2.0.0.png)

*Figure 9. Doctor web desk.*

![Patient web 2.0.0](../assets/screenshots/19-web-patient-2.0.0.png)

*Figure 10. Patient web desk.*

## 7. Architecture

| Area | Path |
|---|---|
| Web routes | `app/src/app/` |
| Domain | `app/src/domain/` |
| Database (web) | `app/src/db/` |
| Auth / jobs | `app/src/server/` |
| i18n (web) | `app/src/i18n/` |
| Desktop UI | `desktop/HospitalDesktop/` (role windows, `Ui/`, `I18n/`) |
| Desktop data | `desktop/HospitalDesktop/Data/` |
| Legacy freeze | `_legacy-1.0.0/` |

Browser or WPF client → app layer → SQLite. Role guards on web mutations; desktop windows open after successful login only.

![Architecture 1.0.0 reference](../assets/diagrams/architecture.svg)

*Figure 11. Legacy 1.0.0 layering (controllers → services → JSON). 2.0.0 keeps the same roles, replaces JSON with SQLite and splits web vs desktop clients.*

## 8. Persistence and seed

Seed version **2** auto-reseeds when the stored version differs. Volume is roughly 10× the first 2.0.0 seed: on the order of ~60 users, ~37 rooms, expanded inventory, medicines, appointments, and announcements.

Demo passwords (unchanged): `manager` / `m`, `secretary` / `s`, `doctor` / `d`, `patient` / `p`.

## 9. Security and localization

Web: hashed passwords, POST login, httpOnly sessions, role-scoped pages and actions. Desktop: local demo auth for the course exercise (not a networked HIS).

UI strings: English, Serbian, Hungarian via cookie (web) and in-process locale (desktop). 1.0.0 Bolnica remains Serbian-only by design.

## 10. Build check

```text
cd app
npm install
npm run db:reset
npm run check
npm run build

cd ../desktop/HospitalDesktop
dotnet build -c Release
dotnet run -c Release -- --smoke
```

Launchers at the repo root: `run-1.0.0.bat`, `run-desktop-2.0.0.bat`.

## 11. Closing

Develop inside `app/` and `desktop/HospitalDesktop/`. Leave `_legacy-1.0.0/` as the historical freeze. Later options: closer 1.0.0 feature parity (vacations, hospitalizations, referrals), shared schema package, HTTPS deploy of the web desk.
