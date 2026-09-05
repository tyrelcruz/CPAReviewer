interface NotesPopoverProps {
  value: string
  onChange: (value: string) => void
}

export function NotesPopover({ value, onChange }: NotesPopoverProps) {
  return (
    <div className="w-72 rounded-xl border border-[#3A2A1A]/10 bg-white p-3 shadow-xl">
      <p className="mb-2 text-xs font-semibold text-[#3A2A1A]/70">
        Scratch notes for this test
      </p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Jot down workings, reminders, or flags for later..."
        rows={6}
        className="w-full resize-none rounded-lg border border-[#3A2A1A]/15 bg-[#F3ECDC]/60 p-2.5 text-sm text-[#3A2A1A] outline-none focus:border-[#7A2323]/40"
      />
    </div>
  )
}
