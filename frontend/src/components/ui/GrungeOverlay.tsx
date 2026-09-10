import grungeWallTexture from '@/assets/images/grunge-wall-texture.jpg'

/** Screens the brand's grunge wall texture over a solid maroon background for
 * a worn, vintage feel — same technique as WizardAside's subject info card,
 * reused on every solid-maroon "selected" surface across the app. The parent
 * element must be `position: relative` (and `overflow-hidden` if rounded,
 * since this paints `absolute inset-0`); render this as the FIRST child so
 * real content painted after it stacks on top without needing z-index. */
export function GrungeOverlay({ opacity = 0.25 }: { opacity?: number }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 mix-blend-screen"
      aria-hidden="true"
      style={{
        backgroundImage: `url(${grungeWallTexture})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity,
      }}
    />
  )
}
