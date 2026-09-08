## Document control

| Field | Value |
|---|---|
| Title | Technical Dossier 1.0.0, Bolnica 1.0.0 |
| Dossier version | 1.0.0 |
| Software version | 1.0.0 (archive label; login window title is still `MainWindow`) |
| Development | 16 March 2021 to 21 June 2021 |
| Main coding stretch | late March to 10 June 2021 (heaviest clean-code week: 10 June) |
| Git freeze | `5b69c9c` (21 June 2021) |
| First commit | `8fe447c`, Initial commit (16 March 2021) |
| Commits on main | 305 |
| Original upstream | github.com/kukuckarastislav/SIMS_IS_Bolnica |
| Archive remote | github.com/laslo-uri/HospitalManagementSuite |
| Freeze path | `_legacy-1.0.0/` (BolnicaProjekat, Dijagrami, Revizije) |
| Compiled | 7 September 2026 |
| Authors | Rastislav Kukučka (RA 129/2018), Mihajlo Ostojić (RA 134/2018), Laslo Uri (RA 135/2018), Milica Vučinić (RA 139/2018) |
| GitHub | [github.com/laslo-uri](https://github.com/laslo-uri), [github.com/mihajlo-ostojic](https://github.com/mihajlo-ostojic), [github.com/kukuckarastislav](https://github.com/kukuckarastislav) |
| Institution | Faculty of Technical Sciences, University of Novi Sad, Computing and Control Engineering |

## 1. Purpose

This is the **1.0.0** technical dossier. It describes Bolnica at commit `5b69c9c`, parked under `_legacy-1.0.0/`. It is meant to be used when the system is rebuilt: what the old desktop suite did, how it was put together, and what should not be copied.

It covers identity, behaviour as coded, architecture, the live 2021 UI (screenshots from a 2026 run), persistence, validation, and the defects.

On 7 September 2026 the archive was restored with NuGet, compiled with VS 2022 Build Tools MSBuild (`.NET Framework 4.7.2` reference assemblies via NuGet when the machine targeting pack was missing), launched from `bin\Debug`, and exercised with the seed accounts. Screenshots below are that run. The PowerDesigner drawings under `_legacy-1.0.0/Dijagrami/` and the peer notes under `_legacy-1.0.0/Revizije/` stay as course artifacts.

## 2. Identification

| Item | Detail |
|---|---|
| Display name | Bolnica (assembly `Bolnica`; login title `MainWindow`) |
| English name | Hospital Management Suite |
| Serbian name | Bolnica / Zdravo Bolnica (secretary chrome) |
| Hungarian name | Kórházkezelő rendszer |
| Solution | `_legacy-1.0.0/BolnicaProjekat/Bolnica/Bolnica.sln` |
| Projects | `Bolnica` (WinExe), `Jarloo.Calendar` (calendar control) |
| Entry | `Bolnica.App` → `MainWindow` |
| Kind | Multi-role single-process desktop GUI |
| UI toolkit | WPF (XAML), MaterialDesignThemes, Extended.Wpf.Toolkit, LiveCharts.Wpf |
| Target | .NET Framework **4.7.2** (calendar project: 4.0) |
| PDF / charts | iText7 7.1.15, LiveCharts 0.9.7 |
| JSON | `System.Text.Json` 5.0.2 |
| Persistence | Nineteen JSON files under `_legacy-1.0.0/BolnicaProjekat/Bolnica/podaci/` |
| UI language | Serbian copy throughout |

| Author | Index | Course role | GitHub |
|---|---|---|---|
| Rastislav Kukučka | RA 129/2018 | Upravnik | [github.com/kukuckarastislav](https://github.com/kukuckarastislav) |
| Mihajlo Ostojić | RA 134/2018 | Sekretar | [github.com/mihajlo-ostojic](https://github.com/mihajlo-ostojic) |
| Laslo Uri | RA 135/2018 | Lekar | [github.com/laslo-uri](https://github.com/laslo-uri) |
| Milica Vučinić | RA 139/2018 | Pacijent | — |

On `main`, git reports `kukuckarastislav` (84), `mihajlo-ostojic` (78), `laslo-uri-ftn` (77), `Milica Vucinic` (50), `milicauns` (16). Messages are mostly Serbian. The tip message is `test - git nalog`.

## 3. Historical context

This is the usual FTN SIMS + HCI hospital exercise: four actors, appointments, prescriptions, rooms and equipment, patient self-service, JSON instead of SQL. Course UML was drawn in PowerDesigner; the product is one WPF executable with four role homes after login.

| Date | Event |
|---|---|
| 16 Mar 2021 | Repository created; roles listed; use-case diagrams |
| 21–28 Mar 2021 | Class diagrams per role; use-case fixes |
| Apr–May 2021 | Role UIs, repositories, seed JSON, HCI work |
| early Jun 2021 | Activity / sequence diagrams; peer reviews (KT4) |
| 10 Jun 2021 | Heavy clean-code / SOLID / factory / DTO refactors across roles |
| 21 Jun 2021 | Tip commit `test - git nalog`. No later functional work in this archive. |
| 7 Sep 2026 | Freeze parked under `_legacy-1.0.0/`; dossier compiled and UI captured |

Spring 2021 project. The last functional week is almost all refactoring, not new features.

## 4. Scope

The program is a **local multi-role desktop app**: one process, one login window, four Serbian shells that share in-memory repositories and the same `podaci/*.json` files. Controllers call services; services call singleton repositories; repositories rewrite JSON.

It is not four separate installers, not a networked HIS, not SQL, not HTTPS, and passwords are plaintext. Concurrent multi-user access to the same folder is not implemented (in-process singletons only). Marketing copy that speaks of “four apps” means four login personas on **one** `Bolnica.exe`.

## 5. The 2021 user interface

Screens captured from this archive on 7 September 2026 after a successful Debug build. They show the freeze. They are not a design target for a new version.

![Login window](../assets/screenshots/00-login.png)

*Figure 1. Login (`MainWindow`). Cyan gradient background, hospital icon, labels Korisničko ime / Lozinka, button Prijavi se. Window title remains MainWindow.*

![Doctor main menu](../assets/screenshots/01-lekar-home.png)

*Figure 2. LekarHome — Glavni meni for Laslo Uri (nema specijalizaciju). Maroon “mobile” shell: Radni kalendar, Lista pacijenata, Lista lekova, Slanje povratnih informacija.*

![Doctor work calendar](../assets/screenshots/02-lekar-calendar.png)

*Figure 3. Radni kalendar — Današnji / Nedeljni / Mesečni tabs. Današnji list empty on this seed clock (no appointments for “today” in 2026).*

![Doctor medicines](../assets/screenshots/03-lekar-recept.png)

*Figure 4. Lekovi area after menu navigation (same narrow shell).*

![Secretary home](../assets/screenshots/04-sekretar-home.png)

*Figure 5. SekretarHome — Zdravo Bolnica. Dark sidebar (registracija, liste, Zakaži termin, Obavestenja, Zauzetost prostorija). First-run wizard overlay with Serbian typos (aplikacijum, dogme, ocenivanj).*

![Secretary schedule chrome](../assets/screenshots/05-sekretar-schedule.png)

*Figure 6. Secretary shell after attempting schedule navigation (sidebar still visible).*

![Manager rooms](../assets/screenshots/06-upravnik-home.png)

*Figure 7. UpravnikHome — Prostorije CRUD. Tabs for room types; seed includes junk rows (TESTsoba3321 floor 12345, TestSPajanje-A/B).*

![Manager rooms alternate](../assets/screenshots/07-upravnik-rooms.png)

*Figure 8. Manager rooms view (same Prostorije surface after sidebar click).*

![Patient home](../assets/screenshots/08-pacijent-home.png)

*Figure 9. PacijentHome for Pera Peric — menus Nalog / Termini / Nadzornik / Medicinski karton / Pomoc; notifications, calendar graphic, Zakazi pregled, folder card with JMBG.*

![Patient appointments chrome](../assets/screenshots/09-pacijent-termini.png)

*Figure 10. Patient shell after Termini navigation.*

`MainWindow.Prijava_Click` tries secretary → manager → doctor → patient **in that order and does not return early**, so colliding usernames can open more than one home. Hidden debug buttons exist on the login XAML (`Visibility="Hidden"`) for some shells; `Lekar_Home_Click` is an empty stub.

Per-shell sizes as shipped: login ~450×600; doctor ~400×700; secretary ~1024×768; manager ~1280×720; patient ~1167×609.

## 6. Functional specification

Four roles share one store.

**Upravnik (manager).** Rooms by type (ordinary, OR, exam, ward): CRUD; schedule renovation, split, merge, equipment transfer (`TerminProstorije`). Per-room inventory (static / dynamic); reallocate between rooms; background thread applies transfers when appointments elapse. Warehouse (magacin). Drug catalogue with **doctor review** queue (`RevizijaLeka`). Ratings; PDF / chart doctor-work report; app feedback; settings (`podesavanja.json`). Live seed shows weak validation (absurd floor/area values left in `prostorije.json`).

**Sekretar (secretary).** First-run wizard and contextual HTML help (typos in wizard copy). Register patients (including guests) and doctors (MVVM on those forms). Browse/edit patients and kartons; doctors, work hours, vacation. Schedule exam/operation (multi-step wizard); emergency appointments; list/cancel/postpone. Announcements. Room occupancy. Rate the application; account page.

**Lekar (doctor).** Glavni meni → work calendar (day / week / month) over `ZdravstvenaUsluga`: record visit + anamnesis, update, delete. Patient karton: basics and allergens, therapy, inpatient referral, referral to another doctor, schedule a service, issue prescription. Medicines: approved list; revision queue; statistics/reports. Feedback. Some sidebar labels elsewhere in the tree are stubs or miswired.

**Pacijent (patient).** Book slots; view/cancel/reschedule; calendar (`Jarloo.Calendar`). Anti-spam: excess schedule/reschedule → `spamUser` and ~14-day suspension (`UserSuspension`). Notifications; medication reminders (`Podsjetnik`). Karton: therapy, history, adherence PDF. Prescriptions; hospital/doctor surveys; feedback; help overlays; keyboard shortcuts. Account change UI present.

Unique keys vary by repository (numeric `Id`, usernames for login). Drug codes use a `Sifra` field that is **not** a password.

## 7. Use cases

![Use-case diagram](../assets/diagrams/use-case.svg)

*Figure 11. Four actors: Upravnik, Sekretar, Lekar, Pacijent. Login is shared.*

Original PowerDesigner use-case drawings remain under `_legacy-1.0.0/Dijagrami/UseCase/`. This SVG is the dossier summary, not a conversion of those `.oom` files.

## 8. Domain model

![Class diagram](../assets/diagrams/class-diagram.svg)

*Figure 12. Core types as implemented.*

**Users:** `Korisnik` → `Pacijent` | `Osoblje` → `Lekar`, `Sekretar`, `Upravnik` (plus unused `Nadzornik`).

**Clinical:** `MedicinskiKarton`, `ZdravstvenaUsluga`, `Termin`, `Terapija`, `Recept`, `Hospitalizacija`, `Lek`, `RevizijaLeka`.

**Facility:** `Prostorija`, `TerminProstorije`, `Inventar`, `Oprema`, `TransferOpreme`, `TransformacijaProstorijeParametri`.

**Ops:** `Obavestenje`, `Notifikacija`, `Podsjetnik`, `Feedback`, `Ocena`, `Aktivnost` (anti-spam), `RadnoVreme`, `GodisnjiOdmor`, `SlobodniDani`.

`Bolnica` exists as a model type; persistence is still per-entity JSON, not one aggregate file.

## 9. Architecture

![Architecture](../assets/diagrams/architecture.svg)

*Figure 13. View → Controller → Service → Repository → JSON.*

| Layer | Location | Notes |
|---|---|---|
| View | `view/lekar`, `sekretar`, `upravnik`, `pacijent` | ~120 XAML surfaces; heavy code-behind |
| ViewModel | `viewmodel/` | Only three: patient/doctor registration, announcements |
| Controller | `Controller/` (`Kontroler`) | Role and domain façades |
| Service | `Service/` | Business rules |
| Repository | `Repository/` | Singletons `GetInstance`, load/save JSON |
| DTO | `DTO/` | Most flows |
| Patterns | Factory, Observer, Template Method | `BazaFactory` / `JSONBaza`; suspension & medication threads; report creators |
| Background | `Threads/` | User suspension, medication reminders, inventory reallocation |

Not full MVVM. SQL factory branch is empty; only JSON is live. Freeze lives entirely under `_legacy-1.0.0/`.

## 10. Key sequences

![Book exam](../assets/diagrams/sequence-book.svg)

*Figure 14. Secretary books an appointment → `zdravstveneUsluge.json` → doctor calendar / patient list.*

![Issue prescription](../assets/diagrams/sequence-prescription.svg)

*Figure 15. Doctor issues a prescription → `recepti.json` → patient view.*

![Move equipment](../assets/diagrams/sequence-equipment.svg)

*Figure 16. Manager schedules equipment transfer; thread applies when due. Peer review noted missing GUI refresh.*

Course sequence drawings stay in `_legacy-1.0.0/Dijagrami/dijagram sekvence/` and `ZdravoBolnicaProj/`.

## 11. Persistence

Repositories keep lists in memory and call `SaveData()` with `System.Text.Json`. Paths are relative (`../../podaci/` from `bin\Debug`), resolving to `_legacy-1.0.0/BolnicaProjekat/Bolnica/podaci/`. No migrations, no file locking, no backup beyond overwriting the JSON file.

| File | Approx. seed rows | Domain |
|---|---|---|
| `pacijenti.json` | 7 | Patients (+ embedded karton) |
| `lekari.json` | 10 | Doctors |
| `sekretari.json` | 2 | Secretaries |
| `upravnici.json` | 1 | Managers |
| `zdravstveneUsluge.json` | 22 | Appointments / services |
| `prostorije.json` | 17 | Rooms (includes test junk) |
| `terminProstorije.json` | 2 | Room appointments |
| `inventari.json` | 18 | Room inventories |
| `lekovi.json` | 5 | Medicines |
| `recepti.json` | 9 | Prescriptions |
| `obavestenja.json` | 4 | Announcements |
| `notifikacije.json` | 19 | Notifications |
| `podsjetnik.json` | 29 | Medication reminders |
| `hospitalizacija.json` | 3 | Inpatient |
| `godisnjiodmor.json` | 5 | Vacation |
| `slobodnidani.json` | 6 | Days off |
| `feedback.json` | 2 | App feedback |
| `anketa.json` | 5 | Surveys |
| `podesavanja.json` | 5 | Settings |

`data/sve.txt` is a small resource, not the primary store. Activity / anti-spam may create additional files at runtime.

## 12. Validation and security

| Area | What is coded |
|---|---|
| Passwords | Clear text `Sifra` in JSON; string compare on login |
| Session | Static `App.ulogovaniKorisnik` / `App.IdUlogovanogKorisnika` |
| Authorisation | Role home opened after matching that role’s repository; no process isolation |
| Login order | Secretary → manager → doctor → patient; **all four checks run**; multiple homes possible on collisions |
| Hashing / HTTPS / audit | None |
| Form validation | Incomplete; manager room seed proves absurd numbers are accepted |
| Copy quality | Secretary wizard: *aplikacijum*, *dogme*, *ocenivanj* |

Demo credentials in the appendix are already public in the seed files.

## 13. Problems and technical debt

These belong to commit `5b69c9c`. They are here because the file is for a rewrite.

| Area | What is wrong |
|---|---|
| Security | Plaintext passwords; static session globals; login can open more than one role home if usernames collide across JSON files |
| Persistence | Relative `../../podaci/` brittle; no migrations; no locking; overwrite-only saves; junk test rooms left in seed |
| Architecture | Incomplete MVVM (three ViewModels); empty SQL factory branch; Serbian/English identifier mix (`Kontroler` vs `Repository`) |
| UI | Window title `MainWindow`; doctor empty-calendar “today” in 2026; secretary wizard typos and oversized overlay; manager table leaves empty lower pane; patient buttons loosely aligned |
| Doctor stubs | `Lekar_Home_Click` empty; some menu items elsewhere miswired |
| Domain / diagrams | Peer reviews (`Revizije/`): missing GUI refresh after equipment move; missing method names on sequences; anti-troll “suspension expired” flag not clearly in code; renovation activity I/O gaps |
| Concurrency | One process only; “four apps” marketing vs one EXE |
| Build in 2026 | System 4.7.2 targeting pack often missing on Build Tools-only machines; NuGet `Microsoft.NETFramework.ReferenceAssemblies.net472` used as workaround (`run-1.0.0.bat`) |
| Gaps for a successor | No hashed auth, no real multi-user server, no SQL, few automated tests, no i18n |

## 14. Implications for a rewrite

**Keep the domain**

- Four roles; appointments (exam / operation); prescriptions and drug review; rooms + equipment transfers; patient self-booking with anti-spam; surveys and reminders

**Replace the machinery**

- WPF 4.7.2 + JSON files with a current stack, hashed credentials, and a real schema
- Singleton repositories with migrations and backups
- Partial MVVM / code-behind with a consistent UI architecture and real window titles
- In-process “four personas” with either true multi-user services or an honest single-desk design

**Do not copy**

- Plaintext `Sifra` in seed JSON as a security model
- Login that continues checking after a match and can open multiple shells
- Empty SQL stubs that look like dual persistence
- Stub menu handlers and junk seed rooms
- Wizard copy typos as “features”

## 15. Build and 2026 check

Specified: Visual Studio 2019 era, .NET Framework 4.7.2, NuGet packages under `_legacy-1.0.0/BolnicaProjekat/Bolnica/packages/`.

Checked **7 September 2026** on Windows with **VS 2022 Build Tools** MSBuild. System targeting pack for 4.7.2 was absent; build succeeded using NuGet reference assemblies (`Microsoft.NETFramework.ReferenceAssemblies.net472` / `net40`) and `FrameworkPathOverride` (also wired into `run-1.0.0.bat`).

```text
cd _legacy-1.0.0\BolnicaProjekat\Bolnica
nuget restore Bolnica.sln
msbuild ..\Jarloo.Calendar\MyCalendar.Calendar.csproj /p:Configuration=Debug /p:FrameworkPathOverride=...\net40
msbuild Bolnica.csproj /p:Configuration=Debug /p:FrameworkPathOverride=...\net472
cd bin\Debug
Bolnica.exe
```

Repo root: `run-1.0.0.bat`. Login with Appendix A accounts produced the screenshots in section 5. Doctor Današnji calendar was empty (seed appointments are not relative to 2026 “today”).

---

## Appendix A. Seed users (plaintext passwords as shipped)

| Username | Password | Role | Notes |
|---|---|---|---|
| `rastislavkukucka` | `sifra` | Upravnik | Sole manager seed |
| `mihajloostojic` | `sifra` | Sekretar | |
| `mihajlo` | `sifra` | Sekretar | Second secretary |
| `LasloUri` | `laci` | Lekar | Course doctor account |
| `JovanaJovanovic` | `joka` | Lekar | |
| `nikolanikolic` | `sifra` | Lekar | Username also appears as a patient with a different password |
| `peraperic` | `pera` | Pacijent | Captured in Figure 9 |
| `nikolanikolic` | `nikola` | Pacijent | |
| `simasima` | `sifra` | Pacijent | |
| `markomarkovic` | `asdasd` | Pacijent | |
| `jokajovanovic` | `sifra` | Pacijent | |

Additional doctor rows use passwords like `sifra` / `sifra2` / `sifra3` as shipped.

## Appendix B. JSON file map

See section 11. Working directory for runtime should keep `../../podaci/` resolving to `_legacy-1.0.0/BolnicaProjekat/Bolnica/podaci/`.

## Appendix C. Git freeze

| Item | Value |
|---|---|
| Tip | `5b69c9c` · 2021-06-21 · *test - git nalog* |
| Root | `8fe447c` · 2021-03-16 · Initial commit |
| Commits | 305 |
| Origin now | https://github.com/laslo-uri/HospitalManagementSuite.git |
| Upstream | https://github.com/kukuckarastislav/SIMS_IS_Bolnica |
| Layout 2026 | Freeze under `_legacy-1.0.0/`; docs at repo root |

## Appendix D. Launch this snapshot

1. Install Visual Studio or Build Tools with .NET desktop (or use NuGet reference assemblies as in `run-1.0.0.bat`).
2. From repo root: `run-1.0.0.bat`, or restore + build under `_legacy-1.0.0/BolnicaProjekat/Bolnica`.
3. Run `Bolnica.exe` from `bin\Debug`.
4. Log in with a seed account from Appendix A.
5. Optional: open `_legacy-1.0.0/Dijagrami/` in PowerDesigner; read `_legacy-1.0.0/Revizije/` for KT4 peer notes.

## Appendix E. Course drawings and reviews

| Path | Role |
|---|---|
| `_legacy-1.0.0/Dijagrami/UseCase/` | Per-role and overall use cases (`.oom`) |
| `_legacy-1.0.0/Dijagrami/ClassDiagram/` | Domain class diagram |
| `_legacy-1.0.0/Dijagrami/dijagram aktivnosti/` | Prescription, patient, emergency scheduling |
| `_legacy-1.0.0/Dijagrami/dijagram sekvence/` | Referral, patient, secretary sequences |
| `_legacy-1.0.0/Dijagrami/ZdravoBolnicaProj/` | Manager sequences / activities |
| `_legacy-1.0.0/Revizije/*.txt` | Peer reviews (Laslo reviewed manager equipment sequence; others reviewed prescription, scheduling, anti-troll) |

Compiled 7 September 2026 from commit `5b69c9c` (21 June 2021). Dossier 1.0.0.
