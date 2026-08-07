import { Button, Group, Stack, Title } from "@mantine/core";
import { IconUserPlus } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { TenantDetail } from "../../../shared/types";
import { PageState } from "../../components/PageState";
import { ngay } from "../../format";
import { useConfirm } from "../../hooks/useConfirm";
import { TenantModal, type MucTieuNguoiThue } from "./components/TenantModal";
import { TenantsTable } from "./components/TenantsTable";
import { useDanhSachNguoiThue, useThaoTacNguoiThue } from "./useTenants";

export function TenantsPage() {
  const { nguoiThue, phong, loading, error, reload } = useDanhSachNguoiThue();
  const { them, capNhat, chuyenDi, huyChuyenDi, xoa } = useThaoTacNguoiThue(reload);
  const { xacNhan, hopThoai } = useConfirm();
  const { t } = useTranslation();

  const [dangMo, setDangMo] = useState<MucTieuNguoiThue>(null);

  function hoiChuyenDi(tenant: TenantDetail) {
    xacNhan({
      title: t("tenants.recordMoveOut"),
      message: t("tenants.confirmMoveOut", {
        name: tenant.full_name,
        room: tenant.room_name,
      }),
      confirmLabel: t("tenants.movedOut"),
      color: "orange",
      onConfirm: () => chuyenDi(tenant.code),
    });
  }

  function hoiHuyChuyenDi(tenant: TenantDetail) {
    xacNhan({
      title: t("tenants.confirmUndoTitle"),
      message: t("tenants.confirmUndo", {
        name: tenant.full_name,
        room: tenant.room_name,
        date: ngay(tenant.moved_out),
      }),
      confirmLabel: t("tenants.undoLabel"),
      color: "teal",
      onConfirm: () => huyChuyenDi(tenant.code),
    });
  }

  function hoiXoa(tenant: TenantDetail) {
    xacNhan({
      title: t("tenants.confirmDeleteTitle"),
      message: t("tenants.confirmDelete", {
        name: tenant.full_name,
        room: tenant.room_name,
      }),
      confirmLabel: t("common.delete"),
      onConfirm: () => xoa(tenant.code),
    });
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>{t("nav.tenants")}</Title>
        <Button
          onClick={() => setDangMo({ tenant: null })}
          leftSection={<IconUserPlus size={16} stroke={1.8} />}
        >
          {t("tenants.add")}
        </Button>
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
