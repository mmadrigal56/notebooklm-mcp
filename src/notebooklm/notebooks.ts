import type { Page } from "playwright";

export interface Cuaderno {
  nombre: string;
  emoji: string;
  id: string;
  url: string;
}

export async function listarCuadernos(
  page: Page
): Promise<Cuaderno[]> {
  await page.goto("https://notebook.google.com/");

  // Esperar a que aparezcan las tarjetas.
  await page.locator(".project-button-card").first().waitFor({
    state: "visible",
    timeout: 30000,
  });

  const cuadernos = await page
    .locator(".project-button-card")
    .evaluateAll((tarjetas) =>
      tarjetas
        .map((tarjeta) => {
          const enlace = tarjeta.querySelector<HTMLAnchorElement>(
            'a[href^="/notebook/"]'
          );

          const nombre = tarjeta
            .querySelector(".project-button-title")
            ?.textContent?.trim();

          const emoji = tarjeta
            .querySelector(".project-button-box-icon")
            ?.textContent?.trim();

          const href = enlace?.getAttribute("href");

          if (!href || !nombre) {
            return null;
          }

          return {
            nombre,
            emoji: emoji || "",
            id: href.replace("/notebook/", ""),
            url: new URL(
              href,
              "https://notebook.google.com"
            ).toString(),
          };
        })
        .filter((cuaderno) => cuaderno !== null)
    );

  return cuadernos;
}