-- Schema khởi tạo cho ứng dụng quản lý nhà trọ.
-- Quy ước: tên bảng tiếng Anh, tên cột tiếng Việt không dấu.
-- Tiền tệ lưu bằng INTEGER (đơn vị VND, không có phần thập phân).
-- Ngày tháng lưu bằng TEXT dạng ISO: 'YYYY-MM-DD' hoặc 'YYYY-MM-DDTHH:MM:SSZ'.

PRAGMA foreign_keys = ON;

CREATE TABLE buildings (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  address       TEXT,
  -- Đơn giá hiện hành, dùng để điền vào hóa đơn mới.
  -- Hóa đơn đã phát hành giữ đơn giá riêng của nó (xem bảng invoices).
  don_gia_dien  INTEGER NOT NULL DEFAULT 0,
  don_gia_nuoc  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE rooms (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  building_id  INTEGER NOT NULL REFERENCES buildings(id) ON DELETE RESTRICT,
  ten_phong    TEXT    NOT NULL,
  gia_phong    INTEGER NOT NULL DEFAULT 0,
  dien_tich    REAL,
  UNIQUE (building_id, ten_phong)
);

-- Mỗi phòng chỉ có một người ĐỨNG TÊN thuê; số người ở thực tế ghi ở so_nguoi.
CREATE TABLE tenants (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id   INTEGER NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
  ho_ten    TEXT    NOT NULL,
  sdt       TEXT,
  so_nguoi  INTEGER NOT NULL DEFAULT 1,
  ngay_vao  TEXT    NOT NULL,
  -- NULL = đang thuê. Có giá trị = đã chuyển đi, giữ lại để tra cứu lịch sử.
  ngay_ra   TEXT,
  CHECK (so_nguoi >= 1)
);

CREATE INDEX idx_tenants_room ON tenants (room_id);
-- Mỗi phòng chỉ có tối đa một người thuê đang ở.
CREATE UNIQUE INDEX idx_tenants_dang_thue ON tenants (room_id) WHERE ngay_ra IS NULL;

-- Chỉ lưu chỉ số công tơ, không lưu tiền. Tiền được tính ở bảng invoices.
CREATE TABLE readings (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id   INTEGER NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
  ky        TEXT    NOT NULL,                      -- 'YYYY-MM'
  dien_cu   INTEGER NOT NULL,
  dien_moi  INTEGER NOT NULL,
  nuoc_cu   INTEGER NOT NULL,
  nuoc_moi  INTEGER NOT NULL,
  ngay_ghi  TEXT    NOT NULL,
  UNIQUE (room_id, ky),
  CHECK (ky GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]'),
  CHECK (dien_moi >= dien_cu),
  CHECK (nuoc_moi >= nuoc_cu)
);

CREATE TABLE invoices (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id       INTEGER NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
  ky            TEXT    NOT NULL,                  -- 'YYYY-MM'
  tien_phong    INTEGER NOT NULL DEFAULT 0,
  tien_dien     INTEGER NOT NULL DEFAULT 0,
  tien_nuoc     INTEGER NOT NULL DEFAULT 0,
  phi_khac      INTEGER NOT NULL DEFAULT 0,
  -- Đơn giá tại thời điểm phát hành, chốt cứng ở đây.
  -- Giá thay đổi về sau không được làm sai lệch hóa đơn cũ.
  don_gia_dien  INTEGER NOT NULL,
  don_gia_nuoc  INTEGER NOT NULL,
  tong_tien     INTEGER NOT NULL,
  trang_thai    TEXT    NOT NULL DEFAULT 'chua_thanh_toan',
  ngay_tao      TEXT    NOT NULL,
  UNIQUE (room_id, ky),
  CHECK (ky GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]'),
  CHECK (trang_thai IN ('chua_thanh_toan', 'da_thanh_toan', 'huy'))
);

CREATE INDEX idx_invoices_ky ON invoices (ky);
CREATE INDEX idx_invoices_trang_thai ON invoices (trang_thai);

CREATE TABLE payments (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id   INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  so_tien      INTEGER NOT NULL,
  ngay_tt      TEXT    NOT NULL,
  phuong_thuc  TEXT    NOT NULL DEFAULT 'chuyen_khoan',
  ghi_chu      TEXT,
  CHECK (phuong_thuc IN ('chuyen_khoan', 'tien_mat'))
);

CREATE INDEX idx_payments_invoice ON payments (invoice_id);

-- 3 tài khoản cố định: 1 quản lý + 1 account cho mỗi phòng.
-- Mật khẩu băm PBKDF2 offline rồi INSERT vào đây (scripts/hash-password.mjs).
CREATE TABLE users (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  username       TEXT    NOT NULL UNIQUE,
  password_hash  TEXT    NOT NULL,
  vai_tro        TEXT    NOT NULL,
  -- Account người thuê gắn với PHÒNG, không gắn với người. Khách chuyển đi thì
  -- đổi mật khẩu, không tạo account mới — số account luôn cố định.
  room_id        INTEGER REFERENCES rooms(id) ON DELETE RESTRICT,
  CHECK (vai_tro IN ('quan_ly', 'nguoi_thue')),
  CHECK (
    (vai_tro = 'quan_ly'   AND room_id IS NULL) OR
    (vai_tro = 'nguoi_thue' AND room_id IS NOT NULL)
  )
);

-- Mỗi phòng tối đa một account.
CREATE UNIQUE INDEX idx_users_room ON users (room_id) WHERE room_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Seed
-- Tên người thuê là giá trị tạm, sửa lại qua giao diện quản trị khi có tên thật.
-- ---------------------------------------------------------------------------

INSERT INTO buildings (id, name, address, don_gia_dien, don_gia_nuoc) VALUES
  (1, 'FMH', NULL, 3000, 15000);

INSERT INTO rooms (id, building_id, ten_phong, gia_phong, dien_tich) VALUES
  (1, 1, 'FMH-P01', 1800000, NULL),
  (2, 1, 'FMH-P02', 1800000, NULL);

INSERT INTO tenants (id, room_id, ho_ten, sdt, so_nguoi, ngay_vao, ngay_ra) VALUES
  (1, 1, 'Người thuê 1', NULL, 1, '2026-08-01', NULL),
  (2, 2, 'Người thuê 2', NULL, 1, '2026-08-01', NULL);
