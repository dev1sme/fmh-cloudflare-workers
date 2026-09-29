# Thanh toán

Luồng mặc định là **thủ công**: mỗi hóa đơn hiện một mã VietQR, nội dung chuyển khoản chứa mã hóa đơn (vd `HD3C8EA506`); người thuê quét và chuyển; quản lý đánh dấu đã thu. Webhook SePay (tuỳ chọn) tự làm bước cuối.

## Tài khoản nhận tiền

Thông tin ngân hàng nằm trên `buildings` (`bank_bin`, `bank_account_no`, `bank_account_name`, migration 0002), vì mỗi nhà có thể thu vào một tài khoản khác. Quản lý cấu hình trong màn **Nhà**: ngân hàng (mã BIN NAPAS), số tài khoản, tên chủ tài khoản.

`GET /api/invoices/:code` trả `bank_transfer` kèm payload, hoặc **null** khi nhà chưa có thông tin ngân hàng, hóa đơn đã huỷ, hoặc không còn gì phải trả — UI khi đó chỉ hiện mã hóa đơn dạng chữ.

Số tiền mã hoá là **`outstanding`, không phải `total`**: hóa đơn trả một phần sẽ quét ra đúng phần còn thiếu.

## VietQR tự sinh

Payload QR **do app tự dựng** (`src/server/domain/vietqr.ts`, EMVCo TLV theo profile NAPAS), rồi vẽ thành SVG ngay trên trình duyệt bằng `@paulmillr/qr`.

**Không thay bằng `img.vietqr.io` hay bất kỳ dịch vụ ảnh QR nào.** Lý do: làm vậy là báo cho bên thứ ba biết ai nợ bao nhiêu, và dịch vụ đó sập thì trang hóa đơn hỏng theo.

CRC là CRC-16/CCITT-FALSE tính trên payload **kể cả** tag `6304` ở cuối. Sửa phần này thì kiểm lại với vector chuẩn: `"123456789"` → `29B1`.

## Copy từng dòng

Mọi thông tin chuyển khoản đi qua `CopyableRow` (`src/client/components/`): số tài khoản, số tiền, nội dung — mỗi dòng một nút copy thấy được. Người thuê trả bằng điện thoại, nên tooltip `title` trên chữ không phải thứ họ tìm ra được; nút phải là control thật.

**Số tiền copy ra số nguyên** (`2415000`) trong khi hiển thị `2.415.000 đ`. Dán chuỗi đã format vào app ngân hàng thì chuyển sai số hoặc bị từ chối, nên `CopyableRow` tách `value` và `display`. Dòng tiền mới nào cũng phải làm vậy.

## MoMo

Chỉ hiện dạng chữ (`momo_phone`, `momo_name` trên `buildings`), **không bao giờ QR**: định dạng payload QR cá nhân của MoMo chưa được xác minh ở đây, và đoán sai có thể gửi tiền vào ví người khác.

## Webhook SePay

`POST /hooks/sepay-payment` nhận webhook biến động số dư. Gói miễn phí của SePay đủ cho quy mô này.

Nằm ngoài `/api` vì không client nào gọi nó và nó không thuộc bề mặt API của app — nghĩa là **`run_worker_first` trong `wrangler.toml` phải có `/hooks/*`**, nếu không Cloudflare trả `index.html` từ kho asset và Worker không bao giờ chạy. Một webhook trả 200 kèm trang HTML trông như đã nhận, và làm mất mọi khoản thanh toán.

Luồng xử lý: bóc mã hóa đơn từ nội dung chuyển khoản (`parseInvoiceCode`, không phân biệt hoa thường, chuẩn hoá về in hoa) → tra `getInvoiceByCode` → insert một dòng `payments` → gọi `syncInvoiceStatus`.

Nó **suy lại** trạng thái từ `SUM(payments)` chứ không set `PAID` thẳng — cùng đường với payment nhập tay. Người thuê chuyển thiếu là đã trả một phần, chưa trả hết, và hóa đơn phải tiếp tục nói đúng như vậy.

### Xác thực

**HMAC-SHA256** — cách SePay khuyến nghị, không dùng header API key. SePay gửi `X-SePay-Signature: sha256=<hex>` và `X-SePay-Timestamp: <unix seconds>`, ký chuỗi `` `${timestamp}.${rawBody}` `` bằng **Secret Key** trong dashboard của họ (`SEPAY_WEBHOOK_SECRET`).

- **Kiểm chữ ký trên raw body, trước khi parse.** `c.req.text()` trước, `JSON.parse` sau. Chữ ký phủ đúng từng byte SePay gửi; parse rồi serialize lại là đổi thứ tự key và khoảng trắng, chữ ký sẽ không bao giờ khớp.
- Timestamp lệch quá **300 giây** bị từ chối trước cả khi kiểm chữ ký. Chữ ký có hiệu lực mãi mãi, nên không có cửa sổ này thì một request bị bắt trên đường có thể phát lại vô hạn. SePay ký lại mỗi lần retry, nên không xung đột với cơ chế retry.
- So sánh chữ ký dùng `secretsEqual` (thời gian hằng), không dùng `===`.
- Chưa đặt secret thì route trả **503 `WEBHOOK_NOT_CONFIGURED`**, không phải 401: không chữ ký nào verify được, và một deployment chưa cấu hình không được nhận ghi ẩn danh vào `payments`.

### Status code là chỉ thị cho SePay, không phải phán quyết

SePay retry mọi response không phải 2xx kèm `{"success": true}` trong 30 giây. Vì vậy mọi thứ mà retry không sửa được đều **trả 200 và dừng**: tiền ra thay vì vào, nội dung không có mã, hóa đơn không tồn tại, hóa đơn đã huỷ, giao dịch đã ghi rồi. Chỉ từ chối khi sai xác thực (401), JSON không parse được (400), và lỗi thật (500).

Retry là lý do `payments.external_id` tồn tại (migration 0008): id giao dịch SePay, có partial unique index. **Index** mới là thứ làm việc gửi lại an toàn, kể cả hai lần retry chạy đua — kiểm SELECT-rồi-INSERT sẽ để cả hai lọt. Route bắt lỗi constraint và trả 200.

Hóa đơn đã huỷ thì để yên. Tiền vẫn về, nên đó là việc quản lý xử lý tay, không ghi vào một hóa đơn chưa bao giờ nợ.

### Tình trạng trên production

Đã verify: timestamp thiếu/cũ → 401 `STALE_SIGNATURE`, chữ ký sai → 401 `UNAUTHORIZED`, response là JSON envelope chứ không phải `index.html`. **Một lần nhận thành công thật vẫn chưa từng xảy ra** — đường chấp nhận mới chỉ chạy local với payload ký tay. Xác nhận bằng một giao dịch nhỏ thật và `wrangler tail`.
