import { Alert, Group, Stack, Text, Title } from "@mantine/core";

import { PageState } from "../../components/PageState";
import { periodLabel, tien } from "../../format";
import { MonthsTable } from "./components/MonthsTable";
import { useDashboardCuaToi } from "./useMine";

/**
 * The tenant's own overview: usage and money, month by month.
 *
 * Deliberately plainer than the manager's dashboard — a tenant needs to know
 * what they used and what they owe, not occupancy or revenue.
 */
export function MyDashboardPage() {
  const { soLieu, loading, error } = useDashboardCuaToi();
  const ganNhat = soLieu?.months[0];

  return (
    <Stack>
      <Group justify="space-between" align="flex-end">
        <Title order={3}>Tổng quan</Title>
        {soLieu?.room_name && (
          <Text c="dimmed">Phòng {soLieu.room_name}</Text>
        )}
      </Group>

      <PageState loading={loading} error={error}>
        {soLieu && (
          <Stack>
            {soLieu.outstanding_total > 0 ? (
              <Alert color="orange" title="Còn nợ">
                Tổng còn phải đóng: <strong>{tien(soLieu.outstanding_total)}</strong>
              </Alert>
            ) : (
              <Alert color="teal" title="Đã thanh toán đủ">
                Không còn khoản nào phải đóng.
              </Alert>
            )}

            {ganNhat && (
              <Text c="dimmed" size="sm">
                Kỳ gần nhất: {periodLabel(ganNhat.period)}
              </Text>
            )}

            {soLieu.months.length === 0 ? (
              <Text c="dimmed">Chưa có dữ liệu tháng nào.</Text>
            ) : (
              <MonthsTable months={soLieu.months} />
            )}
          </Stack>
        )}
      </PageState>
    </Stack>
  );
}
