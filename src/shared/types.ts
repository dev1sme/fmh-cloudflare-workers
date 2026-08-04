/** Shapes exchanged by the API. Field names follow the D1 schema. */

export type Building = {
  id: number;
  name: string;
  address: string | null;
  don_gia_dien: number;
  don_gia_nuoc: number;
};

export type Room = {
  id: number;
  building_id: number;
  ten_phong: string;
  gia_phong: number;
  dien_tich: number | null;
};

export type RoomDetail = Room & {
  building_name: string;
  don_gia_dien: number;
  don_gia_nuoc: number;
  /** Whoever lives there now (ngay_ra IS NULL), if anyone. */
  tenant: Tenant | null;
};

export type Tenant = {
  id: number;
  room_id: number;
  ho_ten: string;
  sdt: string | null;
  /** People actually living in the room; only `ho_ten` signs the tenancy. */
  so_nguoi: number;
  ngay_vao: string;
  /** NULL while still renting. */
  ngay_ra: string | null;
};

export type TenantDetail = Tenant & {
  ten_phong: string;
};

export type Reading = {
  id: number;
  room_id: number;
  ky: string;
  dien_cu: number;
  dien_moi: number;
  nuoc_cu: number;
  nuoc_moi: number;
  ngay_ghi: string;
};

export type ReadingDetail = Reading & {
  ten_phong: string;
  so_dien: number;
  so_nuoc: number;
};

export type InvoiceStatus = "chua_thanh_toan" | "da_thanh_toan" | "huy";

export type Invoice = {
  id: number;
  room_id: number;
  ky: string;
  tien_phong: number;
  tien_dien: number;
  tien_nuoc: number;
  phi_khac: number;
  don_gia_dien: number;
  don_gia_nuoc: number;
  tong_tien: number;
  trang_thai: InvoiceStatus;
  ngay_tao: string;
};

/** What list endpoints return: the invoice plus the room it belongs to. */
export type InvoiceWithRoom = Invoice & {
  ten_phong: string;
  /** Code shown to tenants and carried in the transfer memo, e.g. HD00123. */
  ma_hoa_don: string;
};

export type InvoiceDetail = InvoiceWithRoom & {
  da_thu: number;
  con_lai: number;
  reading: Reading | null;
  payments: Payment[];
};

export type PaymentMethod = "chuyen_khoan" | "tien_mat";

export type Payment = {
  id: number;
  invoice_id: number;
  so_tien: number;
  ngay_tt: string;
  phuong_thuc: PaymentMethod;
  ghi_chu: string | null;
};

export type Role = "quan_ly" | "nguoi_thue";

/** An account as the management screen sees it — never carries a password. */
export type Account = {
  id: number;
  username: string;
  vai_tro: Role;
  room_id: number | null;
  ten_phong: string | null;
};

/** Result of POST /api/invoices/generate. */
export type GenerateResult = {
  created: Invoice[];
  skipped: Array<{
    room_id: number;
    ten_phong: string;
    reason: "thieu_chi_so" | "da_co_hoa_don";
  }>;
};
