# Rentals Hub

Ứng dụng web quản lý nhà trọ: ghi số điện/nước hằng tháng, tính và phát hành hóa đơn (tiền phòng + điện + nước + phí khác), cho người thuê xem hóa đơn và thanh toán qua VietQR, lưu lịch sử chỉ số công tơ.

Ứng dụng nội bộ, quy mô nhỏ — một tài khoản quản lý, mỗi phòng một tài khoản chỉ để xem. Toàn bộ chạy trên Cloudflare Workers + D1 và nằm gọn trong hạn mức miễn phí.

Bản đang chạy: **https://rentals.dev1sme.cloud**

## Tính năng

- Quản lý nhà, phòng, người thuê; mỗi nhà có đơn giá điện/nước và tài khoản nhận tiền riêng.
- Ghi chỉ số điện/nước theo kỳ (tháng); chỉ số cuối kỳ tự thành chỉ số đầu kỳ sau.
- Xem trước rồi sinh hóa đơn hàng loạt; đơn giá được chốt trên từng hóa đơn.
- VietQR tự sinh cho từng hóa đơn (không qua dịch vụ QR bên ngoài); MoMo dạng thông tin.
- Tự xác nhận thanh toán qua webhook biến động số dư SePay.
- Thông báo Zalo khi phát hành hóa đơn và khi tiền về.
- Dashboard quản lý: doanh thu, công nợ từng phòng, tiêu thụ so với kỳ trước.
- Một màn duy nhất cho người thuê: hóa đơn đang phải trả kèm QR, biểu đồ, lịch sử.
- Quản lý tài khoản ngay trong giao diện; song ngữ Việt – Anh; sáng / tối / theo hệ thống.

## Công nghệ

React + Vite + Mantine (SPA) · Hono trên Cloudflare Workers · D1 (SQLite) · JWT (`jose`) trong cookie `httpOnly` · TypeScript.

SPA và API gói trong **một Worker**, build bằng `@cloudflare/vite-plugin`, một lần deploy.

## Chạy nhanh

```bash
npm install
npm run cf-typegen      # sinh type cho binding
npm run db:migrate      # migration lên D1 local
npm run dev             # http://localhost:5173
```

Deploy: `npm run db:migrate:remote && npm run deploy`. Secrets, domain và các bẫy → [docs/deployment.md](docs/deployment.md).

## Tài liệu

| Tài liệu | Nội dung |
|---|---|
| [architecture.md](docs/architecture.md) | Một Worker, cấu trúc thư mục, phân tầng client, code splitting |
| [data-model.md](docs/data-model.md) | Schema, ràng buộc, mã công khai, enum, điểm thiết kế không được phá |
| [api.md](docs/api.md) | Bề mặt API, hành vi cần giữ, an toàn SQL |
| [envelop-conventions.md](.claude/rules/envelop-conventions.md) | Chuẩn response envelope, định dạng `error.code` |
| [auth.md](docs/auth.md) | Vai trò, middleware, phiên, mật khẩu, số vòng PBKDF2 |
| [payments.md](docs/payments.md) | VietQR, MoMo, webhook SePay |
| [notifications.md](docs/notifications.md) | Zalo bot, `bots` / `bot_targets`, mã hoá token |
| [security-headers.md](docs/security-headers.md) | `_headers`, `headers.ts`, CSP, HSTS |
| [ui.md](docs/ui.md) | Hai vỏ giao diện, hệ thị giác, i18n, theme |
| [deployment.md](docs/deployment.md) | `wrangler.toml`, secrets, chạy local, deploy, chi phí |
| [roadmap.md](docs/roadmap.md) | Việc cần làm |
