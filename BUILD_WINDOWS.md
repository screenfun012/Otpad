# Windows paket — MSI i NSIS

Sa **macOS** ne možeš lokalno da napraviš Windows **MSI** (WiX radi samo na Windowsu). Zato je praktično: **GitHub Actions** ili **Windows mašina**.

---

## 1. GitHub Actions (preporuka sa Maca)

1. Push repozitorijum na GitHub (`main` / `master` ili tag `v*`).
2. **Actions** → **Build Windows installers** → otvori poslednji uspešan run.
3. Na dnu: **Artifacts** → **Evidencija-Otpada-Windows-installers** (ZIP).
4. Na Windows PC raspakuj ZIP:
   - `msi/` → `.msi` (Windows Installer)
   - `nsis/` → `*-setup.exe` (NSIS čarobnjak)

Ručno pokretanje: Actions → **Build Windows installers** → **Run workflow**.

---

## 2. Build na Windowsu (lokalno)

PowerShell ili CMD u korenu projekta:

```bat
npm install
npm run tauri:build
```

Instalatori:

- `src-tauri\target\release\bundle\msi\`
- `src-tauri\target\release\bundle\nsis\`

---

## 3. Verzija aplikacije

Isti broj drži usklađen u:

- `package.json` → `"version"`
- `src-tauri/tauri.conf.json` → `"version"`
- `src-tauri/Cargo.toml` → `version = "..."`

Pre release-a podigni verziju u sva tri, pa push / tag.

---

## 4. SmartScreen (nepotpisani build)

Instalacija može prikazati upozorenje. **More info** → **Run anyway**, ili kasnije potpiši kod sertifikatom ako firma zahteva.

---

## 5. Šta dobijaš

| Fajl   | Opis              |
| ------ | ----------------- |
| `.msi` | Klasičan installer |
| `.exe` | NSIS setup        |

Oba instaliraju **Evidencija Otpada** (ime iz `tauri.conf.json`).
