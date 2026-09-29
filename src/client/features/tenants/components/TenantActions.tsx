import { Button, Group, Menu } from "@mantine/core";
import { IconDots } from "@tabler/icons-react";
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
  size = "xs",
  onEdit,
  onMoveOut,
  onUndoMoveOut,
  onDelete,
}: {
  tenant: TenantDetail;
  /** `xs` in a table row under a mouse; `sm` on a card, which is a finger on a phone. */
  size?: "xs" | "sm";
  onEdit: (tenant: TenantDetail) => void;
  onMoveOut: (tenant: TenantDetail) => void;
  onUndoMoveOut: (tenant: TenantDetail) => void;
  onDelete: (tenant: TenantDetail) => void;
}) {
  const { t } = useTranslation();
  const isActive = tenant.moved_out === null;

  return (
    <Group gap="xs" justify="flex-end" wrap="nowrap">
      <Button size={size} variant="light" onClick={() => onEdit(tenant)}>
        {t("common.edit")}
      </Button>

      <Menu position="bottom-end" withinPortal>
        <Menu.Target>
          <Button size={size} variant="subtle" color="gray" aria-label={t("common.more")}>
            <IconDots size={16} stroke={1.8} />
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          {isActive ? (
            <Menu.Item color="red" onClick={() => onMoveOut(tenant)}>
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
