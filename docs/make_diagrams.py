# -*- coding: utf-8 -*-
"""Diagrams for Hospital Management Suite dossier 1.0.0. Cyan hospital theme."""
from __future__ import annotations

from pathlib import Path

OUT = Path(__file__).resolve().parent / "assets" / "diagrams"
OUT.mkdir(parents=True, exist_ok=True)

INK = "#1c2430"
MUTED = "#5a6270"
LINE = "#c5d9e8"
CYAN = "#009CDE"
CORAL = "#c45c3e"
GOLD = "#c9a227"
SAGE = "#3e7a55"
SKY = "#2f6aa0"
PLUM = "#6b4c7a"
WHITE = "#ffffff"
PAPER = "#f7fbfe"
ACCENT = CYAN
HEAD = CYAN
ARROW = CYAN
SOFTS = {
    "cyan": "#e3f4fb",
    "coral": "#fbeee9",
    "gold": "#faf3de",
    "sage": "#e8f3eb",
    "sky": "#e6eef8",
    "plum": "#f3eaf6",
}


def svg(w, h, body: str, mid: str = "") -> str:
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
  <rect width="{w}" height="{h}" fill="{PAPER}"/>
  <defs>
    <marker id="{mid}arr" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path d="M0,0 L7,3.5 L0,7 Z" fill="{ARROW}"/>
    </marker>
  </defs>
  <style>
    .t {{ font-family: 'Segoe UI', Calibri, sans-serif; fill: {INK}; }}
    .h {{ font-family: 'Segoe UI', Calibri, sans-serif; fill: {INK}; font-weight: 600; }}
    .a {{ font-family: 'Segoe UI', Calibri, sans-serif; fill: {ACCENT}; font-weight: 600; }}
    .s {{ font-family: 'Segoe UI', Calibri, sans-serif; fill: {MUTED}; }}
    .w {{ font-family: 'Segoe UI', Calibri, sans-serif; fill: #fff; font-weight: 600; }}
    .m {{ font-family: Consolas, 'Cascadia Mono', monospace; fill: {INK}; }}
  </style>
  {body}
</svg>
'''


def T(x, y, s, cls="t", size=13, anchor="middle"):
    return f'<text x="{x}" y="{y}" class="{cls}" font-size="{size}" text-anchor="{anchor}">{s}</text>'


def R(x, y, w, h, fill=WHITE, stroke=LINE, sw=1, rx=3):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>'


def architecture():
    body = [
        T(40, 28, "Runtime architecture", "h", 16, "start"),
        T(40, 48, "Bolnica 1.0.0  |  freeze under _legacy-1.0.0  |  one WPF process, four role shells, shared JSON", "s", 11, "start"),
    ]
    rows = [
        ("01", "View", "WPF XAML", "MainWindow login  ->  LekarHome / SekretarHome / UpravnikHome / PacijentHome", SKY, SOFTS["sky"]),
        ("02", "Controller", "Kontroler", "Role and domain facades; mostly code-behind calls", CYAN, SOFTS["cyan"]),
        ("03", "Service", "Servis", "Appointments, drugs, rooms, inventory, anti-spam, reminders", SAGE, SOFTS["sage"]),
        ("04", "Repository", "singleton GetInstance", "In-memory lists; SaveData() with System.Text.Json", CORAL, SOFTS["coral"]),
        ("05", "Files", "podaci/*.json", "Nineteen JSON aggregates (patients, doctors, rooms, ...)", GOLD, SOFTS["gold"]),
    ]
    y = 68
    for num, title, tag, desc, bar, fill in rows:
        body.append(R(40, y, 880, 64, fill, LINE, 1, 4))
        body.append(R(40, y, 8, 64, bar, bar, 0, 0))
        body.append(T(64, y + 24, num, "a", 13, "start"))
        body.append(T(108, y + 24, title, "h", 14, "start"))
        body.append(T(250, y + 24, tag, "s", 11, "start"))
        body.append(T(108, y + 46, desc, "t", 12, "start"))
        y += 76
    body.append(T(40, y + 8, "Background threads: user suspension, medication reminders, inventory reallocation.", "s", 11, "start"))
    (OUT / "architecture.svg").write_text(svg(960, 520, "\n".join(body), "arch"), encoding="utf-8")


def actor(x, cy, label, fill, stroke):
    return "\n".join([
        f'<circle cx="{x}" cy="{cy}" r="12" fill="{fill}" stroke="{stroke}" stroke-width="1.6"/>',
        f'<line x1="{x}" y1="{cy + 12}" x2="{x}" y2="{cy + 48}" stroke="{stroke}" stroke-width="1.6"/>',
        f'<line x1="{x - 18}" y1="{cy + 28}" x2="{x + 18}" y2="{cy + 28}" stroke="{stroke}" stroke-width="1.6"/>',
        f'<line x1="{x}" y1="{cy + 48}" x2="{x - 14}" y2="{cy + 72}" stroke="{stroke}" stroke-width="1.6"/>',
        f'<line x1="{x}" y1="{cy + 48}" x2="{x + 14}" y2="{cy + 72}" stroke="{stroke}" stroke-width="1.6"/>',
        T(x, cy + 92, label, "h", 11),
    ])


def use_case():
    body = [
        T(40, 28, "Use cases", "h", 16, "start"),
        T(40, 48, "Four actors share one executable and one JSON store.", "s", 11, "start"),
        R(200, 70, 560, 430, WHITE, CYAN, 1.6, 8),
        T(480, 96, "Bolnica 1.0.0", "a", 13),
        actor(80, 160, "Upravnik", SOFTS["gold"], GOLD),
        actor(80, 320, "Sekretar", SOFTS["sage"], SAGE),
        actor(880, 160, "Lekar", SOFTS["cyan"], CYAN),
        actor(880, 320, "Pacijent", SOFTS["coral"], CORAL),
    ]
    cases = [
        (140, "Login (shared)", SOFTS["sky"], SKY),
        (185, "Manage rooms and equipment", SOFTS["gold"], GOLD),
        (230, "Register patients and staff", SOFTS["sage"], SAGE),
        (275, "Schedule exam or operation", SOFTS["sage"], SAGE),
        (320, "Work calendar / record visit", SOFTS["cyan"], CYAN),
        (365, "Issue prescription / review drugs", SOFTS["cyan"], CYAN),
        (410, "Book / cancel own appointment", SOFTS["coral"], CORAL),
        (455, "Reminders, surveys, karton", SOFTS["coral"], CORAL),
    ]
    for y, label, fill, stroke in cases:
        body.append(f'<ellipse cx="480" cy="{y}" rx="220" ry="16" fill="{fill}" stroke="{stroke}" stroke-width="1.2"/>')
        body.append(T(480, y + 5, label, "t", 11))
    (OUT / "use-case.svg").write_text(svg(960, 540, "\n".join(body), "uc"), encoding="utf-8")


def klass(x, y, w, name, fields, head=HEAD):
    hh = 26
    h = hh + 16 * len(fields) + 12
    parts = [
        R(x, y, w, h, WHITE, LINE, 1, 4),
        R(x, y, w, hh, head, head, 0, 0),
        T(x + w / 2, y + 18, name, "w", 12),
    ]
    for i, f in enumerate(fields):
        parts.append(T(x + 10, y + hh + 14 + i * 16, f, "m", 10.5, "start"))
    return h, "\n".join(parts)


def class_diagram():
    body = [
        T(40, 26, "Domain classes", "h", 16, "start"),
        T(40, 46, "As implemented. Persistence is per-entity JSON, not one Bolnica aggregate file.", "s", 11, "start"),
    ]
    _, s1 = klass(36, 62, 280, "Korisnik", [
        "Id : int",
        "KorisnickoIme, Sifra",
        "Ime, Prezime, Email",
        "Jmbg, Telefon, Pol",
    ], CYAN)
    _, s2 = klass(336, 62, 280, "Lekar / Sekretar / Upravnik", [
        "extends Osoblje",
        "radnoVreme, RadniStatus",
        "Specijalizacija (Lekar)",
    ], SAGE)
    _, s3 = klass(636, 62, 280, "Pacijent", [
        "extends Korisnik",
        "MedicinskiKarton",
        "spamUser / suspension",
    ], CORAL)
    _, s4 = klass(36, 250, 300, "ZdravstvenaUsluga", [
        "Id, tip Pregled/Operacija",
        "lekarId, pacijentId",
        "prostorija, termin",
        "anamneza",
    ], SKY)
    _, s5 = klass(360, 250, 280, "Recept / Lek", [
        "Recept: pacijent, lek",
        "NacinKoriscenja",
        "Lek: Sifra (code), revizija",
    ], PLUM)
    _, s6 = klass(660, 250, 260, "Prostorija / Oprema", [
        "TipProstorije",
        "Inventar, TransferOpreme",
        "TerminProstorije",
    ], GOLD)
    body.extend([s1, s2, s3, s4, s5, s6])
    (OUT / "class-diagram.svg").write_text(svg(960, 460, "\n".join(body), "cls"), encoding="utf-8")


def sequence(path: str, title: str, subtitle: str, actors: list[str], steps: list[tuple[int, int, str]]):
    """actors indexed 0..n-1; steps are (from, to, label)."""
    n = len(actors)
    xs = [100 + i * (760 // max(n - 1, 1)) for i in range(n)] if n > 1 else [480]
    body = [
        T(40, 26, title, "h", 16, "start"),
        T(40, 46, subtitle, "s", 11, "start"),
    ]
    top, bottom = 80, 360
    for i, name in enumerate(actors):
        x = xs[i]
        body.append(R(x - 70, top - 28, 140, 28, SOFTS["cyan"], CYAN, 1, 4))
        body.append(T(x, top - 8, name, "h", 11))
        body.append(f'<line x1="{x}" y1="{top}" x2="{x}" y2="{bottom}" stroke="{LINE}" stroke-width="1.2" stroke-dasharray="4 3"/>')
    y = 100
    for a, b, label in steps:
        x1, x2 = xs[a], xs[b]
        body.append(
            f'<line x1="{x1}" y1="{y}" x2="{x2}" y2="{y}" stroke="{CYAN}" stroke-width="1.4" '
            f'marker-end="url(#seqarr)"/>'
        )
        mx = (x1 + x2) / 2
        body.append(T(mx, y - 6, label, "s", 10))
        y += 36
    (OUT / path).write_text(svg(960, 400, "\n".join(body), "seq"), encoding="utf-8")


def sequences():
    sequence(
        "sequence-book.svg",
        "Book an exam",
        "Secretary schedules ZdravstvenaUsluga; doctor and patient see the same JSON row.",
        ["Sekretar UI", "Kontroler", "Servis", "Repo / JSON"],
        [
            (0, 1, "Zakazi termin"),
            (1, 2, "validate slot + room"),
            (2, 3, "add ZdravstvenaUsluga"),
            (3, 2, "SaveData"),
            (2, 1, "ok"),
            (1, 0, "refresh list"),
        ],
    )
    sequence(
        "sequence-prescription.svg",
        "Issue a prescription",
        "Doctor writes Recept; patient reads recepti.json.",
        ["Lekar UI", "Kontroler", "Servis", "Repo / JSON"],
        [
            (0, 1, "Izdaj recept"),
            (1, 2, "build Recept + usage"),
            (2, 3, "append recepti.json"),
            (3, 0, "patient can open PrikazRecepta"),
        ],
    )
    sequence(
        "sequence-equipment.svg",
        "Move equipment",
        "Manager schedules TransferOpreme; background thread applies when due.",
        ["Upravnik UI", "Servis", "Repo", "Thread"],
        [
            (0, 1, "schedule transfer"),
            (1, 2, "TerminProstorije + inventar"),
            (3, 1, "elapsed appointment"),
            (1, 2, "apply TransferOpreme"),
            (2, 0, "GUI refresh (often missing)"),
        ],
    )


def main() -> int:
    architecture()
    use_case()
    class_diagram()
    sequences()
    print("wrote diagrams to", OUT)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
