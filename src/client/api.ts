export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code);
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  const body = (await res.json().catch(() => null)) as (T & { error?: string }) | null;

  if (!res.ok) {
    throw new ApiError(res.status, body?.error ?? `http_${res.status}`);
  }

  return body as T;
}

export type SessionUser = { id: number; username: string };

export const auth = {
  me: () => api<{ user: SessionUser }>("/api/auth/me"),
  login: (username: string, password: string) =>
    api<{ user: SessionUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  logout: () => api<{ ok: true }>("/api/auth/logout", { method: "POST" }),
};
