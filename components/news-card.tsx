'use client'

import { NewsItem, CATEGORY_LABELS } from '@/lib/types'
import ImportanceBadge from './importance-badge'

interface NewsCardProps {
  item: NewsItem
}

export default function NewsCard({ item }: NewsCardProps) {
  const analysis = item.analysis
  const publishedDate = new Date(item.publishedAt)
  const timeAgo = getTimeAgo(publishedDate)

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block rounded-lg border p-4 transition-colors hover:bg-bg-card-hover ${
        item.isPriority
          ? 'border-accent-gold/30 bg-priority-glow'
          : 'border-border bg-bg-card'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* ソース名・時刻 */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-xs font-medium ${
              item.isPriority ? 'text-accent-gold' : 'text-text-muted'
            }`}>
              {item.source}
            </span>
            <span className="text-xs text-text-muted">{timeAgo}</span>
            {analysis && (
              <>
                <span className="text-xs text-border">|</span>
                <span className="text-xs text-accent-purple">
                  {CATEGORY_LABELS[analysis.category]}
                </span>
              </>
            )}
          </div>

          {/* タイトル */}
          <h3 className="text-sm font-medium text-text-primary leading-snug mb-1.5 line-clamp-2">
            {item.title}
          </h3>

          {/* AI要約 */}
          {analysis?.summary && (
            <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
              {analysis.summary}
            </p>
          )}

          {/* 事業関連メモ */}
          {analysis?.relevanceNote && (
            <p className="text-xs text-accent-emerald mt-1">
              {analysis.relevanceNote}
            </p>
          )}
        </div>

        {/* 重要度バッジ */}
        {analysis && (
          <div className="shrink-0">
            <ImportanceBadge importance={analysis.importance} />
          </div>
        )}
      </div>
    </a>
  )
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 60) return `${diffMins}分前`
  if (diffHours < 24) return `${diffHours}時間前`
  if (diffDays < 7) return `${diffDays}日前`
  return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
}
