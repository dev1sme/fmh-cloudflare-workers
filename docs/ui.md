# Giao diện

## Hai vỏ, không phải một

`AppLayout` là panel quản lý — sidebar, tìm nhanh `Ctrl+K`, bảng dày. `TenantLayout` là một cột ở giữa, có header và menu tài khoản, **không có điều hướng**.

Hai vỏ từng là một — đó là tiện cho việc code chứ không phải quyết định thiết kế. Người thuê có một phòng, mở app một hai lần mỗi tháng, trên điện thoại, để xem mình nợ gì và quét QR — vậy mà từng bị cho xem một sidebar có ba mục đều dẫn tới những lát cắt của cùng một bảng.

Nên người thuê chỉ có **một màn** (`MyHomePage`): kỳ đang phải trả hiện đầy đủ kèm QR, cạnh đó là biểu đồ điện/nước, rồi các kỳ trước dạng dòng một hàng, mở ra khi cần. Kỳ được làm nổi là **kỳ mới nhất thực sự có hóa đơn**, không phải kỳ mới nhất — chủ nhà thường ghi chỉ số trước khi phát hành hóa đơn, và trong khoảng đó kỳ mới nhất chưa có gì để trả.

Thứ tự trên màn, từ trên xuống: **`StatusPanel`** (cả khối tô hổ phách "Số tiền cần thanh toán" kèm nút "Thanh toán ngay" cuộn tới QR, hoặc tô xanh "Đã thanh toán đủ"), hóa đơn kỳ đó dạng **biên lai** (`InvoiceLines` với `heading`), **`PaymentMethods`** (ngân hàng và MoMo là hai tab của một card, QR to đặt giữa), rồi các lần đã trả. Khi đã trả đủ, server không gửi `bank_transfer`/`momo` nên QR tự biến mất — không có mã nào để lỡ trả thêm — và chỗ đó chỉ còn danh sách các lần đã trả. Biểu đồ vẫn là **đường**, không phải cột (lý do trong `UsageTrend`), kèm một dòng tóm tắt "tháng gần nhất · ±% so với tháng trước" màu trung tính — xanh lá ở đây sẽ đọc thành "đã trả". Mỗi dòng kỳ khác có một chấm trạng thái đầu dòng.

Chỉ kỳ đó được tải đầy đủ (`me.invoice(code)`); các kỳ khác lấy dạng tóm tắt từ `me.dashboard()`. `useMyInvoice("")` resolve thành null để một kỳ có chỉ số mà chưa có hóa đơn không bắn request.

`/dashboard`, `/my-invoices`, `/my-readings` của người thuê redirect về `/` thay vì 404, để bookmark cũ vẫn tới chỗ có ích. `MyDashboardPage`, `MyInvoicesPage`, `MyReadingsPage`, `MonthsTable`, `InvoiceCard`, `ReadingsHistoryTable` đã bị xoá, không giữ lại "phòng khi cần".

**Màn quản lý.** Mỗi màn danh sách mở bằng `PageHeader`: tiêu đề, một dòng ngữ cảnh (bao nhiêu phòng / trống, bao nhiêu đã ghi chỉ số, hóa đơn kỳ này còn nợ bao nhiêu), nút của màn ở bên phải. Tổng quan không có dòng ngữ cảnh — ô chọn kỳ bên cạnh đã nói đúng điều đó. Tổng quan mở bằng `RevenuePanel`: "Còn phải thu" là `StatusPanel` (tô hổ phách, hoặc xanh khi thu đủ, hoặc trung tính khi kỳ chưa phát hành hóa đơn nào — xanh ở đó sẽ nói "đã thu" về một hóa đơn chưa từng có), phải thu / đã thu nằm trong thanh dưới con số thay vì là hai card ngang hàng. Chi tiết hóa đơn chia hai cột từ `64em`: hóa đơn và các thao tác bên trái, `PaymentMethods` ở chế độ xem trước bên phải, dính dưới header khi cột trái cuộn.

**Báo cáo doanh thu** (`/reports`, mục "Báo cáo" trong nhóm Thu tiền) trả lời câu Tổng quan không trả lời được: cả năm được bao nhiêu, so với năm trước ra sao — biểu đồ 12 kỳ ở Tổng quan không cho xem gì cũ hơn thế. Là màn riêng chứ không phải chế độ "năm" của Tổng quan, vì nửa Tổng quan (phòng đang thuê, chỉ số còn thiếu) mô tả *bây giờ* và vô nghĩa khi cộng cả năm. Từ trên xuống: `StatusPanel` doanh thu năm (theo kỳ hóa đơn) kèm % so với năm trước, thanh đã thu, và dòng "thực thu trong năm (theo ngày nhận tiền)"; biểu đồ tháng dùng lại `RevenueChart` của Tổng quan (hai đường, không phải cột — lý do trong component); theo nhà và theo phòng dạng danh sách một dòng kèm `CollectionBar`; bảng mọi năm, bấm một dòng để mở năm đó (dưới `sm` chỉ giữ cột doanh thu và còn nợ). Năm nằm ở `?year=`. Với năm hiện tại, tháng chưa tới — và tháng này khi chưa phát hành hóa đơn — **không vẽ**, không vẽ bằng 0: một đường rơi xuống đáy ở tháng 10 đọc thành doanh thu sụp. Năm không có hóa đơn nào dùng tone `neutral`.

**Bảng của quản lý dưới breakpoint `sm` chuyển thành card.** Chín cột trên màn 390 px là cuộn ngang với tên phòng nằm ngoài màn — mất hết ý nghĩa của cột. `InvoicesPage` render `InvoicesTable` trên `sm` và `InvoiceCards` dưới `sm`: cùng dữ liệu, mỗi hóa đơn một card. Các bảng quản lý khác vẫn cuộn ngang; chuyển tương tự khi bắt đầu được dùng trên điện thoại.

Bảng nằm **trong card hoặc modal** thì không cuộn ngang được một cách có ích — cột bị cắt mà không có dấu hiệu gì. `PaymentsTable` và bảng trong `GenerateInvoicesModal` gập cột phụ (hình thức, ghi chú, tiêu thụ) xuống dưới cột đầu ở dưới `sm`, để cột tiền và nút xoá luôn nằm trong màn.

`QuickSearch` (`Ctrl+K`) chỉ có ở quản lý, tải danh sách phòng và hóa đơn một lần khi mount. Ở quy mô này lọc vài chục dòng trong bộ nhớ tốt hơn một endpoint tìm kiếm cần index riêng và câu chuyện phân quyền riêng.

## Hệ thị giác

`src/client/theme.ts` và `theme.css` giữ mọi quyết định thiết kế; component không được gán cứng màu hay kích thước.

- **Hai màu ngữ nghĩa, không thêm màu thứ ba.** `owed` (hổ phách) là tiền còn nợ; `settled` (xanh lá) là tiền đã thu và cũng là màu hành động chính. Cả hai là tuple Mantine đầy đủ. Màu thứ ba sẽ làm loãng đúng tín hiệu app tồn tại để đưa ra: một dòng hổ phách trên trang yên tĩnh là không thể bỏ sót.
  - Ngoài hai màu đó chỉ còn **`red`** (xoá, huỷ, chuyển đi, lỗi) và **`gray`** (nhãn trung tính, cảnh báo không liên quan tới tiền — `Alert` xám kèm `IconAlertTriangle`). Không `orange`/`yellow` (lẫn với `owed`), không `teal`/`blue` (một màu xanh lá thứ hai, và một màu thứ ba). Trạng thái `PAID`, người thuê đang ở, vai trò quản lý, toast thành công đều là `settled`.
  - Chữ màu dùng `c="owed"` / `c="settled"`, **không** `c="owed.6"`: tên không kèm shade resolve về biến `-text`, biến này được chỉnh riêng cho từng chế độ sáng/tối.
- **Tương phản WCAG AA trên nền be.** Mantine chọn shade chữ cho nền trắng; `--fmh-paper` tối hơn nhiều, nên `dimmed` từng chỉ đạt 2,6:1, hổ phách 3,1:1, xanh lá 3,6:1. `cssVariablesResolver` trong `theme.ts` đè các biến chữ ở chế độ sáng (`dimmed`, `owed-text`, `settled-text`, `anchor`, `red-text`, `error`, `red-light-color`) để đạt ≥ 4,5:1. Đỏ là `#b02525` chứ không phải `red[9]`: `red[9]` đạt trên card nhưng chỉ 4,3:1 trên nền giấy, nơi "Xoá hóa đơn" nằm; nút `subtle`/`light` lấy màu chữ từ `-light-color` chứ không từ `-text`, nên phải đè cả hai. `primaryShade` là 7 ở cả hai chế độ: chữ trắng trên shade 5 chỉ đạt 3,2:1. Đổi màu nền hay thang màu thì đo lại.
- **Ô nhập 16 px trên điện thoại** (dưới `sm`, trong `theme.css`). iOS Safari tự phóng to trang khi focus một ô nhập dưới 16 px và không thu lại; Mantine mặc định 14 px. Không dùng `maximum-scale=1` trên viewport — cách đó tắt luôn pinch-zoom của người cần nó.
- **Nút trong card đủ lớn để chạm.** `*Actions` dùng chung cho bảng và card; bảng (chuột) giữ `size="xs"`, card (điện thoại) truyền `size="sm"`.
- **Trung tính ấm.** Thang `dark` xám-xanh của Mantine được thay bằng xám-nâu, để hổ phách và xanh lá đọc như mực trên giấy chứ không như neon trên nền đen. Chiều sâu đến từ **thang bề mặt** (`paper < panel < card < input`, bắt đầu từ `--fmh-paper`), đường kẻ từ `--fmh-rule` — không từ việc thêm màu.
- **Chữ số dạng bảng toàn cục** (`font-variant-numeric: tabular-nums lining-nums`). Tiền phòng và chỉ số công tơ được so dọc theo cột; chữ số tỉ lệ làm `1` hẹp hơn `8` và cột bị lượn. Ô tiền còn có `.fmh-num` để căn phải.
- **Dòng kẻ mảnh, không sọc ngựa vằn.** Sọc cạnh tranh với màu hổ phách — thứ thực sự mang nghĩa. Không `Table` nào có `striped`; đường viền đến từ `theme.css`.
- **Mỗi màn một điểm nhấn, không thêm màu.** Câu hỏi của màn (còn nợ bao nhiêu, còn phải thu bao nhiêu) nằm trong `StatusPanel`: cả khối tô bằng `--fmh-owed-surface` / `--fmh-settled-surface` (shade 0 và 2 của chính hai tuple, rgba ở chế độ tối), con số cỡ `.fmh-display` (2,25–3 rem) trong khi mọi số khác 1–1,5 rem. Nhiều nhất một khối như vậy mỗi màn — hai khối sẽ tranh cùng một ánh nhìn. `dimmed` trong khối ở chế độ tối được nâng lên `bark[1]` vì mặc định chỉ đạt 3,9:1 trên nền tô. Trong danh sách, dòng/card còn nợ mang vạch hổ phách ở mép trái (`.fmh-owes`).
- **`CollectionBar` thay cho badge trạng thái** trên dòng hóa đơn. `CHƯA THANH TOÁN` trả lời có/không, nhưng câu hỏi thật là còn bao nhiêu chưa thu — hóa đơn trả nửa và hóa đơn chưa đụng tới là cùng một badge. Hóa đơn huỷ nhận nhãn phẳng thay vì tỉ lệ, vì chưa từng nợ gì.

**Font Be Vietnam Pro**, bốn weight, chỉ subset `latin` + `vietnamese`, từ `@fontsource` chứ không CDN (CSP cho `font-src 'self'`). Khoảng 148 kB woff2 trong `dist/`; trình duyệt chỉ tải subset cần.

Be Vietnam Pro rộng hơn system stack nó thay, và đã làm hỏng hai thứ một lần: nhãn trục biểu đồ và số trên stat card bị tràn. Số tiền dài trên trục dùng `moneyShort` (`4,5tr`), giá trị chính xác giữ trong tooltip; stat card đo bằng `rem` và cho xuống dòng. Kiểm lại cả hai sau mọi thay đổi về chữ.

**Motion** (`motion`, tức Framer Motion) dùng đúng một chỗ: `PageTransition`, nâng 6 px trong 180 ms khi đổi route. Đây là công cụ mở hai mươi lần mỗi ngày — hiệu ứng duyên dáng ở lần đầu sẽ vướng víu ở lần thứ hai mươi. `useReducedMotion` thu khoảng cách về 0 chứ không bỏ component, để layout không xê dịch giữa hai chế độ.

**Nền trôi** (`BackgroundFX`: aurora + hai orb, CSS animation chứ không phải `motion`) đứng yên dưới `sm` và khi `prefers-reduced-motion`. Trên điện thoại, ba animation vô hạn trên lớp blur 90 px giữ GPU vẽ lại mỗi frame suốt lúc người thuê mở màn QR, trong khi orb 380 px gần như phủ kín màn 375 px nên chuyển động hầu như không thấy. Màu giữ nguyên, chỉ bỏ chuyển động.

**Recharts** tốn ~400 kB raw / 113 kB gzip, là thứ lớn nhất build ra. Từ khi chia route nó là chunk riêng, chỉ tải khi quản lý mở `/dashboard` — người thuê không bao giờ tải. Nó chỉ đáng giá nếu biểu đồ dashboard đáng giá; bỏ `RevenueChart` là gỡ được cả dependency.

## Song ngữ Việt – Anh

Server không tham gia: `message` trong envelope là văn xuôi tiếng Anh cho log và bên tích hợp, SPA không bao giờ hiển thị — SPA tự dựng câu từ `error.code` (→ [api.md](api.md)). Thêm ngôn ngữ là thêm một file trong `src/client/i18n/locales/`, không đụng server.

Mặc định **tiếng Việt**, không theo `navigator.language`: điện thoại để tiếng Anh là chuyện thường và không nói lên rằng người ta muốn đọc hóa đơn của mình bằng tiếng Anh.

Ngày giữ `dd/mm/yyyy` ở **cả hai** ngôn ngữ. Dùng `en-US` sẽ khiến cùng một ngày hiện thành hai chuỗi đảo nhau tuỳ ngôn ngữ đang bật — trên màn hóa đơn thì đó là lỗi không ai báo.

## Sáng / tối / theo hệ thống

Chọn trong menu tài khoản. Lựa chọn được áp bởi một script inline trong `index.html` **trước khi trang vẽ lần đầu**; không thì ai chọn Tối trên máy đang để Sáng sẽ thấy nháy trắng mỗi lần tải.

Script đó buộc phải inline, nên CSP mang **sha256 của đúng chuỗi byte đó** thay vì `'unsafe-inline'`. Sửa script mà quên sinh lại hash thì nó bị chặn im lặng và nháy quay lại. Lệnh sinh hash nằm trong comment đầu `public/_headers`. → [security-headers.md](security-headers.md)
