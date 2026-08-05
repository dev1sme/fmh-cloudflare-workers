import { Box, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { IconBolt, IconBuildingCommunity, IconFileInvoice } from "@tabler/icons-react";

import type { SessionUser } from "../../api";
import { LoginForm } from "./components/LoginForm";
import { useLogin } from "./useLogin";

/**
 * Both roles sign in here, so nothing on this page may assume the visitor
 * manages anything — a tenant arrives to look at one invoice. The old title
 * read "Quản Lý Nhà Trọ", which addressed half the audience.
 *
 * Split layout on desktop: the left panel says what the app is for, the right
 * holds the form. On mobile the panel collapses away — a phone keyboard leaves
 * no room for a statement of purpose.
 */
function DiemBan({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Group gap="sm" wrap="nowrap" align="flex-start">
      <Box c="settled.4" mt={2}>
        {icon}
      </Box>
      <Text size="sm" c="dimmed">
        {children}
      </Text>
    </Group>
  );
}

export function LoginPage({ onLogin }: { onLogin: (user: SessionUser) => void }) {
  const { dangNhap, loi, dangChay } = useLogin(onLogin);

  return (
    <Box mih="100dvh" style={{ display: "grid", placeItems: "center" }} p="md">
      <Paper
        withBorder
        radius="md"
        style={{ overflow: "hidden", width: "100%", maxWidth: 820 }}
      >
        <Box className="fmh-login-grid">
          <Box
            visibleFrom="sm"
            p="xl"
            style={{
              backgroundColor: "var(--mantine-color-default)",
              borderRight: "1px solid var(--fmh-rule)",
            }}
          >
            <Stack gap="lg" h="100%" justify="space-between">
              <Group gap="sm" wrap="nowrap">
                <IconBuildingCommunity size={26} stroke={1.6} />
                <Title order={3}>Nhà trọ FMH</Title>
              </Group>

              <Stack gap="md">
                <DiemBan icon={<IconFileInvoice size={18} stroke={1.7} />}>
                  Xem hóa đơn từng tháng, quét mã QR để chuyển khoản.
                </DiemBan>
                <DiemBan icon={<IconBolt size={18} stroke={1.7} />}>
                  Tra chỉ số điện nước đã ghi, biết tháng nào dùng nhiều.
                </DiemBan>
              </Stack>

              <Text size="xs" c="dimmed">
                © {new Date().getFullYear()} dev1sme
              </Text>
            </Stack>
          </Box>

          <Box p="xl">
            <LoginForm onSubmit={dangNhap} loi={loi} dangChay={dangChay} />
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
