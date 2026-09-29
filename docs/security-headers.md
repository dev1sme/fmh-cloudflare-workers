# Security headers

Đặt ở **hai nơi, và cần cả hai**. `run_worker_first = ["/api/*", "/hooks/*"]` nghĩa là Cloudflare phục vụ mọi đường dẫn khác thẳng từ kho asset mà không gọi Worker, nên middleware Hono không bao giờ chạm tới trang HTML.

| Nơi | Phủ | Nội dung |
|---|---|---|
| `public/_headers` | SPA (HTML, JS, CSS) | CSP, HSTS, `nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` |
| `securityHeaders` trong `src/server/headers.ts` | `/api/*`, `/hooks/*` (mount trên `*`) | `Cache-Control: no-store`, `nosniff`, `Referrer-Policy`, CSP `default-src 'none'` |

`Cache-Control: no-store` trên API vì hóa đơn và tên người thuê không được nằm trong cache nào.

Vite copy `_headers` vào `dist/client/`; Cloudflare đọc nó như cấu hình, không phục vụ nó. Log khởi động in `Parsed N valid header rule` — xem số đó sau khi sửa.

## Middleware đặt header trước `await next()`

Hono giữ chúng làm prepared header và gộp vào bất kỳ response nào context cuối cùng dựng ra, kể cả 400 của `app.onError` và 404 của `app.notFound`. Dời chúng ra sau `next()` là âm thầm mất header trên mọi response lỗi, vì `ValidationError` bị ném ra thì không bao giờ quay lại middleware.

## CSP

- `style-src` cần `'unsafe-inline'`: Mantine chèn một `<style>` cho CSS variable lúc runtime.
- `script-src` **không** có `'unsafe-inline'`, mà mang **sha256 của đúng một script inline** trong `index.html` — script chọn theme chạy trước lần vẽ đầu (→ [ui.md](ui.md)). Sửa script đó mà không sinh lại hash thì nó bị chặn im lặng và màn nháy trắng quay lại. Lệnh sinh hash nằm trong comment đầu `public/_headers`.
- `src/client/components/VietQR.tsx` dùng `dangerouslySetInnerHTML`, nhưng SVG đến từ `@paulmillr/qr` dưới dạng dữ liệu `<path>`, không phải chuỗi nội suy.
- Chunk import động là script cùng origin, đã nằm trong `script-src 'self'`.
- Font từ `@fontsource`, không CDN — CSP cho `font-src 'self'`.

## HSTS

`max-age=31536000; includeSubDomains`, cố ý **không** có `preload`. Trình duyệt đã tải site một lần sẽ từ chối HTTP thường tới đúng hostname đó trong một năm, nên rút ngắn hay bỏ header không có hiệu lực ngay. Pin theo từng host: chuyển sang `rentals.dev1sme.cloud` bắt đầu một năm mới trên tên mới và để lại pin cũ trên tên cũ.

## Kiểm tra

`_headers` chỉ áp dụng cho build thật — `npm run dev` không phục vụ nó.

```bash
npm run build && ./node_modules/.bin/vite preview
```

Rồi kiểm cả một response asset lẫn một response API.
