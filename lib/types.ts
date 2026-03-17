// ニュースカテゴリ
export type Category =
  | 'influencer-marketing'  // インフルエンサーマーケ
  | 'luxury-brands'         // ラグジュアリーブランド
  | 'sns-platforms'          // SNSプラットフォーム
  | 'ai-technology'          // AI・テクノロジー

export const CATEGORY_LABELS: Record<Category, string> = {
  'influencer-marketing': 'インフルエンサーマーケ',
  'luxury-brands': 'ラグジュアリーブランド',
  'sns-platforms': 'SNSプラットフォーム',
  'ai-technology': 'AI・テクノロジー',
}

// RSSフィード定義
export interface FeedSource {
  name: string
  url: string
  category: Category
  isPriority: boolean
  language: 'ja' | 'en'
}

// AI分析結果
export interface AIAnalysis {
  category: Category
  summary: string
  importance: 1 | 2 | 3 | 4 | 5
  relevanceNote?: string
}

// ニュースアイテム（保存形式）
export interface NewsItem {
  id: string
  title: string
  url: string
  description: string
  source: string
  publishedAt: string
  fetchedAt: string
  isPriority: boolean
  analysis?: AIAnalysis
}

// RSS取得結果（AI分析前）
export interface RawNewsItem {
  title: string
  url: string
  description: string
  source: string
  publishedAt: string
  isPriority: boolean
  defaultCategory: Category
}

// === SNSトレンド関連 ===

export type SnsPlaftorm = 'x' | 'instagram' | 'tiktok' | 'threads'

export const SNS_LABELS: Record<SnsPlaftorm, string> = {
  x: 'X',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  threads: 'Threads',
}

// トレンド投稿サンプル
export interface TrendPost {
  username: string
  text: string
  url?: string
  likes?: number
  retweets?: number
  views?: number
  plays?: number
}

// トレンドアイテム
export interface TrendItem {
  id: string
  platform: SnsPlaftorm
  keyword: string          // トレンドワード or ハッシュタグ
  volume?: number          // 投稿数・ボリューム
  rank: number             // 順位
  posts: TrendPost[]       // 関連投稿サンプル（3-5件）
  fetchedAt: string
  aiInsight?: string       // AI分析: スタッツ事業との関連コメント
}

// トレンドデータ（プラットフォームごと）
export interface PlatformTrends {
  platform: SnsPlaftorm
  trends: TrendItem[]
  fetchedAt: string
}
