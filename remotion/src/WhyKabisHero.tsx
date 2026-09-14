import { Bookmark, Check, ChevronLeft, ChevronRight, Flame, Sparkle } from 'lucide-react'
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion'
import { DURATION_IN_FRAMES } from './Root'

const COLORS = {
  bg: '#2E0D0A',
  gold: '#E0AC48',
  cream: '#F3ECDC',
  brown: '#3A2A1A',
  maroon: '#7A2323',
}

const PHONE = { x: 0, y: 60, size: 960 }
const QUIZ_CARD = { x: 660, y: 0, width: 520 }
const FLASH_CARD = { x: 560, y: 800, width: 620 }

// A divisor of DURATION_IN_FRAMES (240) so the float completes whole cycles
// and lines up with itself at the frame-240 -> frame-0 loop seam.
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

function twinkle(frame: number, phaseFrames: number, cycles: number) {
  const t = ((frame + phaseFrames) / DURATION_IN_FRAMES) * Math.PI * 2 * cycles
  return interpolate(Math.sin(t), [-1, 1], [0.25, 0.85])
}

function CircularProgress({ percent }: { percent: number }) {
  const p = Math.max(0, Math.min(100, percent))
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 48,
        height: 48,
        borderRadius: '9999px',
        background: `conic-gradient(${COLORS.gold} 0% ${p}%, rgba(58,42,26,0.12) ${p}% 100%)`,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '9999px',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 700,
          color: COLORS.brown,
        }}
      >
        {Math.round(p)}%
      </div>
    </div>
  )
}

// Progress/score stay at their final values throughout — a one-time "count
// up from zero" can't loop seamlessly, so the phone's "action" beat is
// scoped to what the quiz card and flashcard already do.
function PhoneScreen() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: '#fff',
        padding: '48px 28px 32px',
        color: COLORS.brown,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <p style={{ margin: 0, fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>
        Good morning, Juan! 👋
      </p>
      <p style={{ margin: '4px 0 0', fontSize: 14, color: 'rgba(58,42,26,0.6)' }}>
        Keep going! Your future self is counting on you.
      </p>

      <div
        style={{
          marginTop: 24,
          borderRadius: 14,
          border: '1px solid rgba(58,42,26,0.1)',
          padding: 18,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 1,
            textTransform: 'uppercase',
            color: 'rgba(58,42,26,0.5)',
          }}
        >
          Overall Progress
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 30, fontWeight: 700 }}>68%</p>
        <div
          style={{
            marginTop: 8,
            height: 6,
            width: '100%',
            borderRadius: 9999,
            background: 'rgba(58,42,26,0.1)',
            overflow: 'hidden',
          }}
        >
          <div style={{ height: '100%', width: '68%', borderRadius: 9999, background: COLORS.maroon }} />
        </div>
        <p style={{ margin: '6px 0 0', fontSize: 11, color: 'rgba(58,42,26,0.55)' }}>
          102 of 150 topics
        </p>
      </div>

      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            borderRadius: 12,
            border: '1px solid rgba(58,42,26,0.1)',
            padding: 14,
          }}
        >
          <Flame size={20} color={COLORS.maroon} />
          <span style={{ fontSize: 12, lineHeight: 1.3 }}>
            <span style={{ display: 'block', color: 'rgba(58,42,26,0.55)' }}>Study</span>
            <span style={{ fontWeight: 600 }}>12 days</span>
          </span>
        </div>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            borderRadius: 12,
            border: '1px solid rgba(58,42,26,0.1)',
            padding: 14,
          }}
        >
          <CircularProgress percent={84} />
          <span style={{ fontSize: 12, lineHeight: 1.3 }}>
            <span style={{ display: 'block', color: 'rgba(58,42,26,0.55)' }}>Recent Score</span>
            <span style={{ fontWeight: 600 }}>82 / 98 correct</span>
          </span>
        </div>
      </div>

      <div
        style={{
          marginTop: 20,
          borderTop: '1px solid rgba(58,42,26,0.1)',
          paddingTop: 14,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            color: 'rgba(58,42,26,0.5)',
          }}
        >
          Next Up
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 500 }}>
          IS – Antigen-Antibody Reactions
        </p>
      </div>

      <button
        type="button"
        style={{
          marginTop: 'auto',
          borderRadius: 9999,
          background: COLORS.maroon,
          color: COLORS.cream,
          border: 'none',
          padding: '14px 0',
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        Continue Reviewing
      </button>
    </div>
  )
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

// Full round trip so the loop seam is invisible: idle Q12 -> answer it ->
// Next -> idle Q13 -> answer it -> Next -> back to idle Q12 (same as frame 0).
const LEG_1_SELECT: [number, number] = [36, 52]
const LEG_1_PULSE: [number, number, number] = [76, 84, 92]
const CROSSFADE_1: [number, number] = [92, 108]
const LEG_2_SELECT: [number, number] = [140, 156]
const LEG_2_PULSE: [number, number, number] = [176, 184, 192]
const CROSSFADE_2: [number, number] = [192, 208]

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
      <p style={{ margin: '6px 0 0', fontSize: 12, color: 'rgba(58,42,26,0.55)' }}>
        Question {q.number} of 33
      </p>

      <p
        style={{
          margin: '14px 0 0',
          fontSize: 15,
          lineHeight: 1.4,
          fontWeight: 500,
          color: COLORS.brown,
          minHeight: 42,
        }}
      >
        {q.prompt}
      </p>

      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                gap: 10,
                borderRadius: 10,
                border: `1px solid ${borderColor}`,
                background: bg,
                color: COLORS.brown,
                padding: '8px 12px',
                fontSize: 13,
                transform: isCorrectChoice ? `scale(${tapScale})` : 'scale(1)',
                transformOrigin: 'left center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 22,
                    height: 22,
                    borderRadius: 9999,
                    fontSize: 11,
                    fontWeight: 700,
                    background: t > 0 ? COLORS.gold : 'transparent',
                    color: t > 0 ? COLORS.brown : 'rgba(58,42,26,0.55)',
                    border: t > 0 ? 'none' : '1px solid rgba(58,42,26,0.2)',
                  }}
                >
                  {choice.letter}
                </span>
                {choice.text}
              </div>
              {t > 0 && (
                <Check
                  size={16}
                  color="#3A5A40"
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
            border: '1px solid rgba(58,42,26,0.15)',
            padding: '8px 14px',
            fontSize: 11,
            fontWeight: 600,
            color: 'rgba(58,42,26,0.7)',
          }}
        >
          ← Previous
        </span>
        <span
          style={{
            borderRadius: 9999,
            background: COLORS.maroon,
            padding: '8px 14px',
            fontSize: 11,
            fontWeight: 600,
            color: COLORS.cream,
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

// --- Quiz card: idle Q12 -> select the correct answer -> Next pulses ->
// crossfades to Q13 -> select its answer -> Next pulses -> crossfades back
// to idle Q12, exactly matching frame 0 so the loop wraps invisibly. ---
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

  // Three overlapping layers: idle/answered Q12 (first pass), Q13, and idle
  // Q12 again (second pass, identical markup to the first so it lines up
  // pixel-for-pixel with frame 0 once crossfade 2 finishes).
  const opacityQ12First = fadeOut1
  const opacityQ13 = fadeIn1 * fadeOut2
  const opacityQ12Second = fadeIn2

  return (
    <div
      style={{
        width: QUIZ_CARD.width,
        borderRadius: 20,
        border: '1px solid rgba(58,42,26,0.1)',
        background: '#fff',
        padding: 26,
        boxShadow: '0 30px 60px rgba(0,0,0,0.35)',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: COLORS.brown }}>Multiple Choice</span>
          <span
            style={{
              borderRadius: 6,
              background: COLORS.gold,
              padding: '3px 8px',
              fontSize: 11,
              fontWeight: 700,
              color: COLORS.brown,
            }}
          >
            IS
          </span>
        </div>
        <Bookmark size={16} color="rgba(58,42,26,0.5)" />
      </div>

      <div style={{ position: 'relative', minHeight: 340 }}>
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
    </div>
  )
}

const DECKS = [
  { name: 'IS - Serology', count: 142 },
  { name: 'Blood Banking', count: 118 },
  { name: 'MTAP - Comp.', count: 156 },
  { name: 'Clin. Chem.', count: 97 },
]

// --- Flashcard: idle FRONT -> flips to reveal the BACK answer -> holds ->
// flips back to FRONT, ending exactly where it started. Active deck swaps
// out and back too, on the same round-trip schedule. ---
function FlashcardCard({ frame }: { frame: number }) {
  const flipOut = clamp01(frame, 60, 75)
  const flipIn = clamp01(frame, 75, 90)
  const flipBackOut = clamp01(frame, 150, 162)
  const flipBackIn = clamp01(frame, 162, 175)

  const isBack = frame >= 75 && frame < 162
  const scaleX =
    frame < 60
      ? 1
      : frame < 75
        ? 1 - flipOut
        : frame < 90
          ? flipIn
          : frame < 150
            ? 1
            : frame < 162
              ? 1 - flipBackOut
              : frame < 175
                ? flipBackIn
                : 1

  const activeDeckIndex = frame >= 110 && frame < 200 ? 1 : 2

  return (
    <div
      style={{
        width: FLASH_CARD.width,
        display: 'flex',
        overflow: 'hidden',
        borderRadius: 20,
        border: '1px solid rgba(58,42,26,0.1)',
        background: '#fff',
        boxShadow: '0 30px 60px rgba(0,0,0,0.35)',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ width: 160, flexShrink: 0, borderRight: '1px solid rgba(58,42,26,0.1)', padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(58,42,26,0.7)' }}>Card Decks</span>
          <span style={{ fontSize: 16, color: 'rgba(58,42,26,0.4)' }}>+</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {DECKS.map((deck, i) => {
            const active = i === activeDeckIndex
            return (
              <div
                key={deck.name}
                style={{
                  borderRadius: 8,
                  padding: '6px 8px',
                  fontSize: 10.5,
                  lineHeight: 1.3,
                  background: active ? COLORS.gold : 'transparent',
                  color: active ? COLORS.brown : 'rgba(58,42,26,0.65)',
                }}
              >
                <span style={{ display: 'block', fontWeight: 500 }}>{deck.name}</span>
                <span style={{ opacity: 0.7 }}>{deck.count} cards</span>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ flex: 1, padding: 22, transform: `scaleX(${scaleX})`, transformOrigin: 'center' }}>
        <span
          style={{
            display: 'inline-block',
            borderRadius: 6,
            background: isBack ? COLORS.maroon : COLORS.gold,
            padding: '3px 8px',
            fontSize: 11,
            fontWeight: 700,
            color: isBack ? COLORS.cream : COLORS.brown,
          }}
        >
          {isBack ? 'BACK' : 'FRONT'}
        </span>
        <p style={{ margin: '18px 0 0', fontSize: 14.5, lineHeight: 1.4, fontWeight: 500, color: COLORS.brown }}>
          {isBack
            ? 'Antigen-antibody binding produces a measurable signal — color or fluorescence — proportional to analyte concentration.'
            : 'What is the principle behind the ELISA test?'}
        </p>
        {!isBack && (
          <div
            style={{
              marginTop: 18,
              borderTop: '1px solid rgba(58,42,26,0.1)',
              paddingTop: 12,
              textAlign: 'center',
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: '#B8721F',
                textDecoration: 'underline',
              }}
            >
              Tap to reveal answer
            </span>
          </div>
        )}
        <div style={{ marginTop: isBack ? 22 : 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span
            style={{
              borderRadius: 9999,
              border: '1px solid rgba(58,42,26,0.2)',
              padding: '6px 10px',
              fontSize: 10.5,
              fontWeight: 600,
              color: COLORS.brown,
            }}
          >
            Shuffle
          </span>
          <span style={{ fontSize: 10.5, color: 'rgba(58,42,26,0.55)' }}>29/156</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <ChevronLeft size={14} color="rgba(58,42,26,0.5)" />
            <ChevronRight size={14} color="rgba(58,42,26,0.5)" />
          </div>
        </div>
      </div>
    </div>
  )
}

const SPARKLE_SPOTS = [
  { x: 40, y: -30, size: 26, rotate: 12, phase: 0 },
  { x: -20, y: 260, size: 20, rotate: -12, phase: 30 },
  { x: 960, y: 1000, size: 22, rotate: 45, phase: 60 },
  { x: 1120, y: 120, size: 18, rotate: 0, phase: 15 },
  { x: 40, y: 900, size: 18, rotate: 20, phase: 45 },
]

export function WhyKabisHero() {
  const frame = useCurrentFrame()

  const phoneY = PHONE.y + bob(frame, 0, 6)
  const quizY = QUIZ_CARD.y + bob(frame, 45, 5)
  const flashY = FLASH_CARD.y + bob(frame, 90, 5)

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      {SPARKLE_SPOTS.map((spot, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: spot.x,
            top: spot.y,
            opacity: twinkle(frame, spot.phase, 2),
            transform: `rotate(${spot.rotate}deg)`,
          }}
        >
          <Sparkle size={spot.size} color={COLORS.gold} fill={COLORS.gold} />
        </div>
      ))}

      <div
        style={{
          position: 'absolute',
          left: PHONE.x,
          top: phoneY,
          width: PHONE.size,
          height: PHONE.size,
        }}
      >
        <Img
          src={staticFile('iphone_mock.png')}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
        />
        <div
          style={{
            position: 'absolute',
            overflow: 'hidden',
            borderRadius: 48,
            left: '31%',
            top: '8.6%',
            width: '38%',
            height: '82.8%',
          }}
        >
          <PhoneScreen />
        </div>
      </div>

      <div style={{ position: 'absolute', left: QUIZ_CARD.x, top: quizY }}>
        <QuizCard frame={frame} />
      </div>

      <div style={{ position: 'absolute', left: FLASH_CARD.x, top: flashY }}>
        <FlashcardCard frame={frame} />
      </div>
    </AbsoluteFill>
  )
}
