import { Button, Group, Stack, Text, Title } from "@mantine/core";
import { useState } from "react";

import type { Account } from "../../../shared/types";
import type { SessionUser } from "../../api";
import { PageState } from "../../components/PageState";
import { useConfirm } from "../../hooks/useConfirm";
import { AccountModal } from "./components/AccountModal";
import { AccountsTable } from "./components/AccountsTable";
import { PasswordModal } from "./components/PasswordModal";
import { RenameModal } from "./components/RenameModal";
import { ResetPasswordModal } from "./components/ResetPasswordModal";
import { useDanhSachTaiKhoan, useThaoTacTaiKhoan } from "./useTaiKhoan";

export function AccountsPage({ user }: { user: SessionUser }) {
  const { taiKhoan, phong, loading, error, reload } = useDanhSachTaiKhoan();
  const { them, doiTen, datLaiMatKhau, xoa, matKhauMoi, quenMatKhau } = useThaoTacTaiKhoan(reload);
  const { xacNhan, hopThoai } = useConfirm();

  const [dangThem, setDangThem] = useState(false);
  const [dangReset, setDangReset] = useState<Account | null>(null);
  const [dangDoiTen, setDangDoiTen] = useState<Account | null>(null);

  function hoiXoa(account: Account) {
    xacNhan({
      title: "Xoá tài khoản",
      message: `Xoá "${account.username}"? Người dùng này sẽ không đăng nhập được nữa. Hóa đơn và dữ liệu phòng không bị ảnh hưởng.`,
      confirmLabel: "Xoá",
      onConfirm: () => xoa(account.id),
    });
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>Tài khoản</Title>
        <Button onClick={() => setDangThem(true)}>Thêm tài khoản</Button>
      </Group>

      <Text c="dimmed" size="sm">
        Mỗi phòng một tài khoản để người thuê xem hóa đơn. Mật khẩu lưu dạng đã băm — chỉ hiện một
        lần lúc tạo hoặc đặt lại, không tra cứu lại được.
      </Text>

      <PageState loading={loading} error={error}>
        <AccountsTable
          taiKhoan={taiKhoan}
          idHienTai={user.id}
          onRename={setDangDoiTen}
          onResetPassword={setDangReset}
          onDelete={hoiXoa}
        />
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
