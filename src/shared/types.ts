/** Shapes exchanged by the API. Field names follow the D1 schema. */

/**
 * Every API response is wrapped in an envelope — see
 * `.claude/rules/envelop-conventions.md`. `success` is what a client branches
 * on; `data` carries the payload, `error.code` the stable failure contract.
 */
export type ApiMeta = {
  /** Unix seconds. Must be a number, never a string. */
  timestamp: number;
};

export type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
  meta: ApiMeta;
};

export type ApiFailure = {
  success: false;
  message: string;
  error: {
    /** Stable machine-readable code, e.g. `trung_du_lieu`. The client maps it. */
    code: string;
    /** Field-keyed validation messages; null for everything else. */
    details: Record<string, string[]> | null;
  };
  meta: ApiMeta;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type Building = {
  id: number;
  name: string;
  address: string | null;
  electricity_rate: number;
  water_rate: number;
  /** NAPAS bank id, account and holder for VietQR. Null until configured. */
  bank_bin: string | null;
  bank_account_no: string | null;
  bank_account_name: string | null;
  /** Optional MoMo wallet, shown as text alongside the VietQR code. */
  momo_phone: string | null;
  momo_name: string | null;
};

export type Room = {
  id: number;
  building_id: number;
  room_name: string;
  rent: number;
  area: number | null;
};

export type RoomDetail = Room & {
  building_name: string;
  electricity_rate: number;
  water_rate: number;
  /** Whoever lives there now (moved_out IS NULL), if anyone. */
  tenant: Tenant | null;
};

export type Tenant = {
  id: number;
  room_id: number;
  full_name: string;
  phone: string | null;
  /** People actually living in the room; only `full_name` signs the tenancy. */
  occupants: number;
  moved_in: string;
  /** NULL while still renting. */
  moved_out: string | null;
};

export type TenantDetail = Tenant & {
  room_name: string;
};

export type Reading = {
  id: number;
  room_id: number;
  period: string;
  electricity_start: number;
  electricity_end: number;
  water_start: number;
  water_end: number;
  recorded_on: string;
};

export type ReadingDetail = Reading & {
  room_name: string;
  electricity_used: number;
  water_used: number;
};

export type InvoiceStatus = "UNPAID" | "PAID" | "CANCELLED";

export type Invoice = {
  id: number;
  room_id: number;
  period: string;
  rent_amount: number;
  electricity_amount: number;
  water_amount: number;
  other_fees: number;
  electricity_rate: number;
  water_rate: number;
  total: number;
  status: InvoiceStatus;
  created_at: string;
};

/** What list endpoints return: the invoice plus the room it belongs to. */
export type InvoiceWithRoom = Invoice & {
  room_name: string;
  /** Code shown to tenants and carried in the transfer memo, e.g. HD00123. */
  invoice_code: string;
};

/** What the tenant needs to pay: the QR payload plus the same data as text. */
export type BankTransfer = {
  /** EMVCo/NAPAS payload — render it as a QR, do not display it. */
  vietqr: string;
  bank_bin: string;
  bank_account_no: string;
  bank_account_name: string | null;
  transfer_note: string;
  amount: number;
};

/**
 * MoMo alternative. Text only, no QR: MoMo's personal QR payload format is not
 * verified, and a guessed one could send money to the wrong wallet.
 */
export type MomoInfo = {
  phone: string;
  name: string | null;
  amount: number;
  transfer_note: string;
};

export type InvoiceDetail = InvoiceWithRoom & {
  paid: number;
  outstanding: number;
  reading: Reading | null;
  payments: Payment[];
  /** Null when the building has no bank details, or nothing is left to pay. */
  bank_transfer: BankTransfer | null;
  /** Null when MoMo is not configured, or nothing is left to pay. */
  momo: MomoInfo | null;
};

export type PaymentMethod = "BANK_TRANSFER" | "CASH";

export type Payment = {
  id: number;
  invoice_id: number;
  amount: number;
  paid_on: string;
  method: PaymentMethod;
  note: string | null;
};

export type Role = "MANAGER" | "TENANT";

/** An account as the management screen sees it — never carries a password. */
export type Account = {
  id: number;
  username: string;
  role: Role;
  room_id: number | null;
  room_name: string | null;
};

/** Result of POST /api/invoices/generate. */
export type GenerateResult = {
  created: Invoice[];
  skipped: Array<{
    room_id: number;
    room_name: string;
    reason: "MISSING_READING" | "ALREADY_INVOICED";
  }>;
};

/** Whether a room can be invoiced for a period, and why not when it cannot. */
export type GenerationStatus = "READY" | "MISSING_READING" | "ALREADY_INVOICED";

/**
 * The amounts generation would bill a room, computed without writing anything.
 * Same shape the invoice would be stored with, plus the consumption behind it.
 */
export type InvoiceEstimate = Pick<
  Invoice,
  | "rent_amount"
  | "electricity_amount"
  | "water_amount"
  | "other_fees"
  | "electricity_rate"
  | "water_rate"
  | "total"
> & {
  electricity_used: number;
  water_used: number;
};

/** One room in the generation preview, before the manager picks anything. */
export type PreviewRoom = {
  room_id: number;
  room_name: string;
  building_id: number;
  building_name: string;
  status: GenerationStatus;
  /** Null while the period has no reading for the room. */
  estimate: InvoiceEstimate | null;
  /** Set when the room already has an invoice for the period. */
  invoice_id: number | null;
};

/** Result of GET /api/invoices/generate-preview. */
export type GeneratePreview = {
  period: string;
  rooms: PreviewRoom[];
};

/**
 * Manager dashboard, `GET /api/dashboard?period=`.
 *
 * A read-only rollup, not a mirror of any table — so its fields are English
 * even while the columns underneath are still Vietnamese. Money is VND
 * integers like everywhere else.
 */
export type DashboardRevenue = {
  /** Everything invoiced for the period, cancelled invoices excluded. */
  billed: number;
  collected: number;
  /** `billed - collected`, never negative. */
  outstanding: number;
  counts: { unpaid: number; paid: number; cancelled: number };
};

/** One room that still owes money, across every period, worst first. */
export type DashboardDebt = {
  room_id: number;
  room_name: string;
  amount: number;
  invoice_count: number;
  oldest_period: string;
};

export type DashboardRooms = {
  total: number;
  occupied: number;
  vacant: number;
  /** People living in occupied rooms — the sum of `tenants.occupants`. */
  occupants: number;
  /** Rooms with no meter reading for the period yet. */
  missing_readings: number;
};

export type DashboardUsage = {
  electricity: number;
  water: number;
  electricity_previous: number;
  water_previous: number;
};

/** Newest last, so a bar chart reads left to right. */
export type DashboardHistoryPoint = {
  period: string;
  billed: number;
  collected: number;
};

export type Dashboard = {
  period: string;
  revenue: DashboardRevenue;
  debts: DashboardDebt[];
  rooms: DashboardRooms;
  usage: DashboardUsage;
  history: DashboardHistoryPoint[];
};

/**
 * One month as the tenant sees it, `GET /api/me/dashboard`.
 *
 * A month can exist with a reading but no invoice yet (the manager has not
 * generated it), so the invoice half is nullable while the meter half is not
 * — a row is only listed when at least one of the two exists.
 */
export type TenantMonth = {
  period: string;
  electricity_used: number | null;
  water_used: number | null;
  /** Null until the manager generates the invoice for this period. */
  total: number | null;
  paid: number;
  outstanding: number;
  status: InvoiceStatus | null;
};

export type TenantDashboard = {
  room_name: string;
  /** Newest first — the tenant looks at this month, not two years ago. */
  months: TenantMonth[];
  /** Across every period, cancelled invoices excluded. */
  outstanding_total: number;
};
