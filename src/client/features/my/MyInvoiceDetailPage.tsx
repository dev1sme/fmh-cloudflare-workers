import { Button, Card, Group, Stack, Text, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";

import { BankTransferCard } from "../../components/BankTransferCard";
import { InvoiceLines } from "../../components/InvoiceLines";
import { MomoCard } from "../../components/MomoCard";
import { PageState } from "../../components/PageState";
import { PaymentsTable } from "../../components/PaymentsTable";
import { StatusBadge } from "../../components/StatusBadge";
import { periodLabel } from "../../format";
import { TransferInstructions } from "./components/TransferInstructions";
import { useInvoicesCuaToiChiTiet } from "./useMine";

export function MyInvoiceDetailPage() {
  const code = (useParams().code ?? "").toUpperCase();
  const { hoaDon, loading, error } = useInvoicesCuaToiChiTiet(code);
  const { t } = useTranslation();

  return (
    // Capped independently of the shell's wide container: this is a single
    // receipt, not the two-column home screen, and a 1200px-wide line item
    // is harder to read than a narrow one.
    <Stack maw={560} mx="auto">
      <Group justify="space-between">
        <Title order={3}>{hoaDon ? hoaDon.code : t("invoice.fallbackTitle")}</Title>
        <Button variant="subtle" component={Link} to="/">
          ← {t("common.home")}
        </Button>
      </Group>

      <PageState loading={loading} error={error}>
        {hoaDon && (
          <Stack>
            <Group>
              <Text c="dimmed">{periodLabel(hoaDon.period)}</Text>
              <StatusBadge value={hoaDon.status} />
            </Group>

            <InvoiceLines invoice={hoaDon} />

            {hoaDon.payments.length > 0 && (
              <Card withBorder padding="md">
                <Stack gap="sm">
                  <Text fw={500}>{t("invoice.paidSection")}</Text>
                  <PaymentsTable payments={hoaDon.payments} />
                </Stack>
              </Card>
            )}

            {hoaDon.bank_transfer ? (
              <BankTransferCard chuyenKhoan={hoaDon.bank_transfer} />
            ) : (
              !hoaDon.momo &&
              hoaDon.outstanding > 0 &&
              hoaDon.status !== "CANCELLED" && (
                <TransferInstructions maHoaDon={hoaDon.code} />
              )
            )}

            {hoaDon.momo && <MomoCard momo={hoaDon.momo} />}
          </Stack>
        )}
      </PageState>
    </Stack>
  );
}
