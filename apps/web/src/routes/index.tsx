import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Trophy, Users, Zap } from 'lucide-react'
import { useAuth } from '~/hooks/use-auth'
import { Button } from '~/components/ui/button'
import { FootballLoader } from '~/components/ui/football-loader'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <FootballLoader size="lg" />
      </div>
    )
  }

  if (isAuthenticated) {
    navigate({ to: '/dashboard' })
    return null
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Subtle gradient overlay */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />

      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <span className="text-xl font-black tracking-tight text-primary">Regista</span>
        <Link to="/login">
          <Button variant="ghost">Log in</Button>
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 text-center">
        <div className="fade-in">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/70">
            Football Management Game
          </p>
          <h1 className="mt-3 text-6xl font-black tracking-tighter sm:text-7xl">
            <span className="text-gradient">Regista</span>
          </h1>
          <p className="mt-4 max-w-md text-lg text-muted-foreground">
            Build your dream team, compete in leagues, and rise to the top.
          </p>
          <div className="mt-8 flex gap-3 justify-center">
            <Link to="/register">
              <Button size="lg" className="font-semibold px-8">Start for free</Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline">Sign in</Button>
            </Link>
          </div>
        </div>

        <div className="mt-20 grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-3 slide-up">
          <FeatureCard
            icon={<Trophy className="h-8 w-8 text-amber-500" />}
            title="Compete"
            description="Lead your club through league seasons with promotions and relegations."
          />
          <FeatureCard
            icon={<Users className="h-8 w-8 text-primary" />}
            title="Manage"
            description="Build your squad, train players, handle transfers and finances."
          />
          <FeatureCard
            icon={<Zap className="h-8 w-8 text-orange-500" />}
            title="Live Matches"
            description="Watch your tactics unfold in real-time match simulation."
          />
        </div>
      </main>

      <footer className="relative z-10 py-6 text-center text-xs text-muted-foreground/50">
        Regista — Football Management Game
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="card-hover flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm">
      {icon}
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
