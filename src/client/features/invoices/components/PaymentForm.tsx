import { Button, Group, NumberInput, Select, TextInput } from "@mantine/core";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { separators, today } from "../../../format";
import type { NewPayment } from "../useInvoiceDetail";

export function PaymentForm({
  outstanding,
  onSubmit,
}: {
  outstanding: number;
  onSubmit: (input: NewPayment) => Promise<boolean>;
}) {
  const [amount, setAmount] = useState<number | string>(outstanding);
  const [paidOn, setPaidOn] = useState(today());
  const [method, setMethod] = useState<string | null>("BANK_TRANSFER");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const { t } = useTranslation();

  // Default to what is still owed, refreshed after each payment.
  useEffect(() => setAmount(outstanding), [outstanding]);

  async function submit() {
    setBusy(true);

    const ok = await onSubmit({
      amount: Number(amount),
      paid_on: paidOn,
      method: method ?? "BANK_TRANSFER",
      note: note || null,
    });

    setBusy(false);
    if (ok) setNote("");
  }

  return (
    <Group align="flex-end" wrap="wrap">
      <NumberInput
        label={t("payment.amount")}
        value={amount}
        onChange={setAmount}
        min={0}
        step={100000}
        {...separators()}
        w={180}
      />
      <TextInput
        type="date"
        label={t("invoices.paidOn")}
        value={paidOn}
        onChange={(e) => setPaidOn(e.currentTarget.value)}
        w={160}
      />
      <Select
        label={t("payment.method")}
        value={method}
        onChange={setMethod}
        data={[
          { value: "BANK_TRANSFER", label: t("method.BANK_TRANSFER") },
          { value: "CASH", label: t("method.CASH") },
        ]}
        w={160}
      />
      <TextInput
        label={t("payment.note")}
        value={note}
        onChange={(e) => setNote(e.currentTarget.value)}
        flex={1}
        miw={160}
      />
      <Button onClick={submit} loading={busy}>
        {t("invoices.record")}
      </Button>
    </Group>
  );
}
