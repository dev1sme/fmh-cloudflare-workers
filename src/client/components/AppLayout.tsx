import { AppShell, Burger, Button, Group, NavLink, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Link, Outlet, useLocation } from "react-router-dom";

import type { SessionUser } from "../api";

const QUAN_LY_LINKS = [
  { to: "/phong", label: "Phòng" },
  { to: "/chi-so", label: "Chỉ số điện nước" },
  { to: "/hoa-don", label: "Hóa đơn" },
  { to: "/cai-dat", label: "Cài đặt" },
];

const NGUOI_THUE_LINKS = [
  { to: "/hoa-don-cua-toi", label: "Hóa đơn của tôi" },
  { to: "/chi-so-cua-toi", label: "Lịch sử chỉ số" },
];

export function AppLayout({ user, onLogout }: { user: SessionUser; onLogout: () => void }) {
  const [opened, { toggle, close }] = useDisclosure();
  const { pathname } = useLocation();
  const links = user.vai_tro === "quan_ly" ? QUAN_LY_LINKS : NGUOI_THUE_LINKS;

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 220, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title order={4}>Nhà trọ FMH</Title>
          </Group>
          <Group gap="sm" wrap="nowrap">
            <Text size="sm" c="dimmed" visibleFrom="xs">
              {user.username} · {user.vai_tro === "quan_ly" ? "quản lý" : "người thuê"}
            </Text>
            <Button size="xs" variant="light" onClick={onLogout}>
              Đăng xuất
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        {links.map((link) => (
          <NavLink
            key={link.to}
            component={Link}
            to={link.to}
            label={link.label}
            active={pathname.startsWith(link.to)}
            onClick={close}
          />
        ))}
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
