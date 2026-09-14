import { Bookmark, Check, FileText, Flame, Search, BarChart3 } from 'lucide-react'
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion'
import { DURATION_IN_FRAMES } from './Root'

const COLORS = {
  bg: '#F3ECDC',
  gold: '#E0AC48',
  white: '#ffffff',
  brown: '#3A2A1A',
  maroon: '#7A2323',
  green: '#3A5A40',
}

const CARD_WIDTH = 768
const PROGRESS_WIDTH = 448
const GAP = 16
const TOTAL_WIDTH = CARD_WIDTH + GAP + PROGRESS_WIDTH
const BOB_PERIOD = 80

function clamp01(frame: number, from: number, to: number) {
  return interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  })
}

function bob(frame: number, phaseFrames: number, amplitude: number) {
  return Math.sin(((frame + phaseFrames) / BOB_PERIOD) * Math.PI * 2) * amplitude
}

function dotTwinkle(frame: number, phaseFrames: number, cycles: number) {
  const t = ((frame + phaseFrames) / DURATION_IN_FRAMES) * Math.PI * 2 * cycles
  return interpolate(Math.sin(t), [-1, 1], [0.25, 0.55])
}

interface QuestionDef {
  number: number
  prompt: string
  choices: { letter: string; text: string }[]
  correct: string
}

const Q12: QuestionDef = {
  number: 12,
  prompt: 'Which immunoglobulin class is produced first during a primary immune response?',
  choices: [
    { letter: 'A', text: 'IgM' },
    { letter: 'B', text: 'IgG' },
    { letter: 'C', text: 'IgA' },
    { letter: 'D', text: 'IgE' },
  ],
  correct: 'A',
}

const Q13: QuestionDef = {
  number: 13,
  prompt: 'Which technique detects unexpected antibodies in a patient sample?',
  choices: [
    { letter: 'A', text: 'Direct Coombs' },
    { letter: 'B', text: 'Indirect Coombs' },
    { letter: 'C', text: 'Rh typing' },
    { letter: 'D', text: 'ABO forward typing' },
  ],
  correct: 'B',
}

const LEG_1_SELECT: [number, number] = [36, 52]
const LEG_1_PULSE: [number, number, number] = [76, 84, 92]
const CROSSFADE_1: [number, number] = [92, 108]
const LEG_2_SELECT: [number, number] = [140, 156]
const LEG_2_PULSE: [number, number, number] = [176, 184, 192]
const CROSSFADE_2: [number, number] = [192, 208]

const SUBJECT_TABS = [
  { key: 'IS', icon: FileText },
  { key: 'BB', icon: Search },
  { key: 'MTAP', icon: FileText },
  { key: 'CC', icon: BarChart3 },
]

function QuestionContent({
  q,
  selectProgress,
  tapScale,
  nextPulse,
}: {
  q: QuestionDef
  selectProgress: number
  tapScale: number
  nextPulse: number
}) {
  return (
    <>
      <p
        style={{
          margin: '16px 0 0',
          fontSize: 15,
          lineHeight: 1.5,
          fontWeight: 500,
          color: COLORS.brown,
          minHeight: 48,
        }}
      >
        {q.prompt}
      </p>

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {q.choices.map((choice) => {
          const isCorrectChoice = choice.letter === q.correct
          const t = isCorrectChoice ? selectProgress : 0
          const bg = t > 0 ? `rgba(247,231,196,${t})` : 'transparent'
          const borderColor = t > 0 ? COLORS.gold : 'rgba(58,42,26,0.1)'

          return (
            <div
              key={choice.letter}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                borderRadius: 10,
                border: `1px solid ${borderColor}`,
                background: bg,
                color: COLORS.brown,
                padding: '10px 14px',
                fontSize: 14,
                transform: isCorrectChoice ? `scale(${tapScale})` : 'scale(1)',
                transformOrigin: 'left center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 24,
                    height: 24,
                    borderRadius: 9999,
                    fontSize: 12,
                    fontWeight: 700,
                    background: t > 0 ? COLORS.gold : 'transparent',
                    color: t > 0 ? COLORS.brown : 'rgba(58,42,26,0.6)',
                    border: t > 0 ? 'none' : '1px solid rgba(58,42,26,0.2)',
                  }}
                >
                  {choice.letter}
                </span>
                {choice.text}
              </div>
              {t > 0 && (
                <Check
                  size={17}
                  color={COLORS.green}
                  style={{ opacity: t, transform: `scale(${0.6 + t * 0.4})` }}
                />
              )}
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            borderRadius: 9999,
            border: '1px solid rgba(58,42,26,0.2)',
            padding: '8px 16px',
            fontSize: 12,
            fontWeight: 600,
            color: COLORS.brown,
          }}
        >
          ← Previous
        </span>
        <span
          style={{
            borderRadius: 9999,
            background: COLORS.maroon,
            padding: '8px 16px',
            fontSize: 12,
            fontWeight: 600,
            color: COLORS.white,
            transform: `scale(${nextPulse})`,
            display: 'inline-block',
          }}
        >
          Next →
        </span>
      </div>
    </>
  )
}

function QuizCard({ frame }: { frame: number }) {
  const leg1Select = clamp01(frame, ...LEG_1_SELECT)
  const leg1TapScale = interpolate(frame, [LEG_1_SELECT[0], LEG_1_SELECT[0] + 8, LEG_1_SELECT[1]], [1, 0.95, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const leg1Pulse = interpolate(frame, LEG_1_PULSE, [1, 1.06, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const leg2Select = clamp01(frame, ...LEG_2_SELECT)
  const leg2TapScale = interpolate(frame, [LEG_2_SELECT[0], LEG_2_SELECT[0] + 8, LEG_2_SELECT[1]], [1, 0.95, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const leg2Pulse = interpolate(frame, LEG_2_PULSE, [1, 1.06, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const fadeOut1 = 1 - clamp01(frame, ...CROSSFADE_1)
  const fadeIn1 = clamp01(frame, ...CROSSFADE_1)
  const fadeOut2 = 1 - clamp01(frame, ...CROSSFADE_2)
  const fadeIn2 = clamp01(frame, ...CROSSFADE_2)

  const opacityQ12First = fadeOut1
  const opacityQ13 = fadeIn1 * fadeOut2
  const opacityQ12Second = fadeIn2

  const activeTab = frame >= 92 && frame < 208 ? 1 : 0

  return (
    <div
      style={{
        width: CARD_WIDTH,
        borderRadius: 24,
        border: '1px solid rgba(58,42,26,0.1)',
        background: COLORS.white,
        padding: 32,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 17, fontWeight: 600, color: COLORS.brown }}>Multiple Choice</span>
          <span
            style={{
              borderRadius: 6,
              background: COLORS.gold,
              padding: '4px 10px',
              fontSize: 12,
              fontWeight: 700,
              color: COLORS.brown,
            }}
          >
            IS
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 13, color: 'rgba(58,42,26,0.6)' }}>
          <span>Question 12 of 33</span>
          <Bookmark size={18} color="rgba(58,42,26,0.6)" />
        </div>
      </div>

      <div style={{ position: 'relative', minHeight: 300 }}>
        <div style={{ position: 'absolute', inset: 0, opacity: opacityQ12First }}>
          <QuestionContent q={Q12} selectProgress={leg1Select} tapScale={leg1TapScale} nextPulse={leg1Pulse} />
        </div>
        <div style={{ position: 'absolute', inset: 0, opacity: opacityQ13 }}>
          <QuestionContent q={Q13} selectProgress={leg2Select} tapScale={leg2TapScale} nextPulse={leg2Pulse} />
        </div>
        <div style={{ position: 'absolute', inset: 0, opacity: opacityQ12Second }}>
          <QuestionContent q={Q12} selectProgress={0} tapScale={1} nextPulse={1} />
        </div>
      </div>

      <div style={{ marginTop: 20, borderTop: '1px solid rgba(58,42,26,0.1)', paddingTop: 16 }}>
        <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: COLORS.brown }}>RMT Subjects</p>
        <div style={{ display: 'flex', gap: 10 }}>
          {SUBJECT_TABS.map((tab, i) => {
            const active = i === activeTab
            return (
              <span
                key={tab.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  borderRadius: 8,
                  padding: '7px 14px',
                  fontSize: 13,
                  fontWeight: 600,
                  background: active ? COLORS.maroon : 'transparent',
                  color: active ? COLORS.white : 'rgba(58,42,26,0.7)',
                  border: active ? 'none' : '1px solid rgba(58,42,26,0.15)',
                }}
              >
                <tab.icon size={15} />
                {tab.key}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ProgressCard() {
  return (
    <div
      style={{
        width: PROGRESS_WIDTH,
        borderRadius: 20,
        border: '1px solid rgba(58,42,26,0.1)',
        background: COLORS.white,
        padding: 32,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'rgba(58,42,26,0.7)' }}>Overall Progress</p>
      <p style={{ margin: '4px 0 0', fontSize: 40, fontWeight: 700, color: COLORS.brown }}>68%</p>
      <div
        style={{
          marginTop: 10,
          height: 10,
          width: '100%',
          borderRadius: 9999,
          background: 'rgba(58,42,26,0.1)',
          overflow: 'hidden',
        }}
      >
        <div style={{ height: '100%', width: '68%', borderRadius: 9999, background: COLORS.maroon }} />
      </div>
      <p style={{ margin: '8px 0 0', fontSize: 15, color: 'rgba(58,42,26,0.6)' }}>102 of 150 topics</p>

      <div
        style={{
          marginTop: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          borderTop: '1px solid rgba(58,42,26,0.1)',
          paddingTop: 18,
        }}
      >
        <Flame size={26} color={COLORS.maroon} />
        <div>
          <p style={{ margin: 0, fontSize: 14, color: 'rgba(58,42,26,0.6)' }}>Study Streak</p>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 600, color: COLORS.brown }}>12 days</p>
        </div>
      </div>

      <div
        style={{
          marginTop: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          borderTop: '1px solid rgba(58,42,26,0.1)',
          paddingTop: 18,
        }}
      >
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 66,
            height: 66,
            borderRadius: '9999px',
            background: `conic-gradient(${COLORS.gold} 0% 84%, rgba(58,42,26,0.1) 84% 100%)`,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '9999px',
              background: COLORS.white,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 700,
              color: COLORS.brown,
            }}
          >
            84%
          </div>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 14, color: 'rgba(58,42,26,0.6)' }}>Recent Score</p>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: COLORS.brown }}>82 / 98 correct</p>
        </div>
      </div>
    </div>
  )
}

export function HeroQuizLoop() {
  const frame = useCurrentFrame()

  const cardY = bob(frame, 0, 5)
  const progressY = bob(frame, 40, 5)

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <div style={{ position: 'relative', width: TOTAL_WIDTH, margin: '120px auto 0' }}>
        <div
          style={{
            position: 'absolute',
            top: -48,
            right: 32,
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 8px)',
            gap: 12,
            opacity: dotTwinkle(frame, 0, 2),
          }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} style={{ width: 8, height: 8, borderRadius: 9999, background: COLORS.brown }} />
          ))}
        </div>

        <div style={{ transform: `translateY(${cardY}px)` }}>
          <QuizCard frame={frame} />
        </div>

        <div
          style={{
            position: 'absolute',
            right: 0,
            bottom: -80,
            transform: `translateY(${progressY}px)`,
          }}
        >
          <ProgressCard />
        </div>
      </div>
    </AbsoluteFill>
  )
}
