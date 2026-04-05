import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuth } from '~/hooks/use-auth'
import { AppLayout } from '~/components/layout/app-layout'
import { DashboardLoading } from '~/components/dashboard/dashboard-loading'
import { DashboardErrorState } from '~/components/dashboard/dashboard-error-state'
import { DashboardContent } from '~/components/dashboard/dashboard-content'
import { fetchDashboard } from '~/lib/dashboard'
import { ApiRequestError } from '~/lib/api-client'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: '/login' })
    }
  }, [isAuthenticated, isLoading, navigate])

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
    enabled: isAuthenticated && !isLoading,
  })

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (isPending) {
    return (
      <AppLayout>
        <DashboardLoading />
      </AppLayout>
    )
  }

  if (isError) {
    const isNoClub = error instanceof ApiRequestError && error.status === 404

    if (isNoClub) {
      navigate({ to: '/onboarding' })
      return null
    }

    return (
      <AppLayout>
        <DashboardErrorState isNoClub={false} />
      </AppLayout>
    )
  }

  if (!data) return null

  return (
    <AppLayout dashboardData={data}>
      <DashboardContent data={data} />
    </AppLayout>
  )
}
