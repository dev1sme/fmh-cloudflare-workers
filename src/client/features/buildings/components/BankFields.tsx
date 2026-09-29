import { Select, Stack, Text, TextInput } from "@mantine/core";
import { useTranslation } from "react-i18next";

import { OTHER_BANK, BANKS } from "../banks";

export type BankValue = {
  bin: string | null;
  accountNo: string;
  accountName: string;
  momoPhone: string;
  momoName: string;
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
  const isListed = value.bin !== null && BANKS.some((bank) => bank.bin === value.bin);
  const selectValue = value.bin === null ? null : isListed ? value.bin : OTHER_BANK;

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
        value={selectValue}
        onChange={(bin) =>
          onChange({ ...value, bin: bin === OTHER_BANK ? "" : bin })
        }
        data={[
          ...BANKS.map((bank) => ({ value: bank.bin, label: `${bank.name} — ${bank.bin}` })),
          { value: OTHER_BANK, label: t("bank.other") },
        ]}
      />

      {selectValue === OTHER_BANK && (
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
        value={value.accountNo}
        onChange={(e) => onChange({ ...value, accountNo: e.currentTarget.value })}
      />
      <TextInput
        label={t("bank.accountName")}
        value={value.accountName}
        onChange={(e) => onChange({ ...value, accountName: e.currentTarget.value })}
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
        value={value.momoPhone}
        onChange={(e) => onChange({ ...value, momoPhone: e.currentTarget.value })}
      />
      <TextInput
        label={t("bank.momoName")}
        value={value.momoName}
        onChange={(e) => onChange({ ...value, momoName: e.currentTarget.value })}
      />
    </Stack>
  );
}
