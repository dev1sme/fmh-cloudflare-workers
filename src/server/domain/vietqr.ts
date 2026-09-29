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
const TRANSFER_SERVICE = "QRIBFTTA";
const CURRENCY_VND = "704";
const COUNTRY_CODE = "VN";

export type BankAccount = {
  /** 6-digit NAPAS acquirer id, e.g. 970436 for Vietcombank. */
  bank_bin: string;
  bank_account_no: string;
  bank_account_name: string | null;
};

function tlvField(id: string, value: string): string {
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
export function normalizeTransferNote(text: string): string {
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

export function buildVietQR(input: {
  bank: BankAccount;
  /** VND, whole number. Omit for a QR the payer types the amount into. */
  amount?: number;
  transferNote: string;
}): string {
  const { bank } = input;

  const beneficiary = tlvField("00", bank.bank_bin) + tlvField("01", bank.bank_account_no);

  const napas =
    tlvField("00", GUID_NAPAS) +
    tlvField("01", beneficiary) +
    tlvField("02", TRANSFER_SERVICE);

  const transferNote = normalizeTransferNote(input.transferNote);

  const payload =
    tlvField("00", "01") +
    // 12 = dynamic: this QR carries one amount and is used once.
    tlvField("01", input.amount === undefined ? "11" : "12") +
    tlvField("38", napas) +
    tlvField("53", CURRENCY_VND) +
    (input.amount === undefined ? "" : tlvField("54", String(Math.round(input.amount)))) +
    tlvField("58", COUNTRY_CODE) +
    (transferNote === "" ? "" : tlvField("62", tlvField("08", transferNote)));

  const withoutCrc = `${payload}6304`;
  return withoutCrc + crc16(withoutCrc);
}

/** Null when the building has no bank details configured yet. */
export function validBankAccount(input: {
  bank_bin: string | null;
  bank_account_no: string | null;
  bank_account_name: string | null;
}): BankAccount | null {
  if (!input.bank_bin || !input.bank_account_no) return null;

  return {
    bank_bin: input.bank_bin,
    bank_account_no: input.bank_account_no,
    bank_account_name: input.bank_account_name,
  };
}
