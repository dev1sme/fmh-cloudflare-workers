# Quản Lý Nhà Trọ

Ứng dụng web quản lý 2 căn nhà trọ: ghi số điện/nước hằng tháng, tính và thông báo hóa đơn (tiền phòng + điện + nước), cho người thuê xem hóa đơn và thanh toán qua VietQR, lưu lịch sử chỉ số công tơ.

Ứng dụng nội bộ, quy mô nhỏ — 3 tài khoản quản trị cố định, người thuê xem hóa đơn. Toàn bộ chạy trên nền serverless của Cloudflare và nằm gọn trong hạn mức miễn phí.

## Tính năng

- Quản lý nhà trọ, phòng, người thuê.
- Ghi chỉ số điện/nước theo từng kỳ (tháng); chỉ số cuối kỳ tự trở thành chỉ số đầu kỳ tháng sau.
- Tự sinh hóa đơn: `tiền điện = (điện mới − điện cũ) × đơn giá`, tương tự tiền nước, cộng tiền phòng và phí khác.
- Sinh mã VietQR cho từng hóa đơn để người thuê chuyển khoản.
- (Tùy chọn) Tự động xác nhận đã thanh toán qua webhook biến động số dư (SePay).
- Tra cứu lịch sử chỉ số công tơ và hóa đơn theo phòng.
- 3 tài khoản quản trị đăng nhập bằng mật khẩu.

## Kiến trúc & công nghệ

| Thành phần | Lựa chọn |
|---|---|
| Frontend | React + Vite (SPA) |
| Giao diện | Mantine (khuyến nghị cho app quản trị) — có thể thay bằng CSS Modules |
| API / Backend | Hono chạy trên Cloudflare Workers |
| Database | Cloudflare D1 (SQLite) |
| Đăng nhập | JWT không trạng thái (`jose`) đặt trong cookie `httpOnly`; băm mật khẩu bằng Web Crypto (PBKDF2) |
| Thanh toán | VietQR + webhook SePay (tùy chọn) |
| Deploy | Cloudflare Workers (qua Wrangler) |
| Ngôn ngữ | TypeScript |

Frontend build ra file tĩnh, được chính Worker phục vụ; các request `/api/*` do Hono xử lý. Cả frontend lẫn API gói trong **một Worker duy nhất**, một lần deploy. Hướng này cố ý không dùng Next.js/OpenNext để tránh bước cấu hình phức tạp.

## Cấu trúc thư mục (gợi ý)

```
.
├── src/
│   ├── client/          # React SPA (Vite)
│   │   ├── main.tsx
│   │   └── pages/
│   └── server/          # API Hono chạy trên Worker
│       ├── index.ts     # entry Worker: phục vụ static + route /api
│       ├── routes/      # rooms, readings, invoices, payments, auth, webhook
│       ├── auth.ts      # băm/verify mật khẩu, ký/verify JWT, middleware
│       └── db.ts        # truy vấn D1
├── migrations/          # file SQL tạo bảng cho D1
├── wrangler.toml        # cấu hình Worker + binding D1
├── vite.config.ts
└── package.json
```

## Mô hình dữ liệu

```
buildings   (id, name, address)
rooms       (id, building_id, ten_phong, gia_phong, dien_tich)
tenants     (id, room_id, ho_ten, sdt, ngay_vao)
readings    (id, room_id, ky /YYYY-MM/, dien_cu, dien_moi, nuoc_cu, nuoc_moi, ngay_ghi)
invoices    (id, room_id, ky, tien_phong, tien_dien, tien_nuoc, phi_khac,
             don_gia_dien, don_gia_nuoc, tong_tien, trang_thai, ngay_tao)
payments    (id, invoice_id, so_tien, ngay_tt, phuong_thuc, ghi_chu)
users       (id, username, password_hash)   -- 3 tài khoản cố định
```

Hai điểm cần lưu ý về thiết kế:

- **Lưu đơn giá điện/nước ngay trên `invoices`** (`don_gia_dien`, `don_gia_nuoc`), không tính động theo giá hiện tại. Khi giá thay đổi, hóa đơn cũ vẫn giữ đúng giá tại thời điểm phát hành.
- **`readings` chỉ lưu chỉ số công tơ**, tiền được tính ở `invoices`. Điều này giữ lịch sử chỉ số sạch và cho phép tự động điền chỉ số đầu kỳ từ kỳ trước.

## Yêu cầu

- Node.js (bản LTS)
- Tài khoản Cloudflare (domain đã quản lý tại Cloudflare)
- Wrangler CLI: `npm install -D wrangler`

## Cài đặt & chạy local

```bash
# 1. Cài phụ thuộc
npm install

# 2. Tạo database D1
npx wrangler d1 create nha-tro
# Copy database_id nhận được vào wrangler.toml (mục [[d1_databases]])

# 3. Chạy migration tạo bảng
npx wrangler d1 execute nha-tro --local --file ./migrations/0001_init.sql

# 4. Đặt khóa ký JWT (dùng khi chạy thật)
npx wrangler secret put JWT_SECRET

# 5. Chạy môi trường phát triển
npm run dev
```

## Cấu hình

`wrangler.toml` (rút gọn):

```toml
name = "nha-tro"
main = "src/server/index.ts"
compatibility_date = "2026-01-01"

[assets]
directory = "./dist"          # thư mục Vite build ra

[[d1_databases]]
binding = "DB"
database_name = "nha-tro"
database_id = "<điền-id-của-bạn>"
```

Biến bí mật (đặt bằng `wrangler secret put`, không để trong code):

- `JWT_SECRET` — khóa ký/kiểm token đăng nhập.
- `SEPAY_WEBHOOK_TOKEN` — (tùy chọn) token xác thực webhook SePay.

## Đăng nhập (3 tài khoản cố định)

Không dùng framework auth. Vì tài khoản cố định, không cần đăng ký / xác thực email / quên mật khẩu.

- Mật khẩu được **băm sẵn offline** (PBKDF2) rồi lưu vào bảng `users`.
- Đăng nhập đúng → ký JWT → đặt vào cookie `httpOnly`, `secure`, `sameSite`.
- Route cần bảo vệ đi qua middleware đọc cookie và verify token; không cần bảng session.
- Đổi mật khẩu = cập nhật lại `password_hash` trong D1.

## Thanh toán

- **Mặc định:** sinh mã VietQR cho mỗi hóa đơn (số tiền + nội dung chứa mã hóa đơn, ví dụ `HD00123`). Người thuê quét và chuyển khoản; quản trị đánh dấu đã thu.
- **Tự động (tùy chọn):** đăng ký SePay để nhận webhook biến động số dư. Route `/api/webhook/sepay` bóc mã hóa đơn từ nội dung chuyển khoản, cập nhật `invoices.trang_thai = 'da_thanh_toan'` và ghi vào `payments`. Gói miễn phí của SePay đủ cho quy mô này.

## Deploy

```bash
npm run build            # Vite build frontend -> dist/
npx wrangler deploy      # đưa Worker + static assets lên Cloudflare
```

Sau khi deploy, gắn domain trong Cloudflare: **Workers & Pages → dự án → Settings → Domains/Routes**. Vì domain đã ở Cloudflare, DNS được cấu hình tự động, HTTPS có sẵn.

## Ghi chú về chi phí

Với 2 nhà trọ, ứng dụng nằm gọn trong hạn mức miễn phí của Cloudflare:

- Workers: 100.000 request/ngày, 10ms CPU/request.
- D1: 5 GB lưu trữ, ~5 triệu dòng đọc/ngày, ~100 nghìn dòng ghi/ngày.

Thực tế mỗi tháng chỉ ghi thêm vài chục dòng, nên gần như không thể chạm trần.

## Việc cần làm

- [ ] Khởi tạo dự án React (Vite) + Hono + Wrangler
- [ ] Viết migration tạo bảng, seed 3 tài khoản
- [ ] API: rooms / readings / invoices / payments
- [ ] Logic sinh hóa đơn từ chỉ số công tơ
- [ ] Đăng nhập + middleware bảo vệ route
- [ ] Sinh mã VietQR trên hóa đơn
- [ ] (Tùy chọn) Webhook SePay tự động xác nhận thanh toán
- [ ] Giao diện: danh sách phòng, form nhập chỉ số, trang hóa đơn