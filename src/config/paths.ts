import { fileURLToPath } from "node:url";
import path from "node:path";

const directorioActual = path.dirname(fileURLToPath(import.meta.url));

export const PROJECT_ROOT = path.resolve(directorioActual, "../..");

export const PROFILE_PATH = path.join(
  PROJECT_ROOT,
  "playwright",
  "profile"
);

export function obtenerRutaPerfil(navegador: string): string {
  if (navegador === "chromium") {
    return PROFILE_PATH;
  }

  return path.join(PROJECT_ROOT, "playwright", `profile-${navegador}`);
}

export const ENV_PATH = path.join(PROJECT_ROOT, ".env");