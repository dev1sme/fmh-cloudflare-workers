/**
 * Vietnamese copy. This is the source language and the fallback: a key missing
 * from `en.ts` renders the Vietnamese string rather than a bare key, which is
 * what lets the manager screens stay untranslated without breaking.
 *
 * Keys are grouped by where they appear, not by what they say. Anything shared
 * by more than one screen sits in `common`, `invoice`, `payment` or `format`.
 */
export const vi = {
  app: {
    name: "Nhà trọ FMH",
  },

  common: {
    account: "Tài khoản",
    changePassword: "Đổi mật khẩu",
    logout: "Đăng xuất",
    language: "Ngôn ngữ",
    home: "Về trang chủ",
    error: "Lỗi",
    loadFailed: "Không tải được dữ liệu",
    copy: "Copy {{what}}",
    copied: "Đã copy",
    delete: "Xoá",
    cancel: "Huỷ bỏ",
    confirm: "Xác nhận",
    save: "Lưu",
    add: "Thêm",
    edit: "Sửa",
    close: "Đóng",
    manager: "Quản lý",
    search: "Tìm nhanh",
    empty: "—",
  },

  nav: {
    dashboard: "Tổng quan",
    rooms: "Phòng",
    tenants: "Người thuê",
    readings: "Chỉ số điện nước",
    invoices: "Hóa đơn",
    accounts: "Tài khoản",
    settings: "Cài đặt",
  },

  search: {
    placeholder: "Tìm phòng, mã hóa đơn…",
    nothingFound: "Không tìm thấy.",
    renting: "{{name}} · đang thuê",
    vacant: "Đang trống",
  },

  login: {
    title: "Đăng nhập",
    subtitle: "Dùng tài khoản chủ nhà cấp cho phòng của bạn.",
    username: "Tài khoản",
    password: "Mật khẩu",
    submit: "Đăng nhập",
    forgot: "Quên mật khẩu? Liên hệ chủ nhà để được cấp lại.",
    sellingInvoice: "Xem hóa đơn từng tháng, quét mã QR để chuyển khoản.",
    sellingUsage: "Tra chỉ số điện nước đã ghi, biết tháng nào dùng nhiều.",
  },

  tenant: {
    room: "Phòng",
    // The amount leads in English and trails in Vietnamese, which is the whole
    // reason this is one interpolated string rather than concatenation.
    needToPay: "Cần đóng {{amount}}",
    paidUp: "Đã thanh toán đủ",
    noInvoiceYet: "Chủ nhà đã ghi chỉ số nhưng chưa phát hành hóa đơn cho kỳ này.",
    history: "Lịch sử",
    rangeLabel: "Khoảng thời gian",
    range3: "3 tháng",
    range6: "6 tháng",
    rangeAll: "Tất cả",
    otherMonths: "Các tháng khác",
    outOfRangeDebt: "kèm {{count}} tháng chưa thanh toán ngoài khoảng đã chọn",
    emptyHistory:
      "Chưa có tháng nào trước đó để xem lại — lịch sử sẽ hiện ở đây từ tháng kế tiếp.",
    noReading: "chưa có chỉ số",
    monthMeta:
      "{{eStart}} → {{eEnd}} kWh · {{wStart}} → {{wEnd}} m³ · ghi {{date}}",
  },

  /**
   * Meter wording, shared by the tenant's charts and the manager's dashboard.
   *
   * The bare noun and the "used" form are separate on purpose: a chart title
   * sits above an axis that already says kWh, so "Điện" is enough, while a
   * tooltip pops up over a lone data point with no context and has to say what
   * the number measures.
   */
  meter: {
    electricity: "Điện",
    water: "Nước",
    electricityUsed: "Điện tiêu thụ",
    waterUsed: "Nước tiêu thụ",
  },

  dashboard: {
    billed: "Phải thu",
    collected: "Đã thu",
    outstanding: "Còn nợ",
    invoices: "{{count}} hóa đơn",
    invoicesWithCancelled: "{{count}} hóa đơn · {{cancelled}} đã huỷ",
    paidCount: "{{count}} hóa đơn đã thanh toán",
    unpaidCount: "{{count}} hóa đơn chưa thanh toán",
    occupied: "Phòng đang thuê",
    occupiedHint: "{{vacant}} phòng trống · {{occupants}} người ở",
    missingReadings: "Chưa nhập chỉ số",
    cannotGenerate: "Chưa sinh được hóa đơn",
    allRecorded: "Đã nhập đủ kỳ này",
    noPrevious: "Chưa có kỳ trước",
    changeVsPrevious: "{{percent}}% so với kỳ trước",
    revenueTitle: "Doanh thu {{count}} kỳ gần nhất",
    noInvoicesYet: "Chưa có hóa đơn nào để thống kê.",
    debtsTitle: "Công nợ theo phòng",
    noDebts: "Không phòng nào còn nợ.",
    colRoom: "Phòng",
    colInvoices: "Số hóa đơn",
    colOldest: "Nợ từ kỳ",
    colOutstanding: "Còn nợ",
  },

  invoice: {
    fallbackTitle: "Hóa đơn",
    rent: "Tiền phòng",
    electricity: "Tiền điện",
    water: "Tiền nước",
    otherFees: "Phí khác",
    total: "Tổng cộng",
    collected: "Đã thu",
    outstanding: "Còn lại",
    unitPrice: "đơn giá {{price}}/{{unit}}",
    meterNote: "{{start}} → {{end}} = {{used}} {{unit}} × {{price}}",
    paidSection: "Đã thanh toán",
    collectedAll: "Đã thu đủ",
    stillOwed: "Còn {{amount}}",
  },

  payment: {
    scanToPay: "Quét mã để chuyển khoản",
    previewTitle: "Mã QR người thuê nhìn thấy",
    previewNote: "Xem trước để đối chiếu. Người thuê quét mã này trong tài khoản phòng.",
    previewShort: "Xem trước để đối chiếu.",
    accountNo: "Số tài khoản",
    accountName: "Chủ tài khoản",
    amount: "Số tiền",
    memo: "Nội dung",
    keepMemo:
      "Giữ nguyên nội dung <b>{{memo}}</b> khi chuyển khoản để đối chiếu đúng hóa đơn. Mã QR đã điền sẵn số tiền và nội dung.",
    momoTitle: "Hoặc chuyển qua MoMo",
    momoPhone: "Số điện thoại",
    momoReceiver: "Người nhận",
    momoHowTo:
      "Mở app MoMo, chọn Chuyển tiền tới số điện thoại trên, ghi nội dung <b>{{memo}}</b>.",
    noBankYet:
      "Chủ nhà chưa cấu hình tài khoản nhận tiền nên chưa có mã QR. Khi chuyển khoản, ghi nội dung dưới đây để đối chiếu.",
    date: "Ngày",
    method: "Hình thức",
    note: "Ghi chú",
  },

  status: {
    UNPAID: "Chưa thanh toán",
    PAID: "Đã thanh toán",
    CANCELLED: "Đã huỷ",
  },

  method: {
    BANK_TRANSFER: "Chuyển khoản",
    CASH: "Tiền mặt",
  },

  changePassword: {
    title: "Đổi mật khẩu",
    hint: "Cần nhập mật khẩu hiện tại. Quên mật khẩu thì nhờ chủ nhà đặt lại giúp.",
    current: "Mật khẩu hiện tại",
    new: "Mật khẩu mới",
    minChars: "Tối thiểu {{count}} ký tự",
    repeat: "Nhập lại mật khẩu mới",
    mismatch: "Hai mật khẩu không khớp.",
    done: "Đã đổi mật khẩu.",
  },

  notFound: {
    title: "Không tìm thấy trang",
    body: "Đường dẫn không tồn tại, hoặc tài khoản này không có màn hình đó.",
  },

  /**
   * Number and date shapes that differ by language. `ngay` is deliberately
   * absent: dd/mm/yyyy is used in both languages, because the same date
   * rendering as two different strings depending on a toggle is how someone
   * misreads a payment date.
   */
  format: {
    currency: "{{value}} đ",
    billion: "{{value}} tỷ",
    million: "{{value}}tr",
    thousand: "{{value}}k",
    period: "Tháng {{month}}/{{year}}",
  },

  errors: {
    fallback: "Có lỗi xảy ra, thử lại sau.",
    missingField: "Thiếu thông tin: {{field}}.",
    tooLongField: "Quá dài: {{field}}.",
    invalidField: "Giá trị không hợp lệ: {{field}}.",

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
  },

  /** Field names, for the validation codes generated from them. */
  fields: {
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
  },
} as const;
