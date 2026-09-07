import { cn } from '@/lib/utils'

interface PromptBlock {
  type: 'prose' | 'table'
  lines: string[]
}

/** Matches "Label – Value" lines (the trial-balance / schedule style used across long case-study prompts). */
const ROW_PATTERN = /^(.+?)\s+–\s+(.+)$/

function splitIntoBlocks(text: string): PromptBlock[] {
  const blocks: PromptBlock[] = []
  let buffer: string[] = []
  let bufferType: PromptBlock['type'] | null = null

  function flush() {
    if (buffer.length > 0 && bufferType) blocks.push({ type: bufferType, lines: buffer })
    buffer = []
    bufferType = null
  }

  for (const line of text.split('\n')) {
    if (line.trim() === '') {
      flush()
      continue
    }
    const lineType: PromptBlock['type'] = ROW_PATTERN.test(line) ? 'table' : 'prose'
    if (bufferType && bufferType !== lineType) flush()
    bufferType = lineType
    buffer.push(line)
  }
  flush()

  // A table needs at least 3 rows to be worth a table layout — fewer than that is
  // just a sentence that happens to contain an en dash, not tabular data.
  return blocks.map((b) => (b.type === 'table' && b.lines.length < 3 ? { ...b, type: 'prose' } : b))
}

interface QuestionPromptTextProps {
  text: string
  className?: string
}

/**
 * Renders a question prompt with its line breaks preserved, and promotes any
 * run of 3+ "Label – Value" lines (trial balances, schedules) into an actual
 * table instead of one unreadable run-on paragraph.
 */
export function QuestionPromptText({ text, className }: QuestionPromptTextProps) {
  const blocks = splitIntoBlocks(text)

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {blocks.map((block, i) =>
        block.type === 'table' ? (
          <div key={i} className="overflow-x-auto rounded-lg border border-[#3A2A1A]/10">
            <table className="w-full min-w-max text-sm">
              <tbody>
                {block.lines.map((line, j) => {
                  const match = line.match(ROW_PATTERN)
                  const [, label, value] = match ?? [null, line, '']
                  return (
                    <tr key={j} className={j % 2 === 1 ? 'bg-[#3A2A1A]/[0.03]' : undefined}>
                      <td className="px-3 py-1.5 font-medium whitespace-pre-line text-[#3A2A1A]">{label}</td>
                      <td className="px-3 py-1.5 text-right whitespace-nowrap text-[#3A2A1A]/80">{value}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p key={i} className="whitespace-pre-line">
            {block.lines.join('\n')}
          </p>
        ),
      )}
    </div>
  )
}
