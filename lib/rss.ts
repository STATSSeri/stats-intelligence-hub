import { XMLParser } from 'fast-xml-parser'
import { FeedSource, RawNewsItem } from './types'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
})

// HTMLタグを除去
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

// 単一フィードからニュースを取得
async function fetchFeed(source: FeedSource): Promise<RawNewsItem[]> {
  try {
    const res = await fetch(source.url, {
      headers: { 'User-Agent': 'Stats-Intelligence-Hub/1.0' },
      next: { revalidate: 0 },
    })
    if (!res.ok) {
      console.error(`[RSS] ${source.name}: HTTP ${res.status}`)
      return []
    }

    const xml = await res.text()
    const parsed = parser.parse(xml)

    // RSS 2.0形式
    const rssItems = parsed?.rss?.channel?.item
    if (rssItems) {
      return parseRssItems(rssItems, source)
    }

    // Atom形式
    const atomEntries = parsed?.feed?.entry
    if (atomEntries) {
      return parseAtomEntries(atomEntries, source)
    }

    // RDF形式 (RSS 1.0)
    const rdfItems = parsed?.['rdf:RDF']?.item
    if (rdfItems) {
      return parseRssItems(rdfItems, source)
    }

    console.warn(`[RSS] ${source.name}: 認識できないフィード形式`)
    return []
  } catch (error) {
    console.error(`[RSS] ${source.name}: 取得エラー`, error)
    return []
  }
}

// RSS 2.0 / RDF形式のパース
function parseRssItems(items: unknown, source: FeedSource): RawNewsItem[] {
  const list = Array.isArray(items) ? items : [items]
  return list.slice(0, 20).map((item: Record<string, unknown>) => ({
    title: String(item.title || '').trim(),
    url: String(item.link || '').trim(),
    description: stripHtml(String(item.description || item['dc:description'] || '')).slice(0, 500),
    source: source.name,
    publishedAt: String(item.pubDate || item['dc:date'] || new Date().toISOString()),
    isPriority: source.isPriority,
    defaultCategory: source.category,
  })).filter(item => item.title && item.url)
}

// Atom形式のパース
function parseAtomEntries(entries: unknown, source: FeedSource): RawNewsItem[] {
  const list = Array.isArray(entries) ? entries : [entries]
  return list.slice(0, 20).map((entry: Record<string, unknown>) => {
    // Atomのlinkはオブジェクトの場合がある
    const link = entry.link as Record<string, string> | string
    let url = ''
    if (typeof link === 'string') {
      url = link
    } else if (Array.isArray(link)) {
      const alternate = link.find((l: Record<string, string>) => l['@_rel'] === 'alternate')
      url = (alternate?.['@_href'] || link[0]?.['@_href'] || '') as string
    } else if (link && typeof link === 'object') {
      url = (link['@_href'] || '') as string
    }

    const summary = entry.summary || entry.content || ''
    const summaryText = typeof summary === 'string'
      ? summary
      : (summary as Record<string, string>)?.['#text'] || ''

    return {
      title: String(entry.title || '').trim(),
      url: url.trim(),
      description: stripHtml(String(summaryText)).slice(0, 500),
      source: source.name,
      publishedAt: String(entry.published || entry.updated || new Date().toISOString()),
      isPriority: source.isPriority,
      defaultCategory: source.category,
    }
  }).filter(item => item.title && item.url)
}

// 全フィードを並列取得
export async function fetchAllFeeds(sources: FeedSource[]): Promise<RawNewsItem[]> {
  const results = await Promise.allSettled(
    sources.map(source => fetchFeed(source))
  )

  const allItems: RawNewsItem[] = []
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`[RSS] ${sources[index].name}: ${result.value.length}件取得`)
      allItems.push(...result.value)
    } else {
      console.error(`[RSS] ${sources[index].name}: 失敗`, result.reason)
    }
  })

  return allItems
}
