# Mô hình dữ liệu

Tên bảng và cột là **tiếng Anh**; giá trị enum là **UPPER_SNAKE tiếng Anh**. Migration `0004_english_names.sql` đổi toàn bộ từ tên tiếng Việt ban đầu — các migration trước đó vẫn viết tên cũ, nên `0001_init.sql` một mình không còn mô tả đúng schema đang chạy.

```
buildings (id, name, address, electricity_rate, water_rate,
           bank_bin, bank_account_no, bank_account_name, momo_phone, momo_name)
rooms     (id, code, building_id, room_name, rent, area)
tenants   (id, code, room_id, full_name, phone, occupants, moved_in, moved_out)
readings  (id, code, room_id, period /YYYY-MM/, electricity_start, electricity_end,
           water_start, water_end, recorded_on)
invoices  (id, code, room_id, period, rent_amount, electricity_amount, water_amount,
           other_fees, electricity_rate, water_rate, total, status, created_at)
payments  (id, code, invoice_id, amount, paid_on, method, note, external_id)
users     (id, code, username, password_hash, role, room_id)

bots        (id, code, name, platform, token, active, created_at)
bot_targets (id, code, bot_id, kind, chat_id, label, building_id, active)
```

## Ràng buộc

| Ràng buộc | Ý nghĩa |
|---|---|
| `rooms UNIQUE(building_id, room_name)` | Tên phòng chỉ cần duy nhất trong một nhà. |
| `tenants UNIQUE(room_id) WHERE moved_out IS NULL` | Mỗi phòng tối đa một người **đứng tên** đang thuê; người cũ giữ lại làm lịch sử. |
| `readings UNIQUE(room_id, period)`, `invoices UNIQUE(room_id, period)` | Nhập chỉ số hai lần không sinh hai hóa đơn cho cùng một tháng. |
| `payments UNIQUE(external_id) WHERE external_id IS NOT NULL` | Id giao dịch SePay — chặn webhook gửi trùng, kể cả hai lần retry đến cùng lúc (migration 0008). |
| `users` partial unique trên `room_id` | Mỗi phòng tối đa một tài khoản. |
| `users` CHECK vai trò ↔ `room_id` | `MANAGER` phải có `room_id` NULL, `TENANT` phải có. |
| `bot_targets UNIQUE(bot_id, chat_id)` | Một bot không gửi hai lần vào cùng một chat. |
| `UNIQUE(code)` trên mọi bảng có `code` | Xem dưới. |

Xoá bị chặn bởi FK, không cascade: nhà còn phòng, hoặc phòng còn chỉ số/hóa đơn/người thuê → 409 `RELATED_DATA_EXISTS`.

## Mã công khai (`code`)

**Mọi bảng mà URL có thể trỏ tới đều có `code`**, sinh ngẫu nhiên, không suy ra từ `id`:

| Bảng | Tiền tố |
|---|---|
| `invoices` | `HD…` |
| `rooms` | `RM…` |
| `tenants` | `TN…` |
| `users` | `AC…` |
| `readings` | `RD…` |
| `payments` | `PM…` |
| `bots` | `BT…` |
| `bot_targets` | `TG…` |

Tiền tố là thứ chặn việc dùng mã phòng ở chỗ cần mã người thuê — `parseCode` kiểm nó trước mọi lookup. `buildings` là bảng duy nhất còn đi theo `:id`: chỉ quản lý dùng, không bao giờ xuất hiện trên URL của người thuê.

`invoices.code` (`HD3C8EA506`) là mã con người phải gõ lại: nó là nội dung chuyển khoản, đoạn URL, và thứ người thuê đọc trên hóa đơn. Bốn byte ngẫu nhiên dạng hex in hoa — `0-9A-F` không có O/I/l để gõ nhầm vào app ngân hàng, và unique index bắt va chạm. Migration 0005 thêm cột nullable thay vì dựng lại bảng, vì `payments` có FK vào `invoices`; kiểu input TypeScript bắt buộc có `code`, nên không có chỗ nào ghi NULL.

`rooms.room_name`, không phải `name`: phòng được join vào hóa đơn, chỉ số, người thuê, tài khoản, nơi một cột `name` trần sẽ nằm cạnh `building_name` và đọc mơ hồ. Một cách viết duy nhất còn cho phép `buildSet` dùng thẳng key của patch làm tên cột.

## Enum

Đều có CHECK constraint, nên đổi giá trị là phải viết migration:

| Cột | Giá trị |
|---|---|
| `invoices.status` | `UNPAID` \| `PAID` \| `CANCELLED` |
| `payments.method` | `BANK_TRANSFER` \| `CASH` |
| `users.role` | `MANAGER` \| `TENANT` |
| `bots.platform` | `ZALO` |
| `bot_targets.kind` | `GROUP` \| `MANAGER` |

SQLite không sửa được CHECK constraint, nên bảng nào đổi enum phải dựng lại — vì thế `0004` đổi tên phần lớn cột tại chỗ bằng `ALTER TABLE … RENAME COLUMN` nhưng dựng lại `invoices`, `payments` và `users`.

## Kiểu dữ liệu

Tiền là `INTEGER` VND — không số thực, không đơn vị nhỏ. Ngày là `TEXT` ISO. Kỳ tính tiền là `period` dạng `YYYY-MM`.

```
electricity_amount = (electricity_end - electricity_start) * electricity_rate
water_amount       = (water_end - water_start) * water_rate
total              = rent_amount + electricity_amount + water_amount + other_fees
```

## Những điểm thiết kế không được phá

- **Đơn giá được chốt trên `invoices`** (`electricity_rate`, `water_rate`). `buildings.electricity_rate`/`water_rate` là giá **hiện tại** của từng nhà (hai nhà có thể khác nhau) — hóa đơn mới sinh copy từ đó, còn hiển thị hóa đơn cũ thì không bao giờ đọc. Không tính lại hóa đơn cũ theo giá hôm nay: đổi giá không được viết lại lịch sử.
- **`readings` chỉ lưu chỉ số công tơ; tiền nằm ở `invoices`.** Lịch sử chỉ số sạch, và chỉ số đầu kỳ (`electricity_start`/`water_start`) tự điền được từ số cuối kỳ trước.
- **`tenants.moved_out` NULL nghĩa là còn đang thuê.** **Một hợp đồng = một người đứng tên**; ở ghép nhiều người thì đếm vào `occupants` (≥ 1, tính cả người đứng tên), không thêm dòng. Đừng "sửa" bằng cách cho nhiều người đang thuê cùng lúc — đây là mô hình đã thống nhất.
- **`bots.token` là ciphertext, không bao giờ là plaintext** (`v1.<iv>.<ct>`, AES-GCM). `bot_targets.kind` quyết định chat đó có được gửi số tiền hay không, nên có CHECK và không patch được. → [notifications.md](notifications.md)

## Seed

Migration 0001 seed một nhà (`Nhà trọ 1`, điện 3.000đ/kWh, nước 15.000đ/m³), hai phòng (`P101`, `P102`, `rent = 0`), một người thuê giữ chỗ. Đó là dữ liệu giữ chỗ, không phải sự thật. Production đã có dữ liệu thật — đếm dòng trước khi giả định.
