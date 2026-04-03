import { cn } from '~/lib/utils'

interface FormIndicatorProps {
  form: string
}

const FORM_COLORS: Record<string, string> = {
  W: 'bg-emerald-500',
  D: 'bg-zinc-500',
  L: 'bg-red-500',
}

export function FormIndicator({ form }: FormIndicatorProps) {
  if (!form) return <span className="text-xs text-muted-foreground">-</span>

  return (
    <div className="flex gap-1">
      {form.split('').map((char, i) => (
        <div
          key={i}
          className={cn('h-4 w-4 rounded-full text-center text-[9px] font-bold leading-4 text-white', FORM_COLORS[char] ?? 'bg-zinc-700')}
        >
          {char}
        </div>
      ))}
    </div>
  )
}
