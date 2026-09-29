import { Box, Button, Group, Stack, Title } from "@mantine/core";
import { IconFileInvoice } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { EmptyState } from "../../components/EmptyState";
import { PeriodPicker } from "../../components/PeriodPicker";
import { PageState } from "../../components/PageState";
import { periodLabel } from "../../format";
import { usePeriodParam } from "../../hooks/usePeriodParam";
import { InvoiceCards } from "./components/InvoiceCards";
import { InvoicesTable } from "./components/InvoicesTable";
import { GenerateInvoicesModal } from "./components/GenerateInvoicesModal";
import { SkippedAlert } from "./components/SkippedAlert";
import { useInvoicesForPeriod, useGenerateInvoices, useGeneratePreview } from "./useInvoices";

export function InvoicesPage() {
  const [period, setPeriod] = usePeriodParam();
  const [generateOpen, setGenerateOpen] = useState(false);

  const { invoices, grandTotal, loading, refreshing, error, reload } = useInvoicesForPeriod(period);
  const { generate, busy, result, clearResult } = useGenerateInvoices(period, reload);
  const preview = useGeneratePreview(period, generateOpen);
  const { t } = useTranslation();

  async function confirmGenerate(roomIds: number[]) {
    if (await generate(roomIds)) setGenerateOpen(false);
  }

  return (
    <Stack>
      <Group justify="space-between" align="flex-end">
        <Title order={3}>{t("nav.invoices")}</Title>
        <Group align="flex-end">
          <PeriodPicker value={period} onChange={setPeriod} />
          <Button onClick={() => setGenerateOpen(true)}>
            {t("invoices.generateFor", { period: periodLabel(period) })}
          </Button>
        </Group>
      </Group>

      {result && <SkippedAlert skipped={result.skipped} onClose={clearResult} />}

      <PageState loading={loading} refreshing={refreshing} error={error} onRetry={reload}>
        {invoices.length === 0 ? (
          // A normal mid-month state, not a fault: the meters are read before
          // the invoices are issued. The action is the same one in the header,
          // repeated where the eye already is.
          <EmptyState
            icon={<IconFileInvoice size={24} stroke={1.6} />}
            title={t("invoices.emptyPeriod", { period: periodLabel(period) })}
            hint={t("invoices.emptyPeriodHint")}
            action={
              <Button onClick={() => setGenerateOpen(true)}>
                {t("invoices.generateFor", { period: periodLabel(period) })}
              </Button>
            }
          />
        ) : (
          <>
            {/* Nine columns do not fit a phone; cards carry the same facts. */}
            <Box visibleFrom="sm">
              <InvoicesTable invoices={invoices} grandTotal={grandTotal} />
            </Box>
            <Box hiddenFrom="sm">
              <InvoiceCards invoices={invoices} />
            </Box>
          </>
        )}
      </PageState>

      <GenerateInvoicesModal
        period={period}
        opened={generateOpen}
        rooms={preview.rooms}
        loading={preview.loading}
        error={preview.error}
        onRetry={preview.reload}
        busy={busy}
        onClose={() => setGenerateOpen(false)}
        onSubmit={confirmGenerate}
      />
    </Stack>
  );
}
