import { Box, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { IconBolt, IconBuildingCommunity, IconFileInvoice } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

import type { SessionUser } from "../../api";
import { LanguageMenu } from "../../components/LanguageMenu";
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
  const { t } = useTranslation();

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
                <Title order={3}>{t("app.name")}</Title>
              </Group>

              <Stack gap="md">
                <DiemBan icon={<IconFileInvoice size={18} stroke={1.7} />}>
                  {t("login.sellingInvoice")}
                </DiemBan>
                <DiemBan icon={<IconBolt size={18} stroke={1.7} />}>
                  {t("login.sellingUsage")}
                </DiemBan>
              </Stack>

              <Text size="xs" c="dimmed">
                © {new Date().getFullYear()} dev1sme
              </Text>
            </Stack>
          </Box>

          <Box p="xl">
            {/* Above the form, not buried in it: someone who cannot read the
                form is exactly who needs to reach this. */}
            <Group justify="flex-end" mb="xs">
              <LanguageMenu />
            </Group>

            <LoginForm onSubmit={dangNhap} loi={loi} dangChay={dangChay} />
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
