import { Alert, Button, Group, List, Stack, Table, Text, Title } from "@mantine/core";
import { useState } from "react";
import { Link } from "react-router-dom";

import type { GenerateResult } from "../../../shared/types";
import { invoices as invoicesApi } from "../../api";
import { KyPicker } from "../../components/KyPicker";
import { PageState } from "../../components/PageState";
import { TrangThaiBadge } from "../../components/TrangThaiBadge";
import { baoLoi, baoThanhCong } from "../../errors";
import { kyHienTai, nhanKy, tien } from "../../format";
import { useResource } from "../../hooks/useResource";

const LY_DO: Record<GenerateResult["skipped"][number]["reason"], string> = {
  thieu_chi_so: "chưa nhập chỉ số",
  da_co_hoa_don: "đã có hóa đơn",
};

export function InvoicesPage() {
  const [ky, setKy] = useState(kyHienTai());
  const { data, loading, error, reload } = useResource(() => invoicesApi.list({ ky }), [ky]);
  const [ketQua, setKetQua] = useState<GenerateResult | null>(null);
  const [busy, setBusy] = useState(false);

  async function sinhHoaDon() {
    setBusy(true);

    try {
      const result = await invoicesApi.generate(ky);
      setKetQua(result);
      baoThanhCong(`Đã sinh ${result.created.length} hóa đơn.`);
      reload();
    } catch (err) {
      baoLoi(err);
    } finally {
      setBusy(false);
    }
  }

  const tongTien = data?.invoices.reduce((sum, invoice) => sum + invoice.tong_tien, 0) ?? 0;

  return (
    <Stack>
      <Group justify="space-between" align="flex-end">
        <Title order={3}>Hóa đơn</Title>
        <Group align="flex-end">
          <KyPicker value={ky} onChange={setKy} />
          <Button onClick={sinhHoaDon} loading={busy}>
            Sinh hóa đơn {nhanKy(ky).toLowerCase()}
          </Button>
        </Group>
      </Group>

      {ketQua && ketQua.skipped.length > 0 && (
        <Alert color="yellow" title="Một số phòng chưa sinh được" onClose={() => setKetQua(null)} withCloseButton>
          <List size="sm">
            {ketQua.skipped.map((item) => (
              <List.Item key={item.room_id}>
                {item.ten_phong} — {LY_DO[item.reason]}
              </List.Item>
            ))}
          </List>
        </Alert>
      )}

      <PageState loading={loading} error={error}>
        {data && data.invoices.length === 0 ? (
          <Text c="dimmed">Chưa có hóa đơn nào cho {nhanKy(ky).toLowerCase()}.</Text>
        ) : (
          <Table.ScrollContainer minWidth={820}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Mã</Table.Th>
                  <Table.Th>Phòng</Table.Th>
                  <Table.Th>Tiền phòng</Table.Th>
                  <Table.Th>Điện</Table.Th>
                  <Table.Th>Nước</Table.Th>
                  <Table.Th>Phí khác</Table.Th>
                  <Table.Th>Tổng</Table.Th>
                  <Table.Th>Trạng thái</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data?.invoices.map((invoice) => (
                  <Table.Tr key={invoice.id}>
                    <Table.Td>{invoice.ma_hoa_don}</Table.Td>
                    <Table.Td fw={500}>{invoice.ten_phong}</Table.Td>
                    <Table.Td>{tien(invoice.tien_phong)}</Table.Td>
                    <Table.Td>{tien(invoice.tien_dien)}</Table.Td>
                    <Table.Td>{tien(invoice.tien_nuoc)}</Table.Td>
                    <Table.Td>{tien(invoice.phi_khac)}</Table.Td>
                    <Table.Td fw={600}>{tien(invoice.tong_tien)}</Table.Td>
                    <Table.Td>
                      <TrangThaiBadge value={invoice.trang_thai} />
                    </Table.Td>
                    <Table.Td>
                      <Button
                        size="xs"
                        variant="light"
                        component={Link}
                        to={`/hoa-don/${invoice.id}`}
                      >
                        Chi tiết
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
              <Table.Tfoot>
                <Table.Tr>
                  <Table.Td colSpan={6} ta="right" fw={500}>
                    Tổng cộng
                  </Table.Td>
                  <Table.Td fw={700}>{tien(tongTien)}</Table.Td>
                  <Table.Td colSpan={2} />
                </Table.Tr>
              </Table.Tfoot>
            </Table>
          </Table.ScrollContainer>
        )}
      </PageState>
    </Stack>
  );
}
