import type {
  Account,
  ApiFailure,
  ApiResponse,
  Building,
  Dashboard,
  GeneratePreview,
  GenerateResult,
  Invoice,
  InvoiceDetail,
  InvoiceWithRoom,
  Payment,
  Reading,
  ReadingDetail,
  RoomDetail,
  Tenant,
  TenantDashboard,
  TenantDetail,
} from "../shared/types";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    /** Field-keyed validation codes, when the failure names fields. */
    readonly details: ApiFailure["error"]["details"] = null,
  ) {
    super(code);
  }
}

/**
 * Unwraps the response envelope (`.claude/rules/envelop-conventions.md`).
 *
 * `T` is the shape inside `data`, which is the same object the routes always
 * returned (`{ invoices }`, `{ room }`, …) — so every caller below is unchanged
 * by the envelope. A non-2xx, a `success: false`, or a body that is not JSON
 * all end up as one ApiError carrying the code the UI maps to Vietnamese.
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  const body = (await res.json().catch(() => null)) as ApiResponse<T> | null;

  if (!res.ok || !body || body.success !== true) {
    const failure = body && body.success === false ? body.error : null;
    throw new ApiError(res.status, failure?.code ?? `http_${res.status}`, failure?.details ?? null);
  }

  return body.data;
}

const send = <T>(method: string, path: string, body?: unknown) =>
  request<T>(path, { method, body: body === undefined ? undefined : JSON.stringify(body) });

export type SessionUser = {
  id: number;
  username: string;
  role: "MANAGER" | "TENANT";
  room_id: number | null;
};

export const auth = {
  me: () => request<{ user: SessionUser }>("/api/auth/me"),
  login: (username: string, password: string) =>
    send<{ user: SessionUser }>("POST", "/api/auth/login", { username, password }),
  logout: () => send<{ ok: true }>("POST", "/api/auth/logout"),
  doiMatKhau: (matKhauCu: string, matKhauMoi: string) =>
    send<{ ok: true }>("POST", "/api/auth/change-password", {
      mat_khau_cu: matKhauCu,
      mat_khau_moi: matKhauMoi,
    }),
};

export type BuildingInput = {
  name: string;
  address: string | null;
  electricity_rate: number;
  water_rate: number;
};

export type AccountInput = {
  username: string;
  role: "MANAGER" | "TENANT";
  room_id: number | null;
  /** Omit to have the server generate a strong one. */
  password?: string;
};

/**
 * `password` comes back only from create and reset, and only that once — it is
 * stored hashed and cannot be read back afterwards.
 */
export type AccountWithPassword = { account: Account; password: string };

export const accounts = {
  list: () => request<{ accounts: Account[] }>("/api/accounts"),
  create: (input: AccountInput) => send<AccountWithPassword>("POST", "/api/accounts", input),
  rename: (code: string, username: string) =>
    send<{ account: Account }>("PATCH", `/api/accounts/${code}`, { username }),
  resetPassword: (code: string, password?: string) =>
    send<AccountWithPassword>("POST", `/api/accounts/${code}/reset-password`, { password }),
  remove: (code: string) => send<{ ok: true }>("DELETE", `/api/accounts/${code}`),
};

export const dashboard = {
  /** Omit `period` for the current month. */
  get: (period?: string) => request<Dashboard>(`/api/dashboard${query({ period })}`),
};

export const buildings = {
  list: () => request<{ buildings: Building[] }>("/api/buildings"),
  create: (input: BuildingInput) => send<{ building: Building }>("POST", "/api/buildings", input),
  update: (id: number, patch: Partial<BuildingInput>) =>
    send<{ building: Building }>("PATCH", `/api/buildings/${id}`, patch),
  remove: (id: number) => send<{ ok: true }>("DELETE", `/api/buildings/${id}`),
};

export type RoomInput = {
  building_id: number;
  room_name: string;
  rent: number;
  area: number | null;
};

export const rooms = {
  list: () => request<{ rooms: RoomDetail[] }>("/api/rooms"),
  create: (input: RoomInput) => send<{ room: RoomDetail }>("POST", "/api/rooms", input),
  update: (code: string, patch: Partial<RoomInput>) =>
    send<{ room: RoomDetail }>("PATCH", `/api/rooms/${code}`, patch),
  remove: (code: string) => send<{ ok: true }>("DELETE", `/api/rooms/${code}`),
};

export type TenantInput = {
  room_id: number;
  full_name: string;
  phone: string | null;
  occupants: number;
  moved_in: string;
};

export type TenantPatch = Partial<Omit<TenantInput, "room_id">> & {
  /** A date moves them out; null brings them back as the current tenant. */
  moved_out?: string | null;
};

export const tenants = {
  list: (params: { room_id?: number; active?: 1 } = {}) =>
    request<{ tenants: TenantDetail[] }>(`/api/tenants${query(params)}`),
  create: (input: TenantInput) => send<{ tenant: Tenant }>("POST", "/api/tenants", input),
  update: (code: string, patch: TenantPatch) =>
    send<{ tenant: Tenant }>("PATCH", `/api/tenants/${code}`, patch),
  remove: (code: string) => send<{ ok: true }>("DELETE", `/api/tenants/${code}`),
};

export type ReadingInput = {
  room_id: number;
  period: string;
  electricity_start?: number;
  electricity_end: number;
  water_start?: number;
  water_end: number;
  recorded_on?: string;
};

export const readings = {
  list: (params: { period?: string; room_id?: number } = {}) =>
    request<{ readings: ReadingDetail[] }>(`/api/readings${query(params)}`),
  suggest: (roomId: number, period: string) =>
    request<{ electricity_start: number; water_start: number; previous_period: string | null }>(
      `/api/readings/suggest?room_id=${roomId}&period=${period}`,
    ),
  create: (input: ReadingInput) => send<{ reading: Reading }>("POST", "/api/readings", input),
  update: (code: string, patch: Partial<Omit<ReadingInput, "room_id" | "period">>) =>
    send<{ reading: Reading }>("PATCH", `/api/readings/${code}`, patch),
  remove: (code: string) => send<{ ok: true }>("DELETE", `/api/readings/${code}`),
};

export const invoices = {
  list: (params: { period?: string; room_id?: number; status?: string } = {}) =>
    request<{ invoices: InvoiceWithRoom[] }>(`/api/invoices${query(params)}`),
  get: (code: string) => request<{ invoice: InvoiceDetail }>(`/api/invoices/${code}`),
  /** What generation would produce for a period. Writes nothing. */
  preview: (period: string) => request<GeneratePreview>(`/api/invoices/generate-preview?period=${period}`),
  /** Omit `roomIds` to bill every room. */
  generate: (period: string, roomIds?: number[]) =>
    send<GenerateResult>("POST", "/api/invoices/generate", { period, room_ids: roomIds }),
  update: (code: string, patch: { other_fees?: number; rent_amount?: number; status?: string }) =>
    send<{ invoice: Invoice }>("PATCH", `/api/invoices/${code}`, patch),
  remove: (code: string) => send<{ ok: true }>("DELETE", `/api/invoices/${code}`),
  pay: (
    code: string,
    input: { amount: number; paid_on?: string; method?: string; note?: string | null },
  ) => send<{ payment: Payment; invoice: Invoice }>("POST", `/api/invoices/${code}/payments`, input),
  removePayment: (paymentCode: string) =>
    send<{ ok: true }>("DELETE", `/api/payments/${paymentCode}`),
};

/** Tenant-facing endpoints; the room is taken from the session, never sent. */
export const me = {
  dashboard: () => request<TenantDashboard>("/api/me/dashboard"),
  room: () => request<{ room: RoomDetail }>("/api/me/room"),
  invoices: () => request<{ invoices: InvoiceWithRoom[] }>("/api/me/invoices"),
  invoice: (code: string) => request<{ invoice: InvoiceDetail }>(`/api/me/invoices/${code}`),
  readings: () => request<{ readings: ReadingDetail[] }>("/api/me/readings"),
};

function query(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== "");
  if (entries.length === 0) return "";

  return `?${entries.map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`).join("&")}`;
}
