import {
  Button,
  Card,
  Group,
  NumberInput,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import type { InvoiceDetail } from "../../../shared/types";
import { invoices as invoicesApi } from "../../api";
import { InvoiceLines } from "../../components/InvoiceLines";
import { PageState } from "../../components/PageState";
import { TrangThaiBadge } from "../../components/TrangThaiBadge";
import { baoLoi, baoThanhCong } from "../../errors";
import { homNay, ngay, nhanKy, tien } from "../../format";
import { useResource } from "../../hooks/useResource";

export function InvoiceDetailPage() {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const { data, loading, error, reload } = useResource(() => invoicesApi.get(id), [id]);
  const invoice = data?.invoice;

  const [phiKhac, setPhiKhac] = useState<number | string>(0);
  useEffect(() => {
    if (invoice) setPhiKhac(invoice.phi_khac);
  }, [invoice]);

  async function luuPhiKhac() {
    try {
      await invoicesApi.update(id, { phi_khac: Number(phiKhac) });
      baoThanhCong("Đã cập nhật phí khác.");
      reload();
    } catch (err) {
      baoLoi(err);
    }
  }

  async function huy() {
    if (!confirm("Huỷ hóa đơn này?")) return;

    try {
      await invoicesApi.update(id, { trang_thai: "huy" });
      baoThanhCong("Đã huỷ hóa đơn.");
      reload();
    } catch (err) {
      baoLoi(err);
    }
  }

  async function xoa() {
    if (!confirm("Xoá hẳn hóa đơn này? Sinh lại được từ chỉ số của kỳ.")) return;

    try {
      await invoicesApi.remove(id);
      baoThanhCong("Đã xoá hóa đơn.");
      navigate("/hoa-don");
    } catch (err) {
      baoLoi(err);
    }
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>
          {invoice ? `${invoice.ma_hoa_don} — ${invoice.ten_phong}` : "Hóa đơn"}
        </Title>
        <Button variant="subtle" component={Link} to="/hoa-don">
          ← Danh sách
        </Button>
      </Group>

      <PageState loading={loading} error={error}>
        {invoice && (
          <Stack>
            <Group>
              <Text c="dimmed">{nhanKy(invoice.ky)}</Text>
              <TrangThaiBadge value={invoice.trang_thai} />
              <Text c="dimmed" size="sm">
                Tạo ngày {ngay(invoice.ngay_tao)}
              </Text>
            </Group>

            <InvoiceLines invoice={invoice} />

            <Card withBorder padding="md">
              <Stack gap="sm">
                <Text fw={500}>Phí khác</Text>
                <Group align="flex-end">
                  <NumberInput
                    value={phiKhac}
                    onChange={setPhiKhac}
                    min={0}
                    step={10000}
                    thousandSeparator="."
                    decimalSeparator=","
                    w={200}
                  />
                  <Button variant="light" onClick={luuPhiKhac}>
                    Lưu
                  </Button>
                </Group>
                <Text size="xs" c="dimmed">
                  Đơn giá điện/nước không sửa được — giá đã chốt lúc phát hành. Nếu sai giá, xoá hóa
                  đơn rồi sinh lại.
                </Text>
              </Stack>
            </Card>

            <PaymentsCard invoice={invoice} onChanged={reload} />

            <Group>
              {invoice.trang_thai !== "huy" && (
                <Button variant="light" color="orange" onClick={huy}>
                  Huỷ hóa đơn
                </Button>
              )}
              <Button variant="subtle" color="red" onClick={xoa}>
                Xoá hóa đơn
              </Button>
            </Group>
          </Stack>
        )}
      </PageState>
    </Stack>
  );
}

function PaymentsCard({
  invoice,
  onChanged,
}: {
  invoice: InvoiceDetail;
  onChanged: () => void;
}) {
  const [soTien, setSoTien] = useState<number | string>(invoice.con_lai);
  const [ngayTt, setNgayTt] = useState(homNay());
  const [phuongThuc, setPhuongThuc] = useState<string | null>("chuyen_khoan");
  const [ghiChu, setGhiChu] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => setSoTien(invoice.con_lai), [invoice.con_lai]);

  async function thu() {
    setBusy(true);

    try {
      await invoicesApi.pay(invoice.id, {
        so_tien: Number(soTien),
        ngay_tt: ngayTt,
        phuong_thuc: phuongThuc ?? "chuyen_khoan",
        ghi_chu: ghiChu || null,
      });
      baoThanhCong("Đã ghi nhận thanh toán.");
      setGhiChu("");
      onChanged();
    } catch (err) {
      baoLoi(err);
    } finally {
      setBusy(false);
    }
  }

  async function xoaPayment(paymentId: number) {
    if (!confirm("Xoá khoản thu này?")) return;

    try {
      await invoicesApi.removePayment(paymentId);
      baoThanhCong("Đã xoá khoản thu.");
      onChanged();
    } catch (err) {
      baoLoi(err);
    }
  }

  return (
    <Card withBorder padding="md">
      <Stack>
        <Text fw={500}>Thanh toán</Text>

        {invoice.payments.length > 0 && (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Ngày</Table.Th>
                <Table.Th>Số tiền</Table.Th>
                <Table.Th>Hình thức</Table.Th>
                <Table.Th>Ghi chú</Table.Th>
                <Table.Th />
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
                  <Table.Td>{payment.ghi_chu ?? "—"}</Table.Td>
                  <Table.Td>
                    <Button
                      size="xs"
                      variant="subtle"
                      color="red"
                      onClick={() => xoaPayment(payment.id)}
                    >
                      Xoá
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}

        {invoice.trang_thai === "huy" ? (
          <Text c="dimmed">Hóa đơn đã huỷ, không ghi nhận thêm thanh toán.</Text>
        ) : (
          <Group align="flex-end" wrap="wrap">
            <NumberInput
              label="Số tiền"
              value={soTien}
              onChange={setSoTien}
              min={0}
              step={100000}
              thousandSeparator="."
              decimalSeparator=","
              w={180}
            />
            <TextInput
              type="date"
              label="Ngày thu"
              value={ngayTt}
              onChange={(e) => setNgayTt(e.currentTarget.value)}
              w={160}
            />
            <Select
              label="Hình thức"
              value={phuongThuc}
              onChange={setPhuongThuc}
              data={[
                { value: "chuyen_khoan", label: "Chuyển khoản" },
                { value: "tien_mat", label: "Tiền mặt" },
              ]}
              w={160}
            />
            <TextInput
              label="Ghi chú"
              value={ghiChu}
              onChange={(e) => setGhiChu(e.currentTarget.value)}
              flex={1}
              miw={160}
            />
            <Button onClick={thu} loading={busy}>
              Ghi nhận
            </Button>
          </Group>
        )}
      </Stack>
    </Card>
  );
}
