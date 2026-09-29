import { Center, Loader } from "@mantine/core";
import { useTranslation } from "react-i18next";

import { useSession } from "./features/login/useSession";
import { AppRoutes, LoginRoutes } from "./routes";

export function App() {
  const { session, onLoggedIn, logout } = useSession();

  // Subscribes the whole tree to `languageChanged`. The formatters in
  // `format.ts` read the language off the i18next instance rather than from a
  // hook — they are called from chart formatters and tooltips where a hook
  // cannot go — so nothing else would re-render them. Re-rendering from the
  // root is cheap here and keeps every money and date string in step.
  useTranslation();

  if (session.status === "loading") {
    return (
      <Center mih="100dvh">
        <Loader />
      </Center>
    );
  }

  // Two route tables rather than one with guards: a screen a signed-out
  // visitor can reach and a screen only a session can reach have nothing in
  // common, and there is no path from one table into the other.
  if (session.status === "out") {
    return <LoginRoutes onLogin={onLoggedIn} />;
  }

  return <AppRoutes user={session.user} onLogout={logout} />;
}
