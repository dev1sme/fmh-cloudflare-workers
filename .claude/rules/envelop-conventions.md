## 1. Response Format Rules

### Purpose

Chuẩn hóa JSON response để frontend, mobile, QA và integration partner tích hợp ổn định.

### 1.1 Envelope chuẩn

#### Success response

```json
{
  "success": true,
  "message": "Order created successfully.",
  "data": {
    "id": 123,
    "status": "pending",
    "total_amount": 250000,
    "created_at": "2026-06-08 10:20:30+01:00"
  },
  "meta": {
    "timestamp": 1149318030
  }
}
```

#### Error response

```json
{
  "success": false,
  "message": "Order cannot be cancelled.",
  "error": {
    "code": "ORDER_CANNOT_BE_CANCELLED",
    "details": null
  },
  "meta": {
    "timestamp": 1149318030
  }
}
```

#### Validation error response

```json
{
  "success": false,
  "message": "The given data was invalid.",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "customer_id": ["The customer id field is required."],
      "items.0.quantity": ["The items.0.quantity must be at least 1."]
    }
  },
  "meta": {
    "timestamp": 1149318030
  }
}
```

### 1.2 Quy tắc chung cho response

- Mọi response phải có `success`
- Response thành công nên có `message`, `data`, `meta`
- Response lỗi nên có `message`, `error`, `meta`
- `meta.timestamp` phải trả kiểu số
- Không đổi tên tùy tiện giữa `data`, `result`, `payload`
- Không trả raw model hoặc raw exception cho client

### 1.3 Format của thuộc tính

- Integer phải trả kiểu số thật, không được bọc trong dấu `""` hoặc `''`
- `timestamp` trong `meta` phải trả kiểu số, không được trả chuỗi
- Boolean trả kiểu boolean thật, không dùng chuỗi `"true"` hoặc `"false"`
- Numeric field phải ổn định kiểu dữ liệu giữa các endpoint
- Enum field trả giá trị ổn định, machine-readable, ví dụ `pending`, `paid`, `cancelled`
- Nullable field phải rõ ràng là `null` hoặc không có mặt theo một quy ước thống nhất

### 1.4 Exposure rules

- Không expose secret, token, password hash, internal key
- Không expose field nội bộ không nằm trong public contract
- Không trả stack trace hoặc exception message nội bộ trên production
