'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { NewsItem, Category, PlatformTrends } from '@/lib/types'
import Header from '@/components/header'
import CategoryTabs from '@/components/category-tabs'
import PrioritySection from '@/components/priority-section'
import NewsCard from '@/components/news-card'
import TrendsSection from '@/components/trends-section'
import LoadingSkeleton from '@/components/loading-skeleton'

interface NewsResponse {
  items: NewsItem[]
  lastUpdated: string | null
  count: number
}

interface TrendsResponse {
  trends: PlatformTrends[]
  lastUpdated: string | null
}

export default function Home() {
  const [items, setItems] = useState<NewsItem[]>([])
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [trends, setTrends] = useState<PlatformTrends[]>([])
  const [trendsLastUpdated, setTrendsLastUpdated] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all')
  const [activeTab, setActiveTab] = useState<'news' | 'trends'>('news')

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [newsRes, trendsRes] = await Promise.all([
        fetch('/api/news'),
        fetch('/api/trends'),
      ])
      const newsData: NewsResponse = await newsRes.json()
      const trendsData: TrendsResponse = await trendsRes.json()

      setItems(newsData.items)
      setLastUpdated(newsData.lastUpdated)
      setTrends(trendsData.trends || [])
      setTrendsLastUpdated(trendsData.lastUpdated)
    } catch (error) {
      console.error('データ取得エラー:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // カテゴリでフィルタ
  const filteredItems = useMemo(() => {
    if (activeCategory === 'all') return items
    return items.filter(item => item.analysis?.category === activeCategory)
  }, [items, activeCategory])

  // プライオリティとそれ以外に分離
  const priorityItems = useMemo(
    () => filteredItems.filter(item => item.isPriority),
    [filteredItems]
  )
  const regularItems = useMemo(
    () => filteredItems.filter(item => !item.isPriority),
    [filteredItems]
  )

  // カテゴリ別件数
  const counts = useMemo(() => {
    const c: Record<Category | 'all', number> = {
      'all': items.length,
      'influencer-marketing': 0,
      'luxury-brands': 0,
      'sns-platforms': 0,
      'ai-technology': 0,
    }
    items.forEach(item => {
      const cat = item.analysis?.category
      if (cat && cat in c) c[cat]++
    })
    return c
  }, [items])

  // トレンド件数
  const trendsCount = trends.reduce((sum, t) => sum + t.trends.length, 0)

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4">
        <Header
          lastUpdated={lastUpdated}
          totalCount={items.length}
          onRefresh={fetchData}
          isLoading={isLoading}
        />

        {/* メインタブ: ニュース / SNSトレンド */}
        <div className="flex gap-1 mb-4 border-b border-border pb-2">
          <button
            onClick={() => setActiveTab('news')}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              activeTab === 'news'
                ? 'bg-bg-card text-text-primary border border-border border-b-0'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            📰 ニュース
            <span className="ml-1.5 text-xs opacity-60">{items.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              activeTab === 'trends'
                ? 'bg-bg-card text-text-primary border border-border border-b-0'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            🔥 SNSトレンド
            <span className="ml-1.5 text-xs opacity-60">{trendsCount}</span>
          </button>
        </div>

        {isLoading ? (
          <LoadingSkeleton />
        ) : activeTab === 'trends' ? (
          /* === SNSトレンドタブ === */
          <TrendsSection trends={trends} lastUpdated={trendsLastUpdated} />
        ) : (
          /* === ニュースタブ === */
          <>
            <div className="mb-6">
              <CategoryTabs
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
                counts={counts}
              />
            </div>

            {items.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-text-muted text-sm">ニュースがまだありません</p>
                <p className="text-text-muted text-xs mt-1">
                  /api/cron を実行してニュースを取得してください
                </p>
              </div>
            ) : (
              <>
                <PrioritySection items={priorityItems} />

                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className="text-sm font-semibold text-text-secondary tracking-wide">
                      ニュース
                    </h2>
                    <span className="text-xs text-text-muted">{regularItems.length}件</span>
                  </div>
                  <div className="grid gap-2 pb-8">
                    {regularItems.map(item => (
                      <NewsCard key={item.id} item={item} />
                    ))}
                  </div>
                </section>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
