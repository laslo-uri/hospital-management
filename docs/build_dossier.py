# -*- coding: utf-8 -*-
"""Build Technical Dossier PDFs for Hospital Management Suite 1.0.0 and 2.0.0."""
from __future__ import annotations

import pathlib
import re
import subprocess

import markdown

ROOT = pathlib.Path(__file__).resolve().parent
MD_DIR = ROOT / "markdown"
PDF_DIR = ROOT / "pdf"
CHROME = pathlib.Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe")
EDGE = pathlib.Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe")

CSS = r"""
:root {
  --ink: #1c2430;
  --muted: #5a6270;
  --line: #e4d9c8;
  --accent: #009CDE;
  --coral: #c45c3e;
  --gold: #c9a227;
  --sage: #3e7a55;
  --sky: #2f6aa0;
  --plum: #6b4c7a;
  --cream: #f7fbfe;
  --soft: #e3f4fb;
  --th: #009CDE;
}
* { box-sizing: border-box; }
html, body {
  margin: 0; padding: 0;
  background: #fffdf8;
  color: var(--ink);
  font-family: Cambria, Constantia, "Times New Roman", serif;
  font-size: 10.5pt;
  line-height: 1.5;
  font-variant-ligatures: none;
}
.page-footer {
  position: fixed; left: 0; right: 0; bottom: 0;
  height: 8mm; padding: 2mm 1mm 0 1mm;
  border-top: 2.2pt solid #e8b84a;
  font-family: Calibri, "Segoe UI", sans-serif;
  font-size: 7.4pt;
  color: #e8f4f5;
  display: flex; justify-content: space-between; gap: 8pt;
  background: linear-gradient(90deg, #009CDE 0%, #0077a8 70%, #2f6aa0 100%);
  z-index: 10;
}
.page-footer span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.shell {
  width: 100%;
  border-collapse: collapse;
}
.shell > thead > tr > td,
.shell > tbody > tr > td,
.shell > tfoot > tr > td {
  border: 0 !important;
  background: transparent !important;
  padding: 0 !important;
  margin: 0;
  vertical-align: top;
}
.shell > thead { display: table-header-group; }
.shell > tfoot { display: table-footer-group; }
.foot-space { height: 12mm; }
.wrap { padding: 0; }

.cover {
  page-break-after: always; break-after: page;
  min-height: 0;
  padding: 0 0 4mm 0;
}
.cover-hero {
  background: linear-gradient(135deg, #009CDE 0%, #0077a8 55%, #2f6aa0 100%);
  color: #fff;
  padding: 16mm 12mm 14mm 12mm;
  margin: 0 0 12mm 0;
  border-radius: 0 0 10pt 10pt;
}
.cover-kicker {
  font-family: Calibri, "Segoe UI", sans-serif;
  font-size: 9pt;
  color: #d7eef0;
  margin: 0 0 10mm 0;
}
.cover h1 {
  page-break-before: auto !important; break-before: auto !important;
  font-family: "Calibri Light", Calibri, "Segoe UI", sans-serif;
  font-weight: 300;
  font-size: 30pt;
  letter-spacing: -0.3pt;
  color: #fff;
  margin: 0 0 4pt 0;
  border: 0; padding: 0;
}
.cover-equiv {
  font-family: Calibri, "Segoe UI", sans-serif;
  font-size: 13pt;
  color: #d7eef0;
  margin: 0 0 8mm 0;
}
.cover-rule {
  width: 28mm; height: 3pt; background: #e8b84a;
  margin: 0 0 8mm 0; border: 0; border-radius: 2pt;
}
.cover-body { padding: 0 6mm; }
.cover-product {
  font-family: Calibri, "Segoe UI", sans-serif;
  font-size: 18pt; font-weight: 700;
  color: var(--accent); margin: 0 0 2pt 0;
}
.cover-english {
  font-family: Calibri, "Segoe UI", sans-serif;
  font-size: 13pt; font-weight: 400;
  color: var(--sky);
  margin: 0 0 1pt 0;
}
.cover-hungarian {
  font-family: Calibri, "Segoe UI", sans-serif;
  font-size: 13pt; font-weight: 400;
  color: var(--plum);
  margin: 0 0 6pt 0;
}
.cover-version {
  display: inline-block;
  font-family: Calibri, "Segoe UI", sans-serif;
  font-size: 9.5pt; color: #fff;
  background: var(--coral);
  padding: 4pt 10pt;
  border-radius: 10pt;
  margin: 0 0 8mm 0;
  max-width: 100%;
  line-height: 1.4;
  white-space: normal;
}
.cover-lede {
  font-size: 12pt; max-width: 150mm; margin: 0 0 10mm 0;
}
.cover-meta {
  font-family: Calibri, "Segoe UI", sans-serif;
  font-size: 10.5pt; color: var(--muted);
}
.cover-meta p { margin: 0.15em 0; }
.people {
  display: flex; gap: 8mm; margin-top: 10mm;
  page-break-inside: avoid;
}
.person {
  min-width: 70mm;
  padding: 8pt 12pt;
  border-radius: 6pt;
  background: #e7f4f4;
  border-left: 4pt solid var(--accent);
}
.person.alt {
  background: #fbeee9;
  border-left-color: var(--coral);
}
.pname {
  font-family: Calibri, "Segoe UI", sans-serif;
  font-size: 13pt; font-weight: 600; color: var(--ink);
}
.pmeta { font-size: 10pt; color: var(--muted); margin: 1pt 0 3pt 0; }
.person a {
  font-family: Calibri, "Segoe UI", sans-serif;
  font-size: 10pt; color: var(--accent);
  text-decoration: none;
}
.person.alt a { color: var(--coral); }
.cover-inst {
  margin-top: 12mm;
  font-family: Calibri, "Segoe UI", sans-serif;
  font-size: 10pt; color: var(--muted);
}

.toc-page {
  page-break-after: always; break-after: page;
  padding: 4mm 0 0 0;
}
.toc-page > h1 {
  page-break-before: auto !important; break-before: auto !important;
  font-family: "Calibri Light", Calibri, sans-serif;
  font-weight: 300; font-size: 26pt;
  border: 0; margin: 0 0 4mm 0; padding: 0;
  color: var(--accent);
}
.toc-page > h1:after {
  content: "";
  display: block;
  width: 28mm; height: 3pt;
  background: var(--coral);
  margin-top: 6pt;
  border-radius: 2pt;
}
.toc { list-style: none; margin: 4pt 0 0 0; padding: 0; counter-reset: toc; }
.toc li { margin: 0; counter-increment: toc; page-break-inside: avoid; }
.toc li:nth-child(odd) a { background: #f7f1e6; }
.toc a {
  display: block;
  padding: 3.6pt 8pt;
  border-bottom: 0;
  border-left: 3.5pt solid var(--accent);
  text-decoration: none; color: var(--ink);
  font-family: Calibri, "Segoe UI", sans-serif;
  font-size: 10pt;
}
.toc a::before {
  content: counter(toc, decimal-leading-zero);
  color: var(--coral);
  font-weight: 700;
  font-size: 9.5pt;
  margin-right: 8pt;
  font-variant-numeric: tabular-nums;
}
.toc li:nth-child(3n) a { border-left-color: var(--coral); }
.toc li:nth-child(3n+2) a { border-left-color: var(--gold); }
.toc a:hover { color: var(--accent); }
.toc-part {
  margin: 5mm 0 1.5mm 0;
  font-family: Calibri, sans-serif;
  font-size: 9pt; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--coral);
  page-break-after: avoid;
}

h1 {
  font-family: Calibri, "Segoe UI", sans-serif;
  font-size: 16pt; font-weight: 600; color: var(--accent);
  margin: 14pt 0 10pt 0; padding-bottom: 5pt;
  border-bottom: 2.5pt solid var(--coral);
  page-break-before: always; break-before: page;
}
h2 {
  font-family: Calibri, "Segoe UI", sans-serif;
  font-size: 12.5pt; font-weight: 600; color: var(--accent);
  margin: 16pt 0 7pt 0; page-break-after: avoid;
  padding-left: 8pt;
  border-left: 3.5pt solid var(--coral);
}
h3 {
  font-family: Calibri, "Segoe UI", sans-serif;
  font-size: 11pt; font-weight: 600; color: var(--sky);
  margin: 12pt 0 5pt 0; page-break-after: avoid;
}
h2 + table, h2 + p, h2 + ol, h3 + p, h3 + ol, p + table {
  page-break-before: avoid; break-before: avoid;
}
h3 + table {
  page-break-before: avoid; break-before: avoid;
  page-break-inside: avoid; break-inside: avoid;
}
p { margin: 0 0 0.72em 0; orphans: 3; widows: 3; }
a { color: var(--accent); text-decoration: none; }
hr { border: 0; border-top: 1.5pt solid #f0d9a8; margin: 12pt 0; }
ul, ol { margin: 0 0 0.8em 1.2em; padding: 0; }
li { margin: 0.14em 0; }
code {
  font-family: Consolas, "Cascadia Mono", monospace;
  font-size: 8.6pt;
  background: #e5f3f3;
  color: #0b4f57;
  padding: 0 3px;
}
pre {
  background: #eef7f4;
  border-left: 3.5pt solid var(--sage);
  padding: 8pt 10pt;
  font-size: 8.2pt; line-height: 1.38;
  white-space: pre-wrap;
  page-break-inside: avoid;
}
pre code { background: transparent; padding: 0; color: inherit; }
blockquote {
  margin: 8pt 0 12pt 0; padding: 8pt 12pt;
  background: #fbeee9;
  border-left: 3.5pt solid var(--coral);
  font-size: 10pt;
}
table {
  width: 100%; border-collapse: collapse;
  margin: 8pt 0 12pt 0; font-size: 9.2pt;
}
thead { display: table-header-group; }
tr { page-break-inside: avoid; }
th, td {
  border-bottom: 0.4pt solid #eadfcb;
  padding: 5.5pt 7pt;
  vertical-align: top; text-align: left;
  overflow-wrap: break-word;
  word-break: normal;
  hyphens: none;
}
th {
  background: var(--th);
  font-family: Calibri, "Segoe UI", sans-serif;
  font-weight: 600; font-size: 8.6pt;
  color: #fff;
  border-bottom: 0;
}
tr:nth-child(even) td { background: #eaf5f5; }
tr:nth-child(odd) td { background: #fffdf8; }
img {
  max-width: 100%; height: auto;
  border: 1.5pt solid #cde3e5;
  display: block; margin: 8pt 0 2pt 0;
}
figure.shot, figure.diagram {
  margin: 8pt 0 12pt 0;
  padding: 7pt 7pt 5pt 7pt;
  background: #fff;
  border-radius: 6pt;
  page-break-inside: avoid;
  break-inside: avoid;
  max-width: 100%;
}
figure.shot { border: 1.6pt solid #7ebec4; }
figure.diagram { border: 1.6pt solid #e0c46a; background: #fffdf8; }
figure img {
  border: 0; margin: 0;
  max-width: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
}
figure.shot img { max-height: 108mm; }
figure.diagram img { max-height: 92mm; }
figcaption {
  font-family: Calibri, "Segoe UI", sans-serif;
  font-size: 9pt;
  color: var(--accent);
  margin-top: 6pt;
  padding: 5pt 8pt;
  background: #e7f4f4;
  border-radius: 3pt;
  font-style: italic;
}
figure.diagram figcaption { background: #faf3de; color: #7a5a10; }
p em { color: var(--accent); font-size: 9pt; font-style: italic; }
strong { font-weight: 600; color: #0b4f57; }
.cover-swatches {
  display: flex; height: 5pt; margin: 0 0 8mm 0;
  border-radius: 2pt; overflow: hidden;
}
.cover-swatches span { flex: 1; }
.sw-teal { background: #009CDE; }
.sw-coral { background: #c45c3e; }
.sw-gold { background: #c9a227; }
.sw-sky { background: #2f6aa0; }
@page { size: A4; margin: 14mm 16mm 12mm 16mm; }
@media print { html, body { background: #fffdf8; } }
"""

PEOPLE = """
<div class="people" style="flex-wrap:wrap">
  <div class="person">
    <div class="pname">Laslo Uri</div>
    <div class="pmeta">RA 135/2018 · Lekar</div>
    <a href="https://github.com/laslo-uri">github.com/laslo-uri</a>
  </div>
  <div class="person alt">
    <div class="pname">Mihajlo Ostojić</div>
    <div class="pmeta">RA 134/2018 · Sekretar</div>
    <a href="https://github.com/mihajlo-ostojic">github.com/mihajlo-ostojic</a>
  </div>
  <div class="person">
    <div class="pname">Rastislav Kukučka</div>
    <div class="pmeta">RA 129/2018 · Upravnik</div>
    <a href="https://github.com/kukuckarastislav">github.com/kukuckarastislav</a>
  </div>
  <div class="person alt">
    <div class="pname">Milica Vučinić</div>
    <div class="pmeta">RA 139/2018 · Pacijent</div>
  </div>
</div>
"""

COVERS = {
    "en": {
        "kicker": "Faculty of Technical Sciences, University of Novi Sad",
        "title": "Technical Dossier 1.0.0",
        "equiv": "",
        "product": "Bolnica 1.0.0",
        "english": "Hospital Management Suite",
        "hungarian": "Kórházkezelő rendszer",
        "version": "Dossier 1.0.0  ·  software 1.0.0  ·  frozen 21 June 2021",
        "lede": "A record of the 2021 WPF hospital suite as it actually ran, written so a later rewrite has something solid to start from. Defects are listed on purpose.",
        "meta": ["Compiled 7 September 2026", "Git commit 5b69c9c"],
        "inst": "Computing and Control Engineering",
        "footer_l": "Technical Dossier 1.0.0",
        "footer_r": "Bolnica 1.0.0  |  2021  |  FTN UNS",
        "html_title": "Technical Dossier 1.0.0 - Bolnica",
        "toc_title": "Contents",
        "lang": "en",
    },
    "sr": {
        "kicker": "Fakultet tehničkih nauka, Univerzitet u Novom Sadu",
        "title": "Tehnički dosije 1.0.0",
        "equiv": "",
        "product": "Bolnica 1.0.0",
        "english": "Hospital Management Suite",
        "hungarian": "Kórházkezelő rendszer",
        "version": "Dosije 1.0.0  ·  softver 1.0.0  ·  zamrznuto 21. juna 2021.",
        "lede": "Zapis o WPF bolničkom paketu iz 2021. kakav je stvarno radio, da kasnija prerada ima čvrstu osnovu. Nedostaci su navedeni namerno.",
        "meta": ["Sastavljeno 7. septembra 2026.", "Git commit 5b69c9c"],
        "inst": "Računarstvo i automatika",
        "footer_l": "Tehnički dosije 1.0.0",
        "footer_r": "Bolnica 1.0.0  |  2021  |  FTN UNS",
        "html_title": "Tehnicki dosije 1.0.0 - Bolnica",
        "toc_title": "Sadržaj",
        "lang": "sr",
    },
    "hu": {
        "kicker": "Műszaki Tudományok Kara, Újvidéki Egyetem",
        "title": "Műszaki dosszié 1.0.0",
        "equiv": "",
        "product": "Bolnica 1.0.0",
        "english": "Hospital Management Suite",
        "hungarian": "Kórházkezelő rendszer",
        "version": "Dosszié 1.0.0  ·  szoftver 1.0.0  ·  rögzítve 2021. június 21.",
        "lede": "A 2021-es WPF kórházi csomag úgy, ahogy tényleg futott. Azért készült, hogy egy későbbi újraírásnak legyen mibe kapaszkodnia. A hibát szándékosan bent hagytuk.",
        "meta": ["Összeállítva 2026. szeptember 7.", "Git commit 5b69c9c"],
        "inst": "Számítástechnika és automatika",
        "footer_l": "Műszaki dosszié 1.0.0",
        "footer_r": "Bolnica 1.0.0  |  2021  |  FTN UNS",
        "html_title": "Muszaki dosszie 1.0.0 - Bolnica",
        "toc_title": "Tartalom",
        "lang": "hu",
    },
    "en-sr": {
        "kicker": "FTN UNS  |  English  ·  Serbian  ·  Hungarian",
        "title": "Technical Dossier 1.0.0",
        "equiv": "Tehnički dosije 1.0.0  ·  Műszaki dosszié 1.0.0",
        "product": "Bolnica 1.0.0",
        "english": "Hospital Management Suite",
        "hungarian": "Kórházkezelő rendszer",
        "version": "Dossier 1.0.0  ·  frozen 21 June 2021  /  zamrznuto 21. juna 2021.  /  rögzítve 2021. június 21.",
        "lede": "Part I English. Part II Serbian. Part III Hungarian. A record of the 2021 WPF hospital suite, including the problems, for a later rewrite.",
        "meta": ["Compiled 7 September 2026", "Git commit 5b69c9c"],
        "inst": "Faculty of Technical Sciences  /  Fakultet tehničkih nauka  /  Műszaki Tudományok Kara",
        "footer_l": "Dossier 1.0.0  |  Tehnički dosije  |  Műszaki dosszié",
        "footer_r": "Bolnica 1.0.0  |  2021  |  FTN UNS",
        "html_title": "Technical Dossier 1.0.0 - Bolnica EN-SR-HU",
        "toc_title": "Contents  /  Sadržaj  /  Tartalom",
        "lang": "en",
    },
}

COVERS_2 = {
    "en2": {
        "kicker": "Faculty of Technical Sciences, University of Novi Sad",
        "title": "Technical Dossier 2.0.0",
        "equiv": "",
        "product": "Hospital Management Suite 2.0.0",
        "english": "Hospital Management Suite",
        "hungarian": "Kórházkezelő rendszer",
        "version": "Dossier 2.0.0  ·  software 2.0.0  ·  rewrite 7 September 2026",
        "lede": "The four-role hospital desk after the rewrite: Next.js web, .NET 8 desktop, SQLite, English identifiers, EN/SR/HU UI. Pair of dossier 1.0.0 (Bolnica freeze).",
        "meta": ["Compiled 7 September 2026", "schemaVersion 2"],
        "inst": "Computing and Control Engineering",
        "footer_l": "Technical Dossier 2.0.0",
        "footer_r": "Hospital 2.0.0  |  2026  |  FTN UNS",
        "html_title": "Technical Dossier 2.0.0 - Hospital",
        "toc_title": "Contents",
        "lang": "en",
    },
    "sr2": {
        "kicker": "Fakultet tehničkih nauka, Univerzitet u Novom Sadu",
        "title": "Tehnički dosije 2.0.0",
        "equiv": "",
        "product": "Hospital Management Suite 2.0.0",
        "english": "Hospital Management Suite",
        "hungarian": "Kórházkezelő rendszer",
        "version": "Dosije 2.0.0  ·  softver 2.0.0  ·  prerada 7. septembra 2026.",
        "lede": "Bolnički pult sa četiri uloge posle prerade: Next.js web, .NET 8 desktop, SQLite, engleski identifikatori, UI EN/SR/HU. Par dosijea 1.0.0 (zamrzavanje Bolnica).",
        "meta": ["Sastavljeno 7. septembra 2026.", "schemaVersion 2"],
        "inst": "Računarstvo i automatika",
        "footer_l": "Tehnički dosije 2.0.0",
        "footer_r": "Hospital 2.0.0  |  2026  |  FTN UNS",
        "html_title": "Tehnicki dosije 2.0.0 - Hospital",
        "toc_title": "Sadržaj",
        "lang": "sr",
    },
    "hu2": {
        "kicker": "Műszaki Tudományok Kara, Újvidéki Egyetem",
        "title": "Műszaki dosszié 2.0.0",
        "equiv": "",
        "product": "Hospital Management Suite 2.0.0",
        "english": "Hospital Management Suite",
        "hungarian": "Kórházkezelő rendszer",
        "version": "Dosszié 2.0.0  ·  szoftver 2.0.0  ·  újraírás 2026. szeptember 7.",
        "lede": "A négy szerepkörű kórházi pult az újraírás után: Next.js web, .NET 8 asztali, SQLite, angol azonosítók, EN/SR/HU UI. Az 1.0.0 dosszié párja (Bolnica fagyasztás).",
        "meta": ["Összeállítva 2026. szeptember 7.", "schemaVersion 2"],
        "inst": "Számítástechnika és automatika",
        "footer_l": "Műszaki dosszié 2.0.0",
        "footer_r": "Hospital 2.0.0  |  2026  |  FTN UNS",
        "html_title": "Muszaki dosszie 2.0.0 - Hospital",
        "toc_title": "Tartalom",
        "lang": "hu",
    },
    "en-sr2": {
        "kicker": "FTN UNS  |  English  ·  Serbian  ·  Hungarian",
        "title": "Technical Dossier 2.0.0",
        "equiv": "Tehnički dosije 2.0.0  ·  Műszaki dosszié 2.0.0",
        "product": "Hospital Management Suite 2.0.0",
        "english": "Hospital Management Suite",
        "hungarian": "Kórházkezelő rendszer",
        "version": "Dossier 2.0.0  ·  rewrite 7 September 2026",
        "lede": "Part I English. Part II Serbian. Part III Hungarian. Hospital Management Suite after the 2.0.0 rewrite.",
        "meta": ["Compiled 7 September 2026", "schemaVersion 2"],
        "inst": "Faculty of Technical Sciences  /  Fakultet tehničkih nauka  /  Műszaki Tudományok Kara",
        "footer_l": "Dossier 2.0.0  |  Tehnički dosije  |  Műszaki dosszié",
        "footer_r": "Hospital 2.0.0  |  2026  |  FTN UNS",
        "html_title": "Technical Dossier 2.0.0 - Hospital EN-SR-HU",
        "toc_title": "Contents  /  Sadržaj  /  Tartalom",
        "lang": "en",
    },
}

HTML_TMPL = """<!DOCTYPE html>
<html lang="{lang}">
<head>
<meta charset="utf-8"/>
<title>{html_title}</title>
<style>{css}</style>
</head>
<body>
<div class="page-footer">
  <span>{footer_l}</span>
  <span>{footer_r}</span>
</div>
<table class="shell">
<thead><tr><td></td></tr></thead>
<tfoot><tr><td><div class="foot-space"></div></td></tr></tfoot>
<tbody><tr><td>
<section class="cover">
  <div class="cover-hero">
    <p class="cover-kicker">{kicker}</p>
    <h1>{title}</h1>
    {equiv_html}
    <div class="cover-rule"></div>
  </div>
  <div class="cover-body">
    <div class="cover-swatches">
      <span class="sw-teal"></span><span class="sw-coral"></span>
      <span class="sw-gold"></span><span class="sw-sky"></span>
    </div>
    <p class="cover-product">{product}</p>
    <p class="cover-english">{english}</p>
    <p class="cover-hungarian">{hungarian}</p>
    <p class="cover-version">{version}</p>
    <p class="cover-lede">{lede}</p>
    <div class="cover-meta">{meta_html}</div>
    {people}
    <p class="cover-inst">{inst}</p>
  </div>
</section>
<nav class="toc-page">
  <h1>{toc_title}</h1>
  {toc_html}
</nav>
<div class="wrap">
{body}
</div>
</td></tr></tbody>
</table>
</body>
</html>
"""

def md_to_html(text: str) -> str:
    text = text.replace("](../assets/", "](assets/")
    return markdown.markdown(
        text,
        extensions=["tables", "fenced_code", "sane_lists", "nl2br", "md_in_html"],
    )


def add_ids(html: str) -> str:
    n = {"h1": 0, "h2": 0}

    def h1(m):
        n["h1"] += 1
        return f'<h1 id="p{n["h1"]}">{m.group(1)}</h1>'

    def h2(m):
        n["h2"] += 1
        return f'<h2 id="s{n["h2"]}">{m.group(1)}</h2>'

    html = re.sub(r"<h1>(.*?)</h1>", h1, html, flags=re.S)
    html = re.sub(r"<h2>(.*?)</h2>", h2, html, flags=re.S)
    def fig(m):
        attrs, cap = m.group(1), m.group(2)
        kind = "diagram" if "diagrams/" in attrs else "shot"
        return f'<figure class="{kind}"><img{attrs}><figcaption>{cap}</figcaption></figure>'
    html = re.sub(
        r"<p><img([^>]+)></p>\s*<p><em>(.*?)</em></p>",
        fig,
        html,
        flags=re.S,
    )
    return html


def toc_from(html: str) -> str:
    chunks = []
    items = []

    def flush():
        if items:
            chunks.append('<ol class="toc">\n' + "\n".join(items) + "\n</ol>")
            items.clear()

    for m in re.finditer(r"<h([12]) id=\"([^\"]+)\">(.*?)</h\1>", html, re.S):
        level, hid, raw = m.group(1), m.group(2), m.group(3)
        title = re.sub(r"<[^>]+>", "", raw).strip()
        if level == "1":
            flush()
            chunks.append(f'<p class="toc-part">{title}</p>')
            continue
        items.append(
            f'<li><a href="#{hid}"><span class="toc-title">{title}</span></a></li>'
        )
    flush()
    return "\n".join(chunks)


def merged_markdown(prefix: str = "technical-dossier") -> str:
    en = (MD_DIR / f"{prefix}.en.md").read_text(encoding="utf-8")
    sr = (MD_DIR / f"{prefix}.sr.md").read_text(encoding="utf-8")
    hu = (MD_DIR / f"{prefix}.hu.md").read_text(encoding="utf-8")
    return (
        "# Part I  English\n\n"
        + en
        + "\n\n# Part II  Srpski\n\n"
        + sr
        + "\n\n# Part III  Magyar\n\n"
        + hu
    )


def write_pdf(ed: str, md_text: str, pdf_name: str, covers: dict | None = None) -> None:
    table = covers if covers is not None else COVERS
    c = table[ed]
    body = add_ids(md_to_html(md_text))
    toc_html = toc_from(body)
    equiv = f'<p class="cover-equiv">{c["equiv"]}</p>' if c["equiv"] else ""
    meta = "".join(f"<p>{m}</p>" for m in c["meta"])
    html = HTML_TMPL.format(
        css=CSS,
        body=body,
        toc_html=toc_html,
        people=PEOPLE,
        equiv_html=equiv,
        meta_html=meta,
        **c,
    )
    html_path = ROOT / f"_{ed}.html"
    PDF_DIR.mkdir(parents=True, exist_ok=True)
    pdf_path = PDF_DIR / pdf_name
    html_path.write_text(html, encoding="utf-8")
    browser = CHROME if CHROME.exists() else EDGE
    subprocess.run(
        [
            str(browser),
            "--headless=new",
            "--disable-gpu",
            "--no-pdf-header-footer",
            f"--print-to-pdf={pdf_path}",
            html_path.resolve().as_uri(),
        ],
        check=True,
    )
    html_path.unlink(missing_ok=True)
    print("wrote", pdf_path.name, pdf_path.stat().st_size)


def main() -> int:
    merged = merged_markdown("technical-dossier")
    jobs = [
        ("en", (MD_DIR / "technical-dossier.en.md").read_text(encoding="utf-8"), "technical-dossier-1.0.0.en.pdf", COVERS),
        ("sr", (MD_DIR / "technical-dossier.sr.md").read_text(encoding="utf-8"), "technical-dossier-1.0.0.sr.pdf", COVERS),
        ("hu", (MD_DIR / "technical-dossier.hu.md").read_text(encoding="utf-8"), "technical-dossier-1.0.0.hu.pdf", COVERS),
        ("en-sr", merged, "technical-dossier-1.0.0.pdf", COVERS),
    ]
    merged2 = merged_markdown("technical-dossier-2.0.0")
    jobs2 = [
        ("en2", (MD_DIR / "technical-dossier-2.0.0.en.md").read_text(encoding="utf-8"), "technical-dossier-2.0.0.en.pdf", COVERS_2),
        ("sr2", (MD_DIR / "technical-dossier-2.0.0.sr.md").read_text(encoding="utf-8"), "technical-dossier-2.0.0.sr.pdf", COVERS_2),
        ("hu2", (MD_DIR / "technical-dossier-2.0.0.hu.md").read_text(encoding="utf-8"), "technical-dossier-2.0.0.hu.pdf", COVERS_2),
        ("en-sr2", merged2, "technical-dossier-2.0.0.pdf", COVERS_2),
    ]
    for ed, text, name, covers in jobs + jobs2:
        write_pdf(ed, text, name, covers)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
