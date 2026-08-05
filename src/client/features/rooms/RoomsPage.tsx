import { Button, Group, Stack, Title } from "@mantine/core";
import { useState } from "react";

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

  const [dangMo, setDangMo] = useState<MucTieuPhong>(null);
  const [dangThemNguoi, setDangThemNguoi] = useState<RoomDetail | null>(null);

  function hoiChuyenDi(room: RoomDetail) {
    if (!room.tenant) return;

    xacNhan({
      title: "Xác nhận chuyển đi",
      message: `${room.tenant.ho_ten} đã chuyển khỏi ${room.ten_phong}? Phòng sẽ được đánh dấu trống từ hôm nay.`,
      confirmLabel: "Đã chuyển đi",
      color: "orange",
      onConfirm: () => chuyenDi(room.tenant!.id),
    });
  }

  function hoiXoaPhong(room: RoomDetail) {
    xacNhan({
      title: "Xoá phòng",
      message: `Xoá ${room.ten_phong}? Chỉ xoá được khi phòng chưa có chỉ số, hóa đơn hay người thuê nào.`,
      confirmLabel: "Xoá",
      onConfirm: () => xoaPhong(room.id),
    });
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>Phòng</Title>
        <Button onClick={() => setDangMo({ room: null })} disabled={nha.length === 0}>
          Thêm phòng
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
