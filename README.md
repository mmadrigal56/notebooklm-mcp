# NotebookLM MCP

Servidor MCP (*Model Context Protocol*) que permite conectar asistentes de IA compatibles con servidores MCP locales a Google NotebookLM.

Utiliza **Playwright** para interactuar con NotebookLM mediante un navegador web. Permite iniciar un navegador con un perfil persistente o conectarse a una sesión existente de Microsoft Edge mediante **Chrome DevTools Protocol (CDP)**.

El servidor permite listar los cuadernos disponibles en una cuenta de Google y realizar consultas basadas en sus fuentes.

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

### Alternativa: conectar mediante CDP (Microsoft Edge)

Algunas cuentas de Google pueden rechazar el inicio de sesión desde navegadores controlados directamente por Playwright.

Como alternativa, el proyecto permite iniciar sesión normalmente en Microsoft Edge y conectar posteriormente el servidor MCP mediante Chrome DevTools Protocol (CDP).

**Esta modalidad se ha probado correctamente en Windows con Microsoft Edge y MCP Inspector.**

**1. Crear un perfil independiente de Edge**

Cerrar las ventanas de Edge y ejecutar en PowerShell:

```powershell
& "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe" --user-data-dir="$env:USERPROFILE\notebooklm-edge-test" "https://notebook.google.com/"
```

Iniciar sesión normalmente en Google y comprobar que NotebookLM muestra los cuadernos de la cuenta.

Cerrar Edge después de completar el inicio de sesión.

**2. Abrir Edge con depuración local habilitada**

```powershell
& "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe" --user-data-dir="$env:USERPROFILE\notebooklm-edge-test" --remote-debugging-address=127.0.0.1 --remote-debugging-port=9222 "https://notebook.google.com/"
```

Mantener Edge abierto mientras se utiliza el servidor MCP.

**3. Configurar `.env`**

```dotenv
NOTEBOOKLM_CONNECTION=cdp
NOTEBOOKLM_CDP_URL=http://127.0.0.1:9222
```

**4. Verificar la conexión**

```powershell
Invoke-RestMethod http://127.0.0.1:9222/json/version
```

Si la conexión está disponible, el comando mostrará información del navegador y del protocolo de depuración.

**5. Utilizar el MCP**

Iniciar el servidor desde un cliente compatible, como MCP Inspector o Codex CLI.

Las herramientas `listar_cuadernos` y `preguntar_notebooklm` utilizarán la sesión de Edge previamente autenticada.

**Consideraciones de seguridad:**

- Utilizar un perfil independiente para NotebookLM.
- Mantener el puerto de depuración accesible únicamente desde el equipo local.
- No exponer el puerto 9222 a Internet ni a otras computadoras.
- No compartir el perfil, las cookies ni las direcciones de conexión WebSocket.
- Cerrar Edge al terminar de utilizar el MCP.

La depuración remota concede acceso amplio a la sesión del navegador. Esta modalidad está pensada para uso local en un equipo de confianza.

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
- La automatización requiere un navegador con interfaz gráfica. El modo persistente admite Chromium, Firefox, Chrome y Edge; el modo CDP se ha probado con Microsoft Edge.
- Las operaciones deben ejecutarse secuencialmente cuando comparten el mismo perfil del navegador.
- El listado depende de los cuadernos cargados en la página principal.
- La compatibilidad con diferentes clientes MCP aún requiere pruebas individuales.
- El modo CDP requiere que Edge permanezca abierto con la depuración local habilitada. El servidor MCP no inicia automáticamente ese navegador.

## Tecnologías

- TypeScript
- Node.js
- Playwright
- Cheerio
- Model Context Protocol SDK
- Zod

## Estado del proyecto

En desarrollo. Las herramientas `listar_cuadernos` y `preguntar_notebooklm` se han probado correctamente mediante MCP Inspector y Codex CLI en Windows.

También se ha verificado el funcionamiento de ambas herramientas desde MCP Inspector utilizando Microsoft Edge mediante CDP y una sesión de Google iniciada previamente por el usuario.