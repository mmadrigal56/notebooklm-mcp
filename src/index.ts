
import { chromium } from "playwright";

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

    console.log("Abriendo cuaderno de NotebookLM...");

    await page.goto(NOTEBOOK_URL, {
      waitUntil: "domcontentloaded",
    });

    await page.waitForLoadState("domcontentloaded");

    console.log("Página cargada:", await page.title());
    console.log("URL actual:", page.url());

    console.log("Navegador abierto para verificar el cuaderno.");

    await page.waitForTimeout(300000);
  } finally {
    await context.close();
  }
}

main().catch(console.error);
