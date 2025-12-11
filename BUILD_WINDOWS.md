# Instrukcije za build Windows installer-a

## Preduslovi

Za build Windows aplikacije na macOS/Linux, potrebno je:

1. **Instalirati Windows build alate** (samo ako build-uješ na macOS/Linux):
   - Instalirati `cargo-xwin` ili koristiti cross-compilation
   - **ILI** build-ovati direktno na Windows mašini (preporučeno)

2. **Na Windows mašini** (najlakše rešenje):
   - Instalirati [Rust](https://www.rust-lang.org/tools/install)
   - Instalirati [Node.js](https://nodejs.org/)
   - Instalirati [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022) (potrebno za Rust Windows build)

## Build proces

### Opcija 1: Build na Windows mašini (preporučeno)

```bash
# 1. Kloniraj/nauči projekat
cd waste-evidence-app

# 2. Instaliraj Node.js dependencies
npm install

# 3. Build aplikacije
npm run tauri:build:windows
```

Installer fajlovi će biti u:
- `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/msi/` - MSI installer
- `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/` - NSIS installer (EXE)

### Opcija 2: Build na macOS/Linux (cross-compilation)

Zahtevaju dodatne alate i konfiguraciju. Preporučeno je build-ovati na Windows mašini.

## Rezultat

Nakon build-a, dobijaš:
- **MSI installer** - standardni Windows installer
- **NSIS installer (EXE)** - portable installer

Oba installer-a mogu se distribuirati korisnicima. Korisnik samo pokreće installer i instalira aplikaciju.

## Distribucija

Installer fajlovi su spremni za distribuciju. Korisnik:
1. Pokreće installer (EXE ili MSI)
2. Prati instalacione korake
3. Aplikacija se instalira i može se pokrenuti iz Start menija

## Napomena

Ako build-uješ na macOS/Linux, možda ćeš morati da koristiš Docker ili Windows VM za build proces, jer Tauri zahteva Windows build alate za kreiranje Windows installer-a.

