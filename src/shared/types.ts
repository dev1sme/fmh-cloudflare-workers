/** Shapes exchanged by the API. Field names follow the D1 schema. */

export type Building = {
  id: number;
  name: string;
  address: string | null;
  don_gia_dien: number;
  don_gia_nuoc: number;
  /** NAPAS bank id, account and holder for VietQR. Null until configured. */
  bank_bin: string | null;
  bank_so_tk: string | null;
  bank_chu_tk: string | null;
  /** Optional MoMo wallet, shown as text alongside the VietQR code. */
  momo_sdt: string | null;
  momo_ten: string | null;
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

/** What the tenant needs to pay: the QR payload plus the same data as text. */
export type ChuyenKhoan = {
  /** EMVCo/NAPAS payload — render it as a QR, do not display it. */
  vietqr: string;
  bank_bin: string;
  bank_so_tk: string;
  bank_chu_tk: string | null;
  noi_dung: string;
  so_tien: number;
};

/**
 * MoMo alternative. Text only, no QR: MoMo's personal QR payload format is not
 * verified, and a guessed one could send money to the wrong wallet.
 */
export type MomoInfo = {
  sdt: string;
  ten: string | null;
  so_tien: number;
  noi_dung: string;
};

export type InvoiceDetail = InvoiceWithRoom & {
  da_thu: number;
  con_lai: number;
  reading: Reading | null;
  payments: Payment[];
  /** Null when the building has no bank details, or nothing is left to pay. */
  chuyen_khoan: ChuyenKhoan | null;
  /** Null when MoMo is not configured, or nothing is left to pay. */
  momo: MomoInfo | null;
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

/** Whether a room can be invoiced for a period, and why not when it cannot. */
export type SinhTrangThai = "san_sang" | "thieu_chi_so" | "da_co_hoa_don";

/**
 * The amounts generation would bill a room, computed without writing anything.
 * Same shape the invoice would be stored with, plus the consumption behind it.
 */
export type TamTinhHoaDon = Pick<
  Invoice,
  | "tien_phong"
  | "tien_dien"
  | "tien_nuoc"
  | "phi_khac"
  | "don_gia_dien"
  | "don_gia_nuoc"
  | "tong_tien"
> & {
  so_dien: number;
  so_nuoc: number;
};

/** One room in the generation preview, before the manager picks anything. */
export type GenerationPreviewRoom = {
  room_id: number;
  ten_phong: string;
  building_id: number;
  building_name: string;
  trang_thai: SinhTrangThai;
  /** Null while the period has no reading for the room. */
  tam_tinh: TamTinhHoaDon | null;
  /** Set when the room already has an invoice for the period. */
  invoice_id: number | null;
};

/** Result of GET /api/invoices/generate-preview. */
export type GeneratePreview = {
  ky: string;
  phong: GenerationPreviewRoom[];
};
