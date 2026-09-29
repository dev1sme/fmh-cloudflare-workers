# Kiến trúc

## Một Worker phục vụ tất cả

Vite build React SPA và Worker cùng lúc; chính Worker đó phục vụ asset tĩnh và xử lý `/api/*` bằng Hono. Một lần deploy, một URL. Next.js/OpenNext đã bị loại có chủ đích để tránh gánh cấu hình — không đưa meta-framework trở lại.

| Thành phần | Lựa chọn |
|---|---|
| Frontend | React + Vite (SPA), react-router |
| Giao diện | Mantine, `@tabler/icons-react`, `@mantine/spotlight`, `@mantine/charts` (Recharts), `motion` |
| Đa ngôn ngữ | `i18next` + `react-i18next` (vi / en) |
| API | Hono trên Cloudflare Workers |
| Database | Cloudflare D1 (SQLite) |
| Đăng nhập | JWT không trạng thái (`jose`) trong cookie `httpOnly`; PBKDF2 qua Web Crypto |
| Thanh toán | VietQR tự sinh + webhook SePay |
| Thông báo | Zalo bot, cấu hình trong DB |
| Ngôn ngữ | TypeScript |

Build và dev chạy qua [`@cloudflare/vite-plugin`](https://developers.cloudflare.com/workers/vite-plugin/), không phải Vite trần cộng `[assets] directory` tự viết:

- `npm run dev` chạy Worker trong runtime workerd thật, kèm D1 local và HMR cho client, trong **một process**.
- `assets.directory` **không** khai báo trong `wrangler.toml` — plugin tự trỏ vào output build của client.
- `vite build` xuất `dist/client/` (asset) và `dist/nha_tro/` (Worker + một `wrangler.json` sinh ra). Deploy đọc file sinh ra; `wrangler.toml` là đầu vào.
- `run_worker_first = ["/api/*", "/hooks/*"]` đưa đúng hai prefix đó vào Worker; mọi đường dẫn khác rơi xuống SPA (`not_found_handling = "single-page-application"`). Đường dẫn không có trong danh sách **không bao giờ chạy route** — nó nhận `index.html`.

## Cấu trúc thư mục

```
index.html            entry Vite; kèm script đặt theme trước khi paint
public/               copy nguyên vào dist/client/ — _headers, favicon.svg
src/client/           React SPA
  App.tsx             chỉ làm cổng phiên đăng nhập
  routes.tsx          bảng route theo vai trò
  api.ts              wrapper có kiểu cho mọi endpoint
  errors.ts           mã lỗi API -> câu hiển thị, toast
  format.ts           tiền / ngày / kỳ
  theme.ts, theme.css mọi quyết định thị giác
  i18n/               cấu hình i18next + locales/vi.ts, locales/en.ts
  hooks/              useResource, useConfirm, usePeriodParam
  components/         UI dùng chung nhiều feature (AppLayout, TenantLayout,
                      InvoiceLines, PaymentsTable, PeriodPicker, CopyableRow,
                      VietQR, CollectionBar, QuickSearch, ChunkErrorBoundary, …)
  features/<name>/    login, dashboard, buildings, rooms, tenants, readings,
                      invoices, notifications, accounts, change-password,
                      not-found, my (màn của người thuê)
    XxxPage.tsx       chỉ ghép component
    components/       UI của riêng feature, mỗi component một file
    useXxx.ts         tải dữ liệu + mutation, không JSX
src/server/           API Hono trên Worker
  index.ts            entry Worker: bảng route, guard, map lỗi
  auth.ts             băm/verify mật khẩu, JWT, hai middleware vai trò
  envelope.ts         ok / failure / notFound — nơi duy nhất gọi c.json
  headers.ts          security header cho /api/*
  validate.ts         validate request viết tay
  notify.ts           định tuyến + fan-out thông báo
  types.ts            SessionUser / AppEnv
  routes/             auth, accounts, buildings, rooms, tenants, readings,
                      invoices, payments, me, bots, webhook
  domain/             logic thuần: invoice.ts, period.ts, vietqr.ts,
                      password.ts, code.ts, crypto.ts, zalo.ts
  db/                 một module mỗi bảng + sql.ts
src/shared/types.ts   kiểu API dùng chung client ↔ server
scripts/              hash-password.mjs (băm offline lúc bootstrap)
migrations/           SQL cho D1
```

Route handler validate và quyết định; **không viết SQL** — SQL nằm trong `db/`, mỗi bảng một file. Tính tiền nằm trong `domain/invoice.ts` để test được mà không cần database.

TypeScript chia ba project reference: `tsconfig.app.json` (client, DOM lib), `tsconfig.worker.json` (Worker, type workerd), `tsconfig.node.json` (`vite.config.ts`). Client **không** import từ `src/server/`, chỉ từ `src/shared/`.

**Mọi thứ trong code đều là tiếng Anh**: URL, tên thư mục, cột DB, field API, mã lỗi, giá trị enum, và cả tên hàm, biến, hook, component, type. Tiếng Việt chỉ còn ở chữ trên UI (`src/client/i18n/locales/vi.ts`) và ở nội dung tin nhắn Zalo (`domain/zalo.ts`). Tên định danh tiếng Việt từng được giữ "cho nội bộ" rồi được đổi hết sang tiếng Anh — đừng thêm lại.

## Phân tầng client

Theo quy ước, không có công cụ ép:

- `*Page.tsx` **ghép** — giữ state cấp màn (modal nào đang mở, kỳ nào đang chọn) và render component. Không gọi `api.ts` trực tiếp, không chứa JSX của bảng/modal, không `try/catch` quanh request.
- `use*.ts` trong feature sở hữu việc tải dữ liệu và mutation. Mutation trả `Promise<boolean>` và tự bắn toast, nên nơi gọi chỉ quyết định có đóng modal hay không.
- Component trong `features/*/components/` nhận props và callback, **không** import `api.ts`. UI dùng ở hơn một feature thì chuyển lên `src/client/components/`.

Mục đích: thêm một animation hay sửa một bảng chỉ đụng một file. Page file bắt đầu phình thì tách ra, đừng để nó nuốt feature tiếp theo.

Hook truyền vào `useEffect` của component con **phải memo**. `suggest` của `useReadings` bọc `useCallback` vì đúng lý do đó — bỏ đi là `ReadingModal` render vòng vô hạn. Mảng mà con dùng để khởi tạo state cũng vậy: `useGeneratePreview` memo `rooms` bằng `useMemo` để effect chọn phòng của `GenerateInvoicesModal` không lặp.

Tải dữ liệu là `useResource` (fetch khi mount, `reload()` sau mutation). Không query library, không cache — một quản lý và vài phòng không cần. Xác nhận đi qua `useConfirm` (`confirm({...})` + render `confirmDialog`), **không bao giờ** `window.confirm`: dialog native không style được và chặn cả tab.

SPA không có guard phía client ngoài bảng route: `App.tsx` hỏi `GET /api/auth/me` một lần, rồi `routes.tsx` render route của quản lý hoặc người thuê. Đó là tiện điều hướng, không phải bảo mật — API mới là nơi ép vai trò.

Cả hai vai trò vào `/dashboard`; nhánh vai trò trong `routes.tsx` phân giải ra component khác nhau. Đường dẫn lạ render `NotFoundPage`, không redirect — chỉ `/` trần mới redirect về `/dashboard`. Trang 404 cố ý không phân biệt "không có trang này" với "trang của vai trò kia", vì nói ra là lộ tên route của quản lý cho người thuê. Do `not_found_handling = "single-page-application"`, Cloudflare trả **200 kèm `index.html`** cho mọi đường dẫn không phải asset, nên 404 là màn client-side, HTTP status không thể là 404.

## Code splitting

**Mọi màn sau đăng nhập là một chunk `React.lazy`.** Bảng route là chỗ hai vai trò tách nhau, nên là ranh giới chia duy nhất hợp lý. Trước khi chia, người thuê mở một hóa đơn trên điện thoại phải tải cả panel quản lý. Bundle entry giảm từ 1.302 kB (394 kB gzip) xuống 541 kB (171 kB); Recharts thành chunk 393 kB chỉ `/dashboard` tải.

Giữ eager, và lý do:

- `LoginPage` — màn đầu tiên người chưa đăng nhập thấy.
- `NotFoundPage` — nhỏ, và 404 không đáng một round trip.
- **Cả hai layout.** Lazy `AppLayout`/`TenantLayout` gây waterfall — React không bắt đầu import page được cho tới khi layout resolve và render `<Outlet />` — mà gần như không tiết kiệm gì, vì phần nặng là Mantine, hai vai trò đều tải.

`<Suspense>` nằm **trong mỗi layout**, bọc `<Outlet />` và **ngoài** `PageTransition`. Trong layout để chunk đang tải vẫn giữ sidebar và header; ngoài `PageTransition` để hiệu ứng nâng 180 ms chạy trên màn thật, không chạy trên spinner rồi bị thay mà không chuyển động.

`ChunkErrorBoundary` trong `main.tsx` xử lý lỗi duy nhất mà việc chia chunk sinh ra: tab mở xuyên qua một lần deploy xin hash chunk không còn tồn tại, SPA fallback của Cloudflare trả `index.html`, import fail vì MIME type. Không có boundary thì React unmount hết, màn trắng. Nó reload **một lần** — đó là toàn bộ cách sửa — và chỉ hiện nút nếu lỗi thứ hai tới trong 10 giây, vì khi đó reload không phải thứ đang hỏng. Lỗi **không phải** chunk thì ném lại từ `render`: đây không phải error boundary chung, không được biến bug thật thành "hãy tải lại trang".

Không cần đổi CSP — chunk import động là script cùng origin, đã nằm trong `script-src 'self'`.

Giao diện (hai vỏ, màu, font, motion) → [ui.md](ui.md).
