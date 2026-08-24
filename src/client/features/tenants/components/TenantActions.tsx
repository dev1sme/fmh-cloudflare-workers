import { Button, Group, Menu } from "@mantine/core";
import { useTranslation } from "react-i18next";

import type { TenantDetail } from "../../../../shared/types";

/**
 * The buttons on one tenancy, shared by `TenantsTable` and `TenantCards`.
 *
 * The move-out / undo-move-out pair is mutually exclusive and decided by
 * `moved_out`, which is the condition worth having in exactly one place.
 */
export function TenantActions({
  tenant,
  onEdit,
  onMoveOut,
  onUndoMoveOut,
  onDelete,
}: {
  tenant: TenantDetail;
  onEdit: (tenant: TenantDetail) => void;
  onMoveOut: (tenant: TenantDetail) => void;
  onUndoMoveOut: (tenant: TenantDetail) => void;
  onDelete: (tenant: TenantDetail) => void;
}) {
  const { t } = useTranslation();
  const dangThue = tenant.moved_out === null;

  return (
    <Group gap="xs" justify="flex-end" wrap="nowrap">
      <Button size="xs" variant="light" onClick={() => onEdit(tenant)}>
        {t("common.edit")}
      </Button>

      <Menu position="bottom-end" withinPortal>
        <Menu.Target>
          <Button size="xs" variant="subtle" color="gray" aria-label={t("common.more")}>
            ⋯
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          {dangThue ? (
            <Menu.Item color="orange" onClick={() => onMoveOut(tenant)}>
              {t("tenants.recordMoveOut")}
            </Menu.Item>
          ) : (
            <Menu.Item onClick={() => onUndoMoveOut(tenant)}>
              {t("tenants.undoMoveOut")}
            </Menu.Item>
          )}
          <Menu.Item color="red" onClick={() => onDelete(tenant)}>
            {t("tenants.deleteRecord")}
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
}
