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
- Una cuenta de Google con acceso a NotebookLM.
- Un cliente compatible con servidores MCP locales mediante STDIO.
- Un navegador según el modo de conexión:
  - **Microsoft Edge (recomendado en Windows):** utilizar el navegador instalado en el sistema. No es necesario instalar Chromium mediante Playwright.
  - **Chromium (alternativa):** instalarlo mediante Playwright con `npx playwright install chromium`.

El proyecto se ha desarrollado y probado principalmente en Windows. Se recomienda Microsoft Edge mediante CDP porque Google puede bloquear el inicio de sesión desde Chromium controlado por Playwright.

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/mmadrigal56/notebooklm-mcp.git
cd notebooklm-mcp
```

### 2. Instalar las dependencias

Ejecutar desde la carpeta del proyecto:

```bash
npm install
```

En Windows PowerShell, si existen restricciones de ejecución, utilizar:

```powershell
npm.cmd install
```

**Para Microsoft Edge (recomendado en Windows):**

No es necesario instalar ningún navegador adicional mediante Playwright. Se utiliza Microsoft Edge instalado en Windows.

**Para Chromium (alternativa):**

Instalar el navegador de Playwright:

```bash
npx playwright install chromium
```

En Windows PowerShell se puede utilizar `npx.cmd`.


### 3. Configurar el navegador e iniciar sesión

El servidor permite utilizar Microsoft Edge mediante CDP o Chromium mediante Playwright.

En Windows se recomienda Microsoft Edge, ya que permite iniciar sesión normalmente en Google y reutilizar esa sesión desde el MCP.

#### Opción A: Microsoft Edge (recomendada en Windows)

**1. Configurar `.env`**

Copiar `.env.example` como `.env` en la carpeta del proyecto.

En Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Comprobar que `.env` contiene:

```dotenv
NOTEBOOKLM_CONNECTION=cdp
NOTEBOOKLM_BROWSER=msedge
NOTEBOOKLM_CDP_URL=http://127.0.0.1:9222
```

El servidor utiliza por defecto un perfil independiente ubicado en:

```text
playwright/profile-cdp
```

No es necesario configurar `NOTEBOOKLM_CDP_PROFILE` si se utiliza ese perfil predeterminado.

**2. Iniciar sesión por primera vez**

Para iniciar sesión en Google, primero se debe abrir Edge normalmente, sin depuración CDP, utilizando el mismo perfil que después utilizará el MCP.

Desde la carpeta del proyecto, ejecutar en PowerShell:

```powershell
$perfil = Join-Path (Get-Location) "playwright\profile-cdp"
$edge = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
& $edge --user-data-dir="$perfil" "https://notebook.google.com/"
```

Si Edge está instalado en otra ubicación, ajustar la ruta de `$edge`.

Iniciar sesión en Google y comprobar que NotebookLM muestra los cuadernos.

Después, cerrar todas las ventanas de Edge que utilicen ese perfil.

Este procedimiento solamente es necesario para preparar una nueva sesión autenticada.

**3. Iniciar Edge automáticamente mediante CDP**

Ejecutar:

```powershell
npm.cmd run login
```

El servidor intentará abrir Microsoft Edge automáticamente utilizando el perfil autenticado y el puerto CDP local `9222`.

Si Edge ya está ejecutándose correctamente con CDP y el perfil configurado, se reutilizará.

El comando comprueba la conexión con NotebookLM, pero no garantiza por sí solo que la cuenta esté autenticada. La autenticación se puede comprobar utilizando `listar_cuadernos` desde un cliente MCP.

**4. Perfil personalizado (opcional)**

También se puede configurar una carpeta diferente:

```dotenv
NOTEBOOKLM_CDP_PROFILE=C:\Users\TU_USUARIO\notebooklm-edge
```

En ese caso, el inicio de sesión inicial debe realizarse utilizando exactamente la misma carpeta como argumento de `--user-data-dir`.

No utilizar el perfil personal habitual de Edge.

#### Opción B: Chromium mediante Playwright (alternativa)

**1. Configurar `.env`**

```dotenv
NOTEBOOKLM_CONNECTION=persistent
NOTEBOOKLM_BROWSER=chromium
```

**2. Instalar Chromium**

```powershell
npx.cmd playwright install chromium
```

**3. Iniciar sesión**

```powershell
npm.cmd run login
```

Se abrirá Chromium mediante Playwright.

1. Iniciar sesión en Google si es posible.
2. Acceder a NotebookLM.
3. Regresar a la terminal y presionar Enter.

La sesión se conservará localmente en `playwright/profile/`.

**Limitación:** durante las pruebas, Google rechazó el inicio de sesión desde Chromium controlado por Playwright. Por eso, en Windows se recomienda Microsoft Edge.

#### Seguridad

- Utilizar perfiles independientes para NotebookLM.
- No compartir las carpetas de perfiles, cookies ni sesiones.
- Mantener CDP restringido a `127.0.0.1`.
- No exponer el puerto `9222` a Internet ni a otras computadoras.
- Utilizar CDP únicamente en equipos locales de confianza.

La depuración remota permite acceder a la sesión del navegador. El servidor verifica el proceso y el perfil configurado antes de reutilizar una conexión CDP, pero esto no sustituye las medidas de seguridad del equipo.



### 4. Configurar un cuaderno predeterminado (opcional)

Editar el archivo .env creado en el paso 3

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
- La automatización requiere un navegador con interfaz gráfica. Las opciones documentadas son Microsoft Edge mediante CDP y Chromium mediante Playwright. El inicio de sesión con Chromium puede ser bloqueado por Google.
- Las operaciones deben ejecutarse secuencialmente cuando comparten el mismo perfil del navegador.
- El listado depende de los cuadernos cargados en la página principal.
- La compatibilidad con diferentes clientes MCP aún requiere pruebas individuales.
- El inicio automático de Edge mediante CDP está implementado para Windows. En otros sistemas operativos, esta funcionalidad todavía no se ha probado ni implementado.

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
