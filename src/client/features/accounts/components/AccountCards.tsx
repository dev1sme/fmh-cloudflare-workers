import { Badge, Card, Group, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

import type { Account } from "../../../../shared/types";
import { CardField } from "../../../components/CardField";
import { AccountActions } from "./AccountActions";

/**
 * The accounts list on a phone.
 *
 * The narrowest of the four tables at `minWidth={680}`, but still wider than a
 * 390 px screen, and the column that scrolls off is the username.
 *
 * The room field is skipped for the manager: `users.room_id` is NULL for that
 * role by schema, so a `—` row would be stating a constraint as if it were
 * missing data.
 */
export function AccountCards({
  accounts,
  currentUserId,
  onRename,
  onResetPassword,
  onDelete,
}: {
  accounts: Account[];
  currentUserId: number;
  onRename: (account: Account) => void;
  onResetPassword: (account: Account) => void;
  onDelete: (account: Account) => void;
}) {
  const { t } = useTranslation();

  return (
    <Stack gap="xs">
      {accounts.map((account) => (
        <Card key={account.id} padding="md">
          <Stack gap="xs">
            <Group justify="space-between" wrap="nowrap" gap="sm" align="flex-start">
              <div style={{ minWidth: 0 }}>
                <Text fw={700} truncate>
                  {account.username}
                </Text>
                {account.id === currentUserId && (
                  <Text size="xs" c="dimmed">
                    {t("accounts.currentAccount")}
                  </Text>
                )}
              </div>
              <Badge color={account.role === "MANAGER" ? "settled" : "gray"} variant="light">
                {account.role === "MANAGER" ? t("common.manager") : t("accounts.tenantRole")}
              </Badge>
            </Group>

            {account.room_name !== null && (
              <CardField label={t("dashboard.colRoom")}>{account.room_name}</CardField>
            )}

            <AccountActions
              size="sm"
              account={account}
              currentUserId={currentUserId}
              onRename={onRename}
              onResetPassword={onResetPassword}
              onDelete={onDelete}
            />
          </Stack>
        </Card>
      ))}
    </Stack>
  );
}
