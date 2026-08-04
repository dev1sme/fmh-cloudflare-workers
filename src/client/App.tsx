import { Alert, Container, Loader, Stack, Text, Title } from "@mantine/core";
import { useEffect, useState } from "react";

type Health = { ok: boolean; rooms: number };

export function App() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((res) =>
        res.ok
          ? (res.json() as Promise<Health>)
          : Promise.reject(new Error(`HTTP ${res.status}`)),
      )
      .then(setHealth)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <Container size="sm" py="xl">
      <Stack>
        <Title order={1}>Quản Lý Nhà Trọ</Title>

        {error && <Alert color="red" title="Không gọi được API">{error}</Alert>}
        {!error && !health && <Loader size="sm" />}
        {health && (
          <Text>
            API hoạt động — hiện có <b>{health.rooms}</b> phòng trong database.
          </Text>
        )}
      </Stack>
    </Container>
  );
}
