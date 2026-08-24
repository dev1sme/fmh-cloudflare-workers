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
import { useInvoicesTheoKy, useSinhHoaDon, useXemTruocSinh } from "./useInvoices";

export function InvoicesPage() {
  const [period, setPeriod] = usePeriodParam();
  const [moSinh, setMoSinh] = useState(false);

  const { hoaDon, tongTien, loading, refreshing, error, reload } = useInvoicesTheoKy(period);
  const { sinh, dangChay, ketQua, xoaKetQua } = useSinhHoaDon(period, reload);
  const xemTruoc = useXemTruocSinh(period, moSinh);
  const { t } = useTranslation();

  async function xacNhanSinh(roomIds: number[]) {
    if (await sinh(roomIds)) setMoSinh(false);
  }

  return (
    <Stack>
      <Group justify="space-between" align="flex-end">
        <Title order={3}>{t("nav.invoices")}</Title>
        <Group align="flex-end">
          <PeriodPicker value={period} onChange={setPeriod} />
          <Button onClick={() => setMoSinh(true)}>
            {t("invoices.generateFor", { period: periodLabel(period) })}
          </Button>
        </Group>
      </Group>

      {ketQua && <SkippedAlert skipped={ketQua.skipped} onClose={xoaKetQua} />}

      <PageState loading={loading} refreshing={refreshing} error={error} onRetry={reload}>
        {hoaDon.length === 0 ? (
          // A normal mid-month state, not a fault: the meters are read before
          // the invoices are issued. The action is the same one in the header,
          // repeated where the eye already is.
          <EmptyState
            icon={<IconFileInvoice size={24} stroke={1.6} />}
            title={t("invoices.emptyPeriod", { period: periodLabel(period) })}
            hint={t("invoices.emptyPeriodHint")}
            action={
              <Button onClick={() => setMoSinh(true)}>
                {t("invoices.generateFor", { period: periodLabel(period) })}
              </Button>
            }
          />
        ) : (
          <>
            {/* Nine columns do not fit a phone; cards carry the same facts. */}
            <Box visibleFrom="sm">
              <InvoicesTable hoaDon={hoaDon} tongTien={tongTien} />
            </Box>
            <Box hiddenFrom="sm">
              <InvoiceCards hoaDon={hoaDon} />
            </Box>
          </>
        )}
      </PageState>

      <GenerateInvoicesModal
        period={period}
        opened={moSinh}
        rooms={xemTruoc.rooms}
        loading={xemTruoc.loading}
        error={xemTruoc.error}
        onRetry={xemTruoc.reload}
        dangChay={dangChay}
        onClose={() => setMoSinh(false)}
        onSubmit={xacNhanSinh}
      />
    </Stack>
  );
}
