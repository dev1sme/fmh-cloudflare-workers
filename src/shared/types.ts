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
  ngay_vao: string;
  ngay_ra: string | null;
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

export type InvoiceDetail = Invoice & {
  ten_phong: string;
  /** Code shown to tenants and carried in the transfer memo, e.g. HD00123. */
  ma_hoa_don: string;
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

/** Result of POST /api/invoices/generate. */
export type GenerateResult = {
  created: Invoice[];
  skipped: Array<{
    room_id: number;
    ten_phong: string;
    reason: "thieu_chi_so" | "da_co_hoa_don";
  }>;
};
