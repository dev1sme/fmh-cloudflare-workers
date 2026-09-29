# Việc cần làm

Đây là backlog chính thức của dự án.

## Đã xong

- [x] Khởi tạo dự án React (Vite) + Hono + Wrangler
- [x] Viết migration tạo bảng
- [x] Đăng nhập + phân quyền quản lý / người thuê
- [x] API: buildings / rooms / tenants / readings / invoices / payments
- [x] Logic sinh hóa đơn từ chỉ số công tơ, có xem trước
- [x] Giao diện: nhà, phòng, người thuê, nhập chỉ số, hóa đơn, dashboard, màn người thuê
- [x] Quản lý tài khoản: tạo, đổi tên, đặt lại mật khẩu; người dùng tự đổi mật khẩu
- [x] Sinh mã VietQR trên hóa đơn
- [x] Tuỳ chọn chuyển khoản MoMo (dạng thông tin, không QR)
- [x] Deploy lần đầu + đo CPU time thực tế của route đăng nhập
- [x] Gắn domain riêng (`rentals.dev1sme.cloud`)
- [x] Song ngữ Việt – Anh
- [x] Giao diện sáng / tối / theo hệ thống
- [x] Nhập số liệu thật trên production: nhà, phòng, tài khoản
- [x] Webhook SePay: build + deploy, các đường từ chối đã kiểm trên production
- [x] Thông báo Zalo qua bảng `bots` / `bot_targets` (migration 0009)

## Còn lại

- [ ] Xác nhận một lần webhook SePay nhận thành công thật: một giao dịch nhỏ + `wrangler tail` (→ [payments.md](payments.md#tình-trạng-trên-production))
- [ ] Bật thông báo trên production: bảng `bots` đang trống — nhập bot và đích gửi trong màn Thông báo (→ [notifications.md](notifications.md))
- [ ] Chọn test runner — hiện chưa có test nào
