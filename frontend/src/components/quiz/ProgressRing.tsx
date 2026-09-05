interface RingSegment {
  percent: number
  color: string
}

interface ProgressRingProps {
  percent?: number
  segments?: RingSegment[]
  size?: number
  thickness?: number
  color?: string
  trackColor?: string
  centerColor?: string
  children?: React.ReactNode
}

export function ProgressRing({
  percent,
  segments,
  size = 96,
  thickness = 8,
  color = '#7A2323',
  trackColor = '#3A2A1A1A',
  centerColor = '#F3ECDC',
  children,
}: ProgressRingProps) {
  const stops = segments ?? [{ percent: Math.min(100, Math.max(0, percent ?? 0)), color }]

  let cursor = 0
  const gradientParts: string[] = []
  for (const segment of stops) {
    const start = cursor
    const end = Math.min(100, cursor + Math.max(0, segment.percent))
    if (end > start) gradientParts.push(`${segment.color} ${start}% ${end}%`)
    cursor = end
  }
  gradientParts.push(`${trackColor} ${cursor}% 100%`)

  return (
    <div
      className="relative flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${gradientParts.join(', ')})`,
      }}
    >
      <div
        className="absolute flex items-center justify-center rounded-full"
        style={{ inset: thickness, background: centerColor }}
      >
        {children}
      </div>
    </div>
  )
}
