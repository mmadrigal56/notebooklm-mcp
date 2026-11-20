import { chromium } from "playwright";
import { PROFILE_PATH } from "../config/paths.js";

async function login() {
  const context = await chromium.launchPersistentContext(
    PROFILE_PATH,
    {
      headless: false,
    }
  );

  try {
    const page = await context.newPage();

    await page.goto("https://notebook.google.com/");

    console.log("");
    console.log("Inicia sesión en Google si es necesario.");
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

login().catch(console.error);
