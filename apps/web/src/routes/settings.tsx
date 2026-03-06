import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAuth } from '~/hooks/use-auth'
import { AppLayout } from '~/components/layout/app-layout'
import { ProfileSection } from '~/components/settings/profile-section'
import { SecuritySection } from '~/components/settings/security-section'
import { DangerSection } from '~/components/settings/danger-section'
import { Separator } from '~/components/ui/separator'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    navigate({ to: '/login' })
    return null
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl space-y-8">
        <h1 className="text-3xl font-bold">Settings</h1>

        <ProfileSection />
        <Separator />
        <SecuritySection />
        <Separator />
        <DangerSection />
      </div>
    </AppLayout>
  )
}
