import { Card, Stack, Text, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";

import { ChangePasswordForm } from "./components/ChangePasswordForm";
import { useChangePassword } from "./useChangePassword";

export function ChangePasswordPage() {
  const { doiMatKhau, loi, dangChay } = useChangePassword();
  const { t } = useTranslation();

  return (
    <Stack maw={420}>
      <Title order={3}>{t("changePassword.title")}</Title>
      <Text c="dimmed" size="sm">
        {t("changePassword.hint")}
      </Text>

      <Card withBorder padding="lg">
        <ChangePasswordForm onSubmit={doiMatKhau} loi={loi} dangChay={dangChay} />
      </Card>
    </Stack>
  );
}
