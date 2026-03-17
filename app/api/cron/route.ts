import { NextRequest } from 'next/server'
import { FEED_SOURCES } from '@/lib/feeds'
import { fetchAllFeeds } from '@/lib/rss'
import { analyzeNews } from '@/lib/ai'
import { saveNewsItems, generateId, existsNewsItem, saveTrends } from '@/lib/storage'
import { fetchAllTrends } from '@/lib/trends'
import { NewsItem } from '@/lib/types'

export const maxDuration = 300 // Apify実行時間を考慮して延長

export async function GET(request: NextRequest) {
  // Cron認証
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[Cron] ニュース取得 + トレンド取得 開始...')

    // 1. RSS取得とSNSトレンド取得を並列実行
    const [rawItems, allTrends] = await Promise.all([
      fetchAllFeeds(FEED_SOURCES),
      fetchAllTrends(),
    ])

    console.log(`[Cron] RSS: ${rawItems.length}件取得`)
    allTrends.forEach(t => {
      console.log(`[Cron] ${t.platform}: ${t.trends.length}トレンド取得`)
    })

    // 2. トレンドデータを保存
    await saveTrends(allTrends)
    console.log('[Cron] トレンドデータ保存完了')

    // 3. RSS重複排除
    const newItems = []
    for (const item of rawItems) {
      const id = generateId(item.url)
      const exists = await existsNewsItem(id)
      if (!exists) {
        newItems.push(item)
      }
    }
    console.log(`[Cron] ${newItems.length}件が新規`)

    let savedCount = 0
    if (newItems.length > 0) {
      // 4. AI分析
      console.log(`[Cron] AI分析開始 (${newItems.length}件)...`)
      const analyses = await analyzeNews(newItems)

      // 5. NewsItem形式に変換して保存
      const newsItems: NewsItem[] = newItems.map((item, idx) => ({
        id: generateId(item.url),
        title: item.title,
        url: item.url,
        description: item.description,
        source: item.source,
        publishedAt: item.publishedAt,
        fetchedAt: new Date().toISOString(),
        isPriority: item.isPriority,
        analysis: analyses[idx],
      }))

      savedCount = await saveNewsItems(newsItems)
      console.log(`[Cron] ${savedCount}件を保存完了`)
    }

    return Response.json({
      message: '更新完了',
      news: {
        fetched: rawItems.length,
        new: newItems.length,
        saved: savedCount,
      },
      trends: allTrends.map(t => ({
        platform: t.platform,
        count: t.trends.length,
      })),
    })
  } catch (error) {
    console.error('[Cron] エラー:', error)
    return Response.json(
      { error: 'Internal Server Error', details: String(error) },
      { status: 500 }
    )
  }
}
