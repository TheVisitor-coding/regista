import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchNotificationPreferences, updateNotificationPreferences } from '~/lib/settings'
import { Checkbox } from '~/components/ui/checkbox'
import { Label } from '~/components/ui/label'
import type { NotificationPreference } from '@regista/shared'

const PREFERENCE_LABELS: Array<{ key: keyof NotificationPreference; label: string; description: string }> = [
  { key: 'matchReminders', label: 'Match reminders', description: 'Get notified before upcoming matches' },
  { key: 'matchResults', label: 'Match results', description: 'Receive matchday summaries' },
  { key: 'standingChanges', label: 'Standing changes', description: 'Know when your position changes' },
  { key: 'squadAlerts', label: 'Squad alerts', description: 'Injuries, fatigue, and suspensions' },
  { key: 'financeAlerts', label: 'Finance alerts', description: 'Budget warnings and transactions' },
  { key: 'transferAlerts', label: 'Transfer alerts', description: 'Market opportunities and offers' },
]

export function NotificationPreferencesSection() {
  const queryClient = useQueryClient()

  const { data: prefs, isPending } = useQuery({
    queryKey: ['settings', 'notifications'],
    queryFn: fetchNotificationPreferences,
  })

  const mutation = useMutation({
    mutationFn: updateNotificationPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'notifications'] })
    },
  })

  if (isPending) {
    return <div className="animate-pulse h-40 rounded-lg bg-muted" />
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Notification Preferences</h2>
        <p className="text-sm text-muted-foreground">Choose which notifications you want to receive.</p>
      </div>

      <div className="space-y-3">
        {PREFERENCE_LABELS.map(({ key, label, description }) => (
          <div key={key} className="flex items-start gap-3">
            <Checkbox
              id={key}
              checked={prefs?.[key] ?? true}
              onCheckedChange={(checked) => {
                mutation.mutate({ [key]: !!checked })
              }}
            />
            <div>
              <Label htmlFor={key} className="cursor-pointer">{label}</Label>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
