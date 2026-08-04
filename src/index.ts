import { chromium } from "playwright";

async function main() {
  const context = await chromium.launchPersistentContext(
    "playwright/profile",
    {
      headless: false,
    }
  );

  const page = context.pages()[0] ?? await context.newPage();

  await page.goto("https://notebooklm.google.com");

  console.log(await page.title());

  console.log("Si todo salió bien, ya no debería pedir iniciar sesión.");

  await page.waitForTimeout(300000);

  await context.close();
}

main().catch(console.error);