import { motion } from 'framer-motion'

import kabisWordmark from '@/assets/logo/kabis_wordmark.png'

interface LoadingScreenProps {
  ready: boolean
  onDone?: () => void
}

const TAGLINE = [
  { text: 'Flash Quiz.', color: '#7A2323' },
  { text: 'Focused Review.', color: '#3A5A40' },
  { text: 'RMT Ready.', color: '#E0AC48' },
]

export function LoadingScreen({ ready, onDone }: LoadingScreenProps) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-[#F3ECDC] px-6">
      <motion.img
        src={kabisWordmark}
        alt="KABIS"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="h-40 w-auto object-contain sm:h-48"
      />

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
        className="mt-2 flex flex-wrap items-center justify-center gap-x-3 text-sm font-bold tracking-widest uppercase"
      >
        {TAGLINE.map((part) => (
          <span key={part.text} style={{ color: part.color }}>
            {part.text}
          </span>
        ))}
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="mt-10 w-64 sm:w-80"
      >
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#3A2A1A]/15">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: ready ? '100%' : '85%' }}
            transition={
              ready
                ? { duration: 0.3, ease: 'easeOut' }
                : { duration: 1.6, delay: 0.35, ease: 'easeInOut' }
            }
            onAnimationComplete={() => {
              if (ready) onDone?.()
            }}
            className="h-full rounded-full bg-[#7A2323]"
          />
        </div>
        <p className="mt-3 text-center text-xs font-semibold tracking-[0.3em] text-[#3A2A1A]/60 uppercase">
          Loading...
        </p>
      </motion.div>
    </div>
  )
}
