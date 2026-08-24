import { Button, Group, Stack, Text, Title } from "@mantine/core";
import { IconBuildingCommunity, IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { Building } from "../../../shared/types";
import { EmptyState } from "../../components/EmptyState";
import { PageState } from "../../components/PageState";
import { useConfirm } from "../../hooks/useConfirm";
import { BuildingForm } from "./components/BuildingForm";
import { BuildingModal } from "./components/BuildingModal";
import { useDanhSachNha, useThaoTacNha } from "./useBuildings";

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
  const { nha, loading, refreshing, error, reload } = useDanhSachNha();
  const { them, luu, xoa } = useThaoTacNha(reload);
  const { xacNhan, hopThoai } = useConfirm();
  const { t } = useTranslation();

  const [dangThem, setDangThem] = useState(false);

  function hoiXoa(item: Building) {
    xacNhan({
      title: t("buildings.deleteBuilding"),
      message: t("buildings.confirmDeleteBuilding", { name: item.name }),
      confirmLabel: t("common.delete"),
      onConfirm: () => xoa(item.id),
    });
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>{t("nav.buildings")}</Title>
        <Button
          onClick={() => setDangThem(true)}
          leftSection={<IconPlus size={16} stroke={1.8} />}
        >
          {t("buildings.addBuilding")}
        </Button>
      </Group>

      <Text c="dimmed" size="sm">
        {t("buildings.ratesNote")}
      </Text>

      <PageState loading={loading} refreshing={refreshing} error={error} onRetry={reload}>
        {nha.length === 0 ? (
          <EmptyState
            icon={<IconBuildingCommunity size={24} stroke={1.6} />}
            title={t("buildings.empty")}
            hint={t("buildings.emptyHint")}
            action={
              <Button
                onClick={() => setDangThem(true)}
                leftSection={<IconPlus size={16} stroke={1.8} />}
              >
                {t("buildings.addBuilding")}
              </Button>
            }
          />
        ) : (
          <Stack>
            {nha.map((item) => (
              <BuildingForm key={item.id} nha={item} onSave={luu} onDelete={hoiXoa} />
            ))}
          </Stack>
        )}
      </PageState>

      <BuildingModal opened={dangThem} onClose={() => setDangThem(false)} onSubmit={them} />
      {hopThoai}
    </Stack>
  );
}
