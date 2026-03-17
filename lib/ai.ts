import Anthropic from '@anthropic-ai/sdk'
import { AIAnalysis, Category, RawNewsItem } from './types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const SYSTEM_PROMPT = `あなたはスタッツ株式会社（インフルエンサーキャスティング＆SNS PR支援）のCEO専用ニュースアナリストです。

【会社概要】
- 事業: インフルエンサーキャスティング（Instagram/YouTube/TikTok）、イベント制作、映像・写真コンテンツ制作
- クライアント: Harry Winston, Jimmy Choo, Salomon等ラグジュアリーブランド
- AI活用・業務自動化に積極的に取り組んでいる

【カテゴリ定義】
1. influencer-marketing: インフルエンサーマーケティング、クリエイターエコノミー、SNS PR業界動向
2. luxury-brands: ラグジュアリーブランド、ファッション、ジュエリー、アウトドアブランドの動向
3. sns-platforms: Instagram/YouTube/TikTokのアルゴリズム変更、新機能、プラットフォーム動向
4. ai-technology: AI活用、マーケティングテック、業務自動化の最新動向

【分析ルール】
- 各記事について必ずJSON形式で返す
- categoryは上記4つのいずれか1つ
- summaryは日本語2文で簡潔に（英語記事も日本語で要約）
- importanceは1-5（5が最重要）。スタッツの事業への影響度・関連度で判断
  - 5: 即座に対応が必要な重大ニュース
  - 4: 事業戦略に影響する重要ニュース
  - 3: 知っておくべき業界動向
  - 2: 参考情報
  - 1: 間接的な関連のみ
- importance 3以上の場合のみ relevanceNote を1文で付与`

// バッチでニュース記事を分析
export async function analyzeNews(items: RawNewsItem[]): Promise<AIAnalysis[]> {
  if (items.length === 0) return []

  // 最大20件ずつバッチ処理（API制限とコスト考慮）
  const batchSize = 20
  const allAnalyses: AIAnalysis[] = []

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const analyses = await analyzeBatch(batch)
    allAnalyses.push(...analyses)
  }

  return allAnalyses
}

async function analyzeBatch(items: RawNewsItem[]): Promise<AIAnalysis[]> {
  const articlesText = items.map((item, idx) =>
    `[${idx + 1}] タイトル: ${item.title}\n概要: ${item.description || '(なし)'}\nソース: ${item.source}\nデフォルトカテゴリ: ${item.defaultCategory}`
  ).join('\n\n')

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `以下の${items.length}件のニュース記事を分析してください。JSON配列で返してください。各要素は { "index": 番号, "category": カテゴリ, "summary": 要約, "importance": 重要度, "relevanceNote": 関連メモ(省略可) } の形式です。\n\n${articlesText}`,
      }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    // JSON配列を抽出
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.error('[AI] JSON配列が見つかりません:', text.slice(0, 200))
      return items.map(item => fallbackAnalysis(item))
    }

    const analyses = JSON.parse(jsonMatch[0]) as Array<{
      index: number
      category: string
      summary: string
      importance: number
      relevanceNote?: string
    }>

    return analyses.map((a, idx) => ({
      category: validateCategory(a.category) || items[idx]?.defaultCategory || 'ai-technology',
      summary: a.summary || '',
      importance: Math.min(5, Math.max(1, a.importance)) as AIAnalysis['importance'],
      relevanceNote: a.relevanceNote,
    }))
  } catch (error) {
    console.error('[AI] 分析エラー:', error)
    return items.map(item => fallbackAnalysis(item))
  }
}

// カテゴリ値の検証
function validateCategory(value: string): Category | null {
  const valid: Category[] = ['influencer-marketing', 'luxury-brands', 'sns-platforms', 'ai-technology']
  return valid.includes(value as Category) ? (value as Category) : null
}

// AI分析失敗時のフォールバック
function fallbackAnalysis(item: RawNewsItem): AIAnalysis {
  return {
    category: item.defaultCategory,
    summary: item.description?.slice(0, 100) || item.title,
    importance: 2,
  }
}
