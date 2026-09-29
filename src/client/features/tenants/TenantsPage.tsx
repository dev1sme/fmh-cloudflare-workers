import { Box, Button, Stack } from "@mantine/core";
import { IconUserPlus, IconUsers } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { TenantDetail } from "../../../shared/types";
import { EmptyState } from "../../components/EmptyState";
import { PageHeader } from "../../components/PageHeader";
import { PageState } from "../../components/PageState";
import { formatDate } from "../../format";
import { useConfirm } from "../../hooks/useConfirm";
import { TenantModal, type TenantTarget } from "./components/TenantModal";
import { TenantCards } from "./components/TenantCards";
import { TenantsTable } from "./components/TenantsTable";
import { useTenantList, useTenantActions } from "./useTenants";

export function TenantsPage() {
  const { tenants, rooms, loading, refreshing, error, reload } = useTenantList();
  const { add, update, moveOut, undoMoveOut, remove } = useTenantActions(reload);
  const { confirm, confirmDialog } = useConfirm();
  const { t } = useTranslation();
  const activeCount = tenants.filter((tenant) => tenant.moved_out === null).length;

  const [movingOut, setMovingOut] = useState<TenantTarget>(null);

  function askMoveOut(tenant: TenantDetail) {
    confirm({
      title: t("tenants.recordMoveOut"),
      message: t("tenants.confirmMoveOut", {
        name: tenant.full_name,
        room: tenant.room_name,
      }),
      confirmLabel: t("tenants.movedOut"),
      color: "red",
      onConfirm: () => moveOut(tenant.code),
    });
  }

  function askUndoMoveOut(tenant: TenantDetail) {
    confirm({
      title: t("tenants.confirmUndoTitle"),
      message: t("tenants.confirmUndo", {
        name: tenant.full_name,
        room: tenant.room_name,
        date: formatDate(tenant.moved_out),
      }),
      confirmLabel: t("tenants.undoLabel"),
      color: "settled",
      onConfirm: () => undoMoveOut(tenant.code),
    });
  }

  function askDelete(tenant: TenantDetail) {
    confirm({
      title: t("tenants.confirmDeleteTitle"),
      message: t("tenants.confirmDelete", {
        name: tenant.full_name,
        room: tenant.room_name,
      }),
      confirmLabel: t("common.delete"),
      onConfirm: () => remove(tenant.code),
    });
  }

  const headerContext = loading
    ? undefined
    : t("pageContext.tenants", { active: activeCount, past: tenants.length - activeCount });

  return (
    <Stack>
      <PageHeader
        title={t("nav.tenants")}
        context={headerContext}
        actions={
          <>
            <Button
              onClick={() => setMovingOut({ tenant: null })}
              leftSection={<IconUserPlus size={16} stroke={1.8} />}
            >
              {t("tenants.add")}
            </Button>
          </>
        }
      />

      <PageState loading={loading} refreshing={refreshing} error={error} onRetry={reload}>
        {tenants.length === 0 ? (
          <EmptyState
            icon={<IconUsers size={24} stroke={1.6} />}
            title={t("tenants.empty")}
            hint={t("tenants.emptyHint")}
            action={
              <Button
                onClick={() => setMovingOut({ tenant: null })}
                leftSection={<IconUserPlus size={16} stroke={1.8} />}
              >
                {t("tenants.add")}
              </Button>
            }
          />
        ) : (
          <>
            {/* Eight columns at minWidth 820 — the widest table in the app. */}
            <Box visibleFrom="sm">
              <TenantsTable
                tenants={tenants}
                onEdit={(tenant) => setMovingOut({ tenant })}
                onMoveOut={askMoveOut}
                onUndoMoveOut={askUndoMoveOut}
                onDelete={askDelete}
              />
            </Box>
            <Box hiddenFrom="sm">
              <TenantCards
                tenants={tenants}
                onEdit={(tenant) => setMovingOut({ tenant })}
                onMoveOut={askMoveOut}
                onUndoMoveOut={askUndoMoveOut}
                onDelete={askDelete}
              />
            </Box>
          </>
        )}
      </PageState>

      <TenantModal
        target={movingOut}
        rooms={rooms}
        onClose={() => setMovingOut(null)}
        onCreate={add}
        onUpdate={update}
      />
      {confirmDialog}
    </Stack>
  );
}
