import { AppHeader } from './app-header'
import { Sidebar } from './sidebar'
import { MobileBottomBar } from './mobile-bottom-bar'
import type { DashboardData } from '@regista/shared'

interface AppLayoutProps {
  children: React.ReactNode
  dashboardData?: Pick<DashboardData, 'club' | 'squadStatus' | 'unreadNotifications' | 'divisionName' | 'seasonLabel'>
}

export function AppLayout({ children, dashboardData }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-nuit">
      <Sidebar />

      <div className="flex flex-1 flex-col lg:ml-20">
        <AppHeader dashboardData={dashboardData} />

        <main className="flex-1 overflow-y-auto p-4 pb-20 sm:p-6 lg:p-8 lg:pb-8">
          {children}
        </main>
      </div>

      <MobileBottomBar />
    </div>
  )
}
