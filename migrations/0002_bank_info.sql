-- Thông tin nhận chuyển khoản, dùng để sinh mã VietQR trên hóa đơn.
-- Để ở buildings vì mỗi nhà có thể nhận vào tài khoản khác nhau.
-- NULL = chưa cấu hình, hóa đơn sẽ không hiện mã QR.

ALTER TABLE buildings ADD COLUMN bank_bin TEXT;      -- mã ngân hàng NAPAS, 6 chữ số
ALTER TABLE buildings ADD COLUMN bank_so_tk TEXT;    -- số tài khoản nhận tiền
ALTER TABLE buildings ADD COLUMN bank_chu_tk TEXT;   -- tên chủ tài khoản, in trên QR
