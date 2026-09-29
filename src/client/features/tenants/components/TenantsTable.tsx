import { Badge, Table } from "@mantine/core";
import { useTranslation } from "react-i18next";

import type { TenantDetail } from "../../../../shared/types";
import { formatDate } from "../../../format";
import { TenantActions } from "./TenantActions";

export function TenantsTable({
  tenants,
  onEdit,
  onMoveOut,
  onUndoMoveOut,
  onDelete,
}: {
  tenants: TenantDetail[];
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
          {tenants.map((tenant) => {
            const isActive = tenant.moved_out === null;

            return (
              <Table.Tr key={tenant.id}>
                <Table.Td fw={500}>{tenant.room_name}</Table.Td>
                <Table.Td>{tenant.full_name}</Table.Td>
                <Table.Td>{tenant.phone ?? t("common.empty")}</Table.Td>
                <Table.Td>{t("tenants.occupantsCell", { count: tenant.occupants })}</Table.Td>
                <Table.Td>{formatDate(tenant.moved_in)}</Table.Td>
                <Table.Td>{formatDate(tenant.moved_out)}</Table.Td>
                <Table.Td>
                  <Badge color={isActive ? "teal" : "gray"} variant="light">
                    {isActive ? t("tenants.renting") : t("tenants.movedOut")}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <TenantActions
                    tenant={tenant}
                    onEdit={onEdit}
                    onMoveOut={onMoveOut}
                    onUndoMoveOut={onUndoMoveOut}
                    onDelete={onDelete}
                  />
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>

    </Table.ScrollContainer>
  );
}
