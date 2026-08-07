/**
 * The ambient layer behind everything.
 *
 * Real elements rather than pseudo-elements on `body`, because each drifting
 * orb needs its own `transform` animation and one element can only have one.
 * Transform and opacity are the two properties a browser can animate on the
 * compositor, so this costs no layout and no repaint per frame — animating
 * `background-position` on a viewport-sized layer would repaint all of it,
 * sixty times a second, behind a table of numbers.
 *
 * It sits at `z-index: 0` under a `position: fixed` container with
 * `pointer-events: none`, so nothing here can intercept a click, and every
 * surface above it is opaque — the numbers are read off a solid card, never
 * off a moving gradient.
 *
 * `prefers-reduced-motion` freezes the drift in `theme.css`. That is not a
 * taste setting: motion sickness is a real response, and the orbs are large
 * and slow, which is exactly the kind of movement that triggers it.
 */
export function BackgroundFX() {
  return (
    <div className="fmh-bg" aria-hidden="true">
      <div className="fmh-bg-aurora" />
      <div className="fmh-bg-orb fmh-bg-orb-owed" />
      <div className="fmh-bg-orb fmh-bg-orb-settled" />
      <div className="fmh-bg-grain" />
    </div>
  );
}
