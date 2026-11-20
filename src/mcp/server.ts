import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";
import { enviarPregunta, obtenerRespuesta } from "../notebooklm/chat.js";
import { listarCuadernos } from "../notebooklm/notebooks.js";
import { ENV_PATH } from "../config/paths.js";
import { abrirNavegador } from "../notebooklm/browser.js";
import { config } from "dotenv";

config({ path: ENV_PATH });

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
    }),
  },

async ({ pregunta, notebookId}) => {
  console.error("Pregunta MCP recibida.");

  const context = await abrirNavegador();

  try {
    const page = await context.newPage();

    const notebookUrl = notebookId
        ? `https://notebook.google.com/notebook/${notebookId}`
        : process.env.NOTEBOOKLM_URL;

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
    await context.close();
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
    const context = await abrirNavegador();

    try {
      const page = await context.newPage();
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
      await context.close();
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
