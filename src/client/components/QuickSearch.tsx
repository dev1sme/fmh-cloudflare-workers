import { Spotlight, type SpotlightActionData } from "@mantine/spotlight";
import { IconFileInvoice, IconHome, IconSearch, IconUsers } from "@tabler/icons-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { invoices as invoicesApi, rooms as roomsApi } from "../api";
import { periodLabel, tien } from "../format";
import { useResource } from "../hooks/useResource";

/**
 * Ctrl+K jump-to across rooms and invoices.
 *
 * Manager-only, and loaded once when the shell mounts rather than per
 * keystroke: at this scale the whole list is a few dozen rows, so filtering in
 * memory beats a search endpoint that would need its own index and its own
 * authorisation story.
 *
 * Invoices are listed by code and room because that is what a landlord has in
 * hand — a transfer memo or a tenant asking about "the August one".
 */
export function QuickSearch() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: roomData } = useResource(() => roomsApi.list(), []);
  const { data: invoiceData } = useResource(() => invoicesApi.list(), []);

  const actions = useMemo<SpotlightActionData[]>(() => {
    const rooms = (roomData?.rooms ?? []).map((room) => ({
      id: `room-${room.code}`,
      label: room.room_name,
      description: room.tenant
        ? t("search.renting", { name: room.tenant.full_name })
        : t("search.vacant"),
      leftSection: <IconHome size={18} stroke={1.6} />,
      onClick: () => navigate("/rooms"),
    }));

    const invoices = (invoiceData?.invoices ?? []).map((invoice) => ({
      id: `invoice-${invoice.code}`,
      label: `${invoice.code} · ${invoice.room_name}`,
      description: `${periodLabel(invoice.period)} · ${tien(invoice.total)}`,
      leftSection: <IconFileInvoice size={18} stroke={1.6} />,
      onClick: () => navigate(`/invoices/${invoice.code}`),
    }));

    const screens = [
      {
        id: "go-tenants",
        label: t("nav.tenants"),
        leftSection: <IconUsers size={18} stroke={1.6} />,
        onClick: () => navigate("/tenants"),
      },
    ];

    return [...rooms, ...invoices, ...screens];
  }, [roomData, invoiceData, navigate, t]);

  return (
    <Spotlight
      actions={actions}
      shortcut={["mod + K", "mod + P"]}
      nothingFound={t("search.nothingFound")}
      highlightQuery
      searchProps={{
        leftSection: <IconSearch size={18} stroke={1.6} />,
        placeholder: t("search.placeholder"),
      }}
    />
  );
}
