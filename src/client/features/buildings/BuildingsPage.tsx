import { Button, Stack, Text } from "@mantine/core";
import { IconBuildingCommunity, IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { Building } from "../../../shared/types";
import { EmptyState } from "../../components/EmptyState";
import { PageHeader } from "../../components/PageHeader";
import { PageState } from "../../components/PageState";
import { useConfirm } from "../../hooks/useConfirm";
import { BuildingForm } from "./components/BuildingForm";
import { BuildingModal } from "./components/BuildingModal";
import { useBuildingList, useBuildingActions } from "./useBuildings";

/**
 * Buildings: name, address, the electricity/water rates a generated invoice
 * copies from, and the bank account VietQR pays into.
 *
 * This used to live on "Cài đặt" alongside the Zalo notification bots — one
 * screen for two things that only shared a page, not a purpose. A building is
 * core billing data, the same tier as a room (its own `/api/buildings` CRUD,
 * its own row in the schema, `rooms.building_id` pointing back at it), not an
 * app preference. It gets its own screen for the same reason Phòng and Người
 * thuê do.
 */
export function BuildingsPage() {
  const { buildings, loading, refreshing, error, reload } = useBuildingList();
  const { add, save, remove } = useBuildingActions(reload);
  const { confirm, confirmDialog } = useConfirm();
  const { t } = useTranslation();

  const [adding, setAdding] = useState(false);

  function askDelete(item: Building) {
    confirm({
      title: t("buildings.deleteBuilding"),
      message: t("buildings.confirmDeleteBuilding", { name: item.name }),
      confirmLabel: t("common.delete"),
      onConfirm: () => remove(item.id),
    });
  }

  const headerContext = loading
    ? undefined
    : t("pageContext.buildings", { count: buildings.length });

  return (
    <Stack>
      <PageHeader
        title={t("nav.buildings")}
        context={headerContext}
        actions={
          <>
            <Button
              onClick={() => setAdding(true)}
              leftSection={<IconPlus size={16} stroke={1.8} />}
            >
              {t("buildings.addBuilding")}
            </Button>
          </>
        }
      />

      <Text c="dimmed" size="sm">
        {t("buildings.ratesNote")}
      </Text>

      <PageState loading={loading} refreshing={refreshing} error={error} onRetry={reload}>
        {buildings.length === 0 ? (
          <EmptyState
            icon={<IconBuildingCommunity size={24} stroke={1.6} />}
            title={t("buildings.empty")}
            hint={t("buildings.emptyHint")}
            action={
              <Button
                onClick={() => setAdding(true)}
                leftSection={<IconPlus size={16} stroke={1.8} />}
              >
                {t("buildings.addBuilding")}
              </Button>
            }
          />
        ) : (
          <Stack>
            {buildings.map((item) => (
              <BuildingForm key={item.id} building={item} onSave={save} onDelete={askDelete} />
            ))}
          </Stack>
        )}
      </PageState>

      <BuildingModal opened={adding} onClose={() => setAdding(false)} onSubmit={add} />
      {confirmDialog}
    </Stack>
  );
}
