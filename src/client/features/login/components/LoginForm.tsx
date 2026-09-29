import { Alert, Button, PasswordInput, Stack, Text, TextInput, Title } from "@mantine/core";
import { IconAlertCircle, IconLock, IconUser } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export function LoginForm({
  onSubmit,
  error,
  busy,
}: {
  onSubmit: (username: string, password: string) => void;
  error: string | null;
  busy: boolean;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { t } = useTranslation();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(username, password);
      }}
    >
      <Stack gap="lg">
        <div>
          <Title order={3}>{t("login.title")}</Title>
          {/* Both roles land here, so the copy names neither. */}
          <Text size="sm" c="dimmed" mt={4}>
            {t("login.subtitle")}
          </Text>
        </div>

        {error && (
          <Alert color="red" variant="light" icon={<IconAlertCircle size={18} />}>
            {error}
          </Alert>
        )}

        <Stack gap="sm">
          {/* No placeholder. It showed a real username pattern to anyone who
              loaded the page, which is a hint nobody signing in here needs —
              they were handed their account by the landlord. */}
          <TextInput
            label={t("login.username")}
            leftSection={<IconUser size={16} stroke={1.7} />}
            value={username}
            onChange={(e) => setUsername(e.currentTarget.value)}
            autoComplete="username"
            autoFocus
            required
          />
          <PasswordInput
            label={t("login.password")}
            leftSection={<IconLock size={16} stroke={1.7} />}
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            autoComplete="current-password"
            required
          />
        </Stack>

        <Button type="submit" loading={busy} fullWidth size="md">
          {t("login.submit")}
        </Button>

        <Text size="xs" c="dimmed" ta="center">
          {t("login.forgot")}
        </Text>
      </Stack>
    </form>
  );
}
