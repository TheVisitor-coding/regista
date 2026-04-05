import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useAuth } from '~/hooks/use-auth'
import { useClub } from '~/hooks/use-club'
import { AppLayout } from '~/components/layout/app-layout'
import { FootballPitch } from '~/components/tactics/football-pitch'
import { BenchDisplay } from '~/components/tactics/bench-display'
import { CoherenceBar } from '~/components/tactics/coherence-bar'
import {
  fetchTactics,
  updateTactics,
  fetchAutoLineup,
  fetchPresets,
  applyPreset,
  createPreset,
  deletePreset,
  fetchComposition,
  type LineupSlot,
} from '~/lib/tactics'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { ClipboardList, Bot, Save, Loader2 } from 'lucide-react'
import { FORMATIONS } from '@regista/shared'
import { cn } from '~/lib/utils'
import { toast } from 'sonner'

export const Route = createFileRoute('/tactics')({
  component: TacticsPage,
})

const MENTALITIES = [
  { value: 'ultra_defensive', label: 'Ultra Def', color: 'bg-blue-900 hover:bg-blue-800' },
  { value: 'defensive', label: 'Defensive', color: 'bg-blue-600 hover:bg-blue-500' },
  { value: 'balanced', label: 'Balanced', color: 'bg-zinc-600 hover:bg-zinc-500' },
  { value: 'offensive', label: 'Offensive', color: 'bg-orange-600 hover:bg-orange-500' },
  { value: 'ultra_offensive', label: 'Ultra Off', color: 'bg-red-600 hover:bg-red-500' },
]

const INSTRUCTIONS: Record<string, Array<{ value: string; label: string }>> = {
  pressing: [{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }],
  passingStyle: [{ value: 'short', label: 'Short' }, { value: 'mixed', label: 'Mixed' }, { value: 'long', label: 'Long' }],
  width: [{ value: 'narrow', label: 'Narrow' }, { value: 'normal', label: 'Normal' }, { value: 'wide', label: 'Wide' }],
  tempo: [{ value: 'slow', label: 'Slow' }, { value: 'normal', label: 'Normal' }, { value: 'fast', label: 'Fast' }],
  defensiveLine: [{ value: 'low', label: 'Deep' }, { value: 'medium', label: 'Normal' }, { value: 'high', label: 'High' }],
}

const INSTRUCTION_LABELS: Record<string, string> = {
  pressing: 'Pressing',
  passingStyle: 'Passing',
  width: 'Width',
  tempo: 'Tempo',
  defensiveLine: 'Def. Line',
}

function TacticsPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const { club } = useClub()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [presetName, setPresetName] = useState('')

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate({ to: '/login' })
  }, [isAuthenticated, isLoading, navigate])

  const { data: tactics, isPending: tacticsPending } = useQuery({
    queryKey: ['tactics'],
    queryFn: fetchTactics,
    enabled: isAuthenticated && !isLoading,
  })

  const { data: presetsData } = useQuery({
    queryKey: ['tactics', 'presets'],
    queryFn: fetchPresets,
    enabled: isAuthenticated && !isLoading,
  })

  const { data: compositionData, isPending: compPending } = useQuery({
    queryKey: ['tactics', 'composition'],
    queryFn: fetchComposition,
    enabled: isAuthenticated && !isLoading,
  })

  const tacticsMutation = useMutation({
    mutationFn: updateTactics,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tactics'] }),
  })

  const autoLineupMutation = useMutation({
    mutationFn: (formation: string) => fetchAutoLineup(formation),
    onSuccess: (data) => {
      queryClient.setQueryData(['tactics', 'composition'], {
        formation: tactics?.formation ?? '4-4-2',
        ...data,
      })
      toast.success(`Auto-lineup applied (${data.coherence}% coherence)`)
    },
  })

  const applyPresetMutation = useMutation({
    mutationFn: applyPreset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tactics'] })
      queryClient.invalidateQueries({ queryKey: ['tactics', 'composition'] })
      toast.success('Preset applied')
    },
  })

  const createPresetMutation = useMutation({
    mutationFn: createPreset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tactics', 'presets'] })
      setSaveDialogOpen(false)
      setPresetName('')
      toast.success('Preset saved')
    },
  })

  const deletePresetMutation = useMutation({
    mutationFn: deletePreset,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tactics', 'presets'] }),
  })

  if (isLoading || !isAuthenticated) return null

  const currentTactics = tactics ?? {
    formation: '4-4-2', mentality: 'balanced', pressing: 'medium',
    passingStyle: 'mixed', width: 'normal', tempo: 'normal', defensiveLine: 'medium',
  }

  const startingXI: LineupSlot[] = compositionData?.startingXI ?? []
  const bench: LineupSlot[] = compositionData?.bench ?? []
  const coherence = compositionData?.coherence ?? 0
  const warnings = compositionData?.warnings ?? []
  const presets = presetsData?.presets ?? []

  const handleFormationChange = (f: string) => {
    tacticsMutation.mutate({ formation: f })
    autoLineupMutation.mutate(f)
  }

  const handleSavePreset = () => {
    if (!presetName.trim()) return
    createPresetMutation.mutate({
      name: presetName.trim(),
      formation: currentTactics.formation,
      mentality: currentTactics.mentality,
      pressing: currentTactics.pressing,
      passingStyle: currentTactics.passingStyle,
      width: currentTactics.width,
      tempo: currentTactics.tempo,
      defensiveLine: currentTactics.defensiveLine,
    })
  }

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-2xl font-bold">Tactics</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => autoLineupMutation.mutate(currentTactics.formation)}
              disabled={autoLineupMutation.isPending}
            >
              {autoLineupMutation.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Bot className="mr-1 h-3 w-3" />}
              Auto-Lineup
            </Button>
            <Button size="sm" onClick={() => setSaveDialogOpen(true)}>
              <Save className="mr-1 h-3 w-3" /> Save Preset
            </Button>
          </div>
        </div>

        {/* Presets bar */}
        {presets.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Presets:</span>
            {presets.map((p) => (
              <div key={p.id} className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => applyPresetMutation.mutate(p.id)}
                  disabled={applyPresetMutation.isPending}
                >
                  {p.name}
                </Button>
                {!p.isDefault && (
                  <button
                    className="text-[10px] text-muted-foreground hover:text-destructive"
                    onClick={() => deletePresetMutation.mutate(p.id)}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Coherence */}
        <CoherenceBar score={coherence} warnings={warnings} />

        {/* Main layout */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* LEFT: Pitch + Bench */}
          <div className="space-y-3">
            {tacticsPending || compPending ? (
              <div className="flex aspect-[68/105] items-center justify-center rounded-xl bg-muted">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <FootballPitch
                formation={currentTactics.formation}
                startingXI={startingXI}
                clubColor={club?.primaryColor}
              />
            )}
            <BenchDisplay bench={bench} />
          </div>

          {/* RIGHT: Tactical parameters */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Formation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-1.5">
                  {Object.keys(FORMATIONS).map((f) => (
                    <button
                      key={f}
                      onClick={() => handleFormationChange(f)}
                      className={cn(
                        'rounded-md border px-2 py-1.5 text-xs font-medium transition-all',
                        currentTactics.formation === f
                          ? 'border-primary bg-primary/15 text-primary shadow-sm'
                          : 'border-border hover:border-primary/40 hover:bg-primary/5',
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Mentality</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-1">
                  {MENTALITIES.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => tacticsMutation.mutate({ mentality: m.value as any })}
                      className={cn(
                        'flex-1 rounded-md px-1 py-2 text-[10px] font-semibold text-white transition-all',
                        currentTactics.mentality === m.value
                          ? `${m.color} ring-2 ring-white/30 shadow-lg`
                          : `${m.color} opacity-40 hover:opacity-70`,
                      )}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(INSTRUCTIONS).map(([key, options]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="w-16 text-[10px] font-medium text-muted-foreground">
                      {INSTRUCTION_LABELS[key]}
                    </span>
                    <div className="flex flex-1 gap-0.5">
                      {options.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => tacticsMutation.mutate({ [key]: opt.value } as any)}
                          className={cn(
                            'flex-1 rounded py-1 text-[10px] font-medium transition-all',
                            (currentTactics as any)[key] === opt.value
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80',
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Save preset dialog */}
        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Tactical Preset</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Preset name (max 20 chars)"
                maxLength={20}
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                autoFocus
              />
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Formation: <span className="font-medium text-foreground">{currentTactics.formation}</span></p>
                <p>Mentality: <span className="font-medium text-foreground">{currentTactics.mentality}</span></p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSavePreset} disabled={!presetName.trim() || createPresetMutation.isPending}>
                  {createPresetMutation.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}
