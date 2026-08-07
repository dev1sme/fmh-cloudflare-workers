# Rentals Hub

Ứng dụng web quản lý nhà trọ: ghi số điện/nước hằng tháng, tính và phát hành hóa đơn (tiền phòng + điện + nước + phí khác), cho người thuê xem hóa đơn và thanh toán qua VietQR, lưu lịch sử chỉ số công tơ.

Ứng dụng nội bộ, quy mô nhỏ — một tài khoản quản lý, mỗi phòng một tài khoản chỉ để xem. Toàn bộ chạy trên nền serverless của Cloudflare và nằm gọn trong hạn mức miễn phí.

Tên app không gắn với nhà nào cụ thể: `FMH` là tên một toà nhà, tức một dòng trong bảng `buildings`, không phải tên sản phẩm. Quản lý tự thêm nhà trong màn **Cài đặt**.

## Tính năng

- Quản lý nhà, phòng, người thuê; mỗi nhà có đơn giá điện/nước riêng.
- Ghi chỉ số điện/nước theo từng kỳ (tháng); chỉ số cuối kỳ tự trở thành chỉ số đầu kỳ tháng sau.
- Xem trước rồi sinh hóa đơn hàng loạt: `tiền điện = (điện mới − điện cũ) × đơn giá`, tương tự tiền nước, cộng tiền phòng và phí khác.
- Sinh mã VietQR cho từng hóa đơn để người thuê chuyển khoản; MoMo dạng thông tin (không QR).
- (Tùy chọn) Tự động xác nhận đã thanh toán qua webhook biến động số dư (SePay).
- Màn tổng quan cho quản lý: doanh thu theo kỳ, công nợ từng phòng, mức tiêu thụ so với kỳ trước.
- Màn duy nhất cho người thuê: hóa đơn đang phải trả kèm QR, biểu đồ điện/nước theo tháng, lịch sử từng kỳ.
- Quản lý tự tạo / đổi tên / đặt lại mật khẩu / xoá tài khoản ngay trong giao diện.
- Song ngữ Việt – Anh, và giao diện sáng / tối / theo hệ thống.

## Kiến trúc & công nghệ

| Thành phần | Lựa chọn |
|---|---|
| Frontend | React + Vite (SPA) |
| Giao diện | Mantine, `@mantine/charts` (Recharts), `motion` |
| Đa ngôn ngữ | `i18next` + `react-i18next` (vi / en) |
| API / Backend | Hono chạy trên Cloudflare Workers |
| Database | Cloudflare D1 (SQLite) |
| Đăng nhập | JWT không trạng thái (`jose`) đặt trong cookie `httpOnly`; băm mật khẩu bằng Web Crypto (PBKDF2) |
| Thanh toán | VietQR tự sinh + webhook SePay (tùy chọn) |
| Deploy | Cloudflare Workers (qua Wrangler) |
| Ngôn ngữ | TypeScript |

Frontend build ra file tĩnh, được chính Worker phục vụ; các request `/api/*` do Hono xử lý. Cả frontend lẫn API gói trong **một Worker duy nhất**, một lần deploy. Hướng này cố ý không dùng Next.js/OpenNext để tránh bước cấu hình phức tạp.

## Cấu trúc thư mục

```
.
├── index.html           # entry Vite; kèm script đặt theme trước khi paint
├── public/              # copy nguyên vào dist/client — _headers, favicon.svg
├── src/
│   ├── client/          # React SPA
│   │   ├── App.tsx      # chỉ làm cổng phiên đăng nhập
│   │   ├── routes.tsx   # bảng route theo vai trò + bảng route lúc chưa đăng nhập
│   │   ├── api.ts       # wrapper có kiểu cho mọi endpoint
│   │   ├── errors.ts    # mã lỗi API -> câu tiếng Việt/Anh, toast
│   │   ├── format.ts    # tiền / ngày / kỳ, đổi theo ngôn ngữ
│   │   ├── theme.ts     # màu, font, mặc định component
│   │   ├── theme.css    # thang bề mặt, nền động, typography bảng
│   │   ├── i18n/        # cấu hình i18next + locales/vi.ts, locales/en.ts
│   │   ├── hooks/       # useResource, useConfirm
│   │   ├── components/  # UI dùng chung nhiều feature
│   │   └── features/    # login, dashboard, rooms, tenants, readings,
│   │                    # invoices, settings, accounts, change-password,
│   │                    # not-found, my (màn của người thuê)
│   ├── server/          # API Hono chạy trên Worker
│   │   ├── index.ts     # entry Worker: bảng route, map lỗi
│   │   ├── auth.ts      # băm/verify mật khẩu, ký/verify JWT, 3 middleware
│   │   ├── envelope.ts  # ok / failure / notFound — nơi duy nhất gọi c.json
│   │   ├── routes/      # auth, accounts, buildings, rooms, tenants,
│   │   │                # readings, invoices, payments, me
│   │   ├── domain/      # logic thuần: invoice.ts, period.ts, vietqr.ts
│   │   └── db/          # một module mỗi bảng + sql.ts
│   └── shared/types.ts  # kiểu dùng chung client ↔ server
├── migrations/          # SQL cho D1
├── scripts/             # hash-password.mjs (băm offline lúc bootstrap)
├── wrangler.toml
├── vite.config.ts
└── package.json
```

Chi tiết từng tầng nằm trong `.claude/rules/` — đọc file khớp với việc đang làm **trước khi** sửa.

Build và dev chạy qua [`@cloudflare/vite-plugin`](https://developers.cloudflare.com/workers/vite-plugin/): một lệnh `npm run dev` chạy cả SPA (có HMR) lẫn Worker trong runtime workerd thật, kèm D1 local — không cần dựng 2 process rồi proxy. `vite build` xuất ra `dist/client/` (asset) và `dist/nha_tro/` (Worker), `wrangler deploy` đẩy cả hai lên trong một lần.

## Mô hình dữ liệu

Tên bảng và cột là **tiếng Anh**; giá trị enum là **UPPER_SNAKE tiếng Anh**. Migration `0004_english_names.sql` đã đổi toàn bộ từ tên tiếng Việt ban đầu, nên `0001_init.sql` một mình không còn mô tả đúng schema đang chạy.

```
buildings (id, name, address, electricity_rate, water_rate,
           bank_bin, bank_account_no, bank_account_name, momo_phone, momo_name)
rooms     (id, code, building_id, room_name, rent, area)
tenants   (id, code, room_id, full_name, phone, occupants, moved_in, moved_out)
readings  (id, code, room_id, period /YYYY-MM/, electricity_start, electricity_end,
           water_start, water_end, recorded_on)
invoices  (id, code, room_id, period, rent_amount, electricity_amount, water_amount,
           other_fees, electricity_rate, water_rate, total, status, created_at)
payments  (id, code, invoice_id, amount, paid_on, method, note)
users     (id, code, username, password_hash, role, room_id)
```

Ràng buộc đáng nhớ:

- `UNIQUE(building_id, room_name)` — tên phòng chỉ cần duy nhất trong một nhà, không cần duy nhất toàn hệ thống.
- `UNIQUE(room_id) WHERE moved_out IS NULL` — mỗi phòng chỉ một người **đứng tên** đang thuê; người cũ vẫn giữ lại để tra cứu. Ở ghép nhiều người thì đếm vào `occupants`, không tách dòng.
- `UNIQUE(room_id, period)` trên cả `readings` lẫn `invoices` — nhập chỉ số hai lần không sinh hai hóa đơn cho cùng một tháng.
- **Mọi bảng có thể xuất hiện trên URL đều có cột `code`**: `invoices` (`HD…`), `rooms` (`RM…`), `tenants` (`TN…`), `users` (`AC…`), `readings` (`RD…`), `payments` (`PM…`). Code sinh ngẫu nhiên, không suy ra từ `id`. Tiền tố chính là thứ chặn việc dùng mã phòng ở chỗ cần mã người thuê.

Enum, đều có CHECK constraint nên đổi giá trị là phải viết migration:

| Cột | Giá trị |
|---|---|
| `invoices.status` | `UNPAID` \| `PAID` \| `CANCELLED` |
| `payments.method` | `BANK_TRANSFER` \| `CASH` |
| `users.role` | `MANAGER` \| `TENANT` |

Tiền lưu bằng `INTEGER` (VND) — không dùng số thực, không dùng đơn vị nhỏ. Ngày lưu bằng `TEXT` dạng ISO.

Hai điểm thiết kế không được phá:

- **Đơn giá điện/nước chốt ngay trên `invoices`** (`electricity_rate`, `water_rate`), không tính động theo giá hiện tại. Đổi giá không được viết lại lịch sử.
- **`readings` chỉ lưu chỉ số công tơ**, tiền nằm ở `invoices`. Nhờ vậy lịch sử chỉ số sạch và chỉ số đầu kỳ tự điền được từ kỳ trước.

## Yêu cầu

- Node.js (bản LTS)
- Tài khoản Cloudflare (domain đã quản lý tại Cloudflare)
- Wrangler CLI: `npm install -D wrangler`

## Cài đặt & chạy local

Database D1 `nha-tro` đã được tạo sẵn, `database_id` đã nằm trong `wrangler.toml`.

```bash
# 1. Cài phụ thuộc
npm install

# 2. Sinh type cho binding (worker-configuration.d.ts không commit)
npm run cf-typegen

# 3. Chạy migration tạo bảng trên D1 local
npm run db:migrate

# 4. Chạy môi trường phát triển  ->  http://localhost:5173
npm run dev
```

Khi cần chạy thật:

```bash
npm run db:migrate:remote                      # migration lên D1 remote
./node_modules/.bin/wrangler secret put JWT_SECRET
```

> `npx` không dùng được trong môi trường này (bị hook viết lại thành `npm`). Gọi qua npm script hoặc `./node_modules/.bin/wrangler`.

## Cấu hình

`wrangler.toml` (rút gọn):

```toml
name = "nha-tro"
main = "./src/server/index.ts"

routes = [{ pattern = "rentals.dev1sme.cloud", custom_domain = true }]

[secrets]
required = ["JWT_SECRET"]        # deploy fail nếu Worker chưa có secret này

[assets]
not_found_handling = "single-page-application"   # route không khớp asset -> trả index.html
run_worker_first = ["/api/*"]                    # chỉ /api/* mới vào Worker
# Không khai báo `directory`: vite-plugin tự trỏ vào thư mục build của client.

[[d1_databases]]
binding = "DB"
database_name = "nha-tro"
database_id = "5adee76f-9107-43c1-b428-4ba9b49bc1e5"
migrations_dir = "./migrations"
```

Biến bí mật (đặt bằng `wrangler secret put`, không để trong code):

- `JWT_SECRET` — khóa ký/kiểm token đăng nhập.
- `SEPAY_WEBHOOK_TOKEN` — (tùy chọn) token xác thực webhook SePay.

Header bảo mật đặt ở **hai nơi và cần cả hai**: `public/_headers` cho phần SPA, `src/server/headers.ts` cho `/api/*`. Vì `run_worker_first = ["/api/*"]`, mọi đường dẫn không phải API được phục vụ thẳng từ kho asset mà không gọi Worker, nên middleware Hono không bao giờ chạm tới trang HTML.

## Đăng nhập & phân quyền

Không dùng framework auth, không có bảng session.

| Vai trò | `users.role` | Quyền |
|---|---|---|
| Chủ nhà | `MANAGER` | Toàn quyền: nhà, phòng, người thuê, chỉ số, sinh hóa đơn, thu tiền, tài khoản |
| Người thuê | `TENANT` | Chỉ **xem** hóa đơn + chỉ số của phòng mình |

Tài khoản người thuê gắn với **phòng**, không gắn với người: khách chuyển đi thì đổi mật khẩu, tài khoản giữ nguyên. Schema ép cả hai chiều — `MANAGER` phải có `room_id` NULL, `TENANT` phải có `room_id`, và một partial unique index giới hạn mỗi phòng một tài khoản. Người thuê không tự đánh dấu đã thanh toán — việc đó là của quản lý hoặc webhook SePay.

- Đăng nhập đúng → ký JWT → đặt vào cookie `httpOnly`, `secure`, `sameSite=Lax`, hạn 7 ngày.
- Route cần bảo vệ đi qua middleware đọc cookie và verify token.
- Màn login có route riêng `/login`. Chưa đăng nhập thì mọi đường dẫn đều chuyển về đó; đăng nhập xong thì `/login` chuyển về trang chủ của vai trò tương ứng. **Không** mang theo đường dẫn đang muốn vào: đường dẫn đó thuộc về vai trò vừa thoát, không phải vai trò sắp vào.

Quản lý tự tạo tài khoản, đổi tên đăng nhập, đặt lại mật khẩu và xoá tài khoản ngay trong màn **Tài khoản**. Đặt lại mật khẩu **không cần mật khẩu hiện tại**; mật khẩu mới (tự sinh 20 ký tự hoặc tự chọn) hiện đúng **một lần** kèm nút copy để đưa cho người thuê. Hai chốt chặn giữ app luôn vào được: không xoá được tài khoản đang đăng nhập, và không xoá được tài khoản quản lý cuối cùng.

Mật khẩu chỉ lưu dạng đã băm, không có chỗ nào xem lại được. Quên thì đặt lại — không tra cứu. Lý do không lưu plaintext: phần lớn tài khoản là của người thuê, mà người ta hay dùng lại mật khẩu ở dịch vụ khác.

Băm chạy **trong Worker**, nên quản lý tạo tài khoản và đặt lại mật khẩu ngay trên giao diện. Script offline chỉ còn dùng để tạo tài khoản quản lý **đầu tiên**, lúc DB còn rỗng nên chưa đăng nhập được:

```bash
npm run hash-password -- <username>                          # tài khoản quản lý, tự sinh password
npm run hash-password -- <username> <password>               # tự chọn password
npm run hash-password -- <username> --room <ten_phong>       # tài khoản gắn phòng
```

Script in ra câu `INSERT ... ON CONFLICT DO UPDATE`, chạy nó bằng `wrangler d1 execute nha-tro --local` (hoặc `--remote`).

**Số vòng PBKDF2 là 10.000, không phải 600.000 như khuyến nghị OWASP.** Workers Free giới hạn 10ms CPU mỗi request. Đo trên Worker đã deploy (`wrangler tail --format json`, trường `cpuTime`): 50k vòng tốn 11–17ms — vượt trần ở **mọi** lần đăng nhập; 10k vòng thì đăng nhập trúng tài khoản tốn 5ms, trượt tài khoản median 4ms.

Đừng chỉnh số này dựa trên benchmark máy local: máy dev chạy 50k mất ~6ms, nhanh gấp ~3 lần CPU của Cloudflare. Đổi xong phải đo lại trên bản deploy, và nhớ là số vòng chỉ áp dụng cho tài khoản được băm lại sau đó. Khi đo, giãn các lần thử ra — bắn liên tiếp sẽ dựng isolate nguội và cho số cao giả.

Cái giữ an toàn ở đây là password dài và ngẫu nhiên, không phải số vòng lặp. Số vòng được nhúng trong chuỗi hash nên đổi về sau không cần migration.

Chưa có rate limit cho login — muốn có phải thêm KV hoặc Durable Objects, trái với chủ trương giữ hạ tầng tối thiểu. Bù lại, khi username không tồn tại thì server vẫn verify với một bản ghi giả có **cùng số vòng**, để đăng nhập sai tài khoản và sai mật khẩu tốn thời gian như nhau.

## Giao diện

**Hai vỏ khác nhau, không phải một.** Quản lý dùng `AppLayout` — sidebar, tìm nhanh `Ctrl+K`, bảng dày. Người thuê dùng `TenantLayout` — một cột, không có điều hướng, vì họ có đúng một phòng và mở app mỗi tháng đôi lần trên điện thoại.

Người thuê chỉ có **một màn**: kỳ đang phải trả hiển thị đầy đủ kèm QR, bên cạnh là biểu đồ điện/nước và danh sách các kỳ khác mở ra khi cần. Kỳ được làm nổi là **kỳ mới nhất thực sự có hóa đơn**, không phải kỳ mới nhất — chủ nhà thường ghi chỉ số trước khi phát hành hóa đơn, và trong khoảng đó kỳ mới nhất chưa có gì để trả.

**Hai màu ngữ nghĩa, không thêm màu thứ ba.** Hổ phách là tiền còn nợ, xanh lá là tiền đã thu và cũng là màu hành động chính. Mọi thứ khác trung tính, nhờ vậy một dòng hổ phách trên trang yên tĩnh là không thể bỏ sót. Chiều sâu đến từ **thang bề mặt** (`paper < panel < card < input`) chứ không từ việc thêm màu.

**Song ngữ Việt – Anh.** Server không tham gia: `message` trong envelope là văn xuôi tiếng Anh dành cho log và bên tích hợp, SPA không bao giờ hiển thị nó — SPA tự dựng câu từ `error.code`. Thêm một ngôn ngữ là thêm một file trong `src/client/i18n/locales/`, không đụng server.

Mặc định là **tiếng Việt**, không theo `navigator.language`: điện thoại để tiếng Anh là chuyện thường và không nói lên rằng người ta muốn đọc hóa đơn của mình bằng tiếng Anh.

Ngày giữ `dd/mm/yyyy` ở **cả hai** ngôn ngữ. Dùng `en-US` sẽ khiến cùng một ngày hiện thành hai chuỗi đảo nhau tuỳ ngôn ngữ đang bật — trên màn hóa đơn thì đó là lỗi không ai báo.

**Giao diện sáng / tối / theo hệ thống**, chọn trong menu tài khoản. Lựa chọn được áp bởi một script inline trong `index.html` **trước khi trang vẽ lần đầu**, nếu không thì ai chọn Tối trên máy đang để Sáng sẽ thấy nháy trắng mỗi lần tải. Script đó buộc phải inline, nên CSP mang theo **sha256 của đúng chuỗi byte đó** thay vì `'unsafe-inline'` — sửa script mà quên sinh lại hash thì nó bị chặn im lặng và nháy quay lại. Lệnh sinh hash nằm sẵn trong `public/_headers`.

## Thanh toán

- **Mặc định:** sinh mã VietQR cho mỗi hóa đơn (số tiền + nội dung chứa mã hóa đơn, ví dụ `HD3C8EA506`). Người thuê quét và chuyển khoản; quản trị đánh dấu đã thu.

  Cấu hình tài khoản nhận tiền trong **Cài đặt** của từng nhà: ngân hàng (mã BIN NAPAS), số tài khoản, tên chủ tài khoản. Chưa cấu hình thì hóa đơn chỉ hiện nội dung chuyển khoản dạng chữ, không có QR.

  Payload QR do ứng dụng tự sinh theo chuẩn EMVCo/NAPAS rồi vẽ thành SVG ngay trên trình duyệt — không gọi `img.vietqr.io` hay dịch vụ ảnh QR nào. Lý do: không để bên thứ ba biết ai nợ bao nhiêu, và dịch vụ đó sập thì hóa đơn vẫn dùng được. Số tiền mã hoá trong QR là **số còn lại**, nên hóa đơn trả một phần sẽ quét ra đúng phần thiếu.

  Mọi dòng thông tin chuyển khoản đều có nút copy riêng. Số tiền **copy ra số nguyên** (`2415000`) trong khi hiển thị `2.415.000 đ` — dán chuỗi đã format vào app ngân hàng thì chuyển sai số hoặc bị từ chối.

- **Tự động (tùy chọn):** đăng ký SePay để nhận webhook biến động số dư. Route `/api/webhook/sepay` bóc mã hóa đơn từ nội dung chuyển khoản, cập nhật `invoices.status = 'PAID'` và ghi vào `payments`. Gói miễn phí của SePay đủ cho quy mô này.

## Deploy

```bash
npm run deploy           # build rồi wrangler deploy, một lệnh
```

Domain khai báo ngay trong `wrangler.toml`, không cần vào dashboard:

```toml
routes = [{ pattern = "rentals.dev1sme.cloud", custom_domain = true }]
```

`wrangler deploy` tự tạo DNS record trong zone và cấp HTTPS. Lưu ý: khi đã có `routes`, Cloudflare **tắt** URL `*.workers.dev`; muốn giữ thì thêm `workers_dev = true`. Wrangler tạo DNS record cho custom domain nhưng **không xoá** khi bỏ route — đổi domain thì phải dọn record cũ bằng tay.

Bản đang chạy: **https://rentals.dev1sme.cloud** (trước đây là `fmh.dev1sme.cloud`).

## Ghi chú về chi phí

Ứng dụng nằm gọn trong hạn mức miễn phí của Cloudflare:

- Workers: 100.000 request/ngày, 10ms CPU/request.
- D1: 5 GB lưu trữ, ~5 triệu dòng đọc/ngày, ~100 nghìn dòng ghi/ngày.

Thực tế mỗi tháng chỉ ghi thêm vài chục dòng, nên gần như không thể chạm trần. Đáng chú ý: `/api/dashboard` gộp 6 câu truy vấn vào một `db.batch()` và vẫn chỉ tốn 1–2ms CPU — thời gian chờ D1 không tính vào hạn mức CPU, nên gộp query là miễn phí ở đúng cái hạn mức đang siết.

## Việc cần làm

- [x] Khởi tạo dự án React (Vite) + Hono + Wrangler
- [x] Viết migration tạo bảng
- [x] Đăng nhập + phân quyền quản lý / người thuê
- [x] API: rooms / readings / invoices / payments
- [x] Logic sinh hóa đơn từ chỉ số công tơ
- [x] Giao diện: danh sách phòng, form nhập chỉ số, trang hóa đơn, trang người thuê
- [x] Quản lý tài khoản: tạo, đổi tên, đặt lại mật khẩu; người dùng tự đổi mật khẩu
- [x] Sinh mã VietQR trên hóa đơn
- [x] Tuỳ chọn chuyển khoản MoMo (dạng thông tin, không có QR)
- [x] Deploy lần đầu + kiểm tra CPU time thực tế của route đăng nhập
- [x] Gắn domain riêng
- [x] Song ngữ Việt – Anh
- [x] Giao diện sáng / tối / theo hệ thống
- [ ] Nhập số liệu thật trên bản deploy: nhà, phòng, người thuê, tài khoản ngân hàng
- [ ] Tạo tài khoản thật cho từng phòng
- [ ] (Tùy chọn) Webhook SePay tự động xác nhận thanh toán
- [ ] Chọn test runner — hiện chưa có test nào
