import type { Page } from "playwright";

export interface Cuaderno {
  nombre: string;
  emoji: string;
  id: string;
  url: string;
}

const TARJETAS =
  ".project-button-card:not(.featured-projects-container *)";

export async function listarCuadernos(
  page: Page
): Promise<Cuaderno[]> {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("https://notebook.google.com/");

  const cuadricula = page.getByRole("button", {
    name: /^(Vista de cuadrícula|Grid view)$/i,
  });

  if (await cuadricula.isVisible()) {
    await cuadricula.click();
  }

    // Esperar a que cargue la lista antes de comprobar
  // si existe la opción de ampliarla.
  await page.locator(TARJETAS).first().waitFor({
    state: "visible",
    timeout: 30000,
  });

  const verMas = page.getByRole("button", {
    name: "Ver más cuadernos recientes",
    exact: true,
  });

  // Con pocos cuadernos, la lista ya está completa
  // y NotebookLM no muestra este botón.
  if (await verMas.count() > 0) {
    await verMas.click({ timeout: 15000 });
    await verMas.waitFor({
      state: "hidden",
      timeout: 15000,
    });
  }

  const encontrados = new Map<string, Cuaderno>();

  async function recoger(): Promise<void> {
    const cuadernos = await page.locator(TARJETAS).evaluateAll(
      tarjetas => tarjetas.flatMap(tarjeta => {
        const enlace = tarjeta.querySelector<HTMLAnchorElement>(
          'a[href*="/notebook/"]'
        );
        const nombre = tarjeta
          .querySelector(".project-button-title")
          ?.textContent?.trim();

        if (!enlace || !nombre) {
          return [];
        }

        const url = new URL(enlace.href);
        const id = url.pathname.match(
          /^\/notebook\/([a-zA-Z0-9-]+)\/?$/
        )?.[1];

        if (!id) {
          return [];
        }

        return [{
          nombre,
          emoji: tarjeta
            .querySelector(".project-button-box-icon")
            ?.textContent?.trim() || "",
          id,
          url: url.toString(),
        }];
      })
    );

    for (const cuaderno of cuadernos) {
      encontrados.set(cuaderno.id, cuaderno);
    }
  }

  async function desplazar(
    reiniciar: boolean
  ): Promise<boolean> {
    return page.evaluate(({ selector, reiniciar }) => {
      const contenedores = new Set<Element>();

      if (document.scrollingElement) {
        contenedores.add(document.scrollingElement);
      }

      for (const tarjeta of document.querySelectorAll(selector)) {
        let padre = tarjeta.parentElement;

        while (padre) {
          if (
            padre.scrollHeight > padre.clientHeight + 1 ||
            padre.scrollWidth > padre.clientWidth + 1
          ) {
            contenedores.add(padre);
          }

          padre = padre.parentElement;
        }
      }

      let huboMovimiento = false;

      for (const elemento of contenedores) {
        const antesY = elemento.scrollTop;
        const antesX = elemento.scrollLeft;

        elemento.scrollTo({
          top: reiniciar
            ? 0
            : antesY + Math.max(1, elemento.clientHeight * 0.8),
          left: reiniciar
            ? 0
            : antesX + Math.max(1, elemento.clientWidth * 0.8),
          behavior: "instant",
        });

        huboMovimiento ||= (
          elemento.scrollTop !== antesY ||
          elemento.scrollLeft !== antesX
        );
      }

      return huboMovimiento;
    }, { selector: TARJETAS, reiniciar });
  }

  // Exigir varias observaciones sin cambios al llegar al final.
  // Recoger en cada paso conserva tarjetas que luego desaparecen
  // del DOM en una lista virtualizada.
  const limite = Date.now() + 120000;
  let pasadasSinNuevos = 0;

  while (Date.now() < limite) {
    const cantidadInicial = encontrados.size;
    await desplazar(true);

    let finalEstable = 0;

    while (Date.now() < limite && finalEstable < 4) {
      await recoger();
      const antes = encontrados.size;
      const movimiento = await desplazar(false);

      // Intervalo de observación entre desplazamientos.
      await page.waitForTimeout(750);
      await recoger();

      const cargando = await page.locator(
        '[role="progressbar"]:visible, [aria-busy="true"]:visible'
      ).count();

      if (
        !movimiento &&
        encontrados.size === antes &&
        cargando === 0
      ) {
        finalEstable++;
      } else {
        finalEstable = 0;
      }
    }

    if (finalEstable < 4) {
      break;
    }

    pasadasSinNuevos = encontrados.size === cantidadInicial
      ? pasadasSinNuevos + 1
      : 0;

    if (pasadasSinNuevos >= 2) {
      return [...encontrados.values()];
    }
  }

  throw new Error(
    "No se pudo completar la carga de cuadernos en 120 segundos. " +
    `Se encontraron ${encontrados.size}, pero la carga no se estabilizó.`
  );
}