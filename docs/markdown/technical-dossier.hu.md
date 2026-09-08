## Dokumentumkezelés

| Mező | Érték |
|---|---|
| Cím | Műszaki dosszié 1.0.0, Bolnica 1.0.0 |
| Dosszié verzió | 1.0.0 |
| Szoftver verzió | 1.0.0 (archív címke; a bejelentkező ablak címe továbbra is `MainWindow`) |
| Fejlesztés | 2021. március 16. – 2021. június 21. |
| Fő kódolás | március vége – 2021. június 10. |
| Git rögzítés | `5b69c9c` (2021. június 21.) |
| Első commit | `8fe447c` (2021. március 16.) |
| Commitok | 305 |
| Upstream | github.com/kukuckarastislav/SIMS_IS_Bolnica |
| Archív remote | github.com/laslo-uri/HospitalManagementSuite |
| Fagyasztás útja | `_legacy-1.0.0/` |
| Összeállítva | 2026. szeptember 7. |
| Szerzők | Rastislav Kukučka (RA 129/2018), Mihajlo Ostojić (RA 134/2018), Laslo Uri (RA 135/2018), Milica Vučinić (RA 139/2018) |
| Intézmény | Műszaki Tudományok Kara, Újvidéki Egyetem, Számítástechnika és automatika |

## 1. Cél

Ez a **1.0.0 műszaki dosszié**. A Bolnicát a `5b69c9c` commiton, a `_legacy-1.0.0/` alatt írja le. Újraíráshoz készült.

2026. szeptember 7-én az archívum lefordult (MSBuild Build Tools + NuGet reference assemblies), elindult a `bin\Debug`-ból, és a magfelhasználókkal képernyőképek készültek.

## 2. Azonosítás

| Tétel | Részlet |
|---|---|
| Megjelenített név | Bolnica (`MainWindow` a bejelentkezésen) |
| Angol / szerb / magyar | Hospital Management Suite / Bolnica / Kórházkezelő rendszer |
| Megoldás | `_legacy-1.0.0/BolnicaProjekat/Bolnica/Bolnica.sln` |
| Stack | WPF, .NET Framework **4.7.2**, System.Text.Json, iText7, LiveCharts |
| Perzisztencia | 19 JSON a `_legacy-1.0.0/.../podaci/` alatt |
| UI nyelv | Szerb |

Szerepek: Upravnik / Sekretar / Lekar / Pacijent. Git: 84 / 78 / 77 / 66.

## 3. Történeti kontextus

FTN SIMS + HCI: négy szereplő, időpontok, receptek, termek/eszközök, JSON SQL helyett. 2021. június 21. tip; 2026. szeptember 7. `_legacy-1.0.0/` park + UI felvételek.

## 4. Hatáskör

Helyi többszereplős asztali alkalmazás: egy bejelentkezés, négy héj, közös singleton repók. Nem négy telepítő, nem hálózati HIS, a jelszavak nincsenek hashelve. „Négy alkalmazás” = négy személy egy `Bolnica.exe`-n.

## 5. A 2021-es felhasználói felület

Képernyőképek 2026. szeptember 7. A fagyasztás bizonyítéka, nem design cél.

![Bejelentkezés](../assets/screenshots/00-login.png)

*1. ábra. Bejelentkezés — `MainWindow`, cyan háttér.*

![Orvos menü](../assets/screenshots/01-lekar-home.png)

*2. ábra. LekarHome — Glavni meni (Laslo Uri).*

![Naptár](../assets/screenshots/02-lekar-calendar.png)

*3. ábra. Radni kalendar — a Današnji üres 2026-ban.*

![Gyógyszerek](../assets/screenshots/03-lekar-recept.png)

*4. ábra. Lekovi az orvosi héjban.*

![Titkár](../assets/screenshots/04-sekretar-home.png)

*5. ábra. SekretarHome — Zdravo Bolnica, wizard elgépelésekkel.*

![Titkár időpont](../assets/screenshots/05-sekretar-schedule.png)

*6. ábra. Titkári héj időpont-navigáció után.*

![Igazgató](../assets/screenshots/06-upravnik-home.png)

*7. ábra. UpravnikHome — Prostorije; magadatokban tesztsorok.*

![Termek](../assets/screenshots/07-upravnik-rooms.png)

*8. ábra. Ugyanaz a teremnézet.*

![Beteg](../assets/screenshots/08-pacijent-home.png)

*9. ábra. PacijentHome — Pera Peric.*

![Beteg időpontok](../assets/screenshots/09-pacijent-termini.png)

*10. ábra. Beteg a Termini után.*

A bejelentkezés sorrendben próbálja: titkár → igazgató → orvos → beteg, **korai return nélkül**.

## 6. Funkcionális specifikáció

**Upravnik.** Termek, leltár, raktár, gyógyszerrevízió, értékelések, PDF.

**Sekretar.** Wizard, regisztráció, időpont (sürgős is), közlemények.

**Lekar.** Naptár, karton, terápia, beutaló, recept, gyógyszerrevízió.

**Pacijent.** Foglalás, anti-spam (~14 nap), emlékeztetők, karton, kérdőívek.

## 7. Használati esetek

![Use-case](../assets/diagrams/use-case.svg)

*11. ábra. Négy szereplő. PowerDesigner: `_legacy-1.0.0/Dijagrami/UseCase/`.*

## 8. Tartománymodell

![Osztálydiagram](../assets/diagrams/class-diagram.svg)

*12. ábra. Korisnik / Pacijent / Osoblje; ZdravstvenaUsluga, Recept, Prostorija, …*

## 9. Architektúra

![Architektúra](../assets/diagrams/architecture.svg)

*13. ábra. View → Controller → Service → Repository → JSON. Részleges MVVM.*

## 10. Fő szekvenciák

![Foglalás](../assets/diagrams/sequence-book.svg)

*14. ábra. Titkár időpontot foglal.*

![Recept](../assets/diagrams/sequence-prescription.svg)

*15. ábra. Orvos receptet ír.*

![Eszköz](../assets/diagrams/sequence-equipment.svg)

*16. ábra. Igazgató eszközt mozgat (hiányzó GUI frissítés a peer szerint).*

## 11. Perzisztencia

Tizenkilenc JSON. Futásidejű út: `../../podaci/` → `_legacy-1.0.0/.../podaci/`. Nincs migráció; a terem-magadatok tesztszemetet tartalmaznak.

## 12. Validáció és biztonság

Nyílt szövegű jelszavak; statikus `App` munkamenet; több héj is megnyílhat; nincs hashelés; wizard elgépelések.

## 13. Problémák és technikai adósság

| Terület | Mi a baj |
|---|---|
| Biztonság | Plaintext `Sifra`; többszörös bejelentkezés |
| Perzisztencia | Relatív utak; felülírás; tesztszemét a magadatokban |
| Architektúra | Hiányos MVVM; üres SQL factory |
| UI | `MainWindow` cím; üres mai naptár 2026; wizard hibák |
| Build 2026 | Gyakran nincs system targeting pack — NuGet reference assemblies |
| „4 alkalmazás” | Egy EXE |

## 14. Következmények egy újraírásra

**Tartsd meg a domaint:** négy szerep, időpontok, receptek, termek/eszközök, anti-spam.

**Cseréld a gépezetet:** modern stack, hashelt jelszó, séma, egységes UI.

**Ne másold:** plaintext jelszó-modellt; early-return nélküli logint; üres SQL ágakat; tesztszemetet.

## 15. Építés és 2026-os ellenőrzés

.NET 4.7.2, NuGet, MSBuild. A `run-1.0.0.bat` `FrameworkPathOverride`-ot használ, ha nincs system targeting pack. Az 5. szakasz képei sikeres futást igazolnak.

---

## A. melléklet — magfelhasználók

| Felhasználónév | Jelszó | Szerep |
|---|---|---|
| `rastislavkukucka` | `sifra` | Upravnik |
| `mihajloostojic` | `sifra` | Sekretar |
| `LasloUri` | `laci` | Lekar |
| `peraperic` | `pera` | Pacijent |

## B. melléklet — JSON térkép

Lásd a 11. szakaszt.

## C. melléklet — git

Tip `5b69c9c`. Gyökér `8fe447c`. Fagyasztás: `_legacy-1.0.0/`.

## D. melléklet — indítás

`run-1.0.0.bat` vagy build a `_legacy-1.0.0/BolnicaProjekat/Bolnica` alatt.

## E. melléklet — kurzusrajzok

`_legacy-1.0.0/Dijagrami/`, `_legacy-1.0.0/Revizije/*.txt`.

Összeállítva 2026. szeptember 7-én a `5b69c9c` commitból. Dosszié 1.0.0.
