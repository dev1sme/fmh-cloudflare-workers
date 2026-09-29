import { Alert, Button, PasswordInput, Stack } from "@mantine/core";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const MIN_LENGTH = 8;

export function ChangePasswordForm({
  onSubmit,
  error,
  busy,
}: {
  onSubmit: (currentPassword: string, newPassword: string) => Promise<boolean>;
  error: string | null;
  busy: boolean;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { t } = useTranslation();

  const mismatch = confirmPassword !== "" && confirmPassword !== newPassword;
  const isValid = currentPassword !== "" && newPassword.length >= MIN_LENGTH && confirmPassword === newPassword;

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    if (await onSubmit(currentPassword, newPassword)) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }

  return (
    <form onSubmit={submit}>
      <Stack>
        {error && (
          <Alert color="red" variant="light">
            {error}
          </Alert>
        )}

        <PasswordInput
          label={t("changePassword.current")}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.currentTarget.value)}
          autoComplete="current-password"
          required
        />
        <PasswordInput
          label={t("changePassword.new")}
          description={t("changePassword.minChars", { count: MIN_LENGTH })}
          value={newPassword}
          onChange={(e) => setNewPassword(e.currentTarget.value)}
          autoComplete="new-password"
          required
        />
        <PasswordInput
          label={t("changePassword.repeat")}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.currentTarget.value)}
          error={mismatch ? t("changePassword.mismatch") : null}
          autoComplete="new-password"
          required
        />

        <Button type="submit" loading={busy} disabled={!isValid}>
          {t("changePassword.title")}
        </Button>
      </Stack>
    </form>
  );
}
