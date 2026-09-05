import { useState } from 'react'

const KEYS = [
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
}

export function CalculatorPopover() {
  const [display, setDisplay] = useState('0')
  const [pending, setPending] = useState<{ value: number; op: string } | null>(null)
  const [resetOnNextDigit, setResetOnNextDigit] = useState(false)

  function pressDigit(digit: string) {
    if (display === '0' || resetOnNextDigit) {
      setDisplay(digit === '.' ? '0.' : digit)
      setResetOnNextDigit(false)
      return
    }
    if (digit === '.' && display.includes('.')) return
    setDisplay(display + digit)
  }

  function pressOperator(op: string) {
    const current = Number.parseFloat(display)
    if (pending && !resetOnNextDigit) {
      const result = OPERATORS[pending.op](pending.value, current)
      setDisplay(String(result))
      setPending({ value: result, op })
    } else {
      setPending({ value: current, op })
    }
    setResetOnNextDigit(true)
  }

  function pressEquals() {
    if (!pending) return
    const current = Number.parseFloat(display)
    const result = OPERATORS[pending.op](pending.value, current)
    setDisplay(String(result))
    setPending(null)
    setResetOnNextDigit(true)
  }

  function pressClear() {
    setDisplay('0')
    setPending(null)
    setResetOnNextDigit(false)
  }

  return (
    <div className="w-56 rounded-xl border border-[#3A2A1A]/10 bg-white p-3 shadow-xl">
      <div className="mb-3 flex items-center justify-between">
        <div className="truncate rounded-lg bg-[#F3ECDC] px-3 py-2 text-right text-lg font-semibold text-[#3A2A1A]">
          {display}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        <button
          type="button"
          onClick={pressClear}
          className="col-span-4 rounded-lg bg-[#3A2A1A]/5 py-2 text-xs font-semibold text-[#7A2323] hover:bg-[#3A2A1A]/10"
        >
          Clear
        </button>
        {KEYS.flat().map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              if (key === '=') pressEquals()
              else if (OPERATORS[key]) pressOperator(key)
              else pressDigit(key)
            }}
            className={
              OPERATORS[key] || key === '='
                ? 'rounded-lg bg-[#7A2323] py-2 text-sm font-semibold text-[#F3ECDC] hover:bg-[#7A2323]/90'
                : 'rounded-lg bg-[#F3ECDC] py-2 text-sm font-medium text-[#3A2A1A] hover:bg-[#3A2A1A]/10'
            }
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  )
}
