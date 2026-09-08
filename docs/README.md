# Dossier files

Source Markdown and printed PDFs for **Bolnica** / Hospital Management Suite **1.0.0** (2021 freeze) and **2.0.0** (2026 rewrite). Markdown is what you edit; PDFs are what you open.

## Folders

| Path | Commit? | Role |
|---|---|---|
| [markdown/](markdown/) | yes | English, Serbian, Hungarian source |
| [pdf/](pdf/) | yes | Printed dossiers |
| [assets/](assets/) | yes | Screenshots and SVG diagrams |
| `_preview/` | no | Local layout checks |
| `_*.html` | no | Temporary Chrome print files |

## Open

### Dossier 1.0.0 (software 1.0.0 — Bolnica freeze)

| PDF | Contents |
|---|---|
| [pdf/technical-dossier-1.0.0.pdf](pdf/technical-dossier-1.0.0.pdf) | English + Serbian + Hungarian |
| [pdf/technical-dossier-1.0.0.en.pdf](pdf/technical-dossier-1.0.0.en.pdf) | English |
| [pdf/technical-dossier-1.0.0.sr.pdf](pdf/technical-dossier-1.0.0.sr.pdf) | Serbian |
| [pdf/technical-dossier-1.0.0.hu.pdf](pdf/technical-dossier-1.0.0.hu.pdf) | Hungarian |

### Dossier 2.0.0 (software 2.0.0 — web + desktop rewrite)

| PDF | Contents |
|---|---|
| [pdf/technical-dossier-2.0.0.pdf](pdf/technical-dossier-2.0.0.pdf) | English + Serbian + Hungarian |
| [pdf/technical-dossier-2.0.0.en.pdf](pdf/technical-dossier-2.0.0.en.pdf) | English |
| [pdf/technical-dossier-2.0.0.sr.pdf](pdf/technical-dossier-2.0.0.sr.pdf) | Serbian |
| [pdf/technical-dossier-2.0.0.hu.pdf](pdf/technical-dossier-2.0.0.hu.pdf) | Hungarian |

Screenshots for 2.0.0: desktop `10`–`14`, web `15`–`19` under [assets/screenshots/](assets/screenshots/).

## Rebuild

Python 3 with the `markdown` package, and Google Chrome (or Microsoft Edge). A .NET / Node build is not required for the PDFs.

From this folder:

```text
python make_diagrams.py
python build_dossier.py
```
