
import { chromium, firefox, type BrowserContext } from "playwright";
import { obtenerRutaPerfil } from "../config/paths.js";

type Navegador = "chromium" | "firefox" | "chrome" | "msedge";

export async function abrirNavegador(): Promise<BrowserContext> {
  const navegador = (
    process.env.NOTEBOOKLM_BROWSER || "chromium"
  ).toLowerCase();

  const opciones: Navegador[] = [
    "chromium",
    "firefox",
    "chrome",
    "msedge",
  ];

  if (!opciones.includes(navegador as Navegador)) {
    throw new Error(
      `Navegador no soportado: ${navegador}. Opciones: ${opciones.join(", ")}`
    );
  }

  const perfil = obtenerRutaPerfil(navegador);

  if (navegador === "firefox") {
    return firefox.launchPersistentContext(perfil, {
      headless: false,
    });
  }

  return chromium.launchPersistentContext(perfil, {
    headless: false,
    ...(navegador === "chrome" || navegador === "msedge"
      ? { channel: navegador }
      : {}),
  });
}
