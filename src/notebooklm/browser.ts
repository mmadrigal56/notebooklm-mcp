
import {
  chromium,
  firefox,
  type BrowserContext,
} from "playwright";

import { obtenerRutaPerfil } from "../config/paths.js";

import { asegurarEdgeCDP } from "./edge-cdp.js";

type Navegador = "chromium" | "firefox" | "chrome" | "msedge";

type ConexionNotebookLM = {
  context: BrowserContext;
  cerrar: () => Promise<void>;
};

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

export async function conectarNotebookLM(): Promise<ConexionNotebookLM> {
  const modo = (
    process.env.NOTEBOOKLM_CONNECTION || "persistent"
  ).toLowerCase();

  if (modo === "persistent") {
    const context = await abrirNavegador();

    return {
      context,
      cerrar: async () => {
        await context.close();
      },
    };
  }

  if (modo === "cdp") {
    const endpoint =
      process.env.NOTEBOOKLM_CDP_URL ||
      "http://127.0.0.1:9222";

    const url = new URL(endpoint);

    if (
      url.protocol !== "http:" ||
      url.hostname !== "127.0.0.1"
    ) {
      throw new Error(
        "NOTEBOOKLM_CDP_URL debe utilizar http://127.0.0.1."
      );
    }

    await asegurarEdgeCDP(endpoint);

    const browser = await chromium.connectOverCDP(
      endpoint
    );

    const context = browser.contexts()[0];

    if (!context) {
      await browser.close();

      throw new Error(
        "No se encontró un contexto en el navegador CDP."
      );
    }

    return {
      context,
      cerrar: async () => {
        // Desconectar Playwright sin cerrar el navegador del usuario.
        await browser.close();
      },
    };
  }

  throw new Error(
    `Modo de conexión no soportado: ${modo}. Opciones: persistent, cdp`
  );
}
