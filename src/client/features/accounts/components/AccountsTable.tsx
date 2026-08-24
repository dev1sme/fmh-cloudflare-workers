import { Badge, Button, Group, Menu, Stack, Table, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  return (
    <Table.ScrollContainer minWidth={680}>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t("accounts.colUsername")}</Table.Th>
            <Table.Th>{t("accounts.colRole")}</Table.Th>
            <Table.Th>{t("dashboard.colRoom")}</Table.Th>
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
                    {t("accounts.currentAccount")}
                  </Text>
                )}
              </Table.Td>
              <Table.Td>
                <Badge
                  color={account.role === "MANAGER" ? "teal" : "blue"}
                  variant="light"
                >
                  {account.role === "MANAGER" ? t("common.manager") : t("accounts.tenantRole")}
                </Badge>
              </Table.Td>
              <Table.Td>{account.room_name ?? t("common.empty")}</Table.Td>
              <Table.Td>
                <Group gap="xs" justify="flex-end" wrap="nowrap">
                  <Button size="xs" variant="light" onClick={() => onResetPassword(account)}>
                    {t("accounts.resetPassword")}
                  </Button>
                  <Menu position="bottom-end" withinPortal>
                    <Menu.Target>
                      <Button size="xs" variant="subtle" color="gray">
                        ⋯
                      </Button>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item onClick={() => onRename(account)}>{t("accounts.rename")}</Menu.Item>
                      {/* The API refuses this with CANNOT_DELETE_SELF, so the
                          item has to be disabled — but grey with no reason
                          reads as a bug. The row already says "the account you
                          are signed in as"; this says what follows from it. */}
                      {account.id === idHienTai ? (
                        <Menu.Item color="red" disabled>
                          <Stack gap={2}>
                            <span>{t("accounts.delete")}</span>
                            <Text size="xs" c="dimmed">
                              {t("accounts.cannotDeleteSelf")}
                            </Text>
                          </Stack>
                        </Menu.Item>
                      ) : (
                        <Menu.Item color="red" onClick={() => onDelete(account)}>
                          {t("accounts.delete")}
                        </Menu.Item>
                      )}
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
