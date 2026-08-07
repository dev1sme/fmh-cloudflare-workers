import type { vi } from "./locales/vi";

/**
 * Makes `t()` key-checked against the Vietnamese resource tree, so a typo is a
 * build error instead of the key itself appearing on screen. With 450-odd call
 * sites that is the difference between a rename being safe and being a hunt.
 *
 * The cost is that keys built at runtime — `errors.${code}` — are not literal
 * types and need a cast at the few places that do it.
 */
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: { translation: typeof vi };
  }
}
