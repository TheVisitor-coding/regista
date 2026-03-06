import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Trophy, Users, Zap } from 'lucide-react'
import { useAuth } from '~/hooks/use-auth'
import { Button } from '~/components/ui/button'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (isAuthenticated) {
    navigate({ to: '/dashboard' })
    return null
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between px-6 py-4">
        <span className="text-xl font-bold text-primary">Regista</span>
        <Link to="/login">
          <Button variant="ghost">Log in</Button>
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          <span className="text-primary">Regista</span>
        </h1>
        <p className="mt-4 max-w-lg text-xl text-muted-foreground">
          Build your dream team, compete in leagues, and rise to the top in the ultimate football management experience.
        </p>
        <div className="mt-8">
          <Link to="/register">
            <Button size="lg">Start for free</Button>
          </Link>
        </div>

        <div className="mt-16 grid max-w-3xl grid-cols-1 gap-8 sm:grid-cols-3">
          <FeatureCard
            icon={<Trophy className="h-8 w-8 text-primary" />}
            title="Compete"
            description="Lead your club through league seasons and prove your tactical prowess."
          />
          <FeatureCard
            icon={<Users className="h-8 w-8 text-primary" />}
            title="Manage"
            description="Build your squad, train players, and manage your club's finances."
          />
          <FeatureCard
            icon={<Zap className="h-8 w-8 text-primary" />}
            title="Live matches"
            description="Watch your tactics unfold in real-time match simulation."
          />
        </div>
      </main>

      <footer className="py-6 text-center text-sm text-muted-foreground">
        Regista - Football Management Game
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
    <div className="flex flex-col items-center gap-3 rounded-lg border border-border p-6">
      {icon}
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
