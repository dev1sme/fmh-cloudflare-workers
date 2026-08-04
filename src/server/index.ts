import { Hono } from "hono";

const app = new Hono<{ Bindings: Env }>();

app.get("/api/health", async (c) => {
  const row = await c.env.DB.prepare("SELECT COUNT(*) AS rooms FROM rooms").first<{
    rooms: number;
  }>();

  return c.json({ ok: true, rooms: row?.rooms ?? 0 });
});

app.notFound((c) => c.json({ error: "not_found" }, 404));

export default app;
