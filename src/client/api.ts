import type {
  Building,
  GenerateResult,
  Invoice,
  InvoiceDetail,
  InvoiceWithRoom,
  Payment,
  Reading,
  ReadingDetail,
  RoomDetail,
  Tenant,
  TenantDetail,
} from "../shared/types";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  const body = (await res.json().catch(() => null)) as (T & { error?: string }) | null;

  if (!res.ok) throw new ApiError(res.status, body?.error ?? `http_${res.status}`);
  return body as T;
}

const send = <T>(method: string, path: string, body?: unknown) =>
  request<T>(path, { method, body: body === undefined ? undefined : JSON.stringify(body) });

export type SessionUser = {
  id: number;
  username: string;
  vai_tro: "quan_ly" | "nguoi_thue";
  room_id: number | null;
};

export const auth = {
  me: () => request<{ user: SessionUser }>("/api/auth/me"),
  login: (username: string, password: string) =>
    send<{ user: SessionUser }>("POST", "/api/auth/login", { username, password }),
  logout: () => send<{ ok: true }>("POST", "/api/auth/logout"),
};

export type BuildingInput = {
  name: string;
  address: string | null;
  don_gia_dien: number;
  don_gia_nuoc: number;
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
  ten_phong: string;
  gia_phong: number;
  dien_tich: number | null;
};

export const rooms = {
  list: () => request<{ rooms: RoomDetail[] }>("/api/rooms"),
  create: (input: RoomInput) => send<{ room: RoomDetail }>("POST", "/api/rooms", input),
  update: (id: number, patch: Partial<RoomInput>) =>
    send<{ room: RoomDetail }>("PATCH", `/api/rooms/${id}`, patch),
  remove: (id: number) => send<{ ok: true }>("DELETE", `/api/rooms/${id}`),
};

export type TenantInput = {
  room_id: number;
  ho_ten: string;
  sdt: string | null;
  so_nguoi: number;
  ngay_vao: string;
};

export type TenantPatch = Partial<Omit<TenantInput, "room_id">> & {
  /** A date moves them out; null brings them back as the current tenant. */
  ngay_ra?: string | null;
};

export const tenants = {
  list: (params: { room_id?: number; dang_thue?: 1 } = {}) =>
    request<{ tenants: TenantDetail[] }>(`/api/tenants${query(params)}`),
  create: (input: TenantInput) => send<{ tenant: Tenant }>("POST", "/api/tenants", input),
  update: (id: number, patch: TenantPatch) =>
    send<{ tenant: Tenant }>("PATCH", `/api/tenants/${id}`, patch),
  remove: (id: number) => send<{ ok: true }>("DELETE", `/api/tenants/${id}`),
};

export type ReadingInput = {
  room_id: number;
  ky: string;
  dien_cu?: number;
  dien_moi: number;
  nuoc_cu?: number;
  nuoc_moi: number;
  ngay_ghi?: string;
};

export const readings = {
  list: (params: { ky?: string; room_id?: number } = {}) =>
    request<{ readings: ReadingDetail[] }>(`/api/readings${query(params)}`),
  suggest: (roomId: number, ky: string) =>
    request<{ dien_cu: number; nuoc_cu: number; ky_truoc: string | null }>(
      `/api/readings/goi-y?room_id=${roomId}&ky=${ky}`,
    ),
  create: (input: ReadingInput) => send<{ reading: Reading }>("POST", "/api/readings", input),
  update: (id: number, patch: Partial<Omit<ReadingInput, "room_id" | "ky">>) =>
    send<{ reading: Reading }>("PATCH", `/api/readings/${id}`, patch),
  remove: (id: number) => send<{ ok: true }>("DELETE", `/api/readings/${id}`),
};

export const invoices = {
  list: (params: { ky?: string; room_id?: number; trang_thai?: string } = {}) =>
    request<{ invoices: InvoiceWithRoom[] }>(`/api/invoices${query(params)}`),
  get: (id: number) => request<{ invoice: InvoiceDetail }>(`/api/invoices/${id}`),
  generate: (ky: string, roomIds?: number[]) =>
    send<GenerateResult>("POST", "/api/invoices/generate", { ky, room_ids: roomIds }),
  update: (id: number, patch: { phi_khac?: number; tien_phong?: number; trang_thai?: string }) =>
    send<{ invoice: Invoice }>("PATCH", `/api/invoices/${id}`, patch),
  remove: (id: number) => send<{ ok: true }>("DELETE", `/api/invoices/${id}`),
  pay: (
    id: number,
    input: { so_tien: number; ngay_tt?: string; phuong_thuc?: string; ghi_chu?: string | null },
  ) => send<{ payment: Payment; invoice: Invoice }>("POST", `/api/invoices/${id}/payments`, input),
  removePayment: (paymentId: number) => send<{ ok: true }>("DELETE", `/api/payments/${paymentId}`),
};

/** Tenant-facing endpoints; the room is taken from the session, never sent. */
export const me = {
  room: () => request<{ room: RoomDetail }>("/api/me/phong"),
  invoices: () => request<{ invoices: InvoiceWithRoom[] }>("/api/me/invoices"),
  invoice: (id: number) => request<{ invoice: InvoiceDetail }>(`/api/me/invoices/${id}`),
  readings: () => request<{ readings: ReadingDetail[] }>("/api/me/readings"),
};

function query(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== "");
  if (entries.length === 0) return "";

  return `?${entries.map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`).join("&")}`;
}
