import type { Player } from '@regista/shared'

function formatPrice(cents: number): string {
  const v = cents / 100
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`
  return v.toFixed(0)
}

interface PlayerHeroProps {
  player: Player
  marketValue: number
  onRenew: () => void
  onListTransfer: () => void
}

export function PlayerHero({ player, marketValue, onRenew, onListTransfer }: PlayerHeroProps) {
  const countryCode = player.nationality.slice(0, 3).toUpperCase()

  return (
    <div className="flex w-full items-center justify-between overflow-hidden rounded-3xl border-l-4 border-[#71dc92] bg-surface py-8 pl-9 pr-8">
      {/* Left: Avatar + Info */}
      <div className="flex items-center gap-8">
        {/* Overall circle */}
        <div className="relative shrink-0">
          <div
            className="flex size-24 items-center justify-center rounded-full border-4 border-nuit p-1"
            style={{ backgroundImage: 'linear-gradient(135deg, #71dc92 0%, #35a460 100%)' }}
          >
            <span className="font-heading text-4xl font-bold text-[#00391a]">{player.overall}</span>
          </div>
          {/* Country badge */}
          <div className="absolute -bottom-2 -right-2 rounded-full bg-[#f3632d] px-3 py-1">
            <span className="font-heading text-xs font-bold text-[#511500]">{countryCode}</span>
          </div>
        </div>

        {/* Name + details */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-4">
            <h1 className="font-heading text-5xl font-bold uppercase tracking-[-2.4px] text-text-primary">
              {player.firstName} {player.lastName}
            </h1>
            <span className="rounded bg-[#ffb59d] px-3 py-0.5 font-heading text-sm font-bold tracking-[1.4px] text-[#5d1900]">
              {player.position}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-body text-base font-medium text-[#bdcabc]">
              {player.nationality} · Age {player.age} · Potential: {player.potential}
            </span>
            {marketValue > 0 && (
              <>
                <div className="size-1.5 rounded-full bg-[#3e4a3f]" />
                <span className="font-heading text-xl font-bold text-pelouse-light">
                  {formatPrice(marketValue)} G$
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right: Action buttons */}
      <div className="flex shrink-0 gap-4">
        <button
          onClick={onRenew}
          className="rounded-3xl border border-pelouse-light px-6 py-3.5 font-heading text-base font-bold uppercase tracking-[0.8px] text-pelouse-light transition-colors hover:bg-[rgba(113,220,146,0.1)]"
        >
          Renew Contract
        </button>
        <button
          onClick={onListTransfer}
          className="rounded-3xl border border-[#ffb59d] px-6 py-3.5 font-heading text-base font-bold uppercase tracking-[0.8px] text-[#ffb59d] transition-colors hover:bg-[rgba(255,181,157,0.1)]"
        >
          List for Transfer
        </button>
      </div>
    </div>
  )
}
