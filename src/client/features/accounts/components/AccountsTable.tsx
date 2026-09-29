import { Badge, Table, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

import type { Account } from "../../../../shared/types";
import { AccountActions } from "./AccountActions";

export function AccountsTable({
  accounts,
  currentUserId,
  onRename,
  onResetPassword,
  onDelete,
}: {
  accounts: Account[];
  /** The logged-in manager, so their own row can say so. */
  currentUserId: number;
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
          {accounts.map((account) => (
            <Table.Tr key={account.id}>
              <Table.Td>
                <Text fw={500}>{account.username}</Text>
                {account.id === currentUserId && (
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
                <AccountActions
                  account={account}
                  currentUserId={currentUserId}
                  onRename={onRename}
                  onResetPassword={onResetPassword}
                  onDelete={onDelete}
                />
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
