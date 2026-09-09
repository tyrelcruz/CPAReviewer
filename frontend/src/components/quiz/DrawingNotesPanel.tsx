import {
  Eraser,
  Highlighter,
  Maximize2,
  Minus,
  Move,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { QuestionPromptText } from '@/components/quiz/QuestionPromptText'
import { cn } from '@/lib/utils'

type DrawTool = 'pen' | 'highlight' | 'eraser' | 'move'

interface StrokePoint {
  x: number
  y: number
}

interface Stroke {
  tool: DrawTool
  color: string
  size: number
  points: StrokePoint[]
}

interface QuestionChoice {
  id: string
  text: string
}

interface DrawingNotesPanelProps {
  questionNumber: number
  totalQuestions: number
  questionPrompt: string
  choices: QuestionChoice[]
}

const COLORS = ['#3A2A1A', '#7A2323', '#1D4ED8', '#3A5A40', '#E0AC48']
const GRID_GAP = 22
const GRID_COLOR = 'rgba(58, 42, 26, 0.12)'
/** How much bigger than the visible viewport the pannable canvas is in maximize mode. */
const PAN_SCALE = 2

const DRAW_TOOLS: { key: DrawTool; label: string; icon: typeof Pencil }[] = [
  { key: 'pen', label: 'Pen', icon: Pencil },
  { key: 'highlight', label: 'Highlight', icon: Highlighter },
  { key: 'eraser', label: 'Eraser', icon: Eraser },
]
const MOVE_TOOL: { key: DrawTool; label: string; icon: typeof Pencil } = {
  key: 'move',
  label: 'Move',
  icon: Move,
}

interface ToolbarProps {
  tool: DrawTool
  onToolChange: (tool: DrawTool) => void
  color: string
  onColorChange: (color: string) => void
  size: number
  onSizeChange: (size: number) => void
  canPan?: boolean
}

function DrawingToolbar({
  tool,
  onToolChange,
  color,
  onColorChange,
  size,
  onSizeChange,
  canPan,
}: ToolbarProps) {
  const tools = canPan ? [...DRAW_TOOLS, MOVE_TOOL] : DRAW_TOOLS

  return (
    <>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-1 rounded-full border border-[#3A2A1A]/15 p-1">
          {tools.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => onToolChange(t.key)}
              aria-pressed={tool === t.key}
              title={t.label}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition-colors',
                tool === t.key
                  ? 'bg-[#7A2323] text-white'
                  : 'text-[#3A2A1A]/60 hover:bg-[#3A2A1A]/5',
              )}
            >
              <t.icon className="size-3.5" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
        {canPan && tool === 'move' && (
          <span className="font-reading text-xs text-[#3A2A1A]/50">
            Drag anywhere on the canvas to pan around.
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-1.5">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onColorChange(c)}
              aria-label={`Use color ${c}`}
              aria-pressed={color === c}
              className={cn(
                'size-6 shrink-0 rounded-full ring-offset-2 transition-shadow',
                color === c ? 'ring-2 ring-[#3A2A1A]/60' : 'hover:ring-2 hover:ring-[#3A2A1A]/20',
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="flex flex-1 items-center gap-1.5 rounded-full border border-[#3A2A1A]/15 px-2 py-1">
          <button
            type="button"
            onClick={() => onSizeChange(Math.max(1, size - 1))}
            aria-label="Decrease stroke size"
            className="flex size-5 shrink-0 items-center justify-center rounded-full text-[#3A2A1A]/60 hover:bg-[#3A2A1A]/5"
          >
            <Minus className="size-3" />
          </button>
          <input
            type="range"
            min={1}
            max={16}
            step={1}
            value={size}
            onChange={(e) => onSizeChange(Number(e.target.value))}
            className="h-1 flex-1 accent-[#7A2323]"
            aria-label="Stroke size"
          />
          <button
            type="button"
            onClick={() => onSizeChange(Math.min(16, size + 1))}
            aria-label="Increase stroke size"
            className="flex size-5 shrink-0 items-center justify-center rounded-full text-[#3A2A1A]/60 hover:bg-[#3A2A1A]/5"
          >
            <Plus className="size-3" />
          </button>
        </div>
      </div>
    </>
  )
}

export function DrawingNotesPanel({
  questionNumber,
  totalQuestions,
  questionPrompt,
  choices,
}: DrawingNotesPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const strokesRef = useRef<Stroke[]>([])
  const currentStrokeRef = useRef<Stroke | null>(null)
  const drawingRef = useRef(false)
  const panRef = useRef<{ x: number; y: number } | null>(null)
  const dprRef = useRef(1)

  const [tool, setTool] = useState<DrawTool>('pen')
  const [color, setColor] = useState(COLORS[0])
  const [size, setSize] = useState(3)
  const [hasInk, setHasInk] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)

  function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const gap = GRID_GAP * dprRef.current
    ctx.fillStyle = GRID_COLOR
    for (let y = gap; y < height; y += gap) {
      for (let x = gap; x < width; x += gap) {
        ctx.beginPath()
        ctx.arc(x, y, 1 * dprRef.current, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke, width: number, height: number) {
    if (stroke.points.length < 1) return
    ctx.save()
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    if (stroke.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.globalAlpha = 1
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = stroke.color
      ctx.globalAlpha = stroke.tool === 'highlight' ? 0.35 : 1
    }
    ctx.lineWidth = stroke.size * dprRef.current * (stroke.tool === 'eraser' ? 3.5 : 1)
    ctx.beginPath()
    stroke.points.forEach((p, i) => {
      const x = p.x * width
      const y = p.y * height
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()
    ctx.restore()
  }

  function redraw() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawGrid(ctx, canvas.width, canvas.height)
    for (const stroke of strokesRef.current) drawStroke(ctx, stroke, canvas.width, canvas.height)
    if (currentStrokeRef.current) drawStroke(ctx, currentStrokeRef.current, canvas.width, canvas.height)
  }

  // Re-attach whenever `isMaximized` toggles: the compact and full-screen
  // views render distinct <canvas>/container nodes, so the observer needs to
  // point at whichever pair is currently mounted. In maximize mode the
  // canvas is deliberately oversized (PAN_SCALE) so there's room to pan.
  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return
    let hasCentered = false

    function resize() {
      const canvas = canvasRef.current
      const container = containerRef.current
      if (!canvas || !container) return
      const dpr = window.devicePixelRatio || 1
      dprRef.current = dpr
      const scale = isMaximized ? PAN_SCALE : 1
      const cssWidth = container.clientWidth * scale
      const cssHeight = container.clientHeight * scale
      canvas.style.width = `${cssWidth}px`
      canvas.style.height = `${cssHeight}px`
      canvas.width = Math.max(1, Math.round(cssWidth * dpr))
      canvas.height = Math.max(1, Math.round(cssHeight * dpr))
      redraw()

      if (scale > 1 && !hasCentered) {
        container.scrollLeft = (cssWidth - container.clientWidth) / 2
        container.scrollTop = (cssHeight - container.clientHeight) / 2
        hasCentered = true
      }
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(container)
    return () => observer.disconnect()
  }, [isMaximized])

  useEffect(() => {
    if (!isMaximized) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsMaximized(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isMaximized])

  function toRelative(e: React.PointerEvent<HTMLCanvasElement>): StrokePoint {
    const rect = e.currentTarget.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    }
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    if (tool === 'move') {
      panRef.current = { x: e.clientX, y: e.clientY }
      return
    }
    drawingRef.current = true
    currentStrokeRef.current = { tool, color, size, points: [toRelative(e)] }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (tool === 'move') {
      if (!panRef.current) return
      const container = containerRef.current
      if (!container) return
      container.scrollLeft -= e.clientX - panRef.current.x
      container.scrollTop -= e.clientY - panRef.current.y
      panRef.current = { x: e.clientX, y: e.clientY }
      return
    }
    if (!drawingRef.current || !currentStrokeRef.current) return
    currentStrokeRef.current.points.push(toRelative(e))
    redraw()
  }

  function handlePointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    if (tool === 'move') {
      panRef.current = null
      return
    }
    if (!drawingRef.current) return
    drawingRef.current = false
    if (currentStrokeRef.current && currentStrokeRef.current.points.length > 1) {
      strokesRef.current.push(currentStrokeRef.current)
      setHasInk(true)
    }
    currentStrokeRef.current = null
    redraw()
  }

  function handleUndo() {
    strokesRef.current.pop()
    setHasInk(strokesRef.current.length > 0)
    redraw()
  }

  function handleClear() {
    strokesRef.current = []
    setHasInk(false)
    redraw()
  }

  const canvasEl = (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className={cn(
        'touch-none',
        tool === 'move' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair',
      )}
    />
  )

  const undoClearButtons = (
    <>
      <button
        type="button"
        onClick={handleUndo}
        disabled={!hasInk}
        aria-label="Undo last stroke"
        title="Undo"
        className="flex size-7 items-center justify-center rounded-full text-[#3A2A1A]/50 transition-colors hover:bg-[#3A2A1A]/5 hover:text-[#3A2A1A] disabled:cursor-not-allowed disabled:opacity-30"
      >
        <RotateCcw className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={handleClear}
        disabled={!hasInk}
        aria-label="Clear all notes"
        title="Clear"
        className="flex size-7 items-center justify-center rounded-full text-[#3A2A1A]/50 transition-colors hover:bg-red-600/10 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <Trash2 className="size-3.5" />
      </button>
    </>
  )

  if (isMaximized) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A2A1A]/50 p-3 sm:p-6">
        <div className="flex h-full w-full max-w-7xl flex-col gap-4 rounded-3xl bg-[#FBF3EA] p-4 shadow-2xl sm:p-6">
          <div className="max-h-[24vh] shrink-0 overflow-y-auto rounded-2xl border border-[#3A2A1A]/10 bg-white p-4 sm:p-5">
            <p className="text-xs font-semibold text-[#3A2A1A]/60">
              Question {questionNumber} of {totalQuestions}
            </p>
            <QuestionPromptText
              text={questionPrompt}
              className="font-reading mt-1 text-sm font-semibold text-[#3A2A1A] sm:text-base"
            />
            {choices.length > 0 && (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {choices.map((c, i) => (
                  <div
                    key={c.id}
                    className="flex items-start gap-2 rounded-lg border border-[#3A2A1A]/10 px-3 py-2 text-xs text-[#3A2A1A]/80"
                  >
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-[#3A2A1A]/20 text-[10px] font-bold">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="font-reading">{c.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-[#3A2A1A]/10 bg-white p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-sm font-bold text-[#7A2323]">
                <Pencil className="size-4" />
                Canvas Notes
              </p>
              <div className="flex items-center gap-1">
                {undoClearButtons}
                <button
                  type="button"
                  onClick={() => setIsMaximized(false)}
                  aria-label="Close"
                  title="Close"
                  className="flex size-7 items-center justify-center rounded-full text-[#3A2A1A]/50 transition-colors hover:bg-[#3A2A1A]/5 hover:text-[#3A2A1A]"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <DrawingToolbar
              tool={tool}
              onToolChange={setTool}
              color={color}
              onColorChange={setColor}
              size={size}
              onSizeChange={setSize}
              canPan
            />

            <div
              ref={containerRef}
              className="mt-3 min-h-0 w-full flex-1 overflow-auto rounded-xl border border-[#3A2A1A]/15 bg-[#FBF9F4]"
            >
              {canvasEl}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-w-0 flex-col rounded-2xl border border-[#3A2A1A]/10 bg-white p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-bold text-[#7A2323]">
          <Pencil className="size-4" />
          Canvas Notes
        </p>
        <div className="flex items-center gap-1">
          {undoClearButtons}
          <button
            type="button"
            onClick={() => setIsMaximized(true)}
            aria-label="Maximize canvas notes"
            title="Maximize"
            className="flex size-7 items-center justify-center rounded-full text-[#3A2A1A]/50 transition-colors hover:bg-[#3A2A1A]/5 hover:text-[#3A2A1A]"
          >
            <Maximize2 className="size-3.5" />
          </button>
        </div>
      </div>

      <DrawingToolbar
        tool={tool}
        onToolChange={setTool}
        color={color}
        onColorChange={setColor}
        size={size}
        onSizeChange={setSize}
      />

      <div
        ref={containerRef}
        className="mt-3 min-h-40 w-full flex-1 touch-none overflow-hidden rounded-xl border border-[#3A2A1A]/15 bg-[#FBF9F4] sm:min-h-48"
      >
        {canvasEl}
      </div>
      <p className="font-reading mt-2 text-center text-[11px] text-[#3A2A1A]/50">
        Write directly with your finger, mouse, or Apple Pencil.
      </p>
    </div>
  )
}
