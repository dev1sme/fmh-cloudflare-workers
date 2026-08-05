import { notifications } from "@mantine/notifications";

import { ApiError } from "./api";

/** Error codes the API returns, in the wording shown to the user. */
const MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "Phiên đăng nhập đã hết hạn, đăng nhập lại.",
  FORBIDDEN: "Tài khoản này không có quyền thực hiện.",
  NO_ROOM_BOUND: "Tài khoản này chưa gắn với phòng nào.",
  INVALID_CREDENTIALS: "Sai tài khoản hoặc mật khẩu.",
  MISSING_CREDENTIALS: "Nhập đủ tài khoản và mật khẩu.",
  NOT_FOUND: "Không tìm thấy dữ liệu.",
  DUPLICATE_DATA: "Dữ liệu bị trùng.",
  RELATED_DATA_EXISTS: "Không xoá được vì còn dữ liệu liên quan.",
  INVALID_DATA: "Dữ liệu không hợp lệ.",
  INVALID_PERIOD: "Kỳ phải có dạng YYYY-MM.",
  READING_ALREADY_EXISTS: "Kỳ này đã có chỉ số cho phòng.",
  ELECTRICITY_END_BELOW_START: "Chỉ số điện mới không được nhỏ hơn chỉ số cũ.",
  WATER_END_BELOW_START: "Chỉ số nước mới không được nhỏ hơn chỉ số cũ.",
  ROOM_NOT_FOUND: "Phòng không tồn tại.",
  EMPTY_ROOM_IDS: "Chọn ít nhất một phòng để sinh hóa đơn.",
  MISSING_ROOM_ID_OR_PERIOD: "Thiếu phòng hoặc kỳ.",
  INVOICE_CANCELLED: "Hóa đơn đã huỷ, không ghi nhận thanh toán được.",
  PASSWORD_TOO_SHORT: "Mật khẩu phải từ 8 ký tự trở lên.",
  WRONG_CURRENT_PASSWORD: "Mật khẩu hiện tại không đúng.",
  INVALID_BANK_BIN: "Mã ngân hàng phải là 6 chữ số.",
  INVALID_BANK_ACCOUNT_NO: "Số tài khoản chỉ gồm chữ số.",
  INVALID_MOMO_PHONE: "Số MoMo không hợp lệ.",
  INVALID_OCCUPANTS: "Số người ở phải từ 1 trở lên.",
  CANNOT_DELETE_SELF: "Không xoá được tài khoản đang đăng nhập.",
  LAST_MANAGER_REQUIRED: "Phải còn ít nhất một tài khoản quản lý.",
  INTERNAL_ERROR: "Lỗi hệ thống, thử lại sau.",
};

/** Field names as they read in Vietnamese, for the generated codes below. */
const FIELDS: Record<string, string> = {
  room_name: "tên phòng",
  rent: "giá phòng",
  area: "diện tích",
  full_name: "họ tên",
  phone: "số điện thoại",
  occupants: "số người ở",
  moved_in: "ngày vào",
  moved_out: "ngày ra",
  period: "kỳ",
  electricity_start: "chỉ số điện cũ",
  electricity_end: "chỉ số điện mới",
  water_start: "chỉ số nước cũ",
  water_end: "chỉ số nước mới",
  recorded_on: "ngày ghi",
  rent_amount: "tiền phòng",
  other_fees: "phí khác",
  amount: "số tiền",
  paid_on: "ngày thanh toán",
  method: "phương thức",
  note: "ghi chú",
  username: "tên đăng nhập",
  role: "vai trò",
  room_id: "phòng",
  building_id: "nhà",
  name: "tên",
  electricity_rate: "đơn giá điện",
  water_rate: "đơn giá nước",
};

export function thongBaoLoi(err: unknown): string {
  const code = err instanceof ApiError ? err.code : "";
  if (MESSAGES[code]) return MESSAGES[code];

  // Validation codes are generated from field names (MISSING_ROOM_NAME,
  // INVALID_RENT, TOO_LONG_FULL_NAME), so fall back to a readable form instead
  // of leaving the user with a raw code.
  const match = /^(MISSING|INVALID|TOO_LONG)_(.+)$/.exec(code);
  if (match) {
    const key = match[2]!.toLowerCase();
    const field = FIELDS[key] ?? key.replace(/_/g, " ");
    if (match[1] === "MISSING") return `Thiếu thông tin: ${field}.`;
    if (match[1] === "TOO_LONG") return `Quá dài: ${field}.`;
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
