import { invoke as tauriInvoke, isTauri } from "@tauri-apps/api/core";
import { save as tauriSave } from "@tauri-apps/plugin-dialog";

const NOT_IN_TAURI =
  "Ova aplikacija mora da radi u Tauri prozoru (desktop). Ne otvarajte samo http://localhost:1420 u pregledaču — pokrenite `npm run tauri dev` i koristite prozor koji se otvori sa aplikacijom.";

function assertTauri(): void {
  if (!isTauri()) {
    throw new Error(NOT_IN_TAURI);
  }
}

/** IPC ka Rust backend-u — bezbedno van Taurija (jasna greška umesto „reading 'invoke'“). */
export async function invoke<T>(
  cmd: string,
  args?: Record<string, unknown>
): Promise<T> {
  assertTauri();
  return tauriInvoke(cmd, args) as Promise<T>;
}

/** Dijalog za čuvanje fajla — isto kao `save` iz plugin-dialog, sa proverom okruženja. */
export async function save(
  options?: Parameters<typeof tauriSave>[0]
): Promise<string | null> {
  assertTauri();
  return tauriSave(options);
}
