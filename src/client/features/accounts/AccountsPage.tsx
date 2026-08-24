import { Box, Button, Group, Stack, Text, Title } from "@mantine/core";
import { IconKey, IconUserPlus } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { Account } from "../../../shared/types";
import type { SessionUser } from "../../api";
import { EmptyState } from "../../components/EmptyState";
import { PageState } from "../../components/PageState";
import { useConfirm } from "../../hooks/useConfirm";
import { AccountModal } from "./components/AccountModal";
import { AccountCards } from "./components/AccountCards";
import { AccountsTable } from "./components/AccountsTable";
import { PasswordModal } from "./components/PasswordModal";
import { RenameModal } from "./components/RenameModal";
import { ResetPasswordModal } from "./components/ResetPasswordModal";
import { useDanhSachTaiKhoan, useThaoTacTaiKhoan } from "./useAccounts";

export function AccountsPage({ user }: { user: SessionUser }) {
  const { taiKhoan, phong, loading, refreshing, error, reload } = useDanhSachTaiKhoan();
  const { them, doiTen, datLaiMatKhau, xoa, matKhauMoi, quenMatKhau } = useThaoTacTaiKhoan(reload);
  const { xacNhan, hopThoai } = useConfirm();
  const { t } = useTranslation();

  const [dangThem, setDangThem] = useState(false);
  const [dangReset, setDangReset] = useState<Account | null>(null);
  const [dangDoiTen, setDangDoiTen] = useState<Account | null>(null);

  function hoiXoa(account: Account) {
    xacNhan({
      title: t("accounts.delete"),
      message: t("accounts.confirmDelete", { name: account.username }),
      confirmLabel: t("common.delete"),
      onConfirm: () => xoa(account.code),
    });
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>{t("nav.accounts")}</Title>
        <Button
          onClick={() => setDangThem(true)}
          leftSection={<IconUserPlus size={16} stroke={1.8} />}
        >
          {t("accounts.add")}
        </Button>
      </Group>

      <Text c="dimmed" size="sm">
        {t("accounts.note")}
      </Text>

      <PageState loading={loading} refreshing={refreshing} error={error} onRetry={reload}>
        {taiKhoan.length === 0 ? (
          <EmptyState
            icon={<IconKey size={24} stroke={1.6} />}
            title={t("accounts.empty")}
            hint={t("accounts.emptyHint")}
            action={
              <Button
                onClick={() => setDangThem(true)}
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
                taiKhoan={taiKhoan}
                idHienTai={user.id}
                onRename={setDangDoiTen}
                onResetPassword={setDangReset}
                onDelete={hoiXoa}
              />
            </Box>
            <Box hiddenFrom="sm">
              <AccountCards
                taiKhoan={taiKhoan}
                idHienTai={user.id}
                onRename={setDangDoiTen}
                onResetPassword={setDangReset}
                onDelete={hoiXoa}
              />
            </Box>
          </>
        )}
      </PageState>

      <AccountModal
        opened={dangThem}
        phong={phong}
        onClose={() => setDangThem(false)}
        onSubmit={them}
      />
      <ResetPasswordModal
        account={dangReset}
        onClose={() => setDangReset(null)}
        onSubmit={datLaiMatKhau}
      />
      <RenameModal account={dangDoiTen} onClose={() => setDangDoiTen(null)} onSubmit={doiTen} />
      <PasswordModal ketQua={matKhauMoi} onClose={quenMatKhau} />
      {hopThoai}
    </Stack>
  );
}
