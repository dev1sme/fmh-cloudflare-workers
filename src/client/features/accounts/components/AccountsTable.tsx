import { Badge, Button, Group, Menu, Table, Text } from "@mantine/core";

import type { Account } from "../../../../shared/types";

export function AccountsTable({
  taiKhoan,
  idHienTai,
  onRename,
  onResetPassword,
  onDelete,
}: {
  taiKhoan: Account[];
  /** The logged-in manager, so their own row can say so. */
  idHienTai: number;
  onRename: (account: Account) => void;
  onResetPassword: (account: Account) => void;
  onDelete: (account: Account) => void;
}) {
  return (
    <Table.ScrollContainer minWidth={680}>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Tên đăng nhập</Table.Th>
            <Table.Th>Vai trò</Table.Th>
            <Table.Th>Phòng</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {taiKhoan.map((account) => (
            <Table.Tr key={account.id}>
              <Table.Td>
                <Text fw={500}>{account.username}</Text>
                {account.id === idHienTai && (
                  <Text size="xs" c="dimmed">
                    tài khoản đang đăng nhập
                  </Text>
                )}
              </Table.Td>
              <Table.Td>
                <Badge
                  color={account.role === "MANAGER" ? "teal" : "blue"}
                  variant="light"
                >
                  {account.role === "MANAGER" ? "Quản lý" : "Người thuê"}
                </Badge>
              </Table.Td>
              <Table.Td>{account.room_name ?? "—"}</Table.Td>
              <Table.Td>
                <Group gap="xs" justify="flex-end" wrap="nowrap">
                  <Button size="xs" variant="light" onClick={() => onResetPassword(account)}>
                    Đặt lại mật khẩu
                  </Button>
                  <Menu position="bottom-end" withinPortal>
                    <Menu.Target>
                      <Button size="xs" variant="subtle" color="gray">
                        ⋯
                      </Button>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item onClick={() => onRename(account)}>Đổi tên đăng nhập</Menu.Item>
                      <Menu.Item
                        color="red"
                        disabled={account.id === idHienTai}
                        onClick={() => onDelete(account)}
                      >
                        Xoá tài khoản
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
