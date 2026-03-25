/**
 * Unos i prikaz u tonama — uvek tačno **3 decimale** (poslednja može biti 0, npr. 1.560).
 */
export function parseTonsInput(raw: string): number | null {
  const s = raw.trim().replace(/\u00A0/g, "").replace(/\s/g, "");
  if (s === "") return null;
  if (s === "-" || s === "+" || s === "." || s === ",") return null;

  if (s.includes(",")) {
    const lastComma = s.lastIndexOf(",");
    let before = s.slice(0, lastComma);
    const after = s.slice(lastComma + 1).replace(/[^\d]/g, "");
    if (after === "") return null;

    const dots = (before.match(/\./g) || []).length;
    if (dots >= 2) {
      before = before.replace(/\./g, "");
      const n = parseFloat(`${before}.${after}`);
      return Number.isFinite(n) && n >= 0 ? n : null;
    }
    if (!before.includes(".")) {
      const n = parseFloat(`${before}.${after}`);
      return Number.isFinite(n) && n >= 0 ? n : null;
    }
    const n = parseFloat(`${before}.${after}`);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }

  if (!/^[\d.]+$/.test(s)) return null;

  const n = parseFloat(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function roundTons(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/** Sve količine u tonama (t); ispod nule nije dozvoljeno. */
export function nonNegativeTons(n: number): number {
  return roundTons(Math.max(0, n));
}

/** Prikaz (npr. kolona „Stanje“, ukupno): tačno 3 decimale. */
export function formatTonsDisplay(n: number): string {
  return roundTons(n).toFixed(3);
}

/** Vrednost u polju za unos nakon blur; 0 = prazno. */
export function formatTonsForInput(n: number): string {
  if (n === 0 || Object.is(n, -0)) return "";
  return roundTons(n).toFixed(3);
}

/** Vrednost u tabeli (uvek 3 decimale, uključujući 0.000) — da ne izgleda „prazno“ kad je nula. */
export function formatTonsTableCell(n: number): string {
  const v = Number.isFinite(n) ? n : 0;
  return roundTons(v).toFixed(3);
}
