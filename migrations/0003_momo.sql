-- Tuỳ chọn nhận tiền qua MoMo, hiển thị song song với VietQR trên hóa đơn.
-- Chỉ lưu số điện thoại + tên người nhận: chuẩn QR của MoMo chưa được xác minh
-- nên ứng dụng không tự sinh mã QR MoMo, tránh sinh ra mã sai người nhận.

ALTER TABLE buildings ADD COLUMN momo_sdt TEXT;
ALTER TABLE buildings ADD COLUMN momo_ten TEXT;
