
import type { Page } from "playwright";



export async function enviarPregunta(
  page: Page,
  pregunta: string
): Promise<void> {
  const cuadroConsulta = page.getByRole("textbox", {
    name: "Cuadro de consulta",
  });

  console.log("Esperando cuadro de consulta...");

  await cuadroConsulta.waitFor({
    state: "visible",
    timeout: 30000,
  });

  // Esperar a que NotebookLM termine de cargar.
  await page.waitForTimeout(3000);

  // No enviar mientras haya otra generación activa.
  const botonDetener = page.locator(
    "button[aria-label='Detener generación']"
  );

  if (await botonDetener.isVisible()) {
    throw new Error(
      "NotebookLM todavía está generando una respuesta anterior."
    );
  }

  console.log("Escribiendo pregunta nueva...");

  await cuadroConsulta.fill(pregunta);

  const textoEscrito = await cuadroConsulta.inputValue();

  console.log("Texto escrito:", textoEscrito);

  if (textoEscrito !== pregunta) {
    throw new Error(
      "El texto del cuadro no coincide con la pregunta nueva."
    );
  }

  const botonEnviar = page.locator(
    "nb-icon-button.submit-button button[aria-label='Enviar']"
  );

  console.log("Enviando pregunta...");

  await botonEnviar.click({
    timeout: 15000,
  });

  // Confirmar que el cuadro se vació.
  await page.waitForTimeout(1000);

  const textoRestante = await cuadroConsulta.inputValue();

  console.log("Texto restante:", textoRestante);

  if (textoRestante.trim() !== "") {
    throw new Error(
      "La pregunta sigue escrita en el cuadro de consulta."
    );
  }

  // Verificar que la pregunta nueva aparezca en el historial.
  const preguntaEnHistorial = page
    .locator(".chat-message-pair")
    .filter({
      has: page.locator(".from-user-container").getByText(
        pregunta,
        { exact: true }
      ),
    })
    .last();

  await preguntaEnHistorial.waitFor({
    state: "visible",
    timeout: 30000,
  });

  console.log("Pregunta nueva confirmada en el historial.");
}


export async function obtenerRespuesta(
  page: Page,
  pregunta: string
): Promise<string> {
  console.log("Esperando respuesta de NotebookLM...");

  const par = page.locator(".chat-message-pair").filter({
    has: page.locator(".from-user-container").getByText(
      pregunta,
      { exact: true }
    ),
  }).last();

  await par.waitFor({
    state: "visible",
    timeout: 30000,
  });

  console.log("Pregunta encontrada en el historial.");

  const respuesta = par.locator(
    ".to-user-container .message-text-content"
  );

  const botonDetener = page.locator(
    "button[aria-label='Detener generación']"
  );

  const inicio = Date.now();
  const tiempoMaximo = 180000;
  let textoAnterior = "";
  let estableDesde = Date.now();
  let generacionObservada = false;

  while (Date.now() - inicio < tiempoMaximo) {
    const generando = await botonDetener.isVisible();

    if (generando) {
      generacionObservada = true;
      estableDesde = Date.now();
      console.log("NotebookLM sigue generando...");
    }

    const textoActual = await respuesta
      .innerText()
      .catch(() => "");

    if (textoActual !== textoAnterior) {
      textoAnterior = textoActual;
      estableDesde = Date.now();

      console.log(
        `Texto detectado: ${textoActual.length} caracteres`
      );
    }

    const mensajesTemporales = [
      "Buscando respuestas",
      "Explorando tu material",
      "Analizando fuentes",
      "Generando respuesta",
    ];

    const esTemporal = mensajesTemporales.some(
      (mensaje) => textoActual.includes(mensaje)
    );

    if (
      generacionObservada &&
      !generando &&
      textoActual.trim().length > 0 &&
      !esTemporal &&
      Date.now() - estableDesde >= 5000
    ) {
      console.log("Respuesta completa detectada.");
      return textoActual.trim();
    }

    await page.waitForTimeout(2000);
  }

  throw new Error(
    "NotebookLM no completó la respuesta dentro de los 180 segundos."
  );
}

