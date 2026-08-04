import { notifications } from "@mantine/notifications";

import { ApiError } from "./api";

/** Error codes the API returns, in the wording shown to the user. */
const MESSAGES: Record<string, string> = {
  unauthorized: "Phiên đăng nhập đã hết hạn, đăng nhập lại.",
  forbidden: "Tài khoản này không có quyền thực hiện.",
  invalid_credentials: "Sai tài khoản hoặc mật khẩu.",
  missing_credentials: "Nhập đủ tài khoản và mật khẩu.",
  not_found: "Không tìm thấy dữ liệu.",
  trung_du_lieu: "Dữ liệu bị trùng.",
  rang_buoc_du_lieu: "Không xoá được vì còn dữ liệu liên quan.",
  du_lieu_khong_hop_le: "Dữ liệu không hợp lệ.",
  invalid_ky: "Kỳ phải có dạng YYYY-MM.",
  da_co_chi_so_ky_nay: "Kỳ này đã có chỉ số cho phòng.",
  dien_moi_nho_hon_dien_cu: "Chỉ số điện mới không được nhỏ hơn chỉ số cũ.",
  nuoc_moi_nho_hon_nuoc_cu: "Chỉ số nước mới không được nhỏ hơn chỉ số cũ.",
  phong_khong_ton_tai: "Phòng không tồn tại.",
  hoa_don_da_huy: "Hóa đơn đã huỷ, không ghi nhận thanh toán được.",
  password_qua_ngan: "Mật khẩu phải từ 8 ký tự trở lên.",
  khong_tu_xoa: "Không xoá được tài khoản đang đăng nhập.",
  phai_con_mot_quan_ly: "Phải còn ít nhất một tài khoản quản lý.",
  loi_he_thong: "Lỗi hệ thống, thử lại sau.",
};

export function thongBaoLoi(err: unknown): string {
  const code = err instanceof ApiError ? err.code : "";
  if (MESSAGES[code]) return MESSAGES[code];

  // Validation codes are generated from field names (missing_ten_phong,
  // invalid_gia_phong, too_long_ho_ten), so fall back to a readable form
  // instead of leaving the user with a raw code.
  const match = /^(missing|invalid|too_long)_(.+)$/.exec(code);
  if (match) {
    const field = match[2]!.replace(/_/g, " ");
    if (match[1] === "missing") return `Thiếu thông tin: ${field}.`;
    if (match[1] === "too_long") return `Quá dài: ${field}.`;
    return `Giá trị không hợp lệ: ${field}.`;
  }

  return "Có lỗi xảy ra, thử lại sau.";
}

export function baoLoi(err: unknown): void {
  notifications.show({ color: "red", title: "Lỗi", message: thongBaoLoi(err) });
}

export function baoThanhCong(message: string): void {
  notifications.show({ color: "teal", message });
}
