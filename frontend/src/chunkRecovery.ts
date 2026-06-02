const CHUNK_RELOAD_STORAGE_KEY = "mk-maker:last-chunk-reload";
const CHUNK_RELOAD_COOLDOWN_MS = 10_000;

function getErrorMessage(reason: unknown) {
  if (reason instanceof Error) return reason.message;
  if (typeof reason === "string") return reason;
  return String(reason ?? "");
}

function isChunkLoadFailure(reason: unknown) {
  const message = getErrorMessage(reason);

  return (
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("Importing a module script failed") ||
    message.includes("error loading dynamically imported module") ||
    message.includes("Expected a JavaScript-or-Wasm module script") ||
    message.includes("MIME type of \"text/html\"")
  );
}

function reloadOnceForFreshDeployment() {
  const now = Date.now();
  const lastReloadAt = Number(window.sessionStorage.getItem(CHUNK_RELOAD_STORAGE_KEY) ?? "0");

  if (Number.isFinite(lastReloadAt) && now - lastReloadAt < CHUNK_RELOAD_COOLDOWN_MS) {
    return;
  }

  window.sessionStorage.setItem(CHUNK_RELOAD_STORAGE_KEY, String(now));
  window.location.reload();
}

export function installChunkRecovery() {
  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();
    reloadOnceForFreshDeployment();
  });

  window.addEventListener("unhandledrejection", (event) => {
    if (!isChunkLoadFailure(event.reason)) return;

    event.preventDefault();
    reloadOnceForFreshDeployment();
  });
}
