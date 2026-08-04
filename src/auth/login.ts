import { chromium } from "playwright";

async function login() {
  const context = await chromium.launchPersistentContext(
    "playwright/profile",
    {
      headless: false,
    }
  );

  const page = await context.newPage();

  await page.goto("https://notebooklm.google.com");

  console.log("");
  console.log("Inicia sesión en Google.");
  console.log("Cuando ya estés dentro de NotebookLM, presiona ENTER.");

  process.stdin.resume();

  await new Promise<void>((resolve) => {
    process.stdin.once("data", () => resolve());
  });

  console.log("Perfil guardado.");

  await context.close();
}

login().catch(console.error);