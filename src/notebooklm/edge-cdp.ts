
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { CDP_PROFILE_PATH } from "../config/paths.js";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const ESPERA_MAXIMA_MS = 15000;

function obtenerPerfilCDP(): string {
  return path.resolve(
    process.env.NOTEBOOKLM_CDP_PROFILE || CDP_PROFILE_PATH
  );
}

function obtenerRutaEdge(): string {
  if (process.platform !== "win32") {
    throw new Error(
      "La apertura automática de Edge está implementada únicamente para Windows."
    );
  }

  const rutas = [
    process.env["PROGRAMFILES(X86)"],
    process.env.ProgramFiles,
    process.env.LOCALAPPDATA,
  ]
    .filter((ruta): ruta is string => Boolean(ruta))
    .map((ruta) =>
      path.join(ruta, "Microsoft", "Edge", "Application", "msedge.exe")
    );

  const ejecutable = rutas.find((ruta) => existsSync(ruta));

  if (!ejecutable) {
    throw new Error(
      "No se encontró Microsoft Edge instalado."
    );
  }

  return ejecutable;
}

async function cdpDisponible(endpoint: string): Promise<boolean> {
  try {
    const respuesta = await fetch(
      `${endpoint}/json/version`,
      { signal: AbortSignal.timeout(1500) }
    );

    return respuesta.ok;
  } catch {
    return false;
  }
}


async function verificarProcesoCDP(
  perfilEsperado: string
): Promise<void> {
  const script = `
    $conexion = Get-NetTCPConnection -LocalPort 9222 -State Listen -ErrorAction Stop |
      Where-Object { $_.LocalAddress -eq '127.0.0.1' } |
      Select-Object -First 1

    if (-not $conexion) {
      throw 'No existe un listener CDP local.'
    }

    $proceso = Get-CimInstance Win32_Process -Filter "ProcessId = $($conexion.OwningProcess)"

    if (-not $proceso) {
      throw 'No se encontró el proceso propietario.'
    }

    [PSCustomObject]@{
      Name = $proceso.Name
      CommandLine = $proceso.CommandLine
    } | ConvertTo-Json -Compress
  `;

  const { stdout } = await execFileAsync(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-Command", script],
    { timeout: 10000 }
  );

  const proceso = JSON.parse(stdout.trim()) as {
    Name: string;
    CommandLine: string;
  };

  const argumentos = proceso.CommandLine || "";

  if (proceso.Name.toLowerCase() !== "msedge.exe") {
    throw new Error(
      "El puerto CDP no pertenece a Microsoft Edge."
    );
  }

  const coincidenciaPerfil = argumentos.match(
    /(?:^|\s)--user-data-dir=(?:"([^"]+)"|(\S+))/i
  );

  const perfilActual =
    coincidenciaPerfil?.[1] ?? coincidenciaPerfil?.[2];

  const normalizarRuta = (ruta: string): string =>
    path.normalize(path.resolve(ruta)).toLowerCase();

  const perfilCoincide =
    perfilActual !== undefined &&
    normalizarRuta(perfilActual) === normalizarRuta(perfilEsperado);

  if (!perfilCoincide) {
    throw new Error(
      "El puerto CDP pertenece a un perfil diferente del configurado."
    );
  }

  if (!argumentos.includes("--remote-debugging-port=9222")) {
    throw new Error(
      "El proceso no tiene configurado el puerto CDP esperado."
    );
  }
}


export async function asegurarEdgeCDP(
  endpoint: string
): Promise<void> {
  const url = new URL(endpoint);

  if (
    url.protocol !== "http:" ||
    url.hostname !== "127.0.0.1" ||
    url.port !== "9222" ||
    url.pathname !== "/"
  ) {
    throw new Error(
      "La apertura automática requiere http://127.0.0.1:9222."
    );
  }

  if (await cdpDisponible(endpoint)) {
    await verificarProcesoCDP(obtenerPerfilCDP());
    console.error("CDP verificado. Reutilizando Edge.");
    return;
  }

  // Comprobar si otro proceso está utilizando el puerto 9222.
  const { stdout: puertoOcupado } = await execFileAsync(
    "powershell.exe",
    [
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      "(Get-NetTCPConnection -LocalPort 9222 -State Listen -ErrorAction SilentlyContinue | Measure-Object).Count"
    ],
    { timeout: 10000 }
  );

  if (Number(puertoOcupado.trim()) > 0) {
    throw new Error(
      "El puerto 9222 está ocupado por otro proceso. Cerrá el programa que lo utiliza antes de iniciar NotebookLM MCP."
    );
  }

  const ejecutable = obtenerRutaEdge();

  const perfil = obtenerPerfilCDP();

  console.error("Iniciando Microsoft Edge con CDP...");

  const proceso = spawn(
    ejecutable,
    [
      `--user-data-dir=${perfil}`,
      "--remote-debugging-address=127.0.0.1",
      "--remote-debugging-port=9222",
      "https://notebook.google.com/",
    ],
    {
      detached: true,
      stdio: "ignore",
    }
  );

  proceso.unref();

  const inicio = Date.now();

  while (Date.now() - inicio < ESPERA_MAXIMA_MS) {
    if (await cdpDisponible(endpoint)) {
      await verificarProcesoCDP(perfil);
      console.error("Edge CDP verificado y disponible.");
      return;
    }

    await new Promise((resolve) =>
      setTimeout(resolve, 500)
    );
  }

  throw new Error(
    "Edge no habilitó CDP. Cerrá las ventanas de Edge que utilicen el perfil configurado e intentá nuevamente."
  );
}

