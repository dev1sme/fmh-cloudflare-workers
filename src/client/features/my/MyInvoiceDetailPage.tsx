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
import { useMyInvoice } from "./useMine";

export function MyInvoiceDetailPage() {
  const code = (useParams().code ?? "").toUpperCase();
  const { invoice, loading, refreshing, error } = useMyInvoice(code);
  const { t } = useTranslation();

  return (
    // Capped independently of the shell's wide container: this is a single
    // receipt, not the two-column home screen, and a 1200px-wide line item
    // is harder to read than a narrow one.
    <Stack maw={560} mx="auto">
      <Group justify="space-between">
        <Title order={3}>{invoice ? invoice.code : t("invoice.fallbackTitle")}</Title>
        <Button variant="subtle" component={Link} to="/">
          ← {t("common.home")}
        </Button>
      </Group>

      <PageState loading={loading} refreshing={refreshing} error={error}>
        {invoice && (
          <Stack>
            <Group>
              <Text c="dimmed">{periodLabel(invoice.period)}</Text>
              <StatusBadge value={invoice.status} />
            </Group>

            <InvoiceLines invoice={invoice} />

            {invoice.payments.length > 0 && (
              <Card withBorder padding="md">
                <Stack gap="sm">
                  <Text fw={500}>{t("invoice.paidSection")}</Text>
                  <PaymentsTable payments={invoice.payments} />
                </Stack>
              </Card>
            )}

            {invoice.bank_transfer ? (
              <BankTransferCard transfer={invoice.bank_transfer} />
            ) : (
              !invoice.momo &&
              invoice.outstanding > 0 &&
              invoice.status !== "CANCELLED" && (
                <TransferInstructions invoiceCode={invoice.code} />
              )
            )}

            {invoice.momo && <MomoCard momo={invoice.momo} />}
          </Stack>
        )}
      </PageState>
    </Stack>
  );
}
