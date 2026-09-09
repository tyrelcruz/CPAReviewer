import { motion, useDragControls } from 'framer-motion'
import { Delete, GripVertical, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const SCIENTIFIC_KEYS = [
  ['sin', 'cos', 'tan', 'π'],
  ['log', 'ln', '√', 'x²'],
  ['x^y', '1/x', '%', '±'],
]

const BASIC_KEYS = [
  ['7', '8', '9', '÷'],
  ['4', '5', '6', '×'],
  ['1', '2', '3', '−'],
  ['0', '.', '=', '+'],
]

const OPERATORS: Record<string, (a: number, b: number) => number> = {
  '÷': (a, b) => a / b,
  '×': (a, b) => a * b,
  '−': (a, b) => a - b,
  '+': (a, b) => a + b,
  'x^y': (a, b) => a ** b,
}

const UNARY_FUNCTIONS: Record<string, (a: number) => number> = {
  sin: (a) => Math.sin((a * Math.PI) / 180),
  cos: (a) => Math.cos((a * Math.PI) / 180),
  tan: (a) => Math.tan((a * Math.PI) / 180),
  log: (a) => Math.log10(a),
  ln: (a) => Math.log(a),
  '√': (a) => Math.sqrt(a),
  'x²': (a) => a * a,
  '1/x': (a) => 1 / a,
  '%': (a) => a / 100,
  '±': (a) => -a,
}

const KEYBOARD_OPERATOR_MAP: Record<string, string> = {
  '+': '+',
  '-': '−',
  '*': '×',
  '/': '÷',
  '^': 'x^y',
}

/** Rounds away typical floating-point noise (e.g. sin(30) === 0.49999999999999994)
 * and reports non-finite results (divide by zero, log of a negative number, …) as
 * an explicit error rather than "Infinity"/"NaN". */
function formatResult(n: number): string {
  if (!Number.isFinite(n)) return 'Error'
  return String(Number(n.toPrecision(12)))
}

interface CalculatorPopoverProps {
  onClose: () => void
}

/**
 * A persistent floating tool window, not a dropdown — it starts docked to
 * the side of the screen but can be dragged anywhere (drag is scoped to the
 * header via dragControls/dragListener=false so it doesn't hijack clicks on
 * the digit/operator buttons). Deliberately has no click-outside-to-close
 * backdrop: the point of making it draggable is that it stays put and
 * usable while the learner keeps working the exam underneath it.
 */
export function CalculatorPopover({ onClose }: CalculatorPopoverProps) {
  const [display, setDisplay] = useState('0')
  const [pending, setPending] = useState<{ value: number; op: string } | null>(null)
  const [resetOnNextDigit, setResetOnNextDigit] = useState(false)
  // What's shown on the small line above the main display — the operator (or
  // function) just used, so the calculation stays visible instead of only
  // ever showing the latest number.
  const [historyLine, setHistoryLine] = useState('')
  const dragControls = useDragControls()
  const constraintsRef = useRef<HTMLDivElement>(null)

  function pressDigit(digit: string) {
    if (display === '0' || display === 'Error' || resetOnNextDigit) {
      setDisplay(digit === '.' ? '0.' : digit)
      setResetOnNextDigit(false)
      return
    }
    if (digit === '.' && display.includes('.')) return
    setDisplay(display + digit)
  }

  function pressOperator(op: string) {
    const current = Number.parseFloat(display)
    const operand = pending && !resetOnNextDigit ? OPERATORS[pending.op](pending.value, current) : current
    if (pending && !resetOnNextDigit) setDisplay(formatResult(operand))
    setPending({ value: operand, op })
    setHistoryLine(`${formatResult(operand)} ${op}`)
    setResetOnNextDigit(true)
  }

  function pressUnary(fn: string) {
    if (fn === 'π') {
      setDisplay(formatResult(Math.PI))
      setHistoryLine('π =')
      setResetOnNextDigit(true)
      return
    }
    const current = Number.parseFloat(display)
    setDisplay(formatResult(UNARY_FUNCTIONS[fn](current)))
    setHistoryLine(`${fn}(${formatResult(current)}) =`)
    setResetOnNextDigit(true)
  }

  function pressEquals() {
    if (!pending) return
    const current = Number.parseFloat(display)
    const result = OPERATORS[pending.op](pending.value, current)
    setHistoryLine(`${formatResult(pending.value)} ${pending.op} ${formatResult(current)} =`)
    setDisplay(formatResult(result))
    setPending(null)
    setResetOnNextDigit(true)
  }

  function pressBackspace() {
    if (resetOnNextDigit || display === 'Error') {
      setDisplay('0')
      setResetOnNextDigit(false)
      return
    }
    setDisplay((d) => (d.length > 1 ? d.slice(0, -1) : '0'))
  }

  function pressClear() {
    setDisplay('0')
    setPending(null)
    setResetOnNextDigit(false)
    setHistoryLine('')
  }

  function pressKey(key: string) {
    if (key === '=') pressEquals()
    else if (OPERATORS[key]) pressOperator(key)
    else if (UNARY_FUNCTIONS[key] || key === 'π') pressUnary(key)
    else pressDigit(key)
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      // Don't hijack typing meant for something else on the page (the
      // identification-mode answer input, notes textarea, etc.) — only
      // route bare keystrokes to the calculator.
      const target = e.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      if (target?.isContentEditable) return

      if (/^[0-9.]$/.test(e.key)) {
        e.preventDefault()
        pressDigit(e.key)
      } else if (KEYBOARD_OPERATOR_MAP[e.key]) {
        e.preventDefault()
        pressOperator(KEYBOARD_OPERATOR_MAP[e.key])
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault()
        pressEquals()
      } else if (e.key === '%') {
        e.preventDefault()
        pressUnary('%')
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        pressBackspace()
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault()
        pressClear()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [display, pending, resetOnNextDigit, onClose])

  return (
    <div ref={constraintsRef} className="pointer-events-none fixed inset-0 z-40">
      <motion.div
        drag
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        dragElastic={0}
        dragConstraints={constraintsRef}
        initial={{ opacity: 0, scale: 0.95, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -8 }}
        transition={{ duration: 0.15 }}
        className="pointer-events-auto fixed inset-x-4 top-20 mx-auto w-auto max-w-[320px] overflow-hidden rounded-2xl border border-[#3A2A1A]/10 bg-white shadow-2xl sm:inset-x-auto sm:top-24 sm:right-6 sm:left-auto sm:mx-0 sm:w-80"
      >
        <div
          onPointerDown={(e) => dragControls.start(e)}
          className="flex cursor-grab items-center justify-between border-b border-[#3A2A1A]/10 bg-[#F3ECDC] px-4 py-2.5 touch-none select-none active:cursor-grabbing"
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#3A2A1A]/70">
            <GripVertical className="size-4" />
            Scientific Calculator
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close calculator"
            className="rounded-full p-1 text-[#3A2A1A]/60 transition-colors hover:bg-[#3A2A1A]/10 hover:text-[#3A2A1A]"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-3 rounded-lg bg-[#F3ECDC] px-3 py-3 text-right">
            <div className="h-4 truncate text-xs font-semibold text-[#3A2A1A]/50">
              {historyLine}
            </div>
            <div className="truncate text-xl font-semibold text-[#3A2A1A]">{display}</div>
          </div>

          <div className="mb-2 grid grid-cols-4 gap-2">
            {SCIENTIFIC_KEYS.flat().map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => pressKey(key)}
                className="rounded-lg bg-[#3A5A40]/10 py-2 text-xs font-semibold text-[#3A5A40] transition-colors hover:bg-[#3A5A40]/20"
              >
                {key}
              </button>
            ))}
          </div>

          <div className="mb-2 grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={pressClear}
              className="col-span-2 rounded-lg bg-[#3A2A1A]/5 py-2.5 text-sm font-semibold text-[#7A2323] transition-colors hover:bg-[#3A2A1A]/10"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={pressBackspace}
              aria-label="Backspace"
              className="col-span-2 flex items-center justify-center rounded-lg bg-[#3A2A1A]/5 py-2.5 text-[#7A2323] transition-colors hover:bg-[#3A2A1A]/10"
            >
              <Delete className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {BASIC_KEYS.flat().map((key) => {
              // Highlights whichever operator is currently "armed" — awaiting
              // its second operand — so it's obvious what operation is in
              // progress, not just the running number.
              const isArmedOperator = OPERATORS[key] && pending?.op === key && resetOnNextDigit
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => pressKey(key)}
                  className={
                    isArmedOperator
                      ? 'rounded-lg bg-[#E0AC48] py-3 text-base font-semibold text-[#3A2A1A] ring-2 ring-[#B4791F] transition-colors'
                      : OPERATORS[key] || key === '='
                        ? 'rounded-lg bg-[#7A2323] py-3 text-base font-semibold text-[#F3ECDC] transition-colors hover:bg-[#7A2323]/90'
                        : 'rounded-lg bg-[#F3ECDC] py-3 text-base font-medium text-[#3A2A1A] transition-colors hover:bg-[#3A2A1A]/10'
                  }
                >
                  {key}
                </button>
              )
            })}
          </div>

          <p className="font-reading mt-3 text-center text-[10px] text-[#3A2A1A]/40">
            Type numbers/operators on your keyboard · Enter = equals · Esc closes
          </p>
        </div>
      </motion.div>
    </div>
  )
}
