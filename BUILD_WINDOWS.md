# Windows instalacija — jedan klik

Na **macOS/Linux ne možeš** lokalno da napraviš pravi Windows installer (Tauri zahteva MSVC + alate koji postoje samo na Windowsu). Zato imaš dve praktične opcije ispod.

---

## Opcija A: GitHub Actions (preporučeno — ostaješ na Macu)

1. Okači projekat na GitHub (privatan ili javni repo).
2. U repou: **Actions** → **Build Windows installers** → **Run workflow** (ili samo uradi push na `main` / `master` — workflow se pokreće automatski).
3. Kad job završi, otvori taj run → na dnu **Artifacts** → preuzmi **Evidencija-Otpada-Windows-installers** (jedan ZIP sa `msi/` i `nsis/` folderima).
4. Na Windowsu raspakuj ZIP, uđi u `msi` ili `nsis`, pokreni `.msi` ili setup `.exe` i prati čarobnjaka — to je to.

Instalirana aplikacija: ime kao u `tauri.conf.json` (**Evidencija Otpada**), verzija iz `src-tauri/tauri.conf.json` / `Cargo.toml`.

---

## Opcija B: Build direktno na Windows mašini

1. Kopiraj ceo folder projekta (npr. USB ili mreža).
2. Instaliraj [Node.js LTS](https://nodejs.org/) i [Rust](https://rustup.rs/) (podrazumevani toolchain na Windowsu je dovoljan).
3. U rootu projekta u PowerShell ili CMD:

```bat
npm install
npm run tauri:build
```

4. Instaleri su ovde:
   - `src-tauri\target\release\bundle\msi\` — `.msi`
   - `src-tauri\target\release\bundle\nsis\` — `.exe`

Te fajlove možeš da kopiraš na drugi PC i pokreneš — nije potrebno ponovo buildovati.

---

## Šta tačno dobijaš

| Fajl | Opis |
|------|------|
| **MSI** | Standardni Windows installer |
| **NSIS (.exe)** | Alternativni setup |

Oba rade „klik instal“; izaberi jedan koji ti više odgovara.

---

## Napomena o potpisivanju

Buildovi iz ovog projekta su **nepotpisani**. Windows SmartScreen može da upozori pri prvom pokretanju — „More info“ → „Run anyway“ (ili potpiši aplikaciju kasnije sertifikatom ako treba za firmu).
