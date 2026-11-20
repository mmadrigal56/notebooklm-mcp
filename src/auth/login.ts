
import { config } from "dotenv";
import { ENV_PATH } from "../config/paths.js";
import {
  abrirNavegador,
  conectarNotebookLM,
} from "../notebooklm/browser.js";
import { asegurarEdgeCDP } from "../notebooklm/edge-cdp.js";

config({ path: ENV_PATH });

async function login() {
  const modo = (
    process.env.NOTEBOOKLM_CONNECTION || "persistent"
  ).toLowerCase();

  if (modo === "cdp") {
    const visibilidadAnterior =
      process.env.NOTEBOOKLM_CDP_WINDOW || "visible";
    process.env.NOTEBOOKLM_CDP_WINDOW = "visible";

    console.log("Modo de conexión: CDP");
    console.log("Comprobando conexión con Edge...");

    const { context, cerrar } = await conectarNotebookLM();

    try {
      const page = await context.newPage();

      try {
        await page.goto("https://notebook.google.com/");

        console.log("");
        console.log("Iniciá sesión en Google si es necesario.");
        console.log(
          "Cuando estés dentro de NotebookLM, presioná ENTER."
        );

        process.stdin.resume();

        await new Promise<void>((resolve) => {
          process.stdin.once("data", () => resolve());
        });

        process.stdin.pause();

        console.log("La sesión se conserva en el perfil de Edge.");
      } finally {
        try {
          await page.close();
        } finally {
          process.env.NOTEBOOKLM_CDP_WINDOW = visibilidadAnterior;
          await asegurarEdgeCDP(
            process.env.NOTEBOOKLM_CDP_URL || "http://127.0.0.1:9222"
          );
        }
      }
    } finally {
      await cerrar();
    }

    return;
  }

  if (modo !== "persistent") {
    throw new Error(
      `Modo no soportado: ${modo}. Opciones: persistent, cdp`
    );
  }

  const context = await abrirNavegador();

  try {
    const page =
      context.pages()[0] ?? await context.newPage();

    await page.goto("https://notebook.google.com/");

    console.log("");
    console.log("Iniciá sesión en Google si es necesario.");
    console.log(
      "Cuando estés dentro de NotebookLM, presioná ENTER."
    );

    process.stdin.resume();

    await new Promise<void>((resolve) => {
      process.stdin.once("data", () => resolve());
    });

    console.log("Perfil guardado.");
  } finally {
    await context.close();
  }
}

login().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
