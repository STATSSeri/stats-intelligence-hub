'use client'

import { Category, CATEGORY_LABELS } from '@/lib/types'

interface CategoryTabsProps {
  activeCategory: Category | 'all'
  onCategoryChange: (category: Category | 'all') => void
  counts: Record<Category | 'all', number>
}

const ALL_CATEGORIES: (Category | 'all')[] = [
  'all',
  'influencer-marketing',
  'luxury-brands',
  'sns-platforms',
  'ai-technology',
]

const LABELS: Record<Category | 'all', string> = {
  all: 'すべて',
  ...CATEGORY_LABELS,
}

export default function CategoryTabs({ activeCategory, onCategoryChange, counts }: CategoryTabsProps) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-1">
      {ALL_CATEGORIES.map(cat => (
        <button
          key={cat}
          onClick={() => onCategoryChange(cat)}
          className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeCategory === cat
              ? 'bg-accent-blue text-white'
              : 'bg-bg-card text-text-secondary hover:bg-bg-card-hover hover:text-text-primary'
          }`}
        >
          {LABELS[cat]}
          <span className="ml-1.5 opacity-60">{counts[cat]}</span>
        </button>
      ))}
    </div>
  )
}
