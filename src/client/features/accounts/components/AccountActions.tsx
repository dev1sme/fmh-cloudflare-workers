import { Button, Group, Menu, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

import type { Account } from "../../../../shared/types";

/**
 * The buttons on one account, shared by `AccountsTable` and `AccountCards`.
 *
 * The delete item is the reason this is not inlined twice: the API refuses
 * deleting the account you are signed in as (`CANNOT_DELETE_SELF`), so the item
 * is disabled and carries that reason underneath — grey with no explanation
 * reads as a bug. Two copies of that would be two places to forget it.
 */
export function AccountActions({
  account,
  idHienTai,
  onRename,
  onResetPassword,
  onDelete,
}: {
  account: Account;
  /** The logged-in manager, so their own row can refuse deletion. */
  idHienTai: number;
  onRename: (account: Account) => void;
  onResetPassword: (account: Account) => void;
  onDelete: (account: Account) => void;
}) {
  const { t } = useTranslation();
  const laChinhMinh = account.id === idHienTai;

  return (
    <Group gap="xs" justify="flex-end" wrap="nowrap">
      <Button size="xs" variant="light" onClick={() => onResetPassword(account)}>
        {t("accounts.resetPassword")}
      </Button>

      <Menu position="bottom-end" withinPortal>
        <Menu.Target>
          <Button size="xs" variant="subtle" color="gray" aria-label={t("common.more")}>
            ⋯
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item onClick={() => onRename(account)}>{t("accounts.rename")}</Menu.Item>

          {laChinhMinh ? (
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
  );
}
