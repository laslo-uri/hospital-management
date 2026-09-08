## Dokumentumvezérlés

| Mező | Érték |
|---|---|
| Cím | Műszaki dosszié 2.0.0, Hospital Management Suite 2.0.0 |
| Dosszié verzió | 2.0.0 |
| Szoftver verzió | 2.0.0 |
| Megjelenített márka | **Hospital** (cián `#009CDE`, orvosi bordó `#630000`) |
| Előd | Műszaki dosszié 1.0.0 (**Bolnica**), `5b69c9c` |
| Újraírás | 2026. szeptember 7. |
| Szerzők | Rastislav Kukučka, Mihajlo Ostojić, Laslo Uri, Milica Vučinić |
| Archívum | [github.com/laslo-uri/HospitalManagementSuite](https://github.com/laslo-uri/HospitalManagementSuite) |

## 1. Cél

Ez a **2.0.0 műszaki dosszié**. A **Hospital Management Suite**-ot írja le az újraírás után: ugyanaz a négy szerepkör, angol azonosítók, Next.js 16 web, .NET 8 WPF asztali kliens, SQLite (`schemaVersion` **2**), hashelt webes jelszavak, EN/SR/HU felület.

Párja az [1.0.0 dossziénak](technical-dossier.hu.md) (**Bolnica** fagyasztás a `_legacy-1.0.0/` alatt).

## 2. Azonosítás

| Tétel | Részlet |
|---|---|
| Megjelenített név | Hospital Management Suite |
| Web | `app/` Next.js |
| Asztali | `desktop/HospitalDesktop/` |
| Perzisztencia | SQLite, seed verzió **2** |
| UI nyelvek | angol, szerb, magyar |

## 3. Kapcsolat az 1.0.0-hoz

A .NET Framework WPF + JSON helyett Next.js + .NET 8 + SQLite. Márka: **Bolnica** → **Hospital**. Az 1.0.0 a `run-1.0.0.bat`-tal továbbra is futtatható.

## 4. Hatáskör

Helyi, négyszereplős kórházi pult: szobák, készlet, gyógyszerek, időpontok, közlemények. A web gazdagabb; az asztali kliens az 1.0.0 munkafolyamatot követi. Egyes régi modulok (szabadság, kórházi felvétel, beutalók) még nem teljes paritásban.

## 5–6. Felület

![Asztali bejelentkezés](../assets/screenshots/10-login-2.0.0.png)

*1. ábra. Asztali bejelentkezés 2.0.0.*

![Vezető asztali](../assets/screenshots/11-manager-2.0.0.png)

*2. ábra. Vezető — asztali.*

![Titkár asztali](../assets/screenshots/12-secretary-2.0.0.png)

*3. ábra. Titkár — asztali.*

![Orvos asztali](../assets/screenshots/13-doctor-2.0.0.png)

*4. ábra. Orvos — asztali.*

![Páciens asztali](../assets/screenshots/14-patient-2.0.0.png)

*5. ábra. Páciens — asztali.*

![Web bejelentkezés](../assets/screenshots/15-web-login-2.0.0.png)

*6. ábra. Webes bejelentkezés 2.0.0.*

![Vezető web](../assets/screenshots/16-web-manager-2.0.0.png)

*7. ábra. Vezető — web.*

![Titkár web](../assets/screenshots/17-web-secretary-2.0.0.png)

*8. ábra. Titkár — web.*

![Orvos web](../assets/screenshots/18-web-doctor-2.0.0.png)

*9. ábra. Orvos — web.*

![Páciens web](../assets/screenshots/19-web-patient-2.0.0.png)

*10. ábra. Páciens — web.*

## 7. Architektúra és seed

| Terület | Útvonal |
|---|---|
| Web | `app/src/` |
| Asztali | `desktop/HospitalDesktop/` |
| Fagyasztás | `_legacy-1.0.0/` |

Seed verzió **2** (~10× több adat). Demo: `manager`/`m`, `secretary`/`s`, `doctor`/`d`, `patient`/`p`.

## 8. Biztonság és ellenőrzés

Weben bcrypt + POST bejelentkezés, szerepkör-őrzők, EN/SR/HU. `npm run check`, asztali Release build és `--smoke` 2026. szeptember 7-én sikeres.
