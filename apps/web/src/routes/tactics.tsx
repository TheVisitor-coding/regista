import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuth } from '~/hooks/use-auth'
import { AppLayout } from '~/components/layout/app-layout'
import { fetchTactics, updateTactics } from '~/lib/tactics'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { ClipboardList } from 'lucide-react'
import { FORMATIONS } from '@regista/shared'
import { cn } from '~/lib/utils'

export const Route = createFileRoute('/tactics')({
  component: TacticsPage,
})

const MENTALITIES = [
  { value: 'ultra_defensive', label: 'Ultra Def', color: 'bg-blue-900' },
  { value: 'defensive', label: 'Defensive', color: 'bg-blue-600' },
  { value: 'balanced', label: 'Balanced', color: 'bg-zinc-600' },
  { value: 'offensive', label: 'Offensive', color: 'bg-orange-600' },
  { value: 'ultra_offensive', label: 'Ultra Off', color: 'bg-red-600' },
]

const TRIPLE_OPTIONS = {
  pressing: [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ],
  passingStyle: [
    { value: 'short', label: 'Short' },
    { value: 'mixed', label: 'Mixed' },
    { value: 'long', label: 'Long' },
  ],
  width: [
    { value: 'narrow', label: 'Narrow' },
    { value: 'normal', label: 'Normal' },
    { value: 'wide', label: 'Wide' },
  ],
  tempo: [
    { value: 'slow', label: 'Slow' },
    { value: 'normal', label: 'Normal' },
    { value: 'fast', label: 'Fast' },
  ],
  defensiveLine: [
    { value: 'low', label: 'Deep' },
    { value: 'medium', label: 'Normal' },
    { value: 'high', label: 'High' },
  ],
}

function OptionSelector({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string
  options: Array<{ value: string; label: string; color?: string }>
  selected: string
  onSelect: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex gap-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className={cn(
              'flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
              selected === opt.value
                ? `${opt.color ?? 'bg-primary'} text-white`
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function TacticsPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate({ to: '/login' })
  }, [isAuthenticated, isLoading, navigate])

  const { data, isPending } = useQuery({
    queryKey: ['tactics'],
    queryFn: fetchTactics,
    enabled: isAuthenticated && !isLoading,
  })

  const mutation = useMutation({
    mutationFn: updateTactics,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tactics'] }),
  })

  if (isLoading || !isAuthenticated) return null

  const tactics = data ?? {
    formation: '4-4-2',
    mentality: 'balanced',
    pressing: 'medium',
    passingStyle: 'mixed',
    width: 'normal',
    tempo: 'normal',
    defensiveLine: 'medium',
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold">Tactics</h1>
            <p className="text-sm text-muted-foreground">
              Configure your team's formation and tactical approach.
            </p>
          </div>
        </div>

        {isPending ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Formation */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Formation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2">
                  {Object.keys(FORMATIONS).map((f) => (
                    <button
                      key={f}
                      onClick={() => mutation.mutate({ formation: f })}
                      className={cn(
                        'rounded-lg border p-2 text-center text-sm font-medium transition-colors',
                        tactics.formation === f
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-muted-foreground/40',
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Current: <span className="font-semibold">{tactics.formation}</span> — {FORMATIONS[tactics.formation]?.length ?? 11} players
                </p>
              </CardContent>
            </Card>

            {/* Tactical Parameters */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Tactical Parameters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <OptionSelector
                  label="Mentality"
                  options={MENTALITIES}
                  selected={tactics.mentality}
                  onSelect={(v) => mutation.mutate({ mentality: v as any })}
                />
                <OptionSelector
                  label="Pressing"
                  options={TRIPLE_OPTIONS.pressing}
                  selected={tactics.pressing}
                  onSelect={(v) => mutation.mutate({ pressing: v as any })}
                />
                <OptionSelector
                  label="Passing Style"
                  options={TRIPLE_OPTIONS.passingStyle}
                  selected={tactics.passingStyle}
                  onSelect={(v) => mutation.mutate({ passingStyle: v as any })}
                />
                <OptionSelector
                  label="Width"
                  options={TRIPLE_OPTIONS.width}
                  selected={tactics.width}
                  onSelect={(v) => mutation.mutate({ width: v as any })}
                />
                <OptionSelector
                  label="Tempo"
                  options={TRIPLE_OPTIONS.tempo}
                  selected={tactics.tempo}
                  onSelect={(v) => mutation.mutate({ tempo: v as any })}
                />
                <OptionSelector
                  label="Defensive Line"
                  options={TRIPLE_OPTIONS.defensiveLine}
                  selected={tactics.defensiveLine}
                  onSelect={(v) => mutation.mutate({ defensiveLine: v as any })}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
