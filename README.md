# Evidencija Otpada

Desktop aplikacija za upravljanje dnevnim evidencijama otpada, sa mogućnošću generisanja i izvoza podataka u Excel format.

## Tehnologije

- **Frontend:** React + TypeScript + Vite
- **Backend:** Rust
- **Framework:** Tauri 2.0
- **Excel generisanje:** rust_xlsxwriter
- **Excel import:** calamine

## Funkcionalnosti

- Generisanje podataka za dnevnu evidenciju otpada
- Automatsko računanje stanja na privremenom skladištu
- Izvoz podataka u Excel format (po mesecu ili za celu godinu)
- Upravljanje konfiguracijama otpada
- Dark mode podrška
- Moderni UI sa MR Engines brand bojama (crvena, crna, siva, bela)

## Instalacija i razvoj

### Preduslovi

- Node.js (LTS verzija)
- Rust (najnovija stabilna verzija)
- npm ili yarn

### Lokalni razvoj

```bash
# Instaliraj dependencies
npm install

# Pokreni dev server
npm run dev

# Build aplikacije
npm run build
```

## Build za Windows

Za kreiranje Windows installer-a, potrebno je build-ovati na Windows mašini:

```powershell
npm run tauri:build:windows
```

Detaljne instrukcije su u `BUILD_INSTRUCTIONS.md`.

## Struktura projekta

```
waste-evidence-app/
├── src/                    # React frontend
│   ├── components/        # React komponente
│   ├── types.ts           # TypeScript tipovi
│   └── App.tsx            # Glavna komponenta
├── src-tauri/             # Rust backend
│   ├── src/
│   │   ├── main.rs        # Tauri entry point
│   │   ├── commands.rs    # Backend komande
│   │   ├── excel.rs       # Excel generisanje
│   │   └── excel_import.rs # Excel import
│   └── Cargo.toml         # Rust dependencies
└── package.json           # Node.js dependencies
```

## Licenca

Privatni projekat - MR Engines
