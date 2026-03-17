'use client'

import { NewsItem } from '@/lib/types'
import NewsCard from './news-card'

interface PrioritySectionProps {
  items: NewsItem[]
}

export default function PrioritySection({ items }: PrioritySectionProps) {
  if (items.length === 0) return null

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-1.5 rounded-full bg-accent-gold" />
        <h2 className="text-sm font-semibold text-accent-gold tracking-wide uppercase">
          Priority Sources
        </h2>
        <span className="text-xs text-text-muted">{items.length}件</span>
      </div>
      <div className="grid gap-2">
        {items.slice(0, 10).map(item => (
          <NewsCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}
