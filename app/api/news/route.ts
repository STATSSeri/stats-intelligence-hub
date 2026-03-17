import { getNewsItems, getLastUpdated } from '@/lib/storage'

export async function GET() {
  try {
    const [items, lastUpdated] = await Promise.all([
      getNewsItems(100),
      getLastUpdated(),
    ])

    return Response.json({
      items,
      lastUpdated,
      count: items.length,
    })
  } catch (error) {
    console.error('[API] ニュース取得エラー:', error)
    return Response.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
