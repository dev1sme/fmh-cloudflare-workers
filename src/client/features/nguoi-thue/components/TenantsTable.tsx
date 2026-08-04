import { Badge, Button, Group, Menu, Table, Text } from "@mantine/core";

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
  return (
    <Table.ScrollContainer minWidth={820}>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Phòng</Table.Th>
            <Table.Th>Người đứng tên</Table.Th>
            <Table.Th>Số điện thoại</Table.Th>
            <Table.Th>Số người ở</Table.Th>
            <Table.Th>Vào</Table.Th>
            <Table.Th>Ra</Table.Th>
            <Table.Th>Trạng thái</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {nguoiThue.map((tenant) => {
            const dangThue = tenant.ngay_ra === null;

            return (
              <Table.Tr key={tenant.id}>
                <Table.Td fw={500}>{tenant.ten_phong}</Table.Td>
                <Table.Td>{tenant.ho_ten}</Table.Td>
                <Table.Td>{tenant.sdt ?? "—"}</Table.Td>
                <Table.Td>{tenant.so_nguoi} người</Table.Td>
                <Table.Td>{ngay(tenant.ngay_vao)}</Table.Td>
                <Table.Td>{ngay(tenant.ngay_ra)}</Table.Td>
                <Table.Td>
                  <Badge color={dangThue ? "teal" : "gray"} variant="light">
                    {dangThue ? "Đang thuê" : "Đã chuyển đi"}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs" justify="flex-end" wrap="nowrap">
                    <Button size="xs" variant="light" onClick={() => onEdit(tenant)}>
                      Sửa
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
                            Ghi nhận chuyển đi
                          </Menu.Item>
                        ) : (
                          <Menu.Item onClick={() => onUndoMoveOut(tenant)}>
                            Huỷ chuyển đi
                          </Menu.Item>
                        )}
                        <Menu.Item color="red" onClick={() => onDelete(tenant)}>
                          Xoá bản ghi
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

      {nguoiThue.length === 0 && (
        <Text c="dimmed" py="md">
          Chưa có người thuê nào.
        </Text>
      )}
    </Table.ScrollContainer>
  );
}
