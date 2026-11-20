import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";
import { enviarPregunta, obtenerRespuesta } from "../notebooklm/chat.js";
import { listarCuadernos } from "../notebooklm/notebooks.js";
import { ENV_PATH } from "../config/paths.js";
import { conectarNotebookLM } from "../notebooklm/browser.js";
import { config } from "dotenv";
import { aplicarVisibilidadCDP } from "../notebooklm/edge-cdp.js";
import type { BrowserContext, Page } from "playwright";

config({ path: ENV_PATH });

async function crearPaginaConsulta(
  context: BrowserContext
): Promise<Page> {
  const usarSegundoPlano =
    process.env.NOTEBOOKLM_CONNECTION?.trim().toLowerCase() === "cdp" &&
    process.env.NOTEBOOKLM_CDP_WINDOW?.trim().toLowerCase() === "hidden";

  if (!usarSegundoPlano) {
    return context.newPage();
  }

  const browser = context.browser();

  if (!browser) {
    throw new Error(
      "No se encontró el navegador conectado por CDP."
    );
  }

  const session = await browser.newBrowserCDPSession();

  try {
    const [page] = await Promise.all([
      context.waitForEvent("page", { timeout: 15000 }),
      session.send("Target.createTarget", {
        url: "about:blank",
        background: true,
        newWindow: false,
      }),
    ]);

    return page;
  } finally {
    await session.detach();
  }
}

const server = new McpServer({
  name: "notebooklm-mcp",
  version: "1.0.0",
});

server.registerTool(
  "preguntar_notebooklm",
  {
    description:
      "EnvÃ­a una pregunta a NotebookLM y devuelve una respuesta basada en las fuentes del cuaderno.",
    inputSchema: z.object({
        pregunta: z.string().min(1).describe("Pregunta para NotebookLM"),

        notebookId: z
            .string()
            .uuid()
            .optional()
            .describe(
            "ID del cuaderno que se desea consultar. Se obtiene con listar_cuadernos. Si se omite, se utiliza NOTEBOOKLM_URL."
            ),

        notebookNombre: z
            .string()
            .trim()
            .min(1)
            .optional()
            .describe(
              "Nombre completo o parte del nombre del cuaderno. Si hay varias coincidencias, se devolverán opciones para elegir."
            ),
    }),
  },

async ({ pregunta, notebookId, notebookNombre }) => {
  console.error("Pregunta MCP recibida.");

  const { context, cerrar } = await conectarNotebookLM();
  let page: Awaited<ReturnType<typeof context.newPage>> | undefined;

  try {
    page = await crearPaginaConsulta(context);
    if (
      process.env.NOTEBOOKLM_CONNECTION?.trim().toLowerCase() === "cdp" &&
      process.env.NOTEBOOKLM_CDP_WINDOW?.trim().toLowerCase() === "hidden"
    ) {
      await aplicarVisibilidadCDP();
    }

    if (notebookId && notebookNombre) {
      throw new Error(
        "Indicá notebookId o notebookNombre, pero no ambos."
      );
    }

    let notebookUrl = notebookId
      ? `https://notebook.google.com/notebook/${notebookId}`
      : process.env.NOTEBOOKLM_URL;

    if (notebookNombre) {
      const normalizar = (texto: string): string =>
        texto
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLocaleLowerCase("es")
          .trim()
          .replace(/\s+/g, " ");

      const cuadernos = await listarCuadernos(page);
      const nombreBuscado = normalizar(notebookNombre);

      const exactos = cuadernos.filter(
        (cuaderno) => normalizar(cuaderno.nombre) === nombreBuscado
      );

      const coincidencias = exactos.length > 0
        ? exactos
        : cuadernos.filter((cuaderno) =>
            normalizar(cuaderno.nombre).includes(nombreBuscado)
          );

      if (coincidencias.length === 0) {
        throw new Error(
          `No se encontró un cuaderno con el nombre "${notebookNombre}". Usá listar_cuadernos para ver los disponibles.`
        );
      }

      if (coincidencias.length > 1) {
        const opciones = coincidencias
          .map((cuaderno) => `- ${cuaderno.nombre} | ID: ${cuaderno.id}`)
          .join("\n");

        throw new Error(
          `Hay varios cuadernos que coinciden con "${notebookNombre}". Pedile al usuario que elija uno y luego usá su notebookId:\n${opciones}`
        );
      }

      notebookUrl = coincidencias[0]!.url;
    }

    if (!notebookUrl) {
        throw new Error(
            "Falta configurar NOTEBOOKLM_URL con la dirección del cuaderno."
        );
    }

    const url = new URL(notebookUrl);

    if (
        url.protocol !== "https:" ||
        url.hostname !== "notebook.google.com" ||
        !/^\/notebook\/[a-zA-Z0-9-]+\/?$/.test(url.pathname)
    ) {
        throw new Error(
            "NOTEBOOKLM_URL debe ser una dirección válida de un cuaderno de NotebookLM."
        );
    }

    await page.goto(url.toString());

    await enviarPregunta(page, pregunta);

    const respuesta = await obtenerRespuesta(page, pregunta);

    return {
      content: [
        {
          type: "text" as const,
          text: respuesta,
        },
      ],
    };
  } catch (error) {
    console.error("Error al consultar NotebookLM:", error);

    return {
      isError: true,
      content: [
        {
          type: "text" as const,
          text:
            error instanceof Error
              ? error.message
              : String(error),
        },
      ],
    };
  } finally {
      try {
        if (page && !page.isClosed()) {
          await page.close();
        }
      } finally {
        await cerrar();
      }
  }
}
);

server.registerTool(
  "listar_cuadernos",
  {
    description:
      "Lista los cuadernos disponibles en la cuenta de Google NotebookLM del usuario, incluyendo nombre, emoji, identificador y URL.",
    inputSchema: z.object({}),
  },
  async () => {
    const { context, cerrar } = await conectarNotebookLM();
    let page: Awaited<ReturnType<typeof context.newPage>> | undefined;

    try {
      page = await crearPaginaConsulta(context);
      if (
        process.env.NOTEBOOKLM_CONNECTION?.trim().toLowerCase() === "cdp" &&
        process.env.NOTEBOOKLM_CDP_WINDOW?.trim().toLowerCase() === "hidden"
      ) {
        await aplicarVisibilidadCDP();
      }
      const cuadernos = await listarCuadernos(page);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(cuadernos, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error("Error al listar cuadernos:", error);

      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text:
              error instanceof Error
                ? error.message
                : "No se pudieron listar los cuadernos.",
          },
        ],
      };
    } finally {
        try {
          if (page && !page.isClosed()) {
            await page.close();
          }
        } finally {
          await cerrar();
        }
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();

  await server.connect(transport);

  console.error("Servidor NotebookLM MCP iniciado.");
}

main().catch((error) => {
  console.error("Error al iniciar MCP:", error);
  process.exit(1);
});
