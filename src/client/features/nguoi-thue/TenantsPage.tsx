import { Button, Group, Stack, Title } from "@mantine/core";
import { useState } from "react";

import type { TenantDetail } from "../../../shared/types";
import { PageState } from "../../components/PageState";
import { ngay } from "../../format";
import { useConfirm } from "../../hooks/useConfirm";
import { TenantModal, type MucTieuNguoiThue } from "./components/TenantModal";
import { TenantsTable } from "./components/TenantsTable";
import { useDanhSachNguoiThue, useThaoTacNguoiThue } from "./useNguoiThue";

export function TenantsPage() {
  const { nguoiThue, phong, loading, error, reload } = useDanhSachNguoiThue();
  const { them, capNhat, chuyenDi, huyChuyenDi, xoa } = useThaoTacNguoiThue(reload);
  const { xacNhan, hopThoai } = useConfirm();

  const [dangMo, setDangMo] = useState<MucTieuNguoiThue>(null);

  function hoiChuyenDi(tenant: TenantDetail) {
    xacNhan({
      title: "Ghi nhận chuyển đi",
      message: `${tenant.ho_ten} đã chuyển khỏi ${tenant.ten_phong}? Phòng sẽ trống từ hôm nay và có thể nhận người mới.`,
      confirmLabel: "Đã chuyển đi",
      color: "orange",
      onConfirm: () => chuyenDi(tenant.id),
    });
  }

  function hoiHuyChuyenDi(tenant: TenantDetail) {
    xacNhan({
      title: "Huỷ chuyển đi",
      message: `Đưa ${tenant.ho_ten} trở lại thành người đang thuê ${tenant.ten_phong} (đã ghi chuyển đi ngày ${ngay(tenant.ngay_ra)}). Không được nếu phòng đã có người khác.`,
      confirmLabel: "Đưa trở lại",
      color: "teal",
      onConfirm: () => huyChuyenDi(tenant.id),
    });
  }

  function hoiXoa(tenant: TenantDetail) {
    xacNhan({
      title: "Xoá bản ghi người thuê",
      message: `Xoá hẳn ${tenant.ho_ten} khỏi lịch sử ${tenant.ten_phong}. Chỉ dùng khi nhập nhầm — người đã chuyển đi nên giữ lại để tra cứu.`,
      confirmLabel: "Xoá",
      onConfirm: () => xoa(tenant.id),
    });
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>Người thuê</Title>
        <Button onClick={() => setDangMo({ tenant: null })}>Thêm người thuê</Button>
      </Group>

      <PageState loading={loading} error={error}>
        <TenantsTable
          nguoiThue={nguoiThue}
          onEdit={(tenant) => setDangMo({ tenant })}
          onMoveOut={hoiChuyenDi}
          onUndoMoveOut={hoiHuyChuyenDi}
          onDelete={hoiXoa}
        />
      </PageState>

      <TenantModal
        target={dangMo}
        phong={phong}
        onClose={() => setDangMo(null)}
        onCreate={them}
        onUpdate={capNhat}
      />
      {hopThoai}
    </Stack>
  );
}
