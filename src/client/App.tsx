import { Center, Loader } from "@mantine/core";

import { LoginPage } from "./features/dang-nhap/LoginPage";
import { useSession } from "./features/dang-nhap/useSession";
import { AppRoutes } from "./routes";

export function App() {
  const { phien, dangNhapXong, dangXuat } = useSession();

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
