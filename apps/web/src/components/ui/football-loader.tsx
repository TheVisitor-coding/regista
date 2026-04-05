import { cn } from '~/lib/utils'

interface FootballLoaderProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

export function FootballLoader({ size = 'md', text, className }: FootballLoaderProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-14 w-14',
  }

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div className={cn('relative', sizeClasses[size])}>
        {/* Bouncing ball */}
        <svg viewBox="0 0 40 40" className="animate-bounce" style={{ animationDuration: '0.8s' }}>
          <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary/30" />
          <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary"
            strokeDasharray="113" strokeDashoffset="85"
            style={{ animation: 'spin 1.2s linear infinite', transformOrigin: 'center' }}
          />
          {/* Pentagon pattern */}
          <path d="M20 6 L26 14 L24 22 L16 22 L14 14 Z" fill="currentColor" className="text-primary/20" />
        </svg>
      </div>
      {text && <p className="text-xs text-muted-foreground animate-pulse">{text}</p>}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
