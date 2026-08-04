import { Stack, Title } from "@mantine/core";
import { useState } from "react";

import type { RoomDetail } from "../../../shared/types";
import { PageState } from "../../components/PageState";
import { useConfirm } from "../../hooks/useConfirm";
import { EditRoomModal } from "./components/EditRoomModal";
import { MoveInModal } from "./components/MoveInModal";
import { RoomsTable } from "./components/RoomsTable";
import { useDanhSachPhong, useThaoTacPhong } from "./usePhong";

export function RoomsPage() {
  const { phong, loading, error, reload } = useDanhSachPhong();
  const { capNhatPhong, themNguoiThue, chuyenDi } = useThaoTacPhong(reload);
  const { xacNhan, hopThoai } = useConfirm();

  const [dangSua, setDangSua] = useState<RoomDetail | null>(null);
  const [dangThem, setDangThem] = useState<RoomDetail | null>(null);

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

  return (
    <Stack>
      <Title order={3}>Phòng</Title>

      <PageState loading={loading} error={error}>
        <RoomsTable
          phong={phong}
          onEdit={setDangSua}
          onMoveIn={setDangThem}
          onMoveOut={hoiChuyenDi}
        />
      </PageState>

      <EditRoomModal room={dangSua} onClose={() => setDangSua(null)} onSubmit={capNhatPhong} />
      <MoveInModal room={dangThem} onClose={() => setDangThem(null)} onSubmit={themNguoiThue} />
      {hopThoai}
    </Stack>
  );
}
