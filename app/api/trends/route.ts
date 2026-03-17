import { getTrends, getTrendsLastUpdated } from '@/lib/storage'

export async function GET() {
  try {
    const [trends, lastUpdated] = await Promise.all([
      getTrends(),
      getTrendsLastUpdated(),
    ])

    return Response.json({
      trends,
      lastUpdated,
    })
  } catch (error) {
    console.error('[API] トレンド取得エラー:', error)
    return Response.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
