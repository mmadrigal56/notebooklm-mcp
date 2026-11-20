# NotebookLM MCP

Servidor MCP (*Model Context Protocol*) que permite conectar asistentes de IA compatibles con servidores MCP locales a Google NotebookLM.

Utiliza **Playwright** para interactuar con NotebookLM desde un navegador Chromium y permite consultar los cuadernos disponibles en la cuenta de Google del usuario.

## Características

- Inicio de sesión con una cuenta personal de Google.
- Persistencia local de la sesión del navegador.
- Listado de cuadernos disponibles en NotebookLM.
- Consultas a diferentes cuadernos mediante su identificador.
- Cuaderno predeterminado opcional mediante `.env`.
- Respuestas de NotebookLM convertidas a texto Markdown.
- Comunicación MCP mediante STDIO.

## Requisitos

- Node.js y npm.
- Git.
- Un navegador Chromium instalado mediante Playwright.
- Una cuenta de Google con acceso a NotebookLM.
- Un cliente compatible con servidores MCP locales mediante STDIO.

El proyecto se ha desarrollado y probado principalmente en Windows.

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/mmadrigal56/notebooklm-mcp.git
cd notebooklm-mcp
```

### 2. Instalar las dependencias

```bash
npm install
npx playwright install chromium
```

En Windows PowerShell, si los comandos anteriores presentan restricciones de ejecución, se pueden utilizar `npm.cmd` y `npx.cmd`.

### 3. Iniciar sesión en Google

```bash
npm run login
```

Se abrirá Chromium.

1. Iniciar sesión en Google si es necesario.
2. Acceder a NotebookLM.
3. Regresar a la terminal y presionar Enter.

La sesión se conservará localmente en `playwright/profile/`.

**Seguridad:** no compartir ni publicar esta carpeta, ya que contiene información de la sesión del navegador.

### 4. Configurar un cuaderno predeterminado (opcional)

Copiar `.env.example` como `.env` y reemplazar el identificador de ejemplo por el de un cuaderno propio.

```dotenv
NOTEBOOKLM_URL=https://notebook.google.com/notebook/ID_DEL_CUADERNO
```

Esta configuración es opcional para listar cuadernos y consultar uno mediante su identificador.

Si se utiliza `preguntar_notebooklm` sin indicar `notebookId`, se necesita un cuaderno predeterminado configurado.

### 5. Verificar la instalación

```bash
npm run check
```

### 6. Iniciar el servidor MCP

```bash
npm run mcp
```

El servidor utiliza STDIO. Normalmente debe iniciarlo el cliente MCP, no una terminal independiente.

## Herramientas disponibles

### `listar_cuadernos`

Obtiene los cuadernos disponibles en la cuenta de NotebookLM.

No requiere parámetros.

Ejemplo de resultado:

```json
[
  {
    "nombre": "Mi cuaderno",
    "emoji": "📚",
    "id": "identificador-del-cuaderno",
    "url": "https://notebook.google.com/notebook/identificador-del-cuaderno"
  }
]
```

### `preguntar_notebooklm`

Envía una pregunta a un cuaderno de NotebookLM y devuelve su respuesta.

**Parámetros:**

| Parámetro | Tipo | Obligatorio |
|---|---|---|
| `pregunta` | string | Sí |
| `notebookId` | string (UUID) | No |

Si se proporciona `notebookId`, se consulta ese cuaderno. En caso contrario, se utiliza `NOTEBOOKLM_URL`.

## Ejemplos de uso

Una vez conectado el servidor a un cliente MCP compatible, se pueden realizar solicitudes como:

- «Mostrame mis cuadernos de NotebookLM».
- «Consultá mi cuaderno de Bases de Datos y explicame sus temas principales».
- «Según mi cuaderno de Ingeniería, ¿qué es un Sprint en Scrum?».

El cliente de IA debe invocar las herramientas MCP correspondientes.

## Configuración de clientes MCP

El servidor se comunica mediante STDIO y su punto de entrada de desarrollo es:

```text
src/mcp/server.ts
```

Para ejecutarlo directamente se puede utilizar `tsx`, indicando la ruta absoluta del archivo y asegurándose de que las dependencias estén instaladas.

La integración con Codex CLI se ha probado correctamente en Windows. Otros clientes MCP compatibles con STDIO podrían utilizar el servidor, pero todavía no se ha verificado su funcionamiento.

### Conectar con Codex CLI

**1. Instalar Codex CLI**

```powershell
npm.cmd install -g @openai/codex
```

**2. Registrar el servidor MCP**

Reemplazar `RUTA_DEL_PROYECTO` por la ruta absoluta donde se clonó el repositorio.

```powershell
codex.cmd mcp add notebooklm-mcp -- npx.cmd --prefix RUTA_DEL_PROYECTO tsx RUTA_DEL_PROYECTO\src\mcp\server.ts
```

**3. Verificar la configuración**

```powershell
codex.cmd mcp list
codex.cmd mcp get notebooklm-mcp
```

El servidor debe aparecer habilitado y utilizar el transporte `stdio`.

**4. Iniciar Codex**

```powershell
codex.cmd
```

**5. Probar las herramientas**

Ejemplo de solicitud:

> Mostrame mis cuadernos de NotebookLM. Después consultá el cuaderno Bases y explicame cuáles son sus temas principales.

Codex puede ejecutar `listar_cuadernos` y `preguntar_notebooklm` para completar la solicitud.

**Estado:** integración probada correctamente en Windows con Codex CLI.

## Limitaciones actuales

- Depende de la interfaz web de NotebookLM; cambios en sus elementos HTML pueden requerir ajustes en los selectores.
- La automatización utiliza Chromium con interfaz gráfica.
- Las operaciones deben ejecutarse secuencialmente cuando comparten el mismo perfil del navegador.
- El listado depende de los cuadernos cargados en la página principal.
- La compatibilidad con diferentes clientes MCP aún requiere pruebas individuales.

## Tecnologías

- TypeScript
- Node.js
- Playwright
- Cheerio
- Model Context Protocol SDK
- Zod

## Estado del proyecto

En desarrollo. Las herramientas listar_cuadernos y preguntar_notebooklm se han probado correctamente mediante MCP Inspector y Codex CLI en Windows.