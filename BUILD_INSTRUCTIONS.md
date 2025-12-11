# Instrukcije za Build Windows Installer-a

## Važno: Build na Windows mašini

Za kreiranje Windows installer-a, **mora se build-ovati na Windows mašini** jer Tauri zahteva Windows build alate.

## Preduslovi na Windows mašini

1. **Instalirati Rust:**
   ```powershell
   # Preuzmi i instaliraj sa https://www.rust-lang.org/tools/install
   # Ili koristi winget:
   winget install Rustlang.Rust.MSVC
   ```

2. **Instalirati Node.js:**
   ```powershell
   # Preuzmi sa https://nodejs.org/
   # Ili koristi winget:
   winget install OpenJS.NodeJS.LTS
   ```

3. **Instalirati Visual Studio Build Tools:**
   ```powershell
   # Preuzmi sa https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
   # Instaliraj "Desktop development with C++" workload
   ```

## Build proces

1. **Kloniraj projekat na Windows mašinu:**
   ```powershell
   git clone <repository-url>
   cd waste-evidence-app
   ```

2. **Instaliraj dependencies:**
   ```powershell
   npm install
   ```

3. **Build aplikacije:**
   ```powershell
   npm run tauri:build:windows
   ```

   Ili direktno:
   ```powershell
   npm run build
   npx tauri build --target x86_64-pc-windows-msvc
   ```

## Rezultat

Nakon build-a, installer fajlovi će biti u:

- **MSI installer:** `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/msi/Evidencija Otpada_0.1.0_x64_en-US.msi`
- **NSIS installer (EXE):** `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/Evidencija Otpada_0.1.0_x64-setup.exe`

## Distribucija

Oba installer-a su spremna za distribuciju:

- **MSI** - Standardni Windows installer, koristi se za enterprise distribuciju
- **EXE (NSIS)** - Portable installer, lakši za krajnje korisnike

Korisnik samo:
1. Pokreće installer (EXE ili MSI)
2. Prati instalacione korake
3. Aplikacija se instalira i pojavljuje u Start meniju

## Napomene

- Build proces može potrajati 5-15 minuta prvi put (kompajliranje Rust koda)
- Instaler će automatski uključiti sve potrebne dependencies
- Aplikacija će biti potpuno standalone - ne zahteva Node.js ili druge alate

