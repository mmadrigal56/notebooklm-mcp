# NotebookLM MCP

Servidor MCP (*Model Context Protocol*) que permite listar cuadernos de Google NotebookLM y consultar sus fuentes desde asistentes compatibles con servidores MCP locales.

Utiliza Playwright para interactuar con la interfaz web de NotebookLM. La configuración recomendada para Windows utiliza Microsoft Edge mediante CDP y ejecuta las consultas sin abrir una ventana.

Cada persona utiliza su propia cuenta de Google y sus propios cuadernos.

## Demostración

El siguiente video muestra cómo un asistente de IA utiliza
NotebookLM MCP para listar cuadernos y consultar su contenido.

[Ver demostración del MCP](docs/demo.gif)

## Características

- Listado de cuadernos con nombre, emoji, identificador y enlace.
- Consulta de cuadernos mediante su identificador o nombre.
- Cuaderno predeterminado opcional.
- Persistencia local de la sesión de Google en un perfil independiente.
- Consultas sin ventana con Microsoft Edge mediante CDP.
- Apertura de la lista ampliada de cuadernos cuando está disponible.
- Recorrido de las tarjetas y eliminación de duplicados por identificador.
- Respuesta vacía `[]` cuando se reconoce una cuenta sin cuadernos.
- Respuestas de NotebookLM convertidas a Markdown.
- Comunicación MCP mediante STDIO.

## Requisitos

- Windows para el inicio automático de Microsoft Edge mediante CDP.
- Microsoft Edge instalado.
- Node.js y npm.
- Git.
- Una cuenta de Google con acceso a NotebookLM.
- Un cliente compatible con servidores MCP locales mediante STDIO.

El proyecto se ha probado principalmente en Windows con Codex CLI y MCP Inspector.

La automatización depende de la interfaz web de NotebookLM. Los cambios en esa interfaz pueden requerir actualizar el proyecto.

## Instalación recomendada en Windows

Ejecutar los comandos en PowerShell.

Se utiliza `npm.cmd` y `npx.cmd` para evitar el bloqueo de los archivos
`npm.ps1` y `npx.ps1` cuando PowerShell restringe la ejecución de scripts.

### 1. Clonar el repositorio

```powershell
git clone https://github.com/mmadrigal56/notebooklm-mcp.git
cd notebooklm-mcp
```

Conservar esta carpeta: el cliente MCP ejecutará el servidor desde ella.

### 2. Instalar las dependencias

```powershell
npm.cmd install
```

Para utilizar Microsoft Edge instalado en Windows, no es necesario descargar Chromium mediante Playwright.

### 3. Crear la configuración local

Solo en una instalación nueva:

```powershell
Copy-Item .env.example .env
```

La configuración recomendada es:

```dotenv
NOTEBOOKLM_CONNECTION=cdp
NOTEBOOKLM_BROWSER=msedge
NOTEBOOKLM_CDP_URL=http://127.0.0.1:9222
NOTEBOOKLM_CDP_WINDOW=headless

# Cuaderno predeterminado opcional
NOTEBOOKLM_URL=
```

Si `.env` ya existe, conservar sus valores y actualizar únicamente las opciones necesarias.

El archivo `.env` es local y no debe subirse al repositorio.

### 4. Preparar el inicio de sesión

El proyecto utiliza un perfil independiente de Edge en:

```text
playwright/profile-cdp
```

Este perfil guarda la sesión de Google utilizada por el MCP. No es el perfil habitual del navegador personal.

Para preparar una sesión nueva, abrir Edge normalmente con ese perfil, sin CDP:

```powershell
$perfil = Join-Path (Get-Location) "playwright\profile-cdp"

$rutasEdge = @(
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
    "$env:LOCALAPPDATA\Microsoft\Edge\Application\msedge.exe"
)

$edge = $rutasEdge |
    Where-Object { Test-Path -LiteralPath $_ } |
    Select-Object -First 1

if (-not $edge) {
    throw "No se encontró Microsoft Edge instalado."
}

& $edge "--user-data-dir=$perfil" "https://notebook.google.com/"
```

En el navegador:

1. Iniciar sesión con la cuenta de Google que utilizará el MCP.
2. Abrir `https://notebook.google.com/`.
3. Comprobar que aparecen los cuadernos de esa cuenta, o la pantalla de bienvenida si está vacía.
4. Cerrar las ventanas de Edge que utilicen este perfil dedicado.

Este procedimiento permite preparar la sesión sin iniciar Google desde un navegador controlado por Playwright.

### 5. Comprobar la conexión mediante CDP

Desde la carpeta del proyecto:

```powershell
npm.cmd run login
```

El comando abre Edge de forma visible con el perfil dedicado.

1. Comprobar que NotebookLM muestra la cuenta correcta.
2. Completar el inicio de sesión si es necesario.
3. Regresar a PowerShell y presionar Enter.

Al finalizar, el proyecto intenta devolver Edge al modo configurado en `.env`.

Con `NOTEBOOKLM_CDP_WINDOW=headless`, las consultas posteriores se ejecutan sin ventana.

Si aparece un error al cambiar el modo de Edge, consultar la sección de solución de problemas.

### 6. Verificar TypeScript

```powershell
npm.cmd run check
```

Este comando comprueba el código TypeScript. No verifica por sí solo la sesión de Google ni la conexión con NotebookLM.

### 7. Registrar el servidor en Codex CLI

Si Codex CLI todavía no está instalado:

```powershell
npm.cmd install -g @openai/codex
```

Desde la carpeta del repositorio, registrar el servidor usando rutas absolutas:

```powershell
$rutaProyecto = (Get-Location).Path

codex.cmd mcp add notebooklm-mcp -- npx.cmd --prefix "$rutaProyecto" tsx "$rutaProyecto\src\mcp\server.ts"
```

Comprobar el registro:

```powershell
codex.cmd mcp list
codex.cmd mcp get notebooklm-mcp
```

El servidor debe aparecer habilitado y utilizar el transporte `stdio`.

Si ya existe un registro con ese nombre, revisar su configuración antes de volver a registrarlo. Si apunta a una ubicación anterior:

```powershell
codex.cmd mcp remove notebooklm-mcp
```

Después, ejecutar nuevamente el comando de registro desde la carpeta actual del proyecto.

### 8. Probar desde Codex

Iniciar Codex:

```powershell
codex.cmd
```

Solicitar:

> Ejecutá listar_cuadernos del MCP notebooklm-mcp y mostrame el resultado.

Después, probar una consulta a un cuaderno que tenga fuentes:

> Consultá el cuaderno “Bases” y resumí sus temas principales.

El cliente debe ejecutar las herramientas MCP correspondientes.

La configuración anterior corresponde a Codex CLI. Otros clientes compatibles con STDIO necesitan su propio registro del servidor.

## Uso normal

Una vez instalado y registrado:

- El cliente MCP inicia el servidor.
- El servidor utiliza la sesión guardada en el perfil dedicado.
- Con `headless`, las consultas se realizan sin ventana.
- No es necesario ejecutar `npm.cmd run login` antes de cada consulta.
- Si la sesión vence, volver a iniciar sesión.
- No es necesario crear una instalación del servidor por cada cuaderno.

Normalmente no se debe ejecutar `npm.cmd run mcp` en una terminal independiente mientras el cliente intenta iniciar otra instancia.

## Herramientas disponibles

### `listar_cuadernos`

Lista los cuadernos disponibles en la cuenta utilizada por el MCP.

No requiere parámetros.

Cuando existe la opción «Ver más cuadernos recientes», el servidor la abre antes de recorrer las tarjetas. Los resultados se acumulan por identificador para evitar duplicados.

Ejemplo:

```json
[
  {
    "nombre": "Bases",
    "emoji": "📚",
    "id": "12345678-1234-1234-1234-123456789abc",
    "url": "https://notebook.google.com/notebook/12345678-1234-1234-1234-123456789abc"
  }
]
```

Si se reconoce la pantalla de cuenta sin cuadernos:

```json
[]
```

Una lista vacía es un resultado válido. Una sesión cerrada, un error de carga o una interfaz no reconocida no deben interpretarse como confirmación de que la cuenta está vacía.

### `preguntar_notebooklm`

Envía una pregunta a un cuaderno y devuelve una respuesta basada en sus fuentes.

| Parámetro | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `pregunta` | string | Sí | Pregunta para NotebookLM. |
| `notebookId` | string UUID | No | Identificador obtenido mediante `listar_cuadernos`. |
| `notebookNombre` | string | No | Nombre completo o parte del nombre del cuaderno. |

Selección del cuaderno:

- Con `notebookId`, se consulta ese identificador.
- Con `notebookNombre`, se busca el cuaderno por nombre.
- No enviar `notebookId` y `notebookNombre` al mismo tiempo.
- Si el nombre coincide con varios cuadernos, se devuelven opciones para elegir uno.
- Si no se proporciona identificador ni nombre, se utiliza `NOTEBOOKLM_URL`.

Para obtener respuestas basadas en documentos, el cuaderno debe tener fuentes disponibles.

## Configuración

### Microsoft Edge mediante CDP

```dotenv
NOTEBOOKLM_CONNECTION=cdp
NOTEBOOKLM_BROWSER=msedge
NOTEBOOKLM_CDP_URL=http://127.0.0.1:9222
NOTEBOOKLM_CDP_WINDOW=headless
```

El inicio automático de Edge mediante CDP está implementado para Windows y utiliza el puerto local `9222`.

### Visibilidad de Edge

| Valor de `NOTEBOOKLM_CDP_WINDOW` | Comportamiento |
|---|---|
| `headless` | Ejecuta Edge sin ventana. Recomendado para consultas. |
| `hidden` | Inicia Edge con ventana y luego la oculta; puede aparecer brevemente. |
| `visible` | Mantiene la ventana visible para diagnóstico. |

El comando de inicio de sesión fuerza temporalmente el modo visible.

### Perfil personalizado

Opcionalmente:

```dotenv
NOTEBOOKLM_CDP_PROFILE=C:\Users\TU_USUARIO\notebooklm-edge
```

El inicio de sesión y las consultas deben utilizar exactamente esa misma carpeta.

Si se utiliza un perfil personalizado, adaptar también los comandos de preparación y recuperación que mencionan `playwright/profile-cdp`.

No utilizar el perfil personal habitual de Edge.

### Cuaderno predeterminado

Opcionalmente:

```dotenv
NOTEBOOKLM_URL=https://notebook.google.com/notebook/ID_DEL_CUADERNO
```

No es necesario configurarlo para listar cuadernos ni para consultar mediante `notebookId` o `notebookNombre`.

### Alternativa: Chromium mediante Playwright

Configurar:

```dotenv
NOTEBOOKLM_CONNECTION=persistent
NOTEBOOKLM_BROWSER=chromium
```

Instalar Chromium:

```powershell
npx.cmd playwright install chromium
```

Iniciar sesión:

```powershell
npm.cmd run login
```

La sesión se conserva en:

```text
playwright/profile
```

Este modo utiliza una ventana visible. `NOTEBOOKLM_CDP_WINDOW` corresponde al modo CDP y no controla esta alternativa.

Durante las pruebas, Google bloqueó algunos intentos de inicio de sesión desde Chromium controlado por Playwright. Por eso se recomienda Edge mediante CDP en Windows.

## Aplicar cambios y actualizar el proyecto

### Después de modificar `.env` o el código

Reiniciar el servidor MCP para que lea los cambios.

- En Codex CLI: salir de la sesión y volver a ejecutar `codex.cmd`.
- Si una aplicación mantiene el servidor activo: cerrarla completamente y volver a abrirla.

No es necesario borrar chats, eliminar el proyecto ni reinstalar las dependencias.

Después del reinicio, solicitar una nueva llamada a `listar_cuadernos`.

### Actualizar desde GitHub

Desde el repositorio:

```powershell
git pull --ff-only
npm.cmd install
npm.cmd run check
```

Si Git informa cambios locales que impiden actualizar, revisarlos antes de continuar.

Después, reiniciar el cliente MCP.

Actualizar el repositorio no actualiza automáticamente el archivo `.env`. Comparar las opciones nuevas de `.env.example` y agregarlas al archivo local cuando corresponda.

### Si se mueve la carpeta del repositorio

El registro del cliente utiliza rutas absolutas.

Si la carpeta cambia de ubicación, actualizar el registro del servidor para que apunte a la nueva ruta.

## Cambiar de cuenta de Google

1. Cerrar el cliente MCP para evitar consultas mientras se cambia la sesión.
2. Ejecutar desde el repositorio:

   ```powershell
   npm.cmd run login
   ```

3. En el Edge dedicado, abrir el menú de la cuenta de Google.
4. Para evitar que el MCP vuelva a una cuenta anterior, cerrar las sesiones de Google de ese perfil e iniciar sesión únicamente con la cuenta deseada.
5. Abrir directamente:

   ```text
   https://notebook.google.com/
   ```

6. Comprobar que esa dirección, sin parámetros `authuser`, muestra la cuenta correcta.
7. Regresar a PowerShell y presionar Enter.
8. Abrir el cliente y solicitar una nueva llamada a `listar_cuadernos`.

Cambiar de cuenta en una sola pestaña o agregar una cuenta adicional no garantiza que esa cuenta quede seleccionada cuando el MCP abre la dirección principal.

Este procedimiento afecta al perfil dedicado del MCP, no al perfil habitual del navegador.

## Solución de problemas

### PowerShell bloquea npm.ps1 o npx.ps1

Utilizar:

```powershell
npm.cmd install
npx.cmd playwright --version
```

Se puede aplicar la misma alternativa a los demás comandos de npm y npx.

### Error al cambiar Edge entre visible y headless

Se observó un fallo al esperar que terminara el proceso de Edge durante el cambio de modo.

Si ocurre:

1. Cerrar el cliente MCP.
2. Desde la carpeta del repositorio, ejecutar este bloque para cerrar los procesos de Edge que utilizan el perfil dedicado predeterminado:

   ```powershell
   $perfil = Join-Path (Get-Location) "playwright\profile-cdp"

   Get-CimInstance Win32_Process -Filter "Name = 'msedge.exe'" |
       Where-Object {
           $_.CommandLine -and
           $_.CommandLine.Contains($perfil)
       } |
       ForEach-Object {
           Stop-Process -Id $_.ProcessId -ErrorAction SilentlyContinue
       }
   ```

3. Volver a ejecutar:

   ```powershell
   npm.cmd run login
   ```

Si se utiliza `NOTEBOOKLM_CDP_PROFILE`, reemplazar `$perfil` por la ruta configurada.

Este procedimiento es una recuperación para un problema conocido; el fallo de cambio de modo todavía requiere una corrección en el código.

### El listado muestra cuadernos de otra cuenta

Solicitar una nueva ejecución de la herramienta, sin reutilizar resultados anteriores.

Si la herramienta devuelve nuevamente la cuenta anterior, seguir la sección «Cambiar de cuenta de Google».

No es necesario crear un chat nuevo.

### Timeout buscando tarjetas o botones

Puede indicar:

- Sesión de Google cerrada o vencida.
- Carga incompleta de NotebookLM.
- Una pantalla o idioma no contemplado.
- Cambios en la interfaz web.
- Una versión anterior del proyecto o un servidor que no se reinició.

Actualizar el proyecto, reiniciar el servidor y comprobar la sesión.

Para observar la página que utiliza el MCP, configurar temporalmente:

```dotenv
NOTEBOOKLM_CDP_WINDOW=visible
```

Reiniciar el cliente y repetir la consulta. Después del diagnóstico, restaurar `headless` y reiniciar nuevamente.

No interpretar un timeout como una lista vacía.

### La lista parece incompleta

Comparar el resultado con la cuenta abierta en el Edge dedicado al MCP.

La versión actual abre la lista ampliada cuando está disponible y recorre las tarjetas. Si siguen faltando cuadernos, registrar el error o la diferencia para revisar la navegación y los selectores.

No es necesario modificar el código para indicar cuántos cuadernos tiene una cuenta.

### El puerto 9222 está ocupado

El servidor verifica el proceso y el perfil antes de reutilizar una conexión CDP.

Si otro programa utiliza el puerto, identificarlo y cerrar o reconfigurar ese programa antes de continuar.

No cerrar procesos desconocidos únicamente por utilizar ese puerto.

## Seguridad

- `.env`, cookies y perfiles de navegador son datos locales.
- No compartir las carpetas `playwright/profile*`.
- No subir sesiones de Google al repositorio.
- Mantener CDP restringido a `127.0.0.1`.
- No exponer el puerto `9222` a Internet ni a otras computadoras.
- Utilizar el MCP en un equipo local de confianza.

CDP permite controlar la sesión del navegador. La verificación del proceso y del perfil no sustituye la seguridad del equipo.

## Comandos del proyecto

| Comando | Uso |
|---|---|
| `npm.cmd install` | Instalar dependencias. |
| `npm.cmd run login` | Abrir el flujo de inicio de sesión. |
| `npm.cmd run check` | Verificar TypeScript sin generar archivos. |
| `npm.cmd run mcp` | Iniciar el servidor STDIO manualmente para diagnóstico. |

En terminales donde no exista el bloqueo de PowerShell, se puede utilizar `npm` en lugar de `npm.cmd`.

## Limitaciones actuales

- Depende de la interfaz web de NotebookLM y de sus selectores.
- Algunos textos utilizados para reconocer controles y la cuenta vacía dependen del idioma de la interfaz.
- El listado usa criterios de estabilidad de carga; no dispone de una confirmación oficial del total de cuadernos.
- No se ha verificado el listado con todas las cantidades posibles de cuadernos ni con todas las variantes de paginación.
- Las operaciones que comparten el mismo perfil deben ejecutarse secuencialmente.
- El cambio entre modos de Edge presenta un problema conocido durante el cierre del proceso.
- El inicio automático de Edge mediante CDP está implementado para Windows.
- Otros sistemas operativos y clientes MCP requieren pruebas específicas.
- Google puede bloquear el inicio de sesión desde navegadores automatizados.

## Validación realizada

Durante las pruebas del proyecto se comprobó:

- Listado de 12 cuadernos mediante la apertura automática de la lista ampliada.
- Listado con pocos cuadernos, sin exigir el botón de ampliación.
- Cambio de cuenta de Google en el perfil dedicado.
- Reconocimiento del estado vacío y devolución de `[]`.
- Uso de consultas sin ventana con Edge mediante CDP.
- Consultas a cuadernos mediante MCP.
- Verificación del código con `tsc --noEmit`.

Estas pruebas describen los escenarios comprobados y no garantizan compatibilidad con futuras modificaciones de NotebookLM.

## Tecnologías

- TypeScript.
- Node.js.
- Playwright.
- Cheerio.
- Model Context Protocol SDK.
- Zod.

## Estado del proyecto

En desarrollo.

Integración probada principalmente en Windows con Microsoft Edge mediante CDP, Codex CLI y MCP Inspector.

## Aviso de independencia y uso

Este es un proyecto independiente y no oficial. No está afiliado,
patrocinado ni aprobado por Google. Los nombres y marcas mencionados
pertenecen a sus respectivos titulares.

La herramienta automatiza interacciones con la interfaz web de
NotebookLM. Su funcionamiento puede verse afectado por cambios en
esa interfaz, restricciones del servicio o cambios en sus condiciones.

Utilizá únicamente cuentas y contenido para los que tengas autorización.
El uso debe respetar las condiciones aplicables de Google y los derechos
de privacidad y propiedad intelectual de terceros.

La sesión del navegador se almacena en el equipo donde se ejecuta la
herramienta. Las consultas se envían a Google y los resultados se
entregan al cliente MCP configurado. Revisá también las políticas de
privacidad de los servicios y del cliente que utilicés.

No publiques credenciales, cookies, perfiles del navegador ni contenido
privado al solicitar soporte.
