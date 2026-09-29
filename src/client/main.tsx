import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/charts/styles.css";
import "@mantine/spotlight/styles.css";

// Only the weights the app uses, and only the subsets Vietnamese needs. Loaded
// from the bundle rather than a CDN — the CSP allows `font-src 'self'` only.
import "@fontsource/be-vietnam-pro/latin-400.css";
import "@fontsource/be-vietnam-pro/latin-500.css";
import "@fontsource/be-vietnam-pro/latin-600.css";
import "@fontsource/be-vietnam-pro/latin-700.css";
import "@fontsource/be-vietnam-pro/vietnamese-400.css";
import "@fontsource/be-vietnam-pro/vietnamese-500.css";
import "@fontsource/be-vietnam-pro/vietnamese-600.css";
import "@fontsource/be-vietnam-pro/vietnamese-700.css";

import "./theme.css";

// Side-effect import: initialises i18next before anything renders, so the
// first paint is already in the stored language rather than flashing the
// fallback and correcting itself.
import "./i18n";

import { Notifications } from "@mantine/notifications";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { App } from "./App";
import { BackgroundFX } from "./components/BackgroundFX";
import { ChunkErrorBoundary } from "./components/ChunkErrorBoundary";
import { LocalizedMantineProvider } from "./components/LocalizedMantineProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LocalizedMantineProvider>
      <BackgroundFX />
      <Notifications position="top-right" />
      <BrowserRouter>
        {/* Wraps the whole app, not just the routes: `QuickSearch` is a lazy
            chunk too and is rendered beside the route table, not inside it. */}
        <ChunkErrorBoundary>
          <App />
        </ChunkErrorBoundary>
      </BrowserRouter>
    </LocalizedMantineProvider>
  </StrictMode>,
);
