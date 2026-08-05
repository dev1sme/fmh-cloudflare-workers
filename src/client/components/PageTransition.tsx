import { useReducedMotion } from "motion/react";
import * as motion from "motion/react-client";
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";

/**
 * A short rise-and-fade when a screen mounts.
 *
 * Deliberately one movement, not a sequence: this is a tool someone opens
 * twenty times a day, and an animation that is charming on the first view is
 * an obstacle on the twentieth. 180ms, 6px, no exit animation — enough to make
 * navigation feel connected, short enough to be over before it registers.
 *
 * `key` on the pathname restarts it per screen. `useReducedMotion` honours the
 * OS setting by collapsing the distance to zero rather than skipping the
 * component, so layout never shifts between the two modes.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const reduce = useReducedMotion();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: reduce ? 0 : 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
