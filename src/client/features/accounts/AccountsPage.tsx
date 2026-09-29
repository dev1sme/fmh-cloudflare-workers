import { Box, Button, Stack, Text } from "@mantine/core";
import { IconKey, IconUserPlus } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { Account } from "../../../shared/types";
import type { SessionUser } from "../../api";
import { EmptyState } from "../../components/EmptyState";
import { PageHeader } from "../../components/PageHeader";
import { PageState } from "../../components/PageState";
import { useConfirm } from "../../hooks/useConfirm";
import { AccountModal } from "./components/AccountModal";
import { AccountCards } from "./components/AccountCards";
import { AccountsTable } from "./components/AccountsTable";
import { PasswordModal } from "./components/PasswordModal";
import { RenameModal } from "./components/RenameModal";
import { ResetPasswordModal } from "./components/ResetPasswordModal";
import { useAccountList, useAccountActions } from "./useAccounts";

export function AccountsPage({ user }: { user: SessionUser }) {
  const { accounts, rooms, loading, refreshing, error, reload } = useAccountList();
  const { add, rename, resetPassword, remove, newPassword, clearNewPassword } = useAccountActions(reload);
  const { confirm, confirmDialog } = useConfirm();
  const { t } = useTranslation();

  const [adding, setAdding] = useState(false);
  const [resetting, setResetting] = useState<Account | null>(null);
  const [renaming, setRenaming] = useState<Account | null>(null);

  function askDelete(account: Account) {
    confirm({
      title: t("accounts.delete"),
      message: t("accounts.confirmDelete", { name: account.username }),
      confirmLabel: t("common.delete"),
      onConfirm: () => remove(account.code),
    });
  }

  const headerContext = loading ? undefined : t("pageContext.accounts", { count: accounts.length });

  return (
    <Stack>
      <PageHeader
        title={t("nav.accounts")}
        context={headerContext}
        actions={
          <>
            <Button
              onClick={() => setAdding(true)}
              leftSection={<IconUserPlus size={16} stroke={1.8} />}
            >
              {t("accounts.add")}
            </Button>
          </>
        }
      />

      <Text c="dimmed" size="sm">
        {t("accounts.note")}
      </Text>

      <PageState loading={loading} refreshing={refreshing} error={error} onRetry={reload}>
        {accounts.length === 0 ? (
          <EmptyState
            icon={<IconKey size={24} stroke={1.6} />}
            title={t("accounts.empty")}
            hint={t("accounts.emptyHint")}
            action={
              <Button
                onClick={() => setAdding(true)}
                leftSection={<IconUserPlus size={16} stroke={1.8} />}
              >
                {t("accounts.add")}
              </Button>
            }
          />
        ) : (
          <>
            {/* Four columns at minWidth 680 — still wider than a phone. */}
            <Box visibleFrom="sm">
              <AccountsTable
                accounts={accounts}
                currentUserId={user.id}
                onRename={setRenaming}
                onResetPassword={setResetting}
                onDelete={askDelete}
              />
            </Box>
            <Box hiddenFrom="sm">
              <AccountCards
                accounts={accounts}
                currentUserId={user.id}
                onRename={setRenaming}
                onResetPassword={setResetting}
                onDelete={askDelete}
              />
            </Box>
          </>
        )}
      </PageState>

      <AccountModal
        opened={adding}
        rooms={rooms}
        onClose={() => setAdding(false)}
        onSubmit={add}
      />
      <ResetPasswordModal
        account={resetting}
        onClose={() => setResetting(null)}
        onSubmit={resetPassword}
      />
      <RenameModal account={renaming} onClose={() => setRenaming(null)} onSubmit={rename} />
      <PasswordModal result={newPassword} onClose={clearNewPassword} />
      {confirmDialog}
    </Stack>
  );
}
