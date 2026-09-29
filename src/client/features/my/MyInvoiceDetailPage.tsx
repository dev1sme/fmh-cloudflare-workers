import { Button, Card, Group, Stack, Text, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";

import { InvoiceLines } from "../../components/InvoiceLines";
import { PaymentMethods } from "../../components/PaymentMethods";
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

            <PaymentMethods transfer={invoice.bank_transfer} momo={invoice.momo} />

            {/* No bank account and no MoMo configured, but money still owed:
                the memo alone is enough for the landlord to reconcile a
                transfer made by other means. */}
            {!invoice.bank_transfer &&
              !invoice.momo &&
              invoice.outstanding > 0 &&
              invoice.status !== "CANCELLED" && <TransferInstructions invoiceCode={invoice.code} />}
          </Stack>
        )}
      </PageState>
    </Stack>
  );
}
