import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";
import { chromium } from "playwright";
import { enviarPregunta, obtenerRespuesta } from "../notebooklm/chat.js";

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
      pregunta: z.string().min(1).describe(
        "Pregunta que se desea realizar a NotebookLM"
      ),
    }),
  },

async ({ pregunta }) => {
  console.error("Pregunta MCP recibida.");

  const context = await chromium.launchPersistentContext(
    "playwright/profile",
    {
      headless: false,
    }
  );

  try {
    const page = await context.newPage();

    await page.goto(
      "https://notebook.google.com/notebook/3d0f8b0a-e2dc-464d-9947-248d08b519b0"
    );

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

async function main() {
  const transport = new StdioServerTransport();

  await server.connect(transport);

  console.error("Servidor NotebookLM MCP iniciado.");
}

main().catch((error) => {
  console.error("Error al iniciar MCP:", error);
  process.exit(1);
});
