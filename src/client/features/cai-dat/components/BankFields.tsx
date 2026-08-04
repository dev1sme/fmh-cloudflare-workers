import { Select, Stack, Text, TextInput } from "@mantine/core";

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
  const trongDanhSach = value.bin !== null && NGAN_HANG.some((bank) => bank.bin === value.bin);
  const luaChon = value.bin === null ? null : trongDanhSach ? value.bin : KHAC;

  return (
    <Stack gap="sm">
      <Text fw={500} size="sm">
        Tài khoản nhận tiền (VietQR)
      </Text>

      <Select
        label="Ngân hàng"
        placeholder="Chưa cấu hình"
        searchable
        clearable
        value={luaChon}
        onChange={(bin) =>
          onChange({ ...value, bin: bin === KHAC ? "" : bin })
        }
        data={[
          ...NGAN_HANG.map((bank) => ({ value: bank.bin, label: `${bank.ten} — ${bank.bin}` })),
          { value: KHAC, label: "Ngân hàng khác — tự nhập mã BIN" },
        ]}
      />

      {luaChon === KHAC && (
        <TextInput
          label="Mã BIN"
          description="6 chữ số theo chuẩn NAPAS"
          value={value.bin ?? ""}
          onChange={(e) => onChange({ ...value, bin: e.currentTarget.value })}
          maxLength={6}
        />
      )}

      <TextInput
        label="Số tài khoản"
        value={value.soTk}
        onChange={(e) => onChange({ ...value, soTk: e.currentTarget.value })}
      />
      <TextInput
        label="Tên chủ tài khoản"
        value={value.chuTk}
        onChange={(e) => onChange({ ...value, chuTk: e.currentTarget.value })}
      />

      <Text fw={500} size="sm" mt="sm">
        MoMo (tuỳ chọn)
      </Text>
      <Text size="xs" c="dimmed" mt={-8}>
        Hiện thêm dưới mã QR dạng thông tin để người thuê tự chuyển trong app MoMo. Không có mã QR
        MoMo vì chuẩn mã của MoMo chưa được xác minh.
      </Text>

      <TextInput
        label="Số điện thoại MoMo"
        placeholder="09xxxxxxxx"
        value={value.momoSdt}
        onChange={(e) => onChange({ ...value, momoSdt: e.currentTarget.value })}
      />
      <TextInput
        label="Tên người nhận MoMo"
        value={value.momoTen}
        onChange={(e) => onChange({ ...value, momoTen: e.currentTarget.value })}
      />
    </Stack>
  );
}
