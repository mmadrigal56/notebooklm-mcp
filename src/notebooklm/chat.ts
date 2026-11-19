
import type { Page } from "playwright";

export async function enviarPregunta(
  page: Page,
  pregunta: string
): Promise<void> {
  const cuadroConsulta = page.getByRole("textbox", {
    name: "Cuadro de consulta",
  });

  console.log("Buscando cuadro de consulta...");

  await cuadroConsulta.waitFor({
    state: "visible",
    timeout: 15000,
  });

  console.log("Escribiendo pregunta...");

  await cuadroConsulta.fill(pregunta);

  console.log("Pregunta escrita.");

  // Buscar el botón de envío asociado al cuadro
  const botonEnviar = page.locator(
    "button[aria-label*='Enviar'], button[aria-label*='Send']"
  );

  console.log("Buscando botón de envío...");

  console.log(
    "Botones encontrados:",
    await botonEnviar.count()
  );

  await botonEnviar.first().click({
    timeout: 10000,
  });

  console.log("Clic realizado en el botón de envío.");

  // Comprobar si se vació el cuadro
  await page.waitForTimeout(2000);

  console.log(
    "Texto restante en el cuadro:",
    await cuadroConsulta.inputValue()
  );
}

