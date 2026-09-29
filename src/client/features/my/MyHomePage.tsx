import { Alert, Box, Button, Card, Group, SegmentedControl, Stack, Text, Title } from "@mantine/core";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { InvoiceLines } from "../../components/InvoiceLines";
import { PageState } from "../../components/PageState";
import { PaymentMethods } from "../../components/PaymentMethods";
import { PaymentsTable } from "../../components/PaymentsTable";
import { StatusPanel } from "../../components/StatusPanel";
import { periodLabel, money } from "../../format";
import { MonthList } from "./components/MonthList";
import { TransferInstructions } from "./components/TransferInstructions";
import { UsageTrend } from "./components/UsageTrend";
import { useMyDashboard, useMyInvoice } from "./useMine";

/**
 * The tenant's only screen.
 *
 * Everything they came for is here: what this month costs and how to pay it,
 * then a history column with a usage trend and every earlier month. Below
 * `md` the two stack into one column in that same order — the current bill
 * comes first regardless of screen size.
 *
 * On a laptop the shell has the width to show both at once instead of
 * spreading one narrow column across it, which is what made this read as a
 * phone-only screen even when opened on a desktop.
 *
 * The hero card is the newest month that actually has an invoice, loaded in
 * full (line items, QR, bank details) — not just the newest period. A manager
 * records this month's meters before generating its invoice, and during that
 * gap the newest *period* has nothing to pay while an older one still does;
 * featuring the period instead of the payable invoice would hide the QR the
 * tenant actually needs. Everything else stays as one-line summaries and
 * opens on demand — but the history section itself is always visible, even
 * with nothing in it yet, rather than disappearing when there is only one
 * month on record.
 */

/** Six, not three: three months is too short to show that electricity climbs
 *  in the hot season, which is the question the trend exists to answer. Not
 *  all, because the server hands back up to 24 and that is unreadable on a
 *  phone. */
const DEFAULT_RANGE = "6";

/** Where "Trả tiền ngay" scrolls to. */
const PAY_ANCHOR = "pay";

export function MyHomePage() {
  const { dashboard, loading, refreshing, error, reload } = useMyDashboard();
  const [range, setRange] = useState(DEFAULT_RANGE);
  const { t } = useTranslation();

  const rangeOptions = [
    { value: "3", label: t("tenant.range3") },
    { value: "6", label: t("tenant.range6") },
    { value: "all", label: t("tenant.rangeAll") },
  ];

  const allMonths = dashboard?.months ?? [];
  const featured = allMonths.find((m) => m.code !== null) ?? allMonths[0];

  // One window, two views of it: the chart plots it, the list shows the rest
  // of it after the featured month is taken out. Applying the range to the
  // list alone would leave the chart and the list a month out of step with
  // each other for no reason a tenant could work out.
  const monthCount = range === "all" ? allMonths.length : Number(range);
  const windowMonths = allMonths.slice(0, monthCount);

  // An unpaid month outside the window is still listed. Otherwise the header
  // says "Cần đóng 2.415.000" while no row on the screen accounts for it, and
  // a display filter would be quietly hiding a debt. It is kept out of the
  // chart, though: a gap-jumping point next to its neighbour reads as the
  // month after it.
  const owedOutsideWindow = allMonths.slice(monthCount).filter((m) => m !== featured && m.outstanding > 0);
  const history = [...windowMonths.filter((m) => m !== featured), ...owedOutsideWindow];

  // Only the newest month needs its QR and line items up front.
  const { invoice } = useMyInvoice(featured?.code ?? "");
  const canPay = Boolean(invoice?.bank_transfer || invoice?.momo);
  const unpaidCount = allMonths.filter((m) => m.outstanding > 0).length;

  return (
    <PageState loading={loading} refreshing={refreshing} error={error} onRetry={reload}>
      {dashboard && (
        <Stack gap="lg">
          <div>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: "0.06em" }}>
              {t("tenant.room")}
            </Text>
            <Title order={2}>{dashboard.room_name}</Title>
          </div>

          {/* The answer to the one question the tenant opened the app for,
              filled amber or green so it reads before the number does. */}
          {dashboard.outstanding_total > 0 ? (
            <StatusPanel
              tone="owed"
              label={t("tenant.youOwe")}
              value={money(dashboard.outstanding_total)}
              hint={t("tenant.owedHint", { count: unpaidCount })}
            >
              {canPay && (
                <Button
                  size="md"
                  onClick={() =>
                    document.getElementById(PAY_ANCHOR)?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  {t("tenant.payNow")}
                </Button>
              )}
            </StatusPanel>
          ) : (
            <StatusPanel
              tone="settled"
              label={t("tenant.paidUp")}
              value={money(0)}
              hint={featured?.code ? t("tenant.paidUpHint", { period: periodLabel(featured.period) }) : undefined}
            />
          )}

          <Box className="fmh-tenant-grid">
            {/* Left / top: the month being paid right now. */}
            <Stack gap="md">
              {featured &&
                (featured.total === null ? (
                  <Card>
                    <Stack gap="md">
                      <Title order={4}>{periodLabel(featured.period)}</Title>
                      <Alert color="gray" variant="light">
                        {t("tenant.noInvoiceYet")}
                      </Alert>
                    </Stack>
                  </Card>
                ) : (
                  invoice && <InvoiceLines invoice={invoice} heading={periodLabel(featured.period)} />
                ))}

              {invoice && (
                <PaymentMethods transfer={invoice.bank_transfer} momo={invoice.momo} id={PAY_ANCHOR} />
              )}

              {invoice &&
                !invoice.bank_transfer &&
                !invoice.momo &&
                invoice.outstanding > 0 &&
                invoice.status !== "CANCELLED" && <TransferInstructions invoiceCode={invoice.code} />}

              {/* Once paid there is no QR (the server stops sending one), so
                  the space shows what was paid instead — the receipt a tenant
                  would otherwise ask the landlord for. */}
              {invoice && invoice.payments.length > 0 && (
                <Card>
                  <Stack gap="sm">
                    <Title order={5}>{t("invoice.paidSection")}</Title>
                    <PaymentsTable payments={invoice.payments} />
                  </Stack>
                </Card>
              )}
            </Stack>

            {/* Right / bottom: trend across months, then each month in full.
                One control governs both — they answer the same question, and
                two pickers side by side would need setting twice. */}
            <Stack gap="md">
              <Group justify="space-between" align="center" wrap="wrap" gap="xs">
                <Text
                  size="xs"
                  c="dimmed"
                  tt="uppercase"
                  fw={600}
                  style={{ letterSpacing: "0.06em" }}
                >
                  {t("tenant.history")}
                </Text>
                <SegmentedControl
                  size="sm"
                  value={range}
                  onChange={setRange}
                  data={rangeOptions}
                  aria-label={t("tenant.rangeLabel")}
                />
              </Group>

              <UsageTrend months={windowMonths} />

              {history.length > 0 ? (
                <MonthList months={history} owedOutsideWindow={owedOutsideWindow.length} />
              ) : (
                <Card>
                  <Text size="sm" c="dimmed">
                    {t("tenant.emptyHistory")}
                  </Text>
                </Card>
              )}
            </Stack>
          </Box>
        </Stack>
      )}
    </PageState>
  );
}
