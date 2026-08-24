import { Badge, Button, Group, Menu, Table } from "@mantine/core";
import { useTranslation } from "react-i18next";

import type { TenantDetail } from "../../../../shared/types";
import { ngay } from "../../../format";

export function TenantsTable({
  nguoiThue,
  onEdit,
  onMoveOut,
  onUndoMoveOut,
  onDelete,
}: {
  nguoiThue: TenantDetail[];
  onEdit: (tenant: TenantDetail) => void;
  onMoveOut: (tenant: TenantDetail) => void;
  onUndoMoveOut: (tenant: TenantDetail) => void;
  onDelete: (tenant: TenantDetail) => void;
}) {
  const { t } = useTranslation();

  return (
    <Table.ScrollContainer minWidth={820}>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t("tenants.room")}</Table.Th>
            <Table.Th>{t("tenants.named")}</Table.Th>
            <Table.Th>{t("tenants.colPhone")}</Table.Th>
            <Table.Th>{t("tenants.colOccupants")}</Table.Th>
            <Table.Th>{t("tenants.colIn")}</Table.Th>
            <Table.Th>{t("tenants.colOut")}</Table.Th>
            <Table.Th>{t("tenants.colStatus")}</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {nguoiThue.map((tenant) => {
            const dangThue = tenant.moved_out === null;

            return (
              <Table.Tr key={tenant.id}>
                <Table.Td fw={500}>{tenant.room_name}</Table.Td>
                <Table.Td>{tenant.full_name}</Table.Td>
                <Table.Td>{tenant.phone ?? t("common.empty")}</Table.Td>
                <Table.Td>{t("tenants.occupantsCell", { count: tenant.occupants })}</Table.Td>
                <Table.Td>{ngay(tenant.moved_in)}</Table.Td>
                <Table.Td>{ngay(tenant.moved_out)}</Table.Td>
                <Table.Td>
                  <Badge color={dangThue ? "teal" : "gray"} variant="light">
                    {dangThue ? t("tenants.renting") : t("tenants.movedOut")}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs" justify="flex-end" wrap="nowrap">
                    <Button size="xs" variant="light" onClick={() => onEdit(tenant)}>
                      {t("common.edit")}
                    </Button>
                    <Menu position="bottom-end" withinPortal>
                      <Menu.Target>
                        <Button size="xs" variant="subtle" color="gray">
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
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>

    </Table.ScrollContainer>
  );
}
