import { Button, Card, Center, Container, Group, Loader, Stack, Text, Title } from "@mantine/core";
import { useCallback, useEffect, useState } from "react";

import { api, auth, type SessionUser } from "./api";
import { LoginPage } from "./pages/LoginPage";

type AuthState = { status: "loading" } | { status: "out" } | { status: "in"; user: SessionUser };

export function App() {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    auth
      .me()
      .then(({ user }) => setState({ status: "in", user }))
      .catch(() => setState({ status: "out" }));
  }, []);

  const logout = useCallback(async () => {
    await auth.logout().catch(() => undefined);
    setState({ status: "out" });
  }, []);

  if (state.status === "loading") {
    return (
      <Center mih="100dvh">
        <Loader />
      </Center>
    );
  }

  if (state.status === "out") {
    return <LoginPage onLogin={(user) => setState({ status: "in", user })} />;
  }

  return <Dashboard user={state.user} onLogout={logout} />;
}

function Dashboard({ user, onLogout }: { user: SessionUser; onLogout: () => void }) {
  const [rooms, setRooms] = useState<number | null>(null);

  useEffect(() => {
    api<{ rooms: number }>("/api/summary")
      .then(({ rooms }) => setRooms(rooms))
      .catch(() => setRooms(null));
  }, []);

  return (
    <Container size="sm" py="xl">
      <Stack>
        <Group justify="space-between">
          <Title order={2}>Quản Lý Nhà Trọ</Title>
          <Button variant="subtle" onClick={onLogout}>
            Đăng xuất
          </Button>
        </Group>

        <Card withBorder padding="md">
          <Stack gap="xs">
            <Text>
              Đăng nhập với tài khoản <b>{user.username}</b>.
            </Text>
            <Text c="dimmed">
              {rooms === null ? "Đang tải số phòng…" : `Đang quản lý ${rooms} phòng.`}
            </Text>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
