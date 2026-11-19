import { chromium } from "playwright";
import { enviarPregunta } from "./notebooklm/chat.js";

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

    await enviarPregunta(
      page,
      "PRUEBA MCP: ¿Cuáles son los principales riesgos de un proyecto?"
    );

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
