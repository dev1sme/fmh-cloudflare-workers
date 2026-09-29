# API

Mọi thứ dưới `/api` đều cần phiên đăng nhập, trừ `/api/health` và `/api/auth/*`. `/hooks/*` nằm ngoài `/api` và xác thực bằng chữ ký (→ [payments.md](payments.md)).

## Response envelope

Mục đích: frontend, QA và bên tích hợp đọc một hình dạng duy nhất, ổn định.

```jsonc
// thành công
{ "success": true,  "message": "Invoices retrieved.", "data": { "invoices": [] }, "meta": { "timestamp": 1785900251 } }
// lỗi
{ "success": false, "message": "Duplicate data.", "error": { "code": "DUPLICATE_DATA", "details": null }, "meta": { "timestamp": 1785900251 } }
// lỗi validation
{ "success": false, "message": "The given data was invalid.",
  "error": { "code": "MISSING_ROOM_NAME", "details": { "room_name": ["MISSING_ROOM_NAME"] } },
  "meta": { "timestamp": 1785900251 } }
```

- Handler **không bao giờ gọi `c.json` trực tiếp** — đi qua `ok` / `failure` / `notFound` trong `src/server/envelope.ts`, để `success`, `message`, `meta.timestamp` không thể có ở endpoint này mà thiếu ở endpoint kia. `grep -rn "c\.json(" src/server/` chỉ được khớp `envelope.ts`.
- `data` giữ nguyên hình dạng bên trong mà mỗi route vẫn trả (`{ invoices }`, `{ room }`, `{ ok: true }`), không làm phẳng. Vì thế `request<T>` trong `api.ts` bóc đúng một lớp và không nơi gọi nào trong client phải sửa.
- `message` là câu tiếng Anh cho log và bên tích hợp. SPA **không bao giờ hiển thị** nó — SPA tự dựng câu từ `error.code`. Không đặt message của exception nội bộ vào đây; `onError` log lỗi thật và trả `INTERNAL_ERROR`.
- Không đổi tên tuỳ tiện giữa `data` / `result` / `payload`. Không trả raw model, stack trace, secret, token, password hash.

### Định dạng thuộc tính

- Số nguyên là số thật, không bọc trong chuỗi. `meta.timestamp` là số.
- Boolean là boolean thật, không `"true"`/`"false"`.
- Field số giữ cùng kiểu ở mọi endpoint.
- Enum là UPPER_SNAKE tiếng Anh, ổn định, đọc được bằng máy (bảng enum → [data-model.md](data-model.md)).
- Field nullable là `null` rõ ràng, theo một quy ước thống nhất.

## Mã lỗi

`error.code` **bắt buộc UPPER_SNAKE tiếng Anh**, khớp `^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$`. Được **ép trong code**: `failure()` trong `envelope.ts` và `fail()` trong `validate.ts` đều throw nếu sai định dạng.

**Mã là API contract.** Client map chúng sang câu hiển thị; đổi chữ trong một mã là breaking change, không phải sửa câu chữ.

Validation giữ **mã cụ thể** (`MISSING_ROOM_NAME`), không dùng `VALIDATION_ERROR` chung chung, rồi thêm `details`. Mã do validation sinh ghép từ tên field: `MISSING_<FIELD>`, `INVALID_<FIELD>`, `TOO_LONG_<FIELD>`. `chiTietValidation` tách field từ mã rồi hạ về chữ thường làm khoá trong `details`; mã nghiệp vụ không nêu field nào (`ELECTRICITY_END_BELOW_START`) thì `details: null`. Gửi `VALIDATION_ERROR` sẽ buộc câu chữ phải nằm ở server — không phải chỗ của nó.

| Lỗi | HTTP | Mã |
|---|---|---|
| `ValidationError` | 400 | mã cụ thể (`INVALID_PERIOD`, …) |
| D1 UNIQUE | 409 | `DUPLICATE_DATA` |
| D1 FOREIGN KEY | 409 | `RELATED_DATA_EXISTS` |
| D1 CHECK | 400 | |
| Mã sai tiền tố / không phải code | 400 | `INVALID_CODE` |

### Mã phải đọc được trên UI

Đúng định dạng chưa đủ. `thongBaoLoi` tra `errors.<CODE>` trong locale trước; không có thì rơi xuống câu sinh từ tên field (`INVALID_RENT` → "Giá trị không hợp lệ: giá phòng"). Lối thoát đó chỉ đẹp khi mã **nêu đúng một field người dùng nhìn thấy** và `fields.<field>` có mặt — `INVALID_BODY` từng in ra "Giá trị không hợp lệ: body." vì sai cả hai.

Kiểm mã sai định dạng:

```bash
grep -rhoE '(failure\(c, "|fail\(")[a-zA-Z_]+"' src/server/ \
  | sed -E 's/.*"([a-zA-Z_]+)"/\1/' | sort -u | grep -vE '^[A-Z][A-Z0-9_]*$'
```

Tìm mã thiếu câu hiển thị:

```bash
grep -rhoE '"[A-Z][A-Z0-9]*(_[A-Z0-9]+)+"' src/server/ | tr -d '"' | sort -u \
  | while read -r c; do grep -q "^    ${c}:" src/client/i18n/locales/vi.ts || echo "$c"; done
```

Kết quả không phải lỗi hết. Bỏ qua bốn nhóm:

- **Giá trị enum**, không phải mã lỗi: `BANK_TRANSFER`, `MISSING_READING`, `ALREADY_INVOICED`.
- **Chỉ webhook phát ra**: `STALE_SIGNATURE`, `NOT_INCOMING`, `NO_INVOICE_CODE`, … SePay đọc, SPA không bao giờ thấy. Phần lớn nằm trong `reason` của một `ok()` 200.
- **`reason` nội bộ** bị bọc trước khi tới client: `TOKEN_UNREADABLE` trong `notify.ts` đi vào `message` của `TEST_MESSAGE_FAILED`, và client tra mã bọc ngoài.
- **Khớp `MISSING_`/`INVALID_`/`TOO_LONG_` và có `fields.<field>`**: `INVALID_AMOUNT` ra "Giá trị không hợp lệ: số tiền" là đúng ý.

Còn lại mới là thiếu thật.

## Đường dẫn

Mọi tài nguyên **trừ buildings** được trỏ bằng mã công khai, không bằng id: `/api/rooms/RMC7AD24C8`, `/api/invoices/HD3C8EA506`. `parseCode(CODE_PREFIX.x, …)` kiểm cả tiền tố lẫn hình dạng, nên id số là 400 `INVALID_CODE`, mã phòng trong đường dẫn hóa đơn cũng vậy — cả hai không tới được lookup.

Id vẫn còn trong body request và response (`room_id` của tenant, `building_id` của room) vì FK vẫn là id. Cái thay đổi là thứ xuất hiện trên URL, lịch sử trình duyệt, log server và referrer. `/api/buildings/:id` là route cuối cùng còn dùng id — chỉ quản lý dùng, không bao giờ lọt vào URL của người thuê hay QR.

## Bề mặt API

Guard của từng nhóm → [auth.md](auth.md).

### Quản lý

CRUD đầy đủ trên `/buildings`, `/rooms`, `/tenants`, `/readings`, `/invoices`, cộng `DELETE /payments/:id` và `GET /dashboard`.

App không cứng hai nhà: quản lý thêm nhà ở màn **Nhà** (mỗi nhà có `electricity_rate`/`water_rate` riêng) và phòng ở **Phòng**. Không chuyển được phòng sang nhà khác, không chuyển được hợp đồng sang phòng khác — cả hai viết lại lịch sử đã tính tiền, nên UI khoá select đó khi sửa.

**`/tenants`**: POST là dọn vào; `PATCH { moved_out: "…" }` là dọn ra; `PATCH { moved_out: null }` huỷ một lần dọn ra nhầm (409 nếu phòng đã có người mới); DELETE xoá bản ghi nhập nhầm. `GET /tenants` trả tất cả từ trước tới nay, hợp đồng mới nhất mỗi phòng lên đầu, kèm `room_name`; `?active=1` chỉ người đang thuê, `?room_id=` một phòng.

**`/readings`**: POST tự điền `electricity_start`/`water_start` từ số cuối kỳ trước khi bị bỏ trống. `GET /readings/suggest?room_id=&period=` trả đúng gợi ý đó để điền sẵn form. Route này đăng ký **trước** `/:id` — thứ tự quan trọng trong Hono.

**`/invoices`**:

- `GET /invoices/generate-preview?period=` báo mọi phòng của kỳ, `status` (`READY` | `MISSING_READING` | `ALREADY_INVOICED`) và số tiền sẽ tính, không ghi gì. Cũng đăng ký trước `/:id`. Preview và `POST /generate` cùng tính qua `estimateInvoice`, nên preview **theo cấu trúc** chính là thứ sẽ được ghi.
- `POST /invoices/generate` nhận `{ period, room_ids? }`, trả `{ created, skipped }`. Bỏ `room_ids` là tính mọi phòng; **mảng rỗng bị từ chối** (`EMPTY_ROOM_IDS`) chứ không hiểu thành "mọi phòng", cả ở route lẫn query builder. Phòng thiếu chỉ số hoặc đã có hóa đơn nằm trong `skipped` thay vì làm hỏng cả lô, vì quản lý cần biết phòng nào còn thiếu. Insert chạy trong một `db.batch()` — một kỳ được tạo trọn hoặc không gì cả.
- `PATCH /invoices/:id` chỉ nhận `rent_amount`, `other_fees`, `status`, và tính lại `total`. **`electricity_rate`/`water_rate` cố ý không patch được** — sửa đơn giá sai là xoá hóa đơn rồi sinh lại, để hóa đơn đã lưu luôn khớp giá lúc phát hành.
- `GET /invoices/:id` trả `bank_transfer` (→ [payments.md](payments.md)).

**Thanh toán**: ghi hoặc xoá payment đều **suy lại** `status` từ `SUM(payments.amount)` so với `total` (`capNhatTrangThai` trong `routes/payments.ts`). Hóa đơn `CANCELLED` không bao giờ bị phép tính này đụng tới và từ chối payment mới.

**`GET /api/dashboard?period=`** (mặc định tháng hiện tại): rollup chỉ đọc cho màn chủ của quản lý — doanh thu kỳ, công nợ từng phòng **qua mọi kỳ**, tỉ lệ lấp phòng, tiêu thụ so với kỳ trước, và 12 kỳ gần nhất cho biểu đồ. Field tiếng Anh (`billed`, `collected`, `outstanding`) vì nó không phản chiếu bảng nào. Hai điều phải giữ:

- Hóa đơn `CANCELLED` bị loại khỏi **mọi** con số tiền — hóa đơn huỷ chưa bao giờ nợ.
- Sáu câu truy vấn đi trong **một** `db.batch()`. Chuỗi `await` nối tiếp tốn phần lớn ngân sách ~10 ms CPU để chờ.

**Tài khoản (`/api/accounts`)**: `GET` liệt kê; `POST` tạo (mật khẩu tuỳ chọn — bỏ trống thì server sinh 20 ký tự); `PATCH` đổi tên; `POST /:id/reset-password` đặt lại **không cần mật khẩu hiện tại**; `DELETE` xoá. Hai chốt chặn giữ app luôn vào được: không xoá tài khoản đang đăng nhập (`CANNOT_DELETE_SELF`), không xoá quản lý cuối cùng (`LAST_MANAGER_REQUIRED`).

**Bot thông báo (`/api/bots`, `/api/bot-targets`)**: `GET /bots` liệt kê mọi bot kèm đích gửi; `POST /bots` tạo; `PATCH /bots/:code` đổi tên hoặc tắt; `POST /bots/:code/token` thay token; `DELETE /bots/:code` xoá (409 khi còn đích gửi); `POST /bots/:code/targets` thêm đích. Đích gửi trỏ bằng mã riêng: `PATCH`/`DELETE /bot-targets/:code`, và `POST /bot-targets/:code/test` gửi tin thật và **chờ kết quả**. Token không bao giờ có trong response; `kind` không patch được. → [notifications.md](notifications.md)

### Người thuê

`GET /api/me/dashboard`, `/api/me/room`, `/api/me/invoices`, `/api/me/invoices/:id`, `/api/me/readings`. **Chỉ đọc** — người thuê không bao giờ tự đánh dấu đã trả; đó là việc của quản lý hoặc webhook SePay.

`GET /api/me/dashboard` là bản đơn giản hơn nhiều của dashboard quản lý: tiêu thụ và tiền của phòng mình theo tháng, mới nhất trước. Các kỳ lấy từ **UNION của `readings` và `invoices`**, không phải một bảng — một tháng có thể đã có chỉ số mà quản lý chưa phát hành hóa đơn, khi đó `total`/`status` là null.

### Chung

`POST /api/auth/change-password` — tự đổi mật khẩu, mở cho cả hai vai trò, **có** yêu cầu mật khẩu hiện tại. → [auth.md](auth.md)

## An toàn SQL

Mọi giá trị tới D1 qua `.bind()`. Chuỗi duy nhất được nội suy vào SQL là hằng cấp file (`COLUMNS`, `SELECT`), placeholder sinh ra (`roomIds.map(() => "?")`), và tên cột từ `buildSet` / `Where`.

`buildSet` lấy tên cột từ key của đối số, nên route nào truyền thẳng body request vào là mở lỗ injection. Mọi nơi gọi đều dựng patch từng field một — trong `src/server/` không có `...body` nào. Giữ nguyên như vậy thay vì thêm escaping lúc runtime.
