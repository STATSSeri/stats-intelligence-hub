import { SnsPlaftorm, TrendItem, TrendPost, PlatformTrends } from './types'

const APIFY_BASE = 'https://api.apify.com/v2'

// Apify REST APIでActorを同期実行しデータセット結果を直接取得
async function runActor(actorId: string, input: Record<string, unknown>): Promise<Record<string, unknown>[]> {
  const token = process.env.APIFY_API_TOKEN
  if (!token) throw new Error('APIFY_API_TOKEN が未設定です')

  // actor IDの「username/name」形式を「username~name」に変換（URL安全）
  const safeActorId = actorId.replace('/', '~')
  const url = `${APIFY_BASE}/acts/${safeActorId}/run-sync-get-dataset-items?token=${token}`

  console.log(`[Apify] Actor実行: ${safeActorId}`)

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Apify Actor ${safeActorId} 実行失敗: ${res.status} ${text.slice(0, 200)}`)
  }

  return await res.json() as Record<string, unknown>[]
}

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
    // apidojo/tweet-scraper で日本のトレンドを検索
    const items = await runActor('apidojo/tweet-scraper', {
      searchTerms: ['trending japan'],
      maxItems: 15,
      sort: 'Top',
    })

    return items.slice(0, 15).map((item, idx) => ({
      id: hashId(`x-${item.text || item.full_text || idx}`),
      platform: 'x' as SnsPlaftorm,
      keyword: extractHashtagOrKeyword(item),
      volume: Number(item.replyCount || 0) + Number(item.retweetCount || 0) || undefined,
      rank: idx + 1,
      posts: [{
        username: String(item.author?.toString() || (item.user as Record<string, unknown>)?.screen_name || ''),
        text: String(item.text || item.full_text || '').slice(0, 280),
        url: item.url ? String(item.url) : undefined,
        likes: Number(item.likeCount || item.favoriteCount || 0) || undefined,
        retweets: Number(item.retweetCount || 0) || undefined,
        views: Number(item.viewCount || 0) || undefined,
      }],
      fetchedAt: new Date().toISOString(),
    })).filter(t => t.keyword)
  } catch (error) {
    console.error('[Trends] X取得エラー:', error)
    return []
  }
}

function extractHashtagOrKeyword(item: Record<string, unknown>): string {
  // ハッシュタグがあれば使う
  const entities = item.entities as Record<string, unknown> | undefined
  const hashtags = (entities?.hashtags || []) as Array<Record<string, string>>
  if (hashtags.length > 0) return `#${hashtags[0].text || hashtags[0].tag}`

  // なければテキストの先頭30文字
  const text = String(item.text || item.full_text || '')
  return text.slice(0, 40).trim()
}

// === Instagram トレンド取得 ===
async function fetchInstagramTrends(): Promise<TrendItem[]> {
  try {
    const searchKeywords = [
      'インフルエンサー', 'PR案件', 'ラグジュアリー',
      'コスメPR', 'ブランドコラボ', 'SNSマーケティング',
      'ファッション', 'ジュエリー',
    ]

    const items = await runActor('apify/instagram-scraper', {
      search: searchKeywords.join(' '),
      searchType: 'hashtag',
      resultsLimit: 5,
    })

    // ハッシュタグごとにグループ化
    const grouped = new Map<string, Array<Record<string, unknown>>>()
    for (const item of items) {
      const tag = String(item.hashtag || item.hashtagName || item.queryTag || '')
      if (!tag) continue
      if (!grouped.has(tag)) grouped.set(tag, [])
      grouped.get(tag)!.push(item)
    }

    // グループ化できなかった場合は投稿ごとにリスト化
    if (grouped.size === 0 && items.length > 0) {
      return items.slice(0, 10).map((item, idx) => ({
        id: hashId(`ig-${item.id || idx}`),
        platform: 'instagram' as SnsPlaftorm,
        keyword: String(item.caption || '').slice(0, 40) || `投稿${idx + 1}`,
        volume: undefined,
        rank: idx + 1,
        posts: [{
          username: String(item.ownerUsername || item.username || ''),
          text: String(item.caption || '').slice(0, 280),
          url: item.url ? String(item.url) : undefined,
          likes: Number(item.likesCount || item.likes || 0) || undefined,
        }],
        fetchedAt: new Date().toISOString(),
      }))
    }

    return Array.from(grouped.entries()).map(([tag, posts], idx) => ({
      id: hashId(`ig-${tag}`),
      platform: 'instagram' as SnsPlaftorm,
      keyword: `#${tag}`,
      volume: posts.length > 0 ? Number(posts[0].mediaCount || 0) || undefined : undefined,
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
    const items = await runActor('clockworks/tiktok-scraper', {
      hashtags: [
        'インフルエンサー', 'PR', 'ラグジュアリー',
        'ブランド', 'コラボ', 'SNS',
      ],
      resultsPerPage: 5,
    })

    // ハッシュタグごとにグループ化
    const grouped = new Map<string, Array<Record<string, unknown>>>()
    for (const item of items) {
      const hashtags = (item.hashtags || []) as Array<Record<string, string>>
      const mainTag = hashtags[0]?.name || String(item.hashtag || '')
      if (!mainTag) continue
      if (!grouped.has(mainTag)) grouped.set(mainTag, [])
      grouped.get(mainTag)!.push(item)
    }

    // グループ化できなかった場合
    if (grouped.size === 0 && items.length > 0) {
      return items.slice(0, 10).map((item, idx) => ({
        id: hashId(`tt-${item.id || idx}`),
        platform: 'tiktok' as SnsPlaftorm,
        keyword: String(item.text || item.desc || '').slice(0, 40) || `動画${idx + 1}`,
        volume: undefined,
        rank: idx + 1,
        posts: [{
          username: String((item.authorMeta as Record<string, string>)?.name || item.author || ''),
          text: String(item.text || item.desc || '').slice(0, 280),
          url: item.webVideoUrl ? String(item.webVideoUrl) : undefined,
          likes: Number(item.diggCount || item.likes || 0) || undefined,
          plays: Number(item.playCount || item.plays || 0) || undefined,
        }],
        fetchedAt: new Date().toISOString(),
      }))
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
    const items = await runActor('curious_coder/threads-scraper', {
      searchQueries: [
        'インフルエンサー', 'PR案件', 'ラグジュアリー',
        'ブランドコラボ', 'SNSマーケティング',
      ],
      maxItems: 20,
    })

    // キーワードごとにグループ化
    const grouped = new Map<string, Array<Record<string, unknown>>>()
    for (const item of items) {
      const query = String(item.searchQuery || item.query || 'threads')
      if (!grouped.has(query)) grouped.set(query, [])
      grouped.get(query)!.push(item)
    }

    // グループ化できなかった場合
    if (grouped.size === 0 && items.length > 0) {
      return items.slice(0, 10).map((item, idx) => ({
        id: hashId(`th-${item.id || idx}`),
        platform: 'threads' as SnsPlaftorm,
        keyword: String(item.text || item.caption || '').slice(0, 40) || `投稿${idx + 1}`,
        volume: undefined,
        rank: idx + 1,
        posts: [{
          username: String(item.username || item.author || ''),
          text: String(item.text || item.caption || '').slice(0, 280),
          url: item.url ? String(item.url) : undefined,
          likes: Number(item.likeCount || item.likes || 0) || undefined,
        }],
        fetchedAt: new Date().toISOString(),
      }))
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
