/**
 * NAPAS acquirer ids for the banks most likely to be used here. The BIN is what
 * goes into the VietQR payload; any 6-digit BIN works, so the form also allows
 * typing one in for a bank that is not listed.
 */
export const BANKS = [
  { bin: "970436", name: "Vietcombank" },
  { bin: "970415", name: "VietinBank" },
  { bin: "970418", name: "BIDV" },
  { bin: "970405", name: "Agribank" },
  { bin: "970407", name: "Techcombank" },
  { bin: "970422", name: "MB Bank" },
  { bin: "970416", name: "ACB" },
  { bin: "970432", name: "VPBank" },
  { bin: "970423", name: "TPBank" },
  { bin: "970403", name: "Sacombank" },
  { bin: "970443", name: "SHB" },
  { bin: "970441", name: "VIB" },
  { bin: "970426", name: "MSB" },
  { bin: "970448", name: "OCB" },
  { bin: "970431", name: "Eximbank" },
  { bin: "970437", name: "HDBank" },
  { bin: "970454", name: "VietCapital Bank" },
  { bin: "970429", name: "SCB" },
  { bin: "970419", name: "NCB" },
  { bin: "546034", name: "Cake by VPBank" },
  { bin: "963388", name: "Timo" },
] as const;

export const OTHER_BANK = "khac";
