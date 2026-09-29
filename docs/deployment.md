# Cấu hình & deploy

## `wrangler.toml`

```toml
name = "nha-tro"
main = "./src/server/index.ts"

routes = [{ pattern = "rentals.dev1sme.cloud", custom_domain = true }]

[secrets]
required = ["JWT_SECRET", "SEPAY_WEBHOOK_SECRET", "BOT_ENCRYPTION_KEY"]

[assets]
not_found_handling = "single-page-application"   # route không khớp asset -> index.html (200)
run_worker_first = ["/api/*", "/hooks/*"]        # chỉ hai prefix này vào Worker
# Không khai báo `directory`: vite-plugin tự trỏ vào output build của client.

[[d1_databases]]
binding = "DB"
database_name = "nha-tro"
migrations_dir = "./migrations"
```

`run_worker_first` quyết định route nào **tồn tại**: đường dẫn không có trong danh sách không bao giờ chạy route mà nhận `index.html`. Thêm một prefix mới ngoài `/api` là phải thêm vào đây. Sửa `wrangler.toml` xong thì chạy lại `npm run cf-typegen`.

## Secrets

**Repo GitHub là public.** Mọi thứ commit đều ai cũng đọc được — vì vậy `.dev.vars` bị gitignore, và không token, khoá hay mật khẩu nào được nằm trong `.dev.vars.example`, tài liệu, hay comment. Kiểm trước khi thêm bất cứ thứ gì định danh một người hoặc cấp quyền một hành động.

Đặt bằng `wrangler secret put`, không bao giờ commit:

| Secret | Dùng cho |
|---|---|
| `JWT_SECRET` | ký / kiểm JWT phiên đăng nhập |
| `SEPAY_WEBHOOK_SECRET` | **Secret Key** trong phần webhook của SePay; ký HMAC mà webhook kiểm (→ [payments.md](payments.md)) |
| `BOT_ENCRYPTION_KEY` | 32 byte base64 (`openssl rand -base64 32`), mã hoá token bot trong `bots.token`. Chưa đặt thì route bot trả 503. **Xoay khoá không mã hoá lại dòng cũ** — mọi token bot phải nhập lại trong Thông báo — nên coi như vĩnh viễn (→ [notifications.md](notifications.md)) |

Ba biến `ZALO_*` **đã bỏ** — bot, group người thuê và chat quản lý giờ là dòng trong `bots` / `bot_targets`.

Local: cùng các giá trị nằm trong `.dev.vars` (gitignore; `.dev.vars.example` là template commit). Vite plugin copy `.dev.vars` vào `dist/nha_tro/` để `vite preview` chạy được — đó là output build, gitignore, không phục vụ cho trình duyệt, nhưng nghĩa là `dist/` chứa secret thật trên đĩa.

### `[secrets] required`

- Thiếu tên nào thì `vite build` in `▲ WARNING Missing required secrets: …` — đã quan sát thấy. `wrangler deploy` có **từ chối** hay không thì **chưa từng được kiểm**; coi danh sách là lời nhắc to, không phải cổng chặn, cho tới khi có người deploy thiếu một tên và báo lại.
- **Danh sách này cũng quyết định secret nào vào `c.env` ở dev local.** Vite plugin dùng nó để chọn thứ copy từ `.dev.vars` sang `dist/nha_tro/`; secret không có trong danh sách chỉ đơn giản là `undefined` lúc runtime, không cảnh báo gì. Một route webhook từng bị debug khá lâu vì một 503 hoá ra đúng là do chuyện này. **Thêm mọi secret mới vào đây.**

## Chạy local

Yêu cầu: Node.js LTS. Database D1 `nha-tro` đã tạo sẵn, `database_id` nằm trong `wrangler.toml`.

```bash
npm install
npm run cf-typegen          # sinh worker-configuration.d.ts (gitignore) — cần trước typecheck
npm run db:migrate          # migration lên D1 local
npm run dev                 # http://localhost:5173
```

Tài khoản đầu tiên: xem `hash-password` trong [auth.md](auth.md).

> `npx` không dùng được trong môi trường này (bị hook viết lại thành `npm`). Gọi qua npm script hoặc `./node_modules/.bin/<bin>`.

## Deploy

```bash
npm run db:migrate:remote   # migration lên D1 remote
npm run deploy              # build + wrangler deploy
```

Sau khi migrate remote, kiểm bằng bảng chứ không bằng thư mục: `SELECT COUNT(*) FROM d1_migrations` phải bằng số file trong `migrations/`. Từng có lần remote chậm bốn migration trong khi thư mục trông đủ — mọi lệnh ghi trên production trả 500.

`wrangler d1 migrations apply --remote` từng fail với `code 7403` ("account is not authorized") rồi thành công ngay khi thử lại mà không đổi gì. Thử lại trước khi tin.

### Domain

Domain khai báo ngay trong `wrangler.toml`, không cần vào dashboard. `wrangler deploy` tự tạo DNS record trong zone và cấp HTTPS.

- Khi đã có `routes`, Cloudflare **tắt** URL `*.workers.dev` — có chủ đích; muốn có URL dự phòng thì thêm `workers_dev = true`.
- Wrangler tạo DNS record cho custom domain nhưng **không xoá** khi bỏ route — đổi domain thì dọn record cũ bằng tay.

Bản đang chạy: **https://rentals.dev1sme.cloud**. Trước đây là `fmh.dev1sme.cloud` — hostname đó bị bỏ hẳn chứ không giữ song song, để link cũ fail rõ ràng thay vì âm thầm cũ đi. `FMH` là tên một toà nhà (một dòng trong `buildings`), không phải tên sản phẩm.

### Kiểm tra sau deploy

Sau mọi thay đổi về auth hay băm mật khẩu:

```bash
./node_modules/.bin/wrangler tail nha-tro --format json    # cpuTime từng request
```

Cách lấy mẫu và bảng số đo → [auth.md](auth.md#số-vòng-pbkdf2).

## Chi phí

App nằm gọn trong hạn mức miễn phí của Cloudflare:

- Workers: 100.000 request/ngày, **10 ms CPU/request** — đây là giới hạn thật sự siết.
- D1: 5 GB lưu trữ, ~5 triệu dòng đọc/ngày, ~100 nghìn dòng ghi/ngày.

Mỗi tháng chỉ ghi thêm vài chục dòng, nên gần như không thể chạm trần. Thời gian chờ D1 không tính vào CPU, nên gộp query vào một `db.batch()` là miễn phí ở đúng hạn mức đang siết — `/api/dashboard` chạy sáu câu vẫn chỉ 1–2 ms CPU.

Không thêm hạ tầng (queue, KV, Durable Objects, dịch vụ ngoài) khi chưa có nhu cầu cụ thể.

`npm audit` báo lỗ hổng trong `undici` đi qua `miniflare`/`wrangler`. Đó là toolchain dev local, không gì trong đó được ship lên Worker; đừng "sửa" bằng cách hạ `@cloudflare/vite-plugin`.
