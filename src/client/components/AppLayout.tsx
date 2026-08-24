import {
  AppShell,
  Avatar,
  Burger,
  Group,
  Kbd,
  Menu,
  NavLink,
  Text,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { spotlight } from "@mantine/spotlight";
import {
  IconBolt,
  IconChevronUp,
  IconBuildingCommunity,
  IconFileInvoice,
  IconHome,
  IconKey,
  IconLayoutDashboard,
  IconLogout,
  IconSearch,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { Link, Outlet, useLocation } from "react-router-dom";

import type { SessionUser } from "../api";
import { LanguageMenuItems } from "./LanguageMenu";
import { ThemeMenuItems } from "./ThemeMenu";
import { PageTransition } from "./PageTransition";
import { RouteFallback } from "./RouteFallback";

const ICON = { size: 18, stroke: 1.6 };

/**
 * The manager's shell, and only the manager's — `routes.tsx` gives a tenant
 * `TenantLayout` instead. It used to carry a second link list for tenants;
 * that became unreachable when the tenant screens collapsed into one page, so
 * it is gone rather than translated.
 */
const LINKS = [
  { to: "/dashboard", key: "nav.dashboard", icon: <IconLayoutDashboard {...ICON} /> },
  { to: "/rooms", key: "nav.rooms", icon: <IconHome {...ICON} /> },
  { to: "/tenants", key: "nav.tenants", icon: <IconUsers {...ICON} /> },
  { to: "/readings", key: "nav.readings", icon: <IconBolt {...ICON} /> },
  { to: "/invoices", key: "nav.invoices", icon: <IconFileInvoice {...ICON} /> },
  { to: "/accounts", key: "nav.accounts", icon: <IconKey {...ICON} /> },
  { to: "/settings", key: "nav.settings", icon: <IconSettings {...ICON} /> },
] as const;

/** Two initials from a username, e.g. `phong01` -> `PH`. */
function chuCaiDau(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

export function AppLayout({
  user,
  onLogout,
}: {
  user: SessionUser;
  onLogout: () => void;
}) {
  const [opened, { toggle, close }] = useDisclosure();
  const { pathname } = useLocation();
  const { t } = useTranslation();

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 236, breakpoint: "sm", collapsed: { mobile: !opened } }}
      footer={{ height: 36 }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <IconBuildingCommunity size={22} stroke={1.6} />
            <Title order={4}>{t("app.name")}</Title>
          </Group>

          <UnstyledButton
            onClick={spotlight.open}
            visibleFrom="sm"
            aria-label={t("common.search")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "5px 10px",
              borderRadius: "var(--mantine-radius-sm)",
              border: "1px solid var(--fmh-rule)",
              color: "var(--mantine-color-dimmed)",
            }}
          >
            <IconSearch size={15} stroke={1.8} />
            <Text size="sm">{t("common.search")}</Text>
            <Kbd size="xs">Ctrl+K</Kbd>
          </UnstyledButton>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        {/* Navigation grows; the account block is pinned to the bottom so the
            identity and the way out sit together, away from the screen's work. */}
        <AppShell.Section grow>
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              component={Link}
              to={link.to}
              label={t(link.key)}
              leftSection={link.icon}
              // Match on a path segment, not a raw prefix: plain startsWith
              // lights "Hóa đơn" up on /my-invoices, a different screen.
              active={
                pathname === link.to || pathname.startsWith(`${link.to}/`)
              }
              onClick={close}
            />
          ))}
        </AppShell.Section>

        <AppShell.Section
          pt="sm"
          style={{ borderTop: "1px solid var(--fmh-rule)" }}
        >
          {/* Only the identity is on show. The account actions are behind a
              menu, so the sidebar's bottom edge stays one row tall and the
              navigation above it reads as the only list on the screen. */}
          <Menu position="top-start" width="target" withinPortal shadow="md">
            <Menu.Target>
              <UnstyledButton
                aria-label={t("common.account")}
                className="fmh-account"
                style={{ display: "block", width: "100%" }}
              >
                <Group gap="sm" wrap="nowrap">
                  <Avatar size={32} radius="sm" color="settled">
                    {chuCaiDau(user.username)}
                  </Avatar>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <Text size="sm" fw={600} truncate>
                      {user.username}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {t("common.manager")}
                    </Text>
                  </div>
                  <IconChevronUp size={15} stroke={1.8} opacity={0.6} />
                </Group>
              </UnstyledButton>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item
                component={Link}
                to="/change-password"
                leftSection={<IconKey size={16} stroke={1.8} />}
                onClick={close}
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
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        {/* Outside `PageTransition`, not inside: the rise-and-fade should play
            on the screen itself, not on a spinner that the screen then replaces
            without any movement of its own. */}
        <Suspense fallback={<RouteFallback />}>
          <PageTransition>
            <Outlet />
          </PageTransition>
        </Suspense>
      </AppShell.Main>

      <AppShell.Footer>
        <Group h="100%" px="md" justify="center" wrap="nowrap">
          <Text size="xs" c="dimmed">
            © {new Date().getFullYear()} dev1sme · Software Engineer
          </Text>
        </Group>
      </AppShell.Footer>
    </AppShell>
  );
}
