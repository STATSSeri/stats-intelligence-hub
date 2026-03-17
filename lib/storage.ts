import { Redis } from '@upstash/redis'
import { NewsItem, PlatformTrends } from './types'

// Upstash Redisクライアント
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const TTL_DAYS = 30
const TTL_SECONDS = TTL_DAYS * 24 * 60 * 60

// URLからハッシュIDを生成
export function generateId(url: string): string {
  let hash = 0
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

// ニュースアイテムを保存
export async function saveNewsItems(items: NewsItem[]): Promise<number> {
  if (items.length === 0) return 0

  const pipeline = redis.pipeline()
  let savedCount = 0

  for (const item of items) {
    const key = `news:${item.id}`

    // 既存チェック（重複排除）
    const exists = await redis.exists(key)
    if (exists) continue

    pipeline.set(key, JSON.stringify(item), { ex: TTL_SECONDS })

    // 日付別インデックスに追加
    const date = item.publishedAt.slice(0, 10) // YYYY-MM-DD
    pipeline.sadd(`index:${date}`, item.id)
    pipeline.expire(`index:${date}`, TTL_SECONDS)

    // 全体インデックスにも追加
    pipeline.zadd('index:all', {
      score: new Date(item.publishedAt).getTime(),
      member: item.id,
    })

    savedCount++
  }

  if (savedCount > 0) {
    await pipeline.exec()
    // メタデータ更新
    await redis.set('meta:last_updated', new Date().toISOString())
  }

  return savedCount
}

// ニュース一覧を取得（新しい順）
export async function getNewsItems(limit = 100): Promise<NewsItem[]> {
  // 全体インデックスから新しい順にIDを取得
  const ids = await redis.zrange('index:all', 0, limit - 1, { rev: true })

  if (!ids || ids.length === 0) return []

  // 各IDのデータを並列取得
  const pipeline = redis.pipeline()
  for (const id of ids) {
    pipeline.get(`news:${id}`)
  }
  const results = await pipeline.exec()

  return results
    .filter((r): r is NonNullable<typeof r> => r !== null && r !== undefined)
    .map(r => {
      // Upstash Redisは自動でJSONパースする場合がある
      if (typeof r === 'string') return JSON.parse(r) as NewsItem
      return r as NewsItem
    })
}

// 最終更新日時を取得
export async function getLastUpdated(): Promise<string | null> {
  return await redis.get<string>('meta:last_updated')
}

// ニュースアイテムが既に存在するか確認
export async function existsNewsItem(id: string): Promise<boolean> {
  return (await redis.exists(`news:${id}`)) === 1
}

// === SNSトレンド関連 ===

const TRENDS_TTL = 24 * 60 * 60 // 24時間

// トレンドデータを保存
export async function saveTrends(allTrends: PlatformTrends[]): Promise<void> {
  const pipeline = redis.pipeline()

  for (const platformTrends of allTrends) {
    const key = `trends:${platformTrends.platform}`
    pipeline.set(key, JSON.stringify(platformTrends), { ex: TRENDS_TTL })
  }

  pipeline.set('meta:trends_updated', new Date().toISOString(), { ex: TRENDS_TTL })
  await pipeline.exec()
}

// トレンドデータを取得
export async function getTrends(): Promise<PlatformTrends[]> {
  const platforms = ['x', 'instagram', 'tiktok', 'threads']
  const pipeline = redis.pipeline()

  for (const p of platforms) {
    pipeline.get(`trends:${p}`)
  }

  const results = await pipeline.exec()

  return results
    .filter((r): r is NonNullable<typeof r> => r !== null && r !== undefined)
    .map(r => {
      if (typeof r === 'string') return JSON.parse(r) as PlatformTrends
      return r as PlatformTrends
    })
}

// トレンド最終更新日時
export async function getTrendsLastUpdated(): Promise<string | null> {
  return await redis.get<string>('meta:trends_updated')
}
