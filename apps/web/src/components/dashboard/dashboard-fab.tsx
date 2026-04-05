import { Link } from '@tanstack/react-router'
import { Settings2 } from 'lucide-react'

export function DashboardFab() {
  return (
    <Link
      to="/tactics"
      className="group fixed bottom-8 right-8 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-pelouse-light shadow-[0_8px_32px_rgba(113,220,146,0.4)] transition-transform hover:scale-110"
    >
      <Settings2 className="h-6 w-6 text-nuit" />
      <div className="pointer-events-none absolute right-16 top-3 rounded-lg bg-[#26392c] px-3 py-2 opacity-0 transition-opacity group-hover:opacity-100">
        <span className="whitespace-nowrap font-body text-xs font-bold text-text-primary">
          Quick Match Analysis
        </span>
      </div>
    </Link>
  )
}
