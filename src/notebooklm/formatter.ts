
import type { Locator } from "playwright";
import * as cheerio from "cheerio";

export async function limpiarRespuesta(
  respuesta: Locator
): Promise<string> {
  // Obtener el HTML desde Playwright.
  const html = await respuesta.innerHTML();

  // Procesarlo en Node.js, fuera del navegador.
  const $ = cheerio.load(html);

  // Eliminar elementos de interfaz.
  $(
    "thinking-chain-view, button, mat-icon"
  ).remove();

  // Convertir las tablas a Markdown.
  $("table").each((_, tabla) => {
    const filas: string[][] = [];

    $(tabla).find("tr").each((_, fila) => {
      const celdas: string[] = [];

      $(fila).children("th, td").each((_, celda) => {
        const texto = $(celda)
          .text()
          .trim()
          .replace(/\s+/g, " ")
          .replace(/\|/g, "\\|");

        celdas.push(texto);
      });

      if (celdas.length > 0) {
        filas.push(celdas);
      }
    });

    const encabezado = filas[0];

    if (!encabezado) {
      $(tabla).remove();
      return;
    }

    const separador = encabezado.map(() => "---");

    const markdown = [
      `| ${encabezado.join(" | ")} |`,
      `| ${separador.join(" | ")} |`,
      ...filas.slice(1).map(
        (fila) => `| ${fila.join(" | ")} |`
      ),
    ].join("\n");

    $(tabla).replaceWith(`\n\n${markdown}\n\n`);
  });

  // Conservar saltos de línea.
  $(
    "paragraph-element-view, li, h1, h2, h3, h4"
  ).each((_, elemento) => {
    $(elemento).append("\n");
  });

  return $.root()
    .text()
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

