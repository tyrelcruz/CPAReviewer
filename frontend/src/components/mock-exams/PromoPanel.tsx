import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const CHECKLIST = [
  '3-day full exam experience',
  'Realistic timing & difficulty',
  'In-depth performance insights',
]

export function PromoPanel() {
  const navigate = useNavigate()

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#E0AC48]/30 bg-[#FBEED2] p-5">
      <p className="text-sm font-bold text-[#7A2323]">Simulate. Analyze. Improve.</p>
      <p className="font-reading mt-2 text-sm text-[#3A2A1A]/75">
        Full-length simulations help you build stamina and exam confidence.
      </p>

      <ul className="mt-4 flex flex-col gap-2">
        {CHECKLIST.map((item) => (
          <li key={item} className="flex items-center gap-2 text-sm text-[#3A2A1A]">
            <CheckCircle2 className="size-4 shrink-0 text-[#3A5A40]" />
            {item}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => navigate('/app/practice')}
        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-full bg-[#7A2323] px-4 py-2.5 text-sm font-semibold text-[#F3ECDC] transition-colors hover:bg-[#7A2323]/90"
      >
        Try Full-length Exam
        <ArrowRight className="size-4" />
      </button>

      <p className="mt-3 text-center text-sm text-[#3A5A40]/60" aria-hidden="true">
        〜◡〜
      </p>
    </div>
  )
}
