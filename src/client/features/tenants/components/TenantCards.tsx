import { Badge, Card, Group, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

import type { TenantDetail } from "../../../../shared/types";
import { CardField } from "../../../components/CardField";
import { formatDate } from "../../../format";
import { TenantActions } from "./TenantActions";

/**
 * The tenancy list on a phone.
 *
 * Eight columns at `minWidth={820}` — the widest table in the app, and this one
 * holds past tenancies too, so it is also the longest. The room and the name
 * lead because that pair is what the manager is scanning for; the status badge
 * sits beside them because a past tenancy and a current one look identical
 * otherwise.
 *
 * "Đến ngày" appears only on a tenancy that has ended: on a current one the
 * date is null and a row reading `—` says nothing the badge has not already
 * said.
 */
export function TenantCards({
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
    <Stack gap="xs">
      {tenants.map((tenant) => {
        const isActive = tenant.moved_out === null;

        return (
          <Card key={tenant.id} padding="md">
            <Stack gap="xs">
              <Group justify="space-between" wrap="nowrap" gap="sm" align="flex-start">
                <div style={{ minWidth: 0 }}>
                  <Text fw={700}>{tenant.room_name}</Text>
                  <Text size="sm">{tenant.full_name}</Text>
                </div>
                <Badge color={isActive ? "teal" : "gray"} variant="light">
                  {isActive ? t("tenants.renting") : t("tenants.movedOut")}
                </Badge>
              </Group>

              <CardField label={t("tenants.colPhone")}>
                {tenant.phone ?? t("common.empty")}
              </CardField>

              <CardField label={t("tenants.colOccupants")}>
                {t("tenants.occupantsCell", { count: tenant.occupants })}
              </CardField>

              <CardField label={t("tenants.colIn")}>{formatDate(tenant.moved_in)}</CardField>

              {!isActive && (
                <CardField label={t("tenants.colOut")}>{formatDate(tenant.moved_out)}</CardField>
              )}

              <TenantActions
                tenant={tenant}
                onEdit={onEdit}
                onMoveOut={onMoveOut}
                onUndoMoveOut={onUndoMoveOut}
                onDelete={onDelete}
              />
            </Stack>
          </Card>
        );
      })}
    </Stack>
  );
}
