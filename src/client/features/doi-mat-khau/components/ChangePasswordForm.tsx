import { Alert, Button, PasswordInput, Stack } from "@mantine/core";
import { useState } from "react";

const TOI_THIEU = 8;

export function ChangePasswordForm({
  onSubmit,
  loi,
  dangChay,
}: {
  onSubmit: (matKhauCu: string, matKhauMoi: string) => Promise<boolean>;
  loi: string | null;
  dangChay: boolean;
}) {
  const [matKhauCu, setMatKhauCu] = useState("");
  const [matKhauMoi, setMatKhauMoi] = useState("");
  const [nhapLai, setNhapLai] = useState("");

  const lechNhau = nhapLai !== "" && nhapLai !== matKhauMoi;
  const hopLe = matKhauCu !== "" && matKhauMoi.length >= TOI_THIEU && nhapLai === matKhauMoi;

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    if (await onSubmit(matKhauCu, matKhauMoi)) {
      setMatKhauCu("");
      setMatKhauMoi("");
      setNhapLai("");
    }
  }

  return (
    <form onSubmit={submit}>
      <Stack>
        {loi && (
          <Alert color="red" variant="light">
            {loi}
          </Alert>
        )}

        <PasswordInput
          label="Mật khẩu hiện tại"
          value={matKhauCu}
          onChange={(e) => setMatKhauCu(e.currentTarget.value)}
          autoComplete="current-password"
          required
        />
        <PasswordInput
          label="Mật khẩu mới"
          description={`Tối thiểu ${TOI_THIEU} ký tự`}
          value={matKhauMoi}
          onChange={(e) => setMatKhauMoi(e.currentTarget.value)}
          autoComplete="new-password"
          required
        />
        <PasswordInput
          label="Nhập lại mật khẩu mới"
          value={nhapLai}
          onChange={(e) => setNhapLai(e.currentTarget.value)}
          error={lechNhau ? "Hai mật khẩu không khớp." : null}
          autoComplete="new-password"
          required
        />

        <Button type="submit" loading={dangChay} disabled={!hopLe}>
          Đổi mật khẩu
        </Button>
      </Stack>
    </form>
  );
}
