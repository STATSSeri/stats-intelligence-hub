'use client'

interface ImportanceBadgeProps {
  importance: 1 | 2 | 3 | 4 | 5
}

const BADGE_CONFIG = {
  5: { label: '最重要', className: 'bg-importance-5/20 text-importance-5 border-importance-5/30' },
  4: { label: '重要', className: 'bg-importance-4/20 text-importance-4 border-importance-4/30' },
  3: { label: '注目', className: 'bg-importance-3/20 text-importance-3 border-importance-3/30' },
  2: { label: '参考', className: 'bg-importance-2/20 text-importance-2 border-importance-2/30' },
  1: { label: '低', className: 'bg-importance-1/20 text-importance-1 border-importance-1/30' },
} as const

export default function ImportanceBadge({ importance }: ImportanceBadgeProps) {
  const config = BADGE_CONFIG[importance]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ${config.className}`}>
      {config.label}
    </span>
  )
}
