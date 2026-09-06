import type { Variants } from 'framer-motion'

/** Parent container: staggers its direct motion children in on mount. */
export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

/** Child item: fades and slides up. Pair with `staggerContainer` on the parent. */
export const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
}

/** Tighter stagger for dense lists (activity feeds, table rows). */
export const listStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

export const listItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
}
