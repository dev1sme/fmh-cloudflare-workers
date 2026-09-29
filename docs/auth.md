# Đăng nhập & phân quyền

Không dùng framework auth. **Không trạng thái** — không có bảng session, và không nên có.

## Vai trò

| Vai trò | `users.role` | Quyền |
|---|---|---|
| Chủ nhà | `MANAGER` | Toàn quyền: nhà, phòng, người thuê, chỉ số, hóa đơn, thu tiền, tài khoản, thông báo |
| Người thuê | `TENANT` | Chỉ **xem** hóa đơn + chỉ số của phòng mình |

Tài khoản người thuê gắn với **phòng**, không gắn với người, qua `users.room_id`: khách chuyển đi thì đổi mật khẩu, tài khoản giữ nguyên. Schema ép cả hai chiều — `MANAGER` phải có `room_id` NULL, `TENANT` phải có, và một partial unique index giới hạn mỗi phòng một tài khoản.

## Middleware

Hai middleware trong `auth.ts`, mỗi vai trò một cái:

- `requireQuanLy` — endpoint quản lý; người thuê nhận 403.
- `requirePhong` — `/api/me/*`; bắt buộc token có `room_id`, nên quản lý nhận 403 ở đó.

**Không có `requireAuth` chung.** Đã từng có, và không route nào gắn nó: mọi route cần đăng nhập trong app thuộc đúng một vai trò, nên một guard chỉ kiểm "đã đăng nhập" là guard không ai dùng đúng được. Hai middleware tự kiểm phiên chứ không ghép nhau — lặp năm dòng, đổi lại không có helper nào dụ một route được bảo vệ ít hơn mức cần. `currentUser` là phần dùng chung, và nó không từ chối gì.

Phòng trong các query `/api/me/*` **luôn lấy từ token**, không bao giờ từ request. `GET /api/me/invoices/:code` kiểm lại `room_id` và trả **404 (không phải 403)** cho hóa đơn phòng khác, để không dò được mã.

### Bố cục route trong `src/server/index.ts`

**Mỗi mount mang guard riêng trên prefix riêng.** `quanLyOnly(...)` bọc từng router quản lý, `requirePhong` gắn trên `/api/me`, `requireQuanLy` truyền inline cho `/api/dashboard`; `/api/health`, `/api/auth/*` và `/hooks/*` không có guard.

Cố ý **không có middleware wildcard `/api/*`**. Đã từng có — một sub-app `admin` mount trên `/api` — và nó biến thứ tự đăng ký thành thứ quyết định phân quyền: route công khai chỉ công khai vì nằm trên dòng đó, route thêm vào bên dưới sẽ trả 401 mà trong file không có gì giải thích. Giờ thêm route là chọn guard, không phải chọn số dòng.

Hệ quả thấy được: `/api/...` không tồn tại trả 404 thay vì 401. Chấp nhận được — repo public, nên danh sách endpoint chưa bao giờ là bí mật.

## Phiên đăng nhập

- Đăng nhập đúng → ký JWT HS256 bằng `jose` (`sub` = user id, kèm `username` / `role` / `room_id`) → đặt vào cookie `session`: `httpOnly`, `secure`, `sameSite=Lax`, hạn 7 ngày.
- Claim `role` từng tên là `vai_tro` trước đợt đổi tên sang tiếng Anh; token phát trước đó bị từ chối — mọi người đã phải đăng nhập lại một lần.
- Màn login có route riêng `/login`. Chưa đăng nhập thì mọi đường dẫn chuyển về đó; đăng nhập xong thì `/login` chuyển về trang chủ của vai trò. **Không** mang theo đường dẫn đang muốn vào: nó thuộc về vai trò vừa thoát, không phải vai trò sắp vào.
- Phiên không trạng thái nên **đặt lại mật khẩu không đá phiên cũ ra** — JWT cũ còn hiệu lực tới khi hết hạn. Chấp nhận được với vài tài khoản, một quản lý; sửa thì cần cột token version và một lần tra cứu mỗi request.

## Mật khẩu

Lưu trong `users.password_hash` dạng `pbkdf2$sha256$<iterations>$<salt_b64>$<hash_b64>`. Số vòng nằm trong bản ghi, nên tăng về sau là băm lại + `UPDATE`, không cần migration.

**Plaintext không bao giờ được lưu và không bao giờ đọc lại được.** Mật khẩu sinh ra hoặc tự chọn chỉ trả **đúng một lần**, trong response của lệnh tạo/đặt lại, kèm nút copy để quản lý đưa cho người thuê. `GET /api/accounts` không bao giờ có `password_hash` hay mật khẩu. Quên thì đặt lại, không tra cứu. Đừng thêm endpoint, cột hay dòng log nào giữ plaintext, kể cả khi có ai xin tính năng "xem mật khẩu" — đặt lại cho cùng khả năng thực tế mà không mang rủi ro. Lý do: phần lớn tài khoản là của người thuê, và người ta hay dùng lại mật khẩu ở dịch vụ khác.

Hai kiểu đổi mật khẩu, cố ý ngược nhau:

- **Tự đổi** (`POST /api/auth/change-password`, cả hai vai trò) **có** yêu cầu mật khẩu hiện tại — chỉ cookie phiên không được đủ để khoá chủ thật khỏi một thiết bị bị bỏ quên.
- **Quản lý đặt lại** (`POST /api/accounts/:code/reset-password`) **không** yêu cầu.

Băm chạy **trong Worker** (`hashPassword` trong `auth.ts`), bằng Web Crypto (`crypto.subtle`), không dùng Node `crypto`. So sánh bằng hàm so byte thời gian hằng.

`scripts/hash-password.mjs` sinh đúng định dạng đó offline, và vẫn là cách tạo tài khoản quản lý **đầu tiên** khi DB còn rỗng:

```bash
npm run hash-password -- <username>                      # quản lý, tự sinh mật khẩu
npm run hash-password -- <username> <password>           # tự chọn mật khẩu
npm run hash-password -- <username> --room <ten_phong>   # tài khoản gắn phòng
```

Script in ra câu `INSERT ... ON CONFLICT DO UPDATE`; chạy bằng `./node_modules/.bin/wrangler d1 execute nha-tro --local` (hoặc `--remote`).

## Số vòng PBKDF2

**10.000, không phải 600.000 như OWASP khuyến nghị — có chủ đích.** Workers Free cho 10 ms CPU mỗi request; 50k vòng đo được 11–17 ms, vượt trần ở **mọi** lần đăng nhập.

Đo trên Worker đã deploy (`wrangler tail --format json`, trường `cpuTime`):

| Request | cpuTime |
|---|---|
| Login, username tồn tại (10k vòng) | **5 ms** |
| Login, username không tồn tại — sau khi sửa bản ghi giả | **median 4 ms, max 10 ms** (n=12, giãn cách) |
| Login, username không tồn tại — trước khi sửa | median 14 ms, max 26 ms (n=7) |
| `GET /api/dashboard` (6 query trong một batch) | **1–2 ms** |
| `GET /api/rooms`, `/buildings`, `/tenants` | 1–3 ms |
| `GET /api/health` | 0 ms |

**Cách lấy mẫu quyết định kết quả.** Mười hai lần đăng nhập cách nhau 2 giây cho median 4 ms, không lần nào qua 10 ms; tám lần bắn liên tiếp cho median 10 ms, đỉnh 16 ms, vì request đồng thời dựng isolate nguội. Giãn các lần thử ra — với vài tài khoản, bắn dồn không phải hình dạng traffic thật.

`/api/dashboard` tốn ngang một route một query chính là điểm mấu chốt: thời gian chờ D1 không tính vào CPU, nên batch sáu câu là miễn phí ở đúng cái ngân sách đang siết.

**Không bao giờ chỉnh số vòng theo benchmark máy local.** Máy dev chạy 50k mất ~6 ms — nhanh ~3 lần CPU Cloudflare — và đó chính là cách một bản login vượt trần đã từng được ship. Đổi xong phải đo lại trên bản deploy, và nhớ là hằng số mới chỉ áp dụng cho tài khoản được băm lại sau đó.

Đừng hạ xuống 5k: ở 5 ms, login thật đã nằm gọn trong ngân sách, nên giảm nửa work factor không được gì mà mất một bit.

Thứ giữ an toàn ở đây là **mật khẩu dài và ngẫu nhiên**, không phải số vòng. Điều đó chỉ đúng khi mật khẩu thực sự dài và ngẫu nhiên — mật khẩu quản lý tự đặt tay mới là điểm yếu, không phải số vòng.

### Bản ghi giả

Username không tồn tại thì `POST /api/auth/login` vẫn verify với một **bản ghi giả**, để sai username và sai mật khẩu tốn thời gian như nhau.

**Số vòng của bản ghi giả phải bằng `PBKDF2_ITERATIONS`.** Nó từng bị gán cứng 50k trong khi bản ghi thật ở 10k, và chỉ một chỗ lệch đó gây ra cả hai vấn đề:

- Đăng nhập *trượt* tốn 10–26 ms (median 14) so với 5 ms khi *trúng* — trượt thì vượt trần CPU.
- Tệ hơn, nó phá đúng thứ bản ghi giả sinh ra để bảo vệ: chênh lệch thời gian cho kẻ tấn công biết username nào tồn tại.

Giờ nó được nội suy từ hằng số, nên hai giá trị không thể lệch nữa.

## Không có rate limit

Chưa có rate limit cho login — muốn có phải thêm KV hoặc Durable Objects, trái với chủ trương giữ hạ tầng tối thiểu. Bù lại bằng vài tài khoản cố định với mật khẩu dài ngẫu nhiên.
