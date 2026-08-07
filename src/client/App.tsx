import { Center, Loader } from "@mantine/core";
import { useTranslation } from "react-i18next";

import { LoginPage } from "./features/login/LoginPage";
import { useSession } from "./features/login/useSession";
import { AppRoutes } from "./routes";

export function App() {
  const { phien, dangNhapXong, dangXuat } = useSession();

  // Subscribes the whole tree to `languageChanged`. The formatters in
  // `format.ts` read the language off the i18next instance rather than from a
  // hook — they are called from chart formatters and tooltips where a hook
  // cannot go — so nothing else would re-render them. Re-rendering from the
  // root is cheap here and keeps every money and date string in step.
  useTranslation();

  if (phien.status === "loading") {
    return (
      <Center mih="100dvh">
        <Loader />
      </Center>
    );
  }

  if (phien.status === "out") {
    return <LoginPage onLogin={dangNhapXong} />;
  }

  return <AppRoutes user={phien.user} onLogout={dangXuat} />;
}
