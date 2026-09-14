import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion'
import { DURATION_IN_FRAMES } from './Root'

const BIRD_COLOR = '#7A3324'

// Rendered on solid white and shown with CSS `mix-blend-mode: multiply` in
// the browser — matches how the original static PNG was composited onto the
// cream section background (white multiplies to nothing, colors blend
// through), so the video needs no cream-color matching at all.
const BG = '#FFFFFF'

function sine01(frame: number, periodFrames: number, phaseFrames = 0) {
  return Math.sin(((frame + phaseFrames) / periodFrames) * Math.PI * 2)
}

interface BirdProps {
  fromXPct: number
  toXPct: number
  yPct: number
  riseAmount: number
  startFrame: number
  endFrame: number
  scale: number
  flip?: boolean
}

function Bird({ fromXPct, toXPct, yPct, riseAmount, startFrame, endFrame, scale, flip }: BirdProps) {
  const frame = useCurrentFrame()

  const progress = interpolate(frame, [startFrame, endFrame], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const visible = frame >= startFrame && frame <= endFrame

  if (!visible) return null

  const xPct = fromXPct + (toXPct - fromXPct) * progress
  const arc = Math.sin(progress * Math.PI) * riseAmount
  const flap = Math.sin(progress * Math.PI * 10) * 4

  return (
    <div
      style={{
        position: 'absolute',
        left: `${xPct}%`,
        top: `${yPct - arc}%`,
        transform: `scale(${scale}) ${flip ? 'scaleX(-1)' : ''}`,
      }}
    >
      <svg width="40" height="20" viewBox="0 0 40 20">
        <path
          d={`M0,${10 - flap} Q10,${2 - flap} 20,10 Q30,${2 - flap} 40,${10 - flap}`}
          fill="none"
          stroke={BIRD_COLOR}
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

export function SubjectsSceneLoop() {
  const frame = useCurrentFrame()

  const kenBurnsScale = 1 + 0.03 * ((sine01(frame, DURATION_IN_FRAMES) + 1) / 2)
  const sunGlowOpacity = 0.18 + 0.16 * ((sine01(frame, DURATION_IN_FRAMES / 2) + 1) / 2)

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${kenBurnsScale})`,
          transformOrigin: '50% 60%',
        }}
      >
        <Img
          src={staticFile('study_carabao.png')}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />

        <div
          style={{
            position: 'absolute',
            left: '57%',
            top: '30%',
            width: '26%',
            aspectRatio: '1 / 1',
            transform: 'translate(-50%, -50%)',
            borderRadius: '9999px',
            background: 'radial-gradient(circle, rgba(240,168,48,0.9) 0%, rgba(240,168,48,0) 70%)',
            opacity: sunGlowOpacity,
            filter: 'blur(4px)',
          }}
        />
      </div>

      <Bird
        fromXPct={-6}
        toXPct={106}
        yPct={22}
        riseAmount={4}
        startFrame={18}
        endFrame={128}
        scale={1}
      />
      <Bird
        fromXPct={106}
        toXPct={-6}
        yPct={34}
        riseAmount={3}
        startFrame={128}
        endFrame={222}
        scale={0.75}
        flip
      />
    </AbsoluteFill>
  )
}
