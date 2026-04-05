import { Link } from '@tanstack/react-router'
import { Swords } from 'lucide-react'
import { cn } from '~/lib/utils'
import type { DashboardData } from '@regista/shared'
import { useEffect, useState } from 'react'

type NextMatch = NonNullable<DashboardData['nextMatch']>

function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    function update() {
      const diff = new Date(targetDate).getTime() - Date.now()
      if (diff <= 0) {
        setTimeLeft('Now')
        return
      }
      const hours = Math.floor(diff / 3_600_000)
      const mins = Math.floor((diff % 3_600_000) / 60_000)
      if (hours > 24) {
        const days = Math.floor(hours / 24)
        setTimeLeft(`${days}d ${hours % 24}h`)
      } else {
        setTimeLeft(`${hours}h ${mins}min`)
      }
    }
    update()
    const interval = setInterval(update, 60_000)
    return () => clearInterval(interval)
  }, [targetDate])

  return timeLeft
}

function FormDot({ result }: { result: 'W' | 'D' | 'L' }) {
  return (
    <div
      className={cn(
        'h-3 w-3 rounded-full',
        result === 'W' && 'bg-pelouse-light glow-green',
        result === 'D' && 'bg-text-secondary',
        result === 'L' && 'bg-loss glow-loss',
      )}
    />
  )
}

interface NextMatchHeroProps {
  nextMatch: NextMatch | null
}

export function NextMatchHero({ nextMatch }: NextMatchHeroProps) {
  if (!nextMatch) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-[rgba(255,255,255,0.05)] bg-surface p-8">
        <p className="font-heading text-xl text-text-secondary">No upcoming match scheduled</p>
      </div>
    )
  }

  const countdown = useCountdown(nextMatch.scheduledAt)
  const locationLabel = nextMatch.isHome ? 'Home' : 'Away'

  return (
    <div
      className="relative flex min-h-[320px] flex-col justify-between overflow-hidden rounded-2xl p-8"
      style={{
        background: 'linear-gradient(157deg, #2e9e5b 0%, #1c6e3d 50%, #05170c 100%)',
      }}
    >
      {/* Stadium pattern overlay */}
      <div className="pointer-events-none absolute inset-y-0 left-1/2 right-0 opacity-10">
        <svg viewBox="0 0 400 400" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
          <rect x="50" y="50" width="300" height="300" rx="20" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
          <circle cx="200" cy="200" r="60" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
          <line x1="200" y1="50" x2="200" y2="350" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
          <rect x="100" y="50" width="200" height="80" rx="0" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
          <rect x="100" y="270" width="200" height="80" rx="0" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Top section */}
      <div className="relative flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="font-heading text-sm uppercase tracking-[1.4px] text-[#d1fae5]">
            Next Match
          </span>
          <h2 className="font-heading text-5xl font-bold tracking-tight text-white pt-1">
            vs {nextMatch.opponent.name}
          </h2>
          <p className="font-body text-base text-[rgba(209,250,229,0.8)]">
            Matchday {nextMatch.matchday} · {locationLabel}
          </p>
        </div>

        <div className="text-right">
          <p className="font-heading text-4xl font-bold text-white">
            {countdown}
          </p>
          <span className="font-heading text-xs uppercase tracking-[1.2px] text-[rgba(209,250,229,0.6)]">
            Kickoff Countdown
          </span>
        </div>
      </div>

      {/* Bottom section */}
      <div className="relative grid grid-cols-2 gap-8">
        <div className="flex flex-col gap-2 self-end">
          <span className="font-heading text-xs uppercase tracking-[1.2px] text-[rgba(209,250,229,0.7)]">
            Opponent Form
          </span>
          <div className="flex gap-2">
            {nextMatch.opponentForm.map((r, i) => (
              <FormDot key={i} result={r} />
            ))}
          </div>
        </div>

        <div className="flex justify-end self-end">
          <Link
            to="/tactics"
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-regista-green to-pelouse px-8 py-4 font-heading text-base font-bold text-[#00391a] shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] transition-transform hover:scale-[1.02]"
          >
            <Swords className="h-5 w-5" />
            PREPARE TACTICS
          </Link>
        </div>
      </div>
    </div>
  )
}
