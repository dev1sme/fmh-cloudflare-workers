import { Button, Group, Menu, Stack, Text } from "@mantine/core";
import { IconDots } from "@tabler/icons-react";
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
  size = "xs",
  currentUserId,
  onRename,
  onResetPassword,
  onDelete,
}: {
  account: Account;
  /** `xs` in a table row under a mouse; `sm` on a card, which is a finger on a phone. */
  size?: "xs" | "sm";
  /** The logged-in manager, so their own row can refuse deletion. */
  currentUserId: number;
  onRename: (account: Account) => void;
  onResetPassword: (account: Account) => void;
  onDelete: (account: Account) => void;
}) {
  const { t } = useTranslation();
  const isSelf = account.id === currentUserId;

  return (
    <Group gap="xs" justify="flex-end" wrap="nowrap">
      <Button size={size} variant="light" onClick={() => onResetPassword(account)}>
        {t("accounts.resetPassword")}
      </Button>

      <Menu position="bottom-end" withinPortal>
        <Menu.Target>
          <Button size={size} variant="subtle" color="gray" aria-label={t("common.more")}>
            <IconDots size={16} stroke={1.8} />
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item onClick={() => onRename(account)}>{t("accounts.rename")}</Menu.Item>

          {isSelf ? (
            <Menu.Item color="red" disabled>
              <Stack gap={2}>
                <span>{t("accounts.delete")}</span>
                <Text size={size} c="dimmed">
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
