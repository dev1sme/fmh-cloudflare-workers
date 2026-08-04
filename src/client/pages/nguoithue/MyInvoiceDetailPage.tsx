import { Button, Card, Group, Stack, Table, Text, Title } from "@mantine/core";
import { Link, useParams } from "react-router-dom";

import { me } from "../../api";
import { InvoiceLines } from "../../components/InvoiceLines";
import { PageState } from "../../components/PageState";
import { TrangThaiBadge } from "../../components/TrangThaiBadge";
import { ngay, nhanKy, tien } from "../../format";
import { useResource } from "../../hooks/useResource";

export function MyInvoiceDetailPage() {
  const id = Number(useParams().id);
  const { data, loading, error } = useResource(() => me.invoice(id), [id]);
  const invoice = data?.invoice;

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>{invoice ? invoice.ma_hoa_don : "Hóa đơn"}</Title>
        <Button variant="subtle" component={Link} to="/hoa-don-cua-toi">
          ← Danh sách
        </Button>
      </Group>

      <PageState loading={loading} error={error}>
        {invoice && (
          <Stack>
            <Group>
              <Text c="dimmed">{nhanKy(invoice.ky)}</Text>
              <TrangThaiBadge value={invoice.trang_thai} />
            </Group>

            <InvoiceLines invoice={invoice} />

            {invoice.payments.length > 0 && (
              <Card withBorder padding="md">
                <Stack gap="sm">
                  <Text fw={500}>Đã thanh toán</Text>
                  <Table>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Ngày</Table.Th>
                        <Table.Th>Số tiền</Table.Th>
                        <Table.Th>Hình thức</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {invoice.payments.map((payment) => (
                        <Table.Tr key={payment.id}>
                          <Table.Td>{ngay(payment.ngay_tt)}</Table.Td>
                          <Table.Td>{tien(payment.so_tien)}</Table.Td>
                          <Table.Td>
                            {payment.phuong_thuc === "tien_mat" ? "Tiền mặt" : "Chuyển khoản"}
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Stack>
              </Card>
            )}

            {invoice.con_lai > 0 && invoice.trang_thai !== "huy" && (
              <Card withBorder padding="md">
                <Text size="sm" c="dimmed">
                  Chuyển khoản với nội dung <b>{invoice.ma_hoa_don}</b> để chủ nhà đối chiếu. Mã
                  VietQR sẽ hiển thị ở đây sau khi được cấu hình.
                </Text>
              </Card>
            )}
          </Stack>
        )}
      </PageState>
    </Stack>
  );
}
