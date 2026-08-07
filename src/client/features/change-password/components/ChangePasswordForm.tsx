import { Alert, Button, PasswordInput, Stack } from "@mantine/core";
import { useState } from "react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

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
          label={t("changePassword.current")}
          value={matKhauCu}
          onChange={(e) => setMatKhauCu(e.currentTarget.value)}
          autoComplete="current-password"
          required
        />
        <PasswordInput
          label={t("changePassword.new")}
          description={t("changePassword.minChars", { count: TOI_THIEU })}
          value={matKhauMoi}
          onChange={(e) => setMatKhauMoi(e.currentTarget.value)}
          autoComplete="new-password"
          required
        />
        <PasswordInput
          label={t("changePassword.repeat")}
          value={nhapLai}
          onChange={(e) => setNhapLai(e.currentTarget.value)}
          error={lechNhau ? t("changePassword.mismatch") : null}
          autoComplete="new-password"
          required
        />

        <Button type="submit" loading={dangChay} disabled={!hopLe}>
          {t("changePassword.title")}
        </Button>
      </Stack>
    </form>
  );
}
