
import { config } from "dotenv";
import { ENV_PATH } from "../config/paths.js";
import { abrirNavegador } from "../notebooklm/browser.js";

config({ path: ENV_PATH });

async function login() {
  const context = await abrirNavegador();

  try {
    const page = context.pages()[0] ?? await context.newPage();

    await page.goto("https://notebook.google.com/");

    console.log("");
    console.log("Iniciá sesión en Google si es necesario.");
    console.log("Cuando estés dentro de NotebookLM, presioná ENTER.");

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
