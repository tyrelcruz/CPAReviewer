import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  length?: number
  disabled?: boolean
  id?: string
  className?: string
}

/** 6-card one-time-code input. Clicking or focusing any card always jumps
 * focus to the first empty card (or the last card once the code is full) —
 * so users can't land mid-code, only append or backspace from the end.
 *
 * Digits live in a ref (not just React state) so every handler reads/writes
 * the latest value synchronously — typing or pasting a full code fires
 * several onChange events faster than React can re-render between them, and
 * reading from `value`/state directly in that window drops characters to a
 * stale closure. */
export function OtpInput({ value, onChange, length = 6, disabled, id, className }: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const digitsRef = useRef<string[]>(Array(length).fill(''))
  const [renderDigits, setRenderDigits] = useState<string[]>(digitsRef.current)

  const commit = () => {
    setRenderDigits([...digitsRef.current])
    onChange(digitsRef.current.join(''))
  }

  useEffect(() => {
    if (value === '' && digitsRef.current.join('') !== '') {
      digitsRef.current = Array(length).fill('')
      setRenderDigits([...digitsRef.current])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const firstEmptyIndex = () => {
    const idx = digitsRef.current.findIndex((d) => !d)
    return idx === -1 ? length - 1 : idx
  }

  const focusIndex = (index: number) => {
    inputRefs.current[index]?.focus()
    inputRefs.current[index]?.select()
  }

  const handleChange = (index: number, raw: string) => {
    const typed = raw.replace(/\D/g, '')
    if (!typed) {
      digitsRef.current[index] = ''
      commit()
      return
    }
    let i = index
    for (const d of typed) {
      if (i >= length) break
      digitsRef.current[i] = d
      i++
    }
    commit()
    focusIndex(Math.min(i, length - 1))
  }

  const handlePaste = (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '')
    if (!pasted) return
    e.preventDefault()
    handleChange(index, pasted)
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (digitsRef.current[index]) {
        digitsRef.current[index] = ''
        commit()
      } else if (index > 0) {
        digitsRef.current[index - 1] = ''
        commit()
        focusIndex(index - 1)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      focusIndex(index - 1)
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault()
      focusIndex(index + 1)
    }
  }

  return (
    <div className={cn('flex items-center justify-center gap-2', className)} role="group" aria-label="Verification code">
      {renderDigits.map((digit, index) => (
        <input
          key={index}
          id={index === 0 ? id : undefined}
          ref={(el) => {
            inputRefs.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          aria-label={`Digit ${index + 1} of ${length}`}
          disabled={disabled}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onPaste={(e) => handlePaste(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onFocus={() => focusIndex(firstEmptyIndex())}
          className="size-10 rounded-xl border border-[#3A2A1A]/15 bg-white text-center text-lg font-semibold text-[#3A2A1A] outline-none transition-colors focus:border-[#7A2323]/50 disabled:opacity-60 sm:size-12"
        />
      ))}
    </div>
  )
}
