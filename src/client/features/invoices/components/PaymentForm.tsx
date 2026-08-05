import { Button, Group, NumberInput, Select, TextInput } from "@mantine/core";
import { useEffect, useState } from "react";

import { homNay } from "../../../format";
import type { ThanhToanMoi } from "../useInvoiceDetail";

export function PaymentForm({
  conLai,
  onSubmit,
}: {
  conLai: number;
  onSubmit: (input: ThanhToanMoi) => Promise<boolean>;
}) {
  const [soTien, setSoTien] = useState<number | string>(conLai);
  const [ngayTt, setNgayTt] = useState(homNay());
  const [phuongThuc, setPhuongThuc] = useState<string | null>("BANK_TRANSFER");
  const [ghiChu, setGhiChu] = useState("");
  const [busy, setBusy] = useState(false);

  // Default to what is still owed, refreshed after each payment.
  useEffect(() => setSoTien(conLai), [conLai]);

  async function submit() {
    setBusy(true);

    const ok = await onSubmit({
      amount: Number(soTien),
      paid_on: ngayTt,
      method: phuongThuc ?? "BANK_TRANSFER",
      note: ghiChu || null,
    });

    setBusy(false);
    if (ok) setGhiChu("");
  }

  return (
    <Group align="flex-end" wrap="wrap">
      <NumberInput
        label="Số tiền"
        value={soTien}
        onChange={setSoTien}
        min={0}
        step={100000}
        thousandSeparator="."
        decimalSeparator=","
        w={180}
      />
      <TextInput
        type="date"
        label="Ngày thu"
        value={ngayTt}
        onChange={(e) => setNgayTt(e.currentTarget.value)}
        w={160}
      />
      <Select
        label="Hình thức"
        value={phuongThuc}
        onChange={setPhuongThuc}
        data={[
          { value: "BANK_TRANSFER", label: "Chuyển khoản" },
          { value: "CASH", label: "Tiền mặt" },
        ]}
        w={160}
      />
      <TextInput
        label="Ghi chú"
        value={ghiChu}
        onChange={(e) => setGhiChu(e.currentTarget.value)}
        flex={1}
        miw={160}
      />
      <Button onClick={submit} loading={busy}>
        Ghi nhận
      </Button>
    </Group>
  );
}
