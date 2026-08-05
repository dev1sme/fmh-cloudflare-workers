import { Card, Center } from "@mantine/core";

import type { SessionUser } from "../../api";
import { LoginForm } from "./components/LoginForm";
import { useLogin } from "./useLogin";

export function LoginPage({ onLogin }: { onLogin: (user: SessionUser) => void }) {
  const { dangNhap, loi, dangChay } = useLogin(onLogin);

  return (
    <Center mih="100dvh" p="md">
      <Card withBorder shadow="sm" padding="lg" w={360}>
        <LoginForm onSubmit={dangNhap} loi={loi} dangChay={dangChay} />
      </Card>
    </Center>
  );
}
