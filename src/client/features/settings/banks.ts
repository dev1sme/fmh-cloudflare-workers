/**
 * NAPAS acquirer ids for the banks most likely to be used here. The BIN is what
 * goes into the VietQR payload; any 6-digit BIN works, so the form also allows
 * typing one in for a bank that is not listed.
 */
export const NGAN_HANG = [
  { bin: "970436", ten: "Vietcombank" },
  { bin: "970415", ten: "VietinBank" },
  { bin: "970418", ten: "BIDV" },
  { bin: "970405", ten: "Agribank" },
  { bin: "970407", ten: "Techcombank" },
  { bin: "970422", ten: "MB Bank" },
  { bin: "970416", ten: "ACB" },
  { bin: "970432", ten: "VPBank" },
  { bin: "970423", ten: "TPBank" },
  { bin: "970403", ten: "Sacombank" },
  { bin: "970443", ten: "SHB" },
  { bin: "970441", ten: "VIB" },
  { bin: "970426", ten: "MSB" },
  { bin: "970448", ten: "OCB" },
  { bin: "970431", ten: "Eximbank" },
  { bin: "970437", ten: "HDBank" },
  { bin: "970454", ten: "VietCapital Bank" },
  { bin: "970429", ten: "SCB" },
  { bin: "970419", ten: "NCB" },
  { bin: "546034", ten: "Cake by VPBank" },
  { bin: "963388", ten: "Timo" },
] as const;

export const KHAC = "khac";

export function tenNganHang(bin: string | null): string | null {
  if (!bin) return null;
  return NGAN_HANG.find((bank) => bank.bin === bin)?.ten ?? `Mã ${bin}`;
}
