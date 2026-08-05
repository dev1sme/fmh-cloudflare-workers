/**
 * Builds the VietQR payload (EMVCo TLV, NAPAS profile) for an invoice.
 *
 * The string is generated here rather than fetched from img.vietqr.io: no
 * third party learns who owes how much, the QR keeps working if that service
 * is down, and nothing has to be requested at render time.
 *
 * Field layout: `IDLLVALUE`, where ID and LL are two digits each and LL is the
 * byte length of VALUE.
 */

const GUID_NAPAS = "A000000727";
/** Transfer to an account number (as opposed to QRIBFTTC, to a card). */
const DICH_VU_CHUYEN_KHOAN = "QRIBFTTA";
const TIEN_TE_VND = "704";
const QUOC_GIA = "VN";

export type ThongTinNganHang = {
  /** 6-digit NAPAS acquirer id, e.g. 970436 for Vietcombank. */
  bank_bin: string;
  bank_account_no: string;
  bank_account_name: string | null;
};

function truong(id: string, value: string): string {
  return id + String(value.length).padStart(2, "0") + value;
}

/**
 * CRC-16/CCITT-FALSE over everything up to and including the "6304" tag,
 * uppercase hex — the checksum NAPAS expects.
 */
function crc16(input: string): string {
  let crc = 0xffff;

  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;

    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Banking apps reject diacritics and most punctuation in the transfer memo.
 * The memo only needs to carry the invoice code for reconciliation.
 */
export function chuanHoaNoiDung(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^0-9A-Za-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 99);
}

export function taoVietQR(input: {
  nganHang: ThongTinNganHang;
  /** VND, whole number. Omit for a QR the payer types the amount into. */
  soTien?: number;
  noiDung: string;
}): string {
  const { nganHang } = input;

  const thongTinThuHuong = truong("00", nganHang.bank_bin) + truong("01", nganHang.bank_account_no);

  const napas =
    truong("00", GUID_NAPAS) +
    truong("01", thongTinThuHuong) +
    truong("02", DICH_VU_CHUYEN_KHOAN);

  const noiDung = chuanHoaNoiDung(input.noiDung);

  const payload =
    truong("00", "01") +
    // 12 = dynamic: this QR carries one amount and is used once.
    truong("01", input.soTien === undefined ? "11" : "12") +
    truong("38", napas) +
    truong("53", TIEN_TE_VND) +
    (input.soTien === undefined ? "" : truong("54", String(Math.round(input.soTien)))) +
    truong("58", QUOC_GIA) +
    (noiDung === "" ? "" : truong("62", truong("08", noiDung)));

  const chuaCoCrc = `${payload}6304`;
  return chuaCoCrc + crc16(chuaCoCrc);
}

/** Null when the building has no bank details configured yet. */
export function nganHangHopLe(input: {
  bank_bin: string | null;
  bank_account_no: string | null;
  bank_account_name: string | null;
}): ThongTinNganHang | null {
  if (!input.bank_bin || !input.bank_account_no) return null;

  return {
    bank_bin: input.bank_bin,
    bank_account_no: input.bank_account_no,
    bank_account_name: input.bank_account_name,
  };
}
