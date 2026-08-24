import { Button, Group, Stack, Title, Tooltip } from "@mantine/core";
import { IconBuildingCommunity, IconHome, IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { RoomDetail } from "../../../shared/types";
import { EmptyState } from "../../components/EmptyState";
import { PageState } from "../../components/PageState";
import { useConfirm } from "../../hooks/useConfirm";
import { Link } from "react-router-dom";
import { MoveInModal } from "./components/MoveInModal";
import { RoomModal, type MucTieuPhong } from "./components/RoomModal";
import { RoomsTable } from "./components/RoomsTable";
import { useDanhSachPhong, useThaoTacPhong } from "./useRooms";

export function RoomsPage() {
  const { phong, nha, loading, refreshing, error, reload } = useDanhSachPhong();
  const { themPhong, capNhatPhong, xoaPhong, themNguoiThue, chuyenDi } = useThaoTacPhong(reload);
  const { xacNhan, hopThoai } = useConfirm();
  const { t } = useTranslation();

  const [dangMo, setDangMo] = useState<MucTieuPhong>(null);
  const [dangThemNguoi, setDangThemNguoi] = useState<RoomDetail | null>(null);

  function hoiChuyenDi(room: RoomDetail) {
    if (!room.tenant) return;

    xacNhan({
      title: t("rooms.confirmMoveOutTitle"),
      message: t("rooms.confirmMoveOut", {
        name: room.tenant.full_name,
        room: room.room_name,
      }),
      confirmLabel: t("rooms.movedOutLabel"),
      color: "orange",
      onConfirm: () => chuyenDi(room.tenant!.code),
    });
  }

  function hoiXoaPhong(room: RoomDetail) {
    xacNhan({
      title: t("rooms.delete"),
      message: t("rooms.confirmDelete", { room: room.room_name }),
      confirmLabel: t("common.delete"),
      onConfirm: () => xoaPhong(room.code),
    });
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>{t("nav.rooms")}</Title>
        {/* Disabled needs a reason attached to it. A room belongs to a
            building, and on a fresh install this button is grey with nothing
            on the screen saying why or where to go. A Tooltip alone would not
            do it — Mantine strips pointer events from a disabled button, so it
            never fires — hence the wrapping span. */}
        <Tooltip label={t("rooms.needBuilding")} disabled={nha.length > 0} withArrow>
          <span>
            <Button
              onClick={() => setDangMo({ room: null })}
              disabled={nha.length === 0}
              leftSection={<IconPlus size={16} stroke={1.8} />}
            >
              {t("rooms.add")}
            </Button>
          </span>
        </Tooltip>
      </Group>

      <PageState loading={loading} refreshing={refreshing} error={error} onRetry={reload}>
        {phong.length === 0 ? (
          // Two different dead ends, two different answers. With no building
          // there is nothing to do on this screen at all, so the way out points
          // at Cài đặt; with a building, the room is one click away.
          nha.length === 0 ? (
            <EmptyState
              icon={<IconBuildingCommunity size={24} stroke={1.6} />}
              title={t("rooms.noBuilding")}
              hint={t("rooms.noBuildingHint")}
              action={
                <Button component={Link} to="/settings" variant="light">
                  {t("nav.settings")}
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={<IconHome size={24} stroke={1.6} />}
              title={t("rooms.empty")}
              hint={t("rooms.emptyHint")}
              action={
                <Button
                  onClick={() => setDangMo({ room: null })}
                  leftSection={<IconPlus size={16} stroke={1.8} />}
                >
                  {t("rooms.add")}
                </Button>
              }
            />
          )
        ) : (
          <RoomsTable
            phong={phong}
            onEdit={(room) => setDangMo({ room })}
            onMoveIn={setDangThemNguoi}
            onMoveOut={hoiChuyenDi}
            onDelete={hoiXoaPhong}
          />
        )}
      </PageState>

      <RoomModal
        target={dangMo}
        nha={nha}
        onClose={() => setDangMo(null)}
        onCreate={themPhong}
        onUpdate={capNhatPhong}
      />
      <MoveInModal
        room={dangThemNguoi}
        onClose={() => setDangThemNguoi(null)}
        onSubmit={themNguoiThue}
      />
      {hopThoai}
    </Stack>
  );
}
