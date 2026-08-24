import { Avatar, Box, Container, Group, Menu, Text, UnstyledButton } from "@mantine/core";
import { IconBuildingCommunity, IconChevronDown, IconKey, IconLogout } from "@tabler/icons-react";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { Link, Outlet } from "react-router-dom";

import type { SessionUser } from "../api";
import { LanguageMenuItems } from "./LanguageMenu";
import { ThemeMenuItems } from "./ThemeMenu";
import { PageTransition } from "./PageTransition";
import { RouteFallback } from "./RouteFallback";

/**
 * Shell for a tenant, separate from the manager's on purpose.
 *
 * A tenant has one room, opens this once or twice a month, on a phone, to see
 * what they owe and scan a QR. They were being shown an admin panel — a
 * sidebar of three items, a header and a footer wrapped around a single table.
 * None of that navigation had anywhere to go.
 *
 * So there is no sidebar and no nav: one column, one screen, and an account
 * menu for the two things they can actually do to their account.
 */
export function TenantLayout({
  user,
  onLogout,
}: {
  user: SessionUser;
  onLogout: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Box mih="100dvh" style={{ display: "flex", flexDirection: "column" }}>
      <Box
        component="header"
        py="sm"
        style={{ borderBottom: "1px solid var(--fmh-rule)" }}
      >
        <Container size="lg" px="md">
          <Group justify="space-between" wrap="nowrap">
            {/* The room name lives on the page, which has the data for it. */}
            <Group gap="sm" wrap="nowrap">
              <IconBuildingCommunity size={22} stroke={1.6} />
              <Text fw={700}>{t("app.name")}</Text>
            </Group>

            <Menu position="bottom-end" shadow="md" width={190}>
              <Menu.Target>
                <UnstyledButton aria-label={t("common.account")} className="fmh-account">
                  <Group gap="xs" wrap="nowrap">
                    <Avatar size={30} radius="xl" color="owed">
                      {user.username.slice(0, 2).toUpperCase()}
                    </Avatar>
                    <IconChevronDown size={15} stroke={1.8} opacity={0.6} />
                  </Group>
                </UnstyledButton>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>{user.username}</Menu.Label>
                <Menu.Item
                  component={Link}
                  to="/change-password"
                  leftSection={<IconKey size={16} stroke={1.8} />}
                >
                  {t("common.changePassword")}
                </Menu.Item>

                <Menu.Divider />
                <ThemeMenuItems />

                <Menu.Divider />
                <LanguageMenuItems />

                <Menu.Divider />
                <Menu.Item
                  color="red"
                  leftSection={<IconLogout size={16} stroke={1.8} />}
                  onClick={onLogout}
                >
                  {t("common.logout")}
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Container>
      </Box>

      <Box component="main" style={{ flex: 1 }} py="lg">
        <Container size="lg" px="md">
          {/* Outside `PageTransition` for the same reason as the manager's
              shell: the animation belongs to the screen, not to the wait. */}
          <Suspense fallback={<RouteFallback />}>
            <PageTransition>
              <Outlet />
            </PageTransition>
          </Suspense>
        </Container>
      </Box>

      <Box component="footer" py="sm">
        <Text size="xs" c="dimmed" ta="center">
          © {new Date().getFullYear()} dev1sme · Software Engineer
        </Text>
      </Box>
    </Box>
  );
}
