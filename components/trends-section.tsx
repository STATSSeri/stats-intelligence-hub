'use client'

import { useState } from 'react'
import { PlatformTrends, SnsPlaftorm, SNS_LABELS, TrendItem } from '@/lib/types'

interface TrendsSectionProps {
  trends: PlatformTrends[]
  lastUpdated: string | null
}

const PLATFORM_ICONS: Record<SnsPlaftorm, string> = {
  x: '𝕏',
  instagram: '📷',
  tiktok: '🎵',
  threads: '🧵',
}

const PLATFORM_COLORS: Record<SnsPlaftorm, string> = {
  x: 'text-white',
  instagram: 'text-pink-400',
  tiktok: 'text-cyan-400',
  threads: 'text-gray-300',
}

export default function TrendsSection({ trends, lastUpdated }: TrendsSectionProps) {
  const [activePlatform, setActivePlatform] = useState<SnsPlaftorm | 'all'>('all')
  const [expandedTrend, setExpandedTrend] = useState<string | null>(null)

  const filteredTrends = activePlatform === 'all'
    ? trends
    : trends.filter(t => t.platform === activePlatform)

  const formattedDate = lastUpdated
    ? new Date(lastUpdated).toLocaleString('ja-JP', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : '未取得'

  return (
    <section className="mb-8">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-purple" />
          <h2 className="text-sm font-semibold text-accent-purple tracking-wide uppercase">
            SNS Trends
          </h2>
          <span className="text-xs text-text-muted">{formattedDate}</span>
        </div>
      </div>

      {/* プラットフォームタブ */}
      <div className="flex gap-1 mb-3">
        <button
          onClick={() => setActivePlatform('all')}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
            activePlatform === 'all'
              ? 'bg-accent-purple text-white'
              : 'bg-bg-card text-text-secondary hover:bg-bg-card-hover'
          }`}
        >
          すべて
        </button>
        {(['x', 'instagram', 'tiktok', 'threads'] as SnsPlaftorm[]).map(p => (
          <button
            key={p}
            onClick={() => setActivePlatform(p)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              activePlatform === p
                ? 'bg-accent-purple text-white'
                : 'bg-bg-card text-text-secondary hover:bg-bg-card-hover'
            }`}
          >
            {PLATFORM_ICONS[p]} {SNS_LABELS[p]}
          </button>
        ))}
      </div>

      {/* トレンドリスト */}
      {filteredTrends.length === 0 ? (
        <p className="text-xs text-text-muted py-4 text-center">
          トレンドデータがまだありません
        </p>
      ) : (
        <div className="grid gap-2">
          {filteredTrends.map(pt => (
            <div key={pt.platform}>
              {activePlatform === 'all' && (
                <div className="flex items-center gap-1.5 mb-1.5 mt-2 first:mt-0">
                  <span className="text-sm">{PLATFORM_ICONS[pt.platform]}</span>
                  <span className={`text-xs font-semibold ${PLATFORM_COLORS[pt.platform]}`}>
                    {SNS_LABELS[pt.platform]}
                  </span>
                </div>
              )}
              {pt.trends.slice(0, 10).map(trend => (
                <TrendCard
                  key={trend.id}
                  trend={trend}
                  isExpanded={expandedTrend === trend.id}
                  onToggle={() => setExpandedTrend(
                    expandedTrend === trend.id ? null : trend.id
                  )}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// トレンドカード
function TrendCard({
  trend,
  isExpanded,
  onToggle,
}: {
  trend: TrendItem
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <div className="rounded-lg border border-border bg-bg-card overflow-hidden mb-1">
      {/* トレンド行 */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-bg-card-hover transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted w-5 text-right shrink-0">
            {trend.rank}
          </span>
          <span className="text-sm font-medium text-text-primary">
            {trend.keyword}
          </span>
          {trend.volume && trend.volume > 0 && (
            <span className="text-xs text-text-muted">
              {formatVolume(trend.volume)}
            </span>
          )}
        </div>
        <span className="text-xs text-text-muted">
          {trend.posts.length > 0 && `${trend.posts.length}件`}
          {isExpanded ? ' ▲' : ' ▼'}
        </span>
      </button>

      {/* 展開: 投稿サンプル */}
      {isExpanded && trend.posts.length > 0 && (
        <div className="px-3 pb-3 border-t border-border/50">
          {trend.posts.map((post, idx) => (
            <div key={idx} className="mt-2 pl-7">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs font-medium text-accent-blue">
                  @{post.username || '—'}
                </span>
                {post.likes !== undefined && post.likes > 0 && (
                  <span className="text-xs text-text-muted">
                    ♥ {formatVolume(post.likes)}
                  </span>
                )}
                {post.plays !== undefined && post.plays > 0 && (
                  <span className="text-xs text-text-muted">
                    ▶ {formatVolume(post.plays)}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                {post.text || '(テキストなし)'}
              </p>
              {post.url && (
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent-blue/70 hover:text-accent-blue mt-0.5 inline-block"
                >
                  投稿を見る →
                </a>
              )}
            </div>
          ))}

          {/* AIインサイト */}
          {trend.aiInsight && (
            <div className="mt-2 pl-7 pt-2 border-t border-border/30">
              <p className="text-xs text-accent-emerald">
                💡 {trend.aiInsight}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function formatVolume(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}
