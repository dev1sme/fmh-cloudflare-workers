import { Button, Group, Stack, Title } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { RoomDetail } from "../../../shared/types";
import { PageState } from "../../components/PageState";
import { useConfirm } from "../../hooks/useConfirm";
import { MoveInModal } from "./components/MoveInModal";
import { RoomModal, type MucTieuPhong } from "./components/RoomModal";
import { RoomsTable } from "./components/RoomsTable";
import { useDanhSachPhong, useThaoTacPhong } from "./useRooms";

export function RoomsPage() {
  const { phong, nha, loading, error, reload } = useDanhSachPhong();
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
        <Button
          onClick={() => setDangMo({ room: null })}
          disabled={nha.length === 0}
          leftSection={<IconPlus size={16} stroke={1.8} />}
        >
          {t("rooms.add")}
        </Button>
      </Group>

      <PageState loading={loading} error={error}>
        <RoomsTable
          phong={phong}
          onEdit={(room) => setDangMo({ room })}
          onMoveIn={setDangThemNguoi}
          onMoveOut={hoiChuyenDi}
          onDelete={hoiXoaPhong}
        />
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
