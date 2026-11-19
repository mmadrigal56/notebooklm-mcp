import { chromium } from "playwright";
import { enviarPregunta, obtenerRespuesta } from "./notebooklm/chat.js";

const NOTEBOOK_URL =
  "https://notebook.google.com/notebook/3d0f8b0a-e2dc-464d-9947-248d08b519b0";

async function main() {
  const context = await chromium.launchPersistentContext(
    "playwright/profile",
    {
      headless: false,
    }
  );

  try {
    const page = context.pages()[0] ?? await context.newPage();

    console.log("Abriendo cuaderno...");

    await page.goto(NOTEBOOK_URL, {
      waitUntil: "domcontentloaded",
    });

    console.log("Cuaderno abierto.");

    const pregunta =
      "PRUEBA MCP 2026 NUMERO 2: ¿Cuál es la diferencia entre velocidad y capacidad en Scrum?";

    await enviarPregunta(page, pregunta);

    const respuesta = await obtenerRespuesta(page, pregunta);

    console.log("\n========== RESPUESTA ==========\n");
    console.log(respuesta);
    console.log("\n===============================\n");

    console.log("Esperando para revisar la respuesta...");

    console.log("Navegador abierto. Presioná ENTER en PowerShell para cerrarlo.");

    await new Promise<void>((resolve) => {
      process.stdin.resume();
      process.stdin.once("data", () => resolve());
    });
  } finally {
    await context.close();
  }
}

main().catch(console.error);
