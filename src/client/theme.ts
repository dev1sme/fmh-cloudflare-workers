import { createTheme, type CSSVariablesResolver, type MantineColorsTuple } from "@mantine/core";

/**
 * The app is a ledger. Every screen is a column of numbers a landlord scans to
 * answer one question — who still owes, and how much. The theme is built
 * around reading those numbers, not around decoration.
 *
 * Three decisions carry it:
 *
 * 1. Warm neutrals, not the blue-grey Mantine ships. A rental ledger is paper
 *    and meter dials, not a SaaS console. The dark surface is a very dark
 *    brown-grey, so amber and green sit on it without the neon-on-black look.
 * 2. Two semantic accents only — amber for money still owed, green for money
 *    received. Everything else is neutral, so a single amber row on an
 *    otherwise quiet page is unmissable.
 * 3. Tabular figures everywhere (see theme.css). Rents and meter readings are
 *    compared vertically; proportional digits make that impossible.
 */

/** Amber. Reserved for money still owed — never used decoratively. */
const owed: MantineColorsTuple = [
  "#FDF4E7",
  "#F7E4C9",
  "#EFC894",
  "#E7AB5C",
  "#E19334",
  "#DD851A",
  "#DB7D0C",
  "#C26A00",
  "#AD5D00",
  "#964E00",
];

/** Muted green. Money received, and the primary action colour. */
const settled: MantineColorsTuple = [
  "#EFF7F0",
  "#DEEAE0",
  "#BAD3BE",
  "#94BC9B",
  "#75A87E",
  "#619C6C",
  "#569662",
  "#458351",
  "#3A7446",
  "#2B6438",
];

/** Warm brown-grey. Replaces Mantine's blue-tinted dark scale. */
const bark: MantineColorsTuple = [
  "#C9C3BA",
  "#ADA69B",
  "#8E8578",
  "#6F675B",
  "#554E44",
  "#413B33",
  "#332E28",
  "#26221D",
  "#1D1A16",
  "#161311",
];

export const theme = createTheme({
  colors: { owed, settled, dark: bark },
  primaryColor: "settled",
  // 7 in both schemes: white label text on the filled button needs 4.5:1, and
  // shade 5 gave 3.2:1. Shade 7 is the lightest that clears it (4.55:1).
  primaryShade: { light: 7, dark: 7 },

  fontFamily: '"Be Vietnam Pro", system-ui, sans-serif',
  headings: {
    fontFamily: '"Be Vietnam Pro", system-ui, sans-serif',
    fontWeight: "600",
  },

  // Slightly tighter than Mantine's default: a ledger wants density, but not
  // the zero-radius broadsheet look.
  defaultRadius: "sm",
  radius: { sm: "0.375rem", md: "0.5rem", lg: "0.75rem" },

  components: {
    // Rows are separated by a hairline, not by zebra striping — stripes fight
    // with the amber highlight that actually means something.
    Table: {
      defaultProps: { highlightOnHover: true, verticalSpacing: "sm" },
    },
    Card: {
      defaultProps: { withBorder: true, padding: "lg", radius: "md" },
    },
    Button: {
      defaultProps: { radius: "sm" },
    },
    Badge: {
      // Square-ish, not pill: these are labels on a ledger, not tags.
      defaultProps: { radius: "sm", variant: "light" },
      styles: { root: { fontWeight: 600, letterSpacing: "0.02em" } },
    },
  },
});

/**
 * Text colours for the light scheme, darkened to clear WCAG AA (4.5:1) on the
 * beige surfaces in `theme.css`.
 *
 * Mantine picks its light-scheme text shades against white. The page here is
 * `--fmh-paper` (#ece3d3), noticeably darker, so every one of them fell short:
 * `dimmed` measured 2.6:1 on the page, amber 3.1:1, green 3.6:1 — the helper
 * text under every page title and the amount a tenant owes were the hardest
 * things on the screen to read. Shade 9 of each accent, and a warm grey taken
 * between `bark[3]` and `bark[4]`, each clear 4.5:1 on paper and on card.
 *
 * Dark scheme is untouched: it already measures 4.6–10:1 against the bark
 * surfaces.
 */
export const cssVariablesResolver: CSSVariablesResolver = (t) => ({
  variables: {},
  light: {
    "--mantine-color-dimmed": "#6a6256",
    "--mantine-color-owed-text": t.colors.owed[9],
    "--mantine-color-settled-text": t.colors.settled[9],
    "--mantine-color-anchor": t.colors.settled[9],
    // Darker than red[9] (#c92a2a), which clears a card at 4.9:1 but not the
    // paper at 4.3:1 — "Xoá hóa đơn" sits straight on the page.
    "--mantine-color-red-text": "#b02525",
    "--mantine-color-error": "#b02525",
    // `subtle` / `light` buttons take their label colour from here, not from
    // `-text`, so the same fix has to land on both.
    "--mantine-color-red-light-color": "#b02525",
  },
  dark: {},
});
