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

  await page.getByRole("button", {
    name: /^Notebook sections,/,
  }).click();

  await page.getByRole("menu")
    .getByText("Todos", { exact: true })
    .click();

  await page.getByRole("button", {
    name: "Notebook sections, Todos",
    exact: true,
  }).waitFor({ state: "visible", timeout: 15000 });

  await page.getByRole("button", {
    name: "Vista de cuadrícula",
    exact: true,
  }).click();

  // Esperar a que aparezcan las tarjetas.
  await page.locator(".project-button-card:not(.featured-projects-container *)").first().waitFor({
    state: "visible",
    timeout: 30000,
  });

  const cuadernos = await page
    .locator(".project-button-card:not(.featured-projects-container *)")
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