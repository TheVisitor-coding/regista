import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuth } from '~/hooks/use-auth'
import { AppLayout } from '~/components/layout/app-layout'
import { fetchTrainingProgram, updateTrainingProgram } from '~/lib/training'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Dumbbell } from 'lucide-react'
import { cn } from '~/lib/utils'

export const Route = createFileRoute('/training')({
  component: TrainingPage,
})

const OUTFIELD_FOCUSES = [
  { value: 'physical', label: 'Physical', desc: 'Pace, Stamina, Strength, Agility', fatigue: '+7' },
  { value: 'technical', label: 'Technical', desc: 'Passing, Shooting, Dribbling, Crossing, Heading', fatigue: '+5' },
  { value: 'mental', label: 'Mental', desc: 'Vision, Composure, Work Rate, Positioning', fatigue: '+3' },
  { value: 'defensive', label: 'Defensive', desc: 'Tackling, Marking', fatigue: '+5' },
  { value: 'set_pieces', label: 'Set Pieces', desc: 'Penalties, Free Kicks', fatigue: '+4' },
  { value: 'rest', label: 'Rest', desc: 'No training, recovery', fatigue: '-10' },
]

const GK_FOCUSES = [
  { value: 'reflexes', label: 'Reflexes', desc: 'Reflexes, Diving', fatigue: '+5' },
  { value: 'distribution', label: 'Distribution', desc: 'Kicking, Communication', fatigue: '+4' },
  { value: 'placement', label: 'Placement', desc: 'Handling, Positioning', fatigue: '+4' },
  { value: 'rest', label: 'Rest', desc: 'No training, recovery', fatigue: '-10' },
]

function FocusSelector({
  label,
  options,
  selected,
  onSelect
}: {
  label: string
  options: typeof OUTFIELD_FOCUSES
  selected: string
  onSelect: (value: string) => void
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSelect(opt.value)}
              className={cn(
                'rounded-lg border p-3 text-left transition-colors',
                selected === opt.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-muted-foreground/40',
              )}
            >
              <p className="text-sm font-medium">{opt.label}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{opt.desc}</p>
              <p className={cn(
                'mt-1 text-[10px] font-medium',
                opt.value === 'rest' ? 'text-emerald-500' : 'text-orange-500',
              )}>
                Fatigue: {opt.fatigue}
              </p>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function TrainingPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: '/login' })
    }
  }, [isAuthenticated, isLoading, navigate])

  const { data, isPending } = useQuery({
    queryKey: ['training'],
    queryFn: fetchTrainingProgram,
    enabled: isAuthenticated && !isLoading,
  })

  const mutation = useMutation({
    mutationFn: updateTrainingProgram,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training'] })
    },
  })

  if (isLoading || !isAuthenticated) return null

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Dumbbell className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold">Training</h1>
            <p className="text-sm text-muted-foreground">
              Configure training focus for each line. Applied automatically between matches.
            </p>
          </div>
        </div>

        {isPending ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            <FocusSelector
              label="Goalkeepers"
              options={GK_FOCUSES}
              selected={data?.gkFocus ?? 'reflexes'}
              onSelect={(v) => mutation.mutate({ gkFocus: v as any })}
            />
            <FocusSelector
              label="Defenders"
              options={OUTFIELD_FOCUSES}
              selected={data?.defFocus ?? 'defensive'}
              onSelect={(v) => mutation.mutate({ defFocus: v as any })}
            />
            <FocusSelector
              label="Midfielders"
              options={OUTFIELD_FOCUSES}
              selected={data?.midFocus ?? 'technical'}
              onSelect={(v) => mutation.mutate({ midFocus: v as any })}
            />
            <FocusSelector
              label="Attackers"
              options={OUTFIELD_FOCUSES}
              selected={data?.attFocus ?? 'technical'}
              onSelect={(v) => mutation.mutate({ attFocus: v as any })}
            />
          </>
        )}
      </div>
    </AppLayout>
  )
}
