# Thông báo

Tin nhắn Zalo bot cho đúng hai sự kiện: một lần sinh hóa đơn, và tiền về. Không gì khác — một công cụ mở hai lần mỗi tháng không cần luồng thông báo.

Quản lý trong màn **Thông báo**, không cần deploy.

## Vì sao là bảng, không phải ba secret

Từng là `ZALO_BOT_TOKEN` / `ZALO_GROUP_CHAT_ID` / `ZALO_MANAGER_CHAT_ID` cho tới migration 0009. Env var chứa được một bot và hai chat; không chứa được N. Mỗi đích gửi thêm là một tên secret mới, một field mới trên `AppEnv`, một dòng mới trong `[secrets] required` của `wrangler.toml`, và một lần deploy — mà tên nào thiếu trong danh sách đó thì `undefined` lúc runtime, không cảnh báo gì. Dự án đã trả giá cho kiểu lỗi đó một lần.

Nên: `bots` (ai gửi) và `bot_targets` (gửi đi đâu). Hai bảng vì bot và đích gửi có vòng đời khác nhau — đổi group không được đụng token, thêm group không được đụng bot.

## Chia nội dung mới là điểm chính

`bot_targets.kind` quyết định **tin nhắn nói gì**, không chỉ gửi tới đâu:

- `GROUP` — vừa sinh hóa đơn cho N phòng. **Không tên phòng, không số tiền.**
- `MANAGER` — tiền vừa về, kèm phòng, số tiền và phần còn nợ.

Mọi thứ trong app đều tránh để người thuê này biết người thuê kia nợ bao nhiêu: mã hóa đơn ngẫu nhiên nên không đoán được từ nhau, payload VietQR tự sinh nên không bên thứ ba nào biết ai nợ gì. Một tin nhắn nhóm liệt kê tổng tiền từng phòng sẽ phá hết chỉ bằng một dòng. Vì vậy `kind` là enum có CHECK và **không patch được** — đổi là xoá rồi tạo lại, để không thể xảy ra vì bấm nhầm một select. UI hiện cảnh báo dưới field cũng vì lý do đó.

`building_id` NULL nghĩa là mọi nhà; có giá trị nghĩa là chỉ nhà đó — nhờ vậy mỗi nhà có một group riêng mà group này không biết số của group kia. `POST /api/invoices/generate` vì thế gửi **một tin mỗi nhà**, đếm từ các dòng thực sự được tạo, không phải một tin cho cả lần chạy.

## Token được mã hoá

`bots.token` lưu `v1.<iv_b64>.<ciphertext_b64>` — AES-GCM dưới `BOT_ENCRYPTION_KEY` (32 byte base64, `openssl rand -base64 32`). `domain/crypto.ts` sở hữu định dạng; tiền tố `v1.` tồn tại để lần xoay khoá sau vẫn đọc được thứ đã lưu.

Một token Zalo bot đăng được với tư cách bot vào mọi chat bot đang ở. Thế là đủ để gửi vào group người thuê một thông báo hóa đơn giả kèm số tài khoản của người khác — lời nói dối mà người thuê không có cách nào nhận ra. Mã hoá không nhằm chống kẻ đã có Worker, mà chống: một bản export D1, một lệnh MCP `d1_database_query` (được phép đọc DB remote không cần hỏi), và một ảnh chụp kết quả query. Cả ba giờ chỉ thấy ciphertext.

**IV 12 byte ngẫu nhiên mới cho mỗi lần mã hoá, không bao giờ dùng lại.** Dùng lại IV dưới cùng khoá trong GCM không làm yếu nó — mà vứt bỏ nó.

Token **chỉ ghi được trên toàn API**. Vào qua `POST /api/bots` hoặc `POST /api/bots/:code/token`; không response nào chứa nó. `Bot` mang `has_token` thay vào. Cùng quy tắc với mật khẩu — quên thì thay, không lấy lại. `token` chỉ nằm trong đúng một SELECT (`getBotTokenById`) cộng query định tuyến, nên không có route nào lộ nó vì quên lọc field.

Chưa đặt khoá thì các route bot trả **503 `ENCRYPTION_NOT_CONFIGURED`** thay vì lưu một token không bao giờ giải mã được — cùng hình dạng với webhook SePay thiếu secret. `BOT_ENCRYPTION_KEY` phải nằm trong danh sách `required` của `wrangler.toml`, không thì ở dev local nó vắng mặt khỏi `c.env` mà không báo gì.

**Xoay khoá không mã hoá lại các dòng đã có.** Mọi token bot phải nhập lại trong Thông báo sau đó. Token không giải mã được thì log và bỏ qua bot đó, không làm hỏng lần sinh hóa đơn.

## Gửi không bao giờ được làm hỏng thứ đã kích hoạt nó

`notify.ts` sở hữu định tuyến và fan-out; `domain/zalo.ts` sở hữu lời gọi API và câu chữ. Cả hai đường vào đều xếp hàng qua `c.executionCtx.waitUntil` và nuốt lỗi vào `console.error`. Một lần sinh hóa đơn fail vì Zalo sập là thiệt hại thật; một thông báo không tới thì không. Điều này quan trọng nhất với webhook SePay, vốn bỏ cuộc sau 30 giây rồi retry — chờ Zalo ở đó là liều một payment trùng để không được gì.

Fan-out dùng `Promise.allSettled`, không `all`. Với N đích, một chat đã kick bot ra sẽ làm dừng phần còn lại. Mỗi lỗi được log kèm chat id.

`POST /api/bot-targets/:code/test` là ngoại lệ duy nhất: nó chờ và trả kết quả (lỗi là `TEST_MESSAGE_FAILED` — 503 khi thiếu khoá, 502 khi Zalo từ chối), vì quản lý bấm nó để biết chat id có đúng không. Tin thử có ghi label của đích, nên một chat id trỏ nhầm chỗ sẽ lộ ra thay vì trông như thành công.

## Dễ làm sai

- Tin dùng `parse_mode: "markdown"`, không `text_styles`. Mảng style định vị theo UTF-16 code unit, mà tin có emoji — mỗi emoji hai unit — đếm lệch một offset là in đậm nhầm chữ.
- API Zalo trả **200 kèm `{"ok": false}`** khi lỗi, nên status code một mình không nói tin đã đi hay chưa.
- Giá trị từ DB đi qua `thoat()` trước khi nội suy — tên phòng quản lý gõ có thể chứa `_` hay `*`, nuốt nửa dòng còn lại vào chữ nghiêng.
- Chat id lấy lại được bất cứ lúc nào: nhắn bot, `@`-mention bot trong group, rồi gọi `getUpdates`. Group id có dạng `zgr-…`.
