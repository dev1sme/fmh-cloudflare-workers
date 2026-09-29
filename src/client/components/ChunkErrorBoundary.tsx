import { Alert, Button, Center, Stack } from "@mantine/core";
import { Component, type ReactNode } from "react";

import i18n from "../i18n";

/** Session storage key holding when the last automatic reload was attempted. */
const RELOAD_KEY = "fmh-chunk-reload";

/** Two chunk failures inside this window mean reloading is not fixing it. */
const RETRY_WINDOW_MS = 10_000;

/**
 * Chrome, Firefox and Safari each word a failed `import()` differently, and a
 * chunk served as `index.html` fails on the MIME type instead. Match all four
 * rather than one browser's wording.
 */
const CHUNK_ERROR_SIGNATURES = [
  "failed to fetch dynamically imported module",
  "error loading dynamically imported module",
  "importing a module script failed",
  "expected a javascript module script",
];

function isChunkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const lower = message.toLowerCase();
  return CHUNK_ERROR_SIGNATURES.some((signature) => lower.includes(signature));
}

/** True when the last automatic reload is old enough that another is worth it. */
function shouldReload(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY));
    if (Number.isFinite(last) && Date.now() - last < RETRY_WINDOW_MS) return false;

    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
    return true;
  } catch {
    // Storage is locked down; reloading once is still better than a blank page,
    // and the browser's own error page catches a genuine loop.
    return true;
  }
}

type State = {
  error: unknown;
  /** `null` until `componentDidCatch` has decided; keeps the first paint blank. */
  recovery: "reload" | "manual" | null;
};

/**
 * Catches the one error code splitting introduces: a tab that has been open
 * across a deploy asking for a chunk whose hash no longer exists.
 *
 * Cloudflare serves assets from the manifest of the current deployment, so the
 * old file is gone and the SPA fallback answers `index.html` — the import fails
 * on the MIME type and, with no boundary, React unmounts the whole tree and
 * leaves a white screen. Reloading fetches the new `index.html` and its new
 * hashes, which is the entire fix, so it happens automatically.
 *
 * A second failure within ten seconds means reloading is not the fix (a broken
 * deploy, an offline device), so the loop stops and says so instead.
 *
 * Anything that is *not* a chunk error is re-thrown from `render`. This is not
 * a general-purpose error boundary and must not quietly swallow a real bug into
 * a "reload the page" message.
 */
export class ChunkErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null, recovery: null };

  static getDerivedStateFromError(error: unknown): Partial<State> {
    return { error };
  }

  componentDidCatch(error: unknown): void {
    if (!isChunkError(error)) return;

    if (shouldReload()) {
      this.setState({ recovery: "reload" });
      window.location.reload();
      return;
    }

    this.setState({ recovery: "manual" });
  }

  render(): ReactNode {
    const { error, recovery } = this.state;
    if (!error) return this.props.children;

    // Not ours. Propagate exactly as if this boundary were not here.
    if (!isChunkError(error)) throw error;

    // The reload is already on its way; painting anything would flash.
    if (recovery !== "manual") return null;

    return (
      <Center py="xl" px="md">
        <Stack gap="md" align="center">
          <Alert color="owed" title={i18n.t("common.appUpdated")}>
            {i18n.t("common.appUpdatedHint")}
          </Alert>
          <Button color="settled" onClick={() => window.location.reload()}>
            {i18n.t("common.reload")}
          </Button>
        </Stack>
      </Center>
    );
  }
}
