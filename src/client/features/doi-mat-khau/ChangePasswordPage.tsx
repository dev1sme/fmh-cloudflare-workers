import { Card, Stack, Text, Title } from "@mantine/core";

import { ChangePasswordForm } from "./components/ChangePasswordForm";
import { useDoiMatKhau } from "./useDoiMatKhau";

export function ChangePasswordPage() {
  const { doiMatKhau, loi, dangChay } = useDoiMatKhau();

  return (
    <Stack maw={420}>
      <Title order={3}>Đổi mật khẩu</Title>
      <Text c="dimmed" size="sm">
        Cần nhập mật khẩu hiện tại. Quên mật khẩu thì nhờ chủ nhà đặt lại giúp.
      </Text>

      <Card withBorder padding="lg">
        <ChangePasswordForm onSubmit={doiMatKhau} loi={loi} dangChay={dangChay} />
      </Card>
    </Stack>
  );
}
