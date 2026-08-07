import { Select, Stack, Text, TextInput } from "@mantine/core";
import { useTranslation } from "react-i18next";

import { KHAC, NGAN_HANG } from "../banks";

export type BankValue = {
  bin: string | null;
  soTk: string;
  chuTk: string;
  momoSdt: string;
  momoTen: string;
};

/**
 * Bank details used to build the VietQR code on each invoice. Leaving them
 * empty is fine — invoices then just show the transfer memo as text.
 */
export function BankFields({
  value,
  onChange,
}: {
  value: BankValue;
  onChange: (next: BankValue) => void;
}) {
  const { t } = useTranslation();
  const trongDanhSach = value.bin !== null && NGAN_HANG.some((bank) => bank.bin === value.bin);
  const luaChon = value.bin === null ? null : trongDanhSach ? value.bin : KHAC;

  return (
    <Stack gap="sm">
      <Text fw={500} size="sm">
        {t("bank.title")}
      </Text>

      <Select
        label={t("bank.bank")}
        placeholder={t("bank.notConfigured")}
        searchable
        clearable
        value={luaChon}
        onChange={(bin) =>
          onChange({ ...value, bin: bin === KHAC ? "" : bin })
        }
        data={[
          ...NGAN_HANG.map((bank) => ({ value: bank.bin, label: `${bank.ten} — ${bank.bin}` })),
          { value: KHAC, label: t("bank.other") },
        ]}
      />

      {luaChon === KHAC && (
        <TextInput
          label={t("bank.bin")}
          description={t("bank.binHint")}
          value={value.bin ?? ""}
          onChange={(e) => onChange({ ...value, bin: e.currentTarget.value })}
          maxLength={6}
        />
      )}

      <TextInput
        label={t("bank.accountNo")}
        value={value.soTk}
        onChange={(e) => onChange({ ...value, soTk: e.currentTarget.value })}
      />
      <TextInput
        label={t("bank.accountName")}
        value={value.chuTk}
        onChange={(e) => onChange({ ...value, chuTk: e.currentTarget.value })}
      />

      <Text fw={500} size="sm" mt="sm">
        {t("bank.momoTitle")}
      </Text>
      <Text size="xs" c="dimmed" mt={-8}>
        {t("bank.momoNote")}
      </Text>

      <TextInput
        label={t("bank.momoPhone")}
        placeholder="09xxxxxxxx"
        value={value.momoSdt}
        onChange={(e) => onChange({ ...value, momoSdt: e.currentTarget.value })}
      />
      <TextInput
        label={t("bank.momoName")}
        value={value.momoTen}
        onChange={(e) => onChange({ ...value, momoTen: e.currentTarget.value })}
      />
    </Stack>
  );
}
