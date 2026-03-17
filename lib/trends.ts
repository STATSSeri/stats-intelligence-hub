import { ApifyClient } from 'apify-client'
import { SnsPlaftorm, TrendItem, TrendPost, PlatformTrends } from './types'

const apify = new ApifyClient({
  token: process.env.APIFY_API_TOKEN!,
})

// ハッシュID生成
function hashId(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

// === X (Twitter) トレンド取得 ===
async function fetchXTrends(): Promise<TrendItem[]> {
  try {
    // X Trending Topics用Actor
    const run = await apify.actor('novi/twitter-trending-topics').call({
      country: 'japan',
      count: 15,
    }, { timeout: 120 })

    const { items } = await apify.dataset(run.defaultDatasetId).listItems()

    return (items as Array<Record<string, unknown>>).slice(0, 15).map((item, idx) => ({
      id: hashId(`x-${item.name || item.trend || idx}`),
      platform: 'x' as SnsPlaftorm,
      keyword: String(item.name || item.trend || ''),
      volume: Number(item.tweet_volume || item.tweetVolume || 0) || undefined,
      rank: idx + 1,
      posts: extractXPosts(item),
      fetchedAt: new Date().toISOString(),
    })).filter(t => t.keyword)
  } catch (error) {
    console.error('[Trends] X取得エラー:', error)
    return []
  }
}

function extractXPosts(item: Record<string, unknown>): TrendPost[] {
  const tweets = (item.tweets || item.topTweets || []) as Array<Record<string, unknown>>
  return tweets.slice(0, 3).map(tweet => ({
    username: String(tweet.username || tweet.user || tweet.screen_name || ''),
    text: String(tweet.text || tweet.full_text || '').slice(0, 280),
    url: tweet.url ? String(tweet.url) : undefined,
    likes: Number(tweet.likes || tweet.favorite_count || 0) || undefined,
    retweets: Number(tweet.retweets || tweet.retweet_count || 0) || undefined,
    views: Number(tweet.views || tweet.view_count || 0) || undefined,
  }))
}

// === Instagram トレンド取得 ===
async function fetchInstagramTrends(): Promise<TrendItem[]> {
  try {
    // Instagram Hashtag Scraper
    const searchKeywords = [
      'インフルエンサー', 'PR案件', 'ラグジュアリー',
      'コスメPR', 'ブランドコラボ', 'SNSマーケティング',
      'ファッション', 'ジュエリー',
    ]

    const run = await apify.actor('apify/instagram-hashtag-scraper').call({
      hashtags: searchKeywords,
      resultsLimit: 5,
    }, { timeout: 120 })

    const { items } = await apify.dataset(run.defaultDatasetId).listItems()

    // ハッシュタグごとにグループ化
    const grouped = new Map<string, Array<Record<string, unknown>>>()
    for (const item of items as Array<Record<string, unknown>>) {
      const tag = String(item.hashtag || item.hashtagName || '')
      if (!tag) continue
      if (!grouped.has(tag)) grouped.set(tag, [])
      grouped.get(tag)!.push(item)
    }

    return Array.from(grouped.entries()).map(([tag, posts], idx) => ({
      id: hashId(`ig-${tag}`),
      platform: 'instagram' as SnsPlaftorm,
      keyword: `#${tag}`,
      volume: posts.length > 0 ? Number((posts[0] as Record<string, unknown>).mediaCount || 0) || undefined : undefined,
      rank: idx + 1,
      posts: posts.slice(0, 3).map(p => ({
        username: String(p.ownerUsername || p.username || ''),
        text: String(p.caption || '').slice(0, 280),
        url: p.url ? String(p.url) : undefined,
        likes: Number(p.likesCount || p.likes || 0) || undefined,
      })),
      fetchedAt: new Date().toISOString(),
    }))
  } catch (error) {
    console.error('[Trends] Instagram取得エラー:', error)
    return []
  }
}

// === TikTok トレンド取得 ===
async function fetchTikTokTrends(): Promise<TrendItem[]> {
  try {
    const run = await apify.actor('clockworks/free-tiktok-scraper').call({
      hashtags: [
        'インフルエンサー', 'PR', 'ラグジュアリー',
        'ブランド', 'コラボ', 'SNS',
      ],
      resultsPerPage: 5,
    }, { timeout: 120 })

    const { items } = await apify.dataset(run.defaultDatasetId).listItems()

    // ハッシュタグごとにグループ化
    const grouped = new Map<string, Array<Record<string, unknown>>>()
    for (const item of items as Array<Record<string, unknown>>) {
      const hashtags = (item.hashtags || []) as Array<Record<string, string>>
      const mainTag = hashtags[0]?.name || String(item.hashtag || '')
      if (!mainTag) continue
      if (!grouped.has(mainTag)) grouped.set(mainTag, [])
      grouped.get(mainTag)!.push(item)
    }

    return Array.from(grouped.entries()).map(([tag, posts], idx) => ({
      id: hashId(`tt-${tag}`),
      platform: 'tiktok' as SnsPlaftorm,
      keyword: `#${tag}`,
      volume: undefined,
      rank: idx + 1,
      posts: posts.slice(0, 3).map(p => {
        const authorMeta = p.authorMeta as Record<string, string> | undefined
        return {
          username: String(authorMeta?.name || p.author || ''),
          text: String(p.text || p.desc || '').slice(0, 280),
          url: p.webVideoUrl ? String(p.webVideoUrl) : undefined,
          likes: Number(p.diggCount || p.likes || 0) || undefined,
          plays: Number(p.playCount || p.plays || 0) || undefined,
        }
      }),
      fetchedAt: new Date().toISOString(),
    }))
  } catch (error) {
    console.error('[Trends] TikTok取得エラー:', error)
    return []
  }
}

// === Threads トレンド取得 ===
async function fetchThreadsTrends(): Promise<TrendItem[]> {
  try {
    const run = await apify.actor('apify/threads-scraper').call({
      searchQueries: [
        'インフルエンサー', 'PR案件', 'ラグジュアリー',
        'ブランドコラボ', 'SNSマーケティング',
      ],
      maxItems: 20,
    }, { timeout: 120 })

    const { items } = await apify.dataset(run.defaultDatasetId).listItems()

    // キーワードごとにグループ化
    const grouped = new Map<string, Array<Record<string, unknown>>>()
    for (const item of items as Array<Record<string, unknown>>) {
      const query = String(item.searchQuery || item.query || 'threads')
      if (!grouped.has(query)) grouped.set(query, [])
      grouped.get(query)!.push(item)
    }

    return Array.from(grouped.entries()).map(([keyword, posts], idx) => ({
      id: hashId(`th-${keyword}`),
      platform: 'threads' as SnsPlaftorm,
      keyword,
      volume: posts.length,
      rank: idx + 1,
      posts: posts.slice(0, 3).map(p => ({
        username: String(p.username || p.author || ''),
        text: String(p.text || p.caption || '').slice(0, 280),
        url: p.url ? String(p.url) : undefined,
        likes: Number(p.likeCount || p.likes || 0) || undefined,
      })),
      fetchedAt: new Date().toISOString(),
    }))
  } catch (error) {
    console.error('[Trends] Threads取得エラー:', error)
    return []
  }
}

// === 全プラットフォーム一括取得 ===
export async function fetchAllTrends(): Promise<PlatformTrends[]> {
  const now = new Date().toISOString()

  const results = await Promise.allSettled([
    fetchXTrends(),
    fetchInstagramTrends(),
    fetchTikTokTrends(),
    fetchThreadsTrends(),
  ])

  const platforms: SnsPlaftorm[] = ['x', 'instagram', 'tiktok', 'threads']

  return results.map((result, idx) => ({
    platform: platforms[idx],
    trends: result.status === 'fulfilled' ? result.value : [],
    fetchedAt: now,
  }))
}
