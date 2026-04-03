import { AppHeader } from './app-header'
import { Sidebar } from './sidebar'
import { MobileBottomBar } from './mobile-bottom-bar'

interface AppLayoutProps {
  children: React.ReactNode
  unreadCount?: number
}

export function AppLayout({ children, unreadCount }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader unreadCount={unreadCount} />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
            {children}
          </div>
        </main>
      </div>

      <MobileBottomBar />
    </div>
  )
}
