import { Alert, Button, Center, Stack } from "@mantine/core";
import { Component, type ReactNode } from "react";

import i18n from "../i18n";

/** Session storage key holding when the last automatic reload was attempted. */
const LAN_TAI_LAI = "fmh-chunk-reload";

/** Two chunk failures inside this window mean reloading is not fixing it. */
const CHO_TAI_LAI_MS = 10_000;

/**
 * Chrome, Firefox and Safari each word a failed `import()` differently, and a
 * chunk served as `index.html` fails on the MIME type instead. Match all four
 * rather than one browser's wording.
 */
const DAU_HIEU = [
  "failed to fetch dynamically imported module",
  "error loading dynamically imported module",
  "importing a module script failed",
  "expected a javascript module script",
];

function laLoiChunk(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const thuong = message.toLowerCase();
  return DAU_HIEU.some((dau) => thuong.includes(dau));
}

/** True when the last automatic reload is old enough that another is worth it. */
function nenTaiLai(): boolean {
  try {
    const truoc = Number(sessionStorage.getItem(LAN_TAI_LAI));
    if (Number.isFinite(truoc) && Date.now() - truoc < CHO_TAI_LAI_MS) return false;

    sessionStorage.setItem(LAN_TAI_LAI, String(Date.now()));
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
  cach: "reload" | "manual" | null;
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
  state: State = { error: null, cach: null };

  static getDerivedStateFromError(error: unknown): Partial<State> {
    return { error };
  }

  componentDidCatch(error: unknown): void {
    if (!laLoiChunk(error)) return;

    if (nenTaiLai()) {
      this.setState({ cach: "reload" });
      window.location.reload();
      return;
    }

    this.setState({ cach: "manual" });
  }

  render(): ReactNode {
    const { error, cach } = this.state;
    if (!error) return this.props.children;

    // Not ours. Propagate exactly as if this boundary were not here.
    if (!laLoiChunk(error)) throw error;

    // The reload is already on its way; painting anything would flash.
    if (cach !== "manual") return null;

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
