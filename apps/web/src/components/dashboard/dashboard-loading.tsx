import { FootballLoader } from '~/components/ui/football-loader'

export function DashboardLoading() {
  return (
    <div className="flex flex-col gap-8">
      {/* Season progress skeleton */}
      <div className="h-[60px] animate-pulse rounded-2xl bg-surface" />

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        {/* Left column */}
        <div className="flex flex-col gap-8 xl:col-span-8">
          {/* Hero skeleton */}
          <div className="flex min-h-[320px] items-center justify-center rounded-2xl bg-surface">
            <FootballLoader size="lg" text="Loading your club..." />
          </div>
          {/* Actions + Results */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="h-[330px] animate-pulse rounded-2xl bg-surface" />
            <div className="h-[330px] animate-pulse rounded-2xl bg-surface" />
          </div>
          {/* Overview strip */}
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[93px] animate-pulse rounded-2xl bg-surface" />
            ))}
          </div>
        </div>
        {/* Right column */}
        <div className="xl:col-span-4">
          <div className="h-[500px] animate-pulse rounded-2xl bg-surface" />
        </div>
      </div>
    </div>
  )
}
