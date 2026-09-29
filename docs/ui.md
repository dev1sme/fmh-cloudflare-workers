# Giao diện

## Hai vỏ, không phải một

`AppLayout` là panel quản lý — sidebar, tìm nhanh `Ctrl+K`, bảng dày. `TenantLayout` là một cột ở giữa, có header và menu tài khoản, **không có điều hướng**.

Hai vỏ từng là một — đó là tiện cho việc code chứ không phải quyết định thiết kế. Người thuê có một phòng, mở app một hai lần mỗi tháng, trên điện thoại, để xem mình nợ gì và quét QR — vậy mà từng bị cho xem một sidebar có ba mục đều dẫn tới những lát cắt của cùng một bảng.

Nên người thuê chỉ có **một màn** (`MyHomePage`): kỳ đang phải trả hiện đầy đủ kèm QR, cạnh đó là biểu đồ điện/nước, rồi các kỳ trước dạng dòng một hàng, mở ra khi cần. Kỳ được làm nổi là **kỳ mới nhất thực sự có hóa đơn**, không phải kỳ mới nhất — chủ nhà thường ghi chỉ số trước khi phát hành hóa đơn, và trong khoảng đó kỳ mới nhất chưa có gì để trả.

Chỉ kỳ đó được tải đầy đủ (`me.invoice(code)`); các kỳ khác lấy dạng tóm tắt từ `me.dashboard()`. `useMyInvoice("")` resolve thành null để một kỳ có chỉ số mà chưa có hóa đơn không bắn request.

`/dashboard`, `/my-invoices`, `/my-readings` của người thuê redirect về `/` thay vì 404, để bookmark cũ vẫn tới chỗ có ích. `MyDashboardPage`, `MyInvoicesPage`, `MyReadingsPage`, `MonthsTable`, `InvoiceCard`, `ReadingsHistoryTable` đã bị xoá, không giữ lại "phòng khi cần".

**Bảng của quản lý dưới breakpoint `sm` chuyển thành card.** Chín cột trên màn 390 px là cuộn ngang với tên phòng nằm ngoài màn — mất hết ý nghĩa của cột. `InvoicesPage` render `InvoicesTable` trên `sm` và `InvoiceCards` dưới `sm`: cùng dữ liệu, mỗi hóa đơn một card. Các bảng quản lý khác vẫn cuộn ngang; chuyển tương tự khi bắt đầu được dùng trên điện thoại.

`QuickSearch` (`Ctrl+K`) chỉ có ở quản lý, tải danh sách phòng và hóa đơn một lần khi mount. Ở quy mô này lọc vài chục dòng trong bộ nhớ tốt hơn một endpoint tìm kiếm cần index riêng và câu chuyện phân quyền riêng.

## Hệ thị giác

`src/client/theme.ts` và `theme.css` giữ mọi quyết định thiết kế; component không được gán cứng màu hay kích thước.

- **Hai màu ngữ nghĩa, không thêm màu thứ ba.** `owed` (hổ phách) là tiền còn nợ; `settled` (xanh lá) là tiền đã thu và cũng là màu hành động chính. Cả hai là tuple Mantine đầy đủ. Màu thứ ba sẽ làm loãng đúng tín hiệu app tồn tại để đưa ra: một dòng hổ phách trên trang yên tĩnh là không thể bỏ sót.
  - Ngoài hai màu đó chỉ còn **`red`** (xoá, huỷ, chuyển đi, lỗi) và **`gray`** (nhãn trung tính, cảnh báo không liên quan tới tiền — `Alert` xám kèm `IconAlertTriangle`). Không `orange`/`yellow` (lẫn với `owed`), không `teal`/`blue` (một màu xanh lá thứ hai, và một màu thứ ba). Trạng thái `PAID`, người thuê đang ở, vai trò quản lý, toast thành công đều là `settled`.
  - Chữ màu dùng `c="owed"` / `c="settled"`, **không** `c="owed.6"`: tên không kèm shade resolve về biến `-text`, biến này được chỉnh riêng cho từng chế độ sáng/tối.
- **Tương phản WCAG AA trên nền be.** Mantine chọn shade chữ cho nền trắng; `--fmh-paper` tối hơn nhiều, nên `dimmed` từng chỉ đạt 2,6:1, hổ phách 3,1:1, xanh lá 3,6:1. `cssVariablesResolver` trong `theme.ts` đè các biến chữ ở chế độ sáng (`dimmed`, `owed-text`, `settled-text`, `anchor`, `red-text`, `error`) để đạt ≥ 4,5:1. `primaryShade` là 7 ở cả hai chế độ: chữ trắng trên shade 5 chỉ đạt 3,2:1. Đổi màu nền hay thang màu thì đo lại.
- **Nút trong card đủ lớn để chạm.** `*Actions` dùng chung cho bảng và card; bảng (chuột) giữ `size="xs"`, card (điện thoại) truyền `size="sm"`.
- **Trung tính ấm.** Thang `dark` xám-xanh của Mantine được thay bằng xám-nâu, để hổ phách và xanh lá đọc như mực trên giấy chứ không như neon trên nền đen. Chiều sâu đến từ **thang bề mặt** (`paper < panel < card < input`, bắt đầu từ `--fmh-paper`), đường kẻ từ `--fmh-rule` — không từ việc thêm màu.
- **Chữ số dạng bảng toàn cục** (`font-variant-numeric: tabular-nums lining-nums`). Tiền phòng và chỉ số công tơ được so dọc theo cột; chữ số tỉ lệ làm `1` hẹp hơn `8` và cột bị lượn. Ô tiền còn có `.fmh-num` để căn phải.
- **Dòng kẻ mảnh, không sọc ngựa vằn.** Sọc cạnh tranh với màu hổ phách — thứ thực sự mang nghĩa. Không `Table` nào có `striped`; đường viền đến từ `theme.css`.
- **`CollectionBar` thay cho badge trạng thái** trên dòng hóa đơn. `CHƯA THANH TOÁN` trả lời có/không, nhưng câu hỏi thật là còn bao nhiêu chưa thu — hóa đơn trả nửa và hóa đơn chưa đụng tới là cùng một badge. Hóa đơn huỷ nhận nhãn phẳng thay vì tỉ lệ, vì chưa từng nợ gì.

**Font Be Vietnam Pro**, bốn weight, chỉ subset `latin` + `vietnamese`, từ `@fontsource` chứ không CDN (CSP cho `font-src 'self'`). Khoảng 148 kB woff2 trong `dist/`; trình duyệt chỉ tải subset cần.

Be Vietnam Pro rộng hơn system stack nó thay, và đã làm hỏng hai thứ một lần: nhãn trục biểu đồ và số trên stat card bị tràn. Số tiền dài trên trục dùng `moneyShort` (`4,5tr`), giá trị chính xác giữ trong tooltip; stat card đo bằng `rem` và cho xuống dòng. Kiểm lại cả hai sau mọi thay đổi về chữ.

**Motion** (`motion`, tức Framer Motion) dùng đúng một chỗ: `PageTransition`, nâng 6 px trong 180 ms khi đổi route. Đây là công cụ mở hai mươi lần mỗi ngày — hiệu ứng duyên dáng ở lần đầu sẽ vướng víu ở lần thứ hai mươi. `useReducedMotion` thu khoảng cách về 0 chứ không bỏ component, để layout không xê dịch giữa hai chế độ.

**Recharts** tốn ~400 kB raw / 113 kB gzip, là thứ lớn nhất build ra. Từ khi chia route nó là chunk riêng, chỉ tải khi quản lý mở `/dashboard` — người thuê không bao giờ tải. Nó chỉ đáng giá nếu biểu đồ dashboard đáng giá; bỏ `RevenueChart` là gỡ được cả dependency.

## Song ngữ Việt – Anh

Server không tham gia: `message` trong envelope là văn xuôi tiếng Anh cho log và bên tích hợp, SPA không bao giờ hiển thị — SPA tự dựng câu từ `error.code` (→ [api.md](api.md)). Thêm ngôn ngữ là thêm một file trong `src/client/i18n/locales/`, không đụng server.

Mặc định **tiếng Việt**, không theo `navigator.language`: điện thoại để tiếng Anh là chuyện thường và không nói lên rằng người ta muốn đọc hóa đơn của mình bằng tiếng Anh.

Ngày giữ `dd/mm/yyyy` ở **cả hai** ngôn ngữ. Dùng `en-US` sẽ khiến cùng một ngày hiện thành hai chuỗi đảo nhau tuỳ ngôn ngữ đang bật — trên màn hóa đơn thì đó là lỗi không ai báo.

## Sáng / tối / theo hệ thống

Chọn trong menu tài khoản. Lựa chọn được áp bởi một script inline trong `index.html` **trước khi trang vẽ lần đầu**; không thì ai chọn Tối trên máy đang để Sáng sẽ thấy nháy trắng mỗi lần tải.

Script đó buộc phải inline, nên CSP mang **sha256 của đúng chuỗi byte đó** thay vì `'unsafe-inline'`. Sửa script mà quên sinh lại hash thì nó bị chặn im lặng và nháy quay lại. Lệnh sinh hash nằm trong comment đầu `public/_headers`. → [security-headers.md](security-headers.md)
