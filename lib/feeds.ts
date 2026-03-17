import { FeedSource } from './types'

export const FEED_SOURCES: FeedSource[] = [
  // === プライオリティソース ===
  {
    name: '日経ビジネス',
    url: 'https://business.nikkei.com/rss/sns/nb.rdf',
    category: 'luxury-brands',
    isPriority: true,
    language: 'ja',
  },
  {
    name: 'Bloomberg Japan',
    url: 'https://news.google.com/rss/search?q=site:bloomberg.co.jp&hl=ja&gl=JP&ceid=JP:ja',
    category: 'luxury-brands',
    isPriority: true,
    language: 'ja',
  },
  {
    name: 'WWD Japan',
    url: 'https://www.wwdjapan.com/rss',
    category: 'luxury-brands',
    isPriority: true,
    language: 'ja',
  },
  {
    name: 'Fashionsnap',
    url: 'https://news.google.com/rss/search?q=site:fashionsnap.com&hl=ja&gl=JP&ceid=JP:ja',
    category: 'luxury-brands',
    isPriority: true,
    language: 'ja',
  },

  // === 通常ソース ===
  {
    name: 'PR TIMES',
    url: 'https://prtimes.jp/index.rdf',
    category: 'influencer-marketing',
    isPriority: false,
    language: 'ja',
  },
  {
    name: 'MarkeZine',
    url: 'https://markezine.jp/rss/new/20/index.xml',
    category: 'influencer-marketing',
    isPriority: false,
    language: 'ja',
  },
  {
    name: 'Social Media Lab',
    url: 'https://gaiax-socialmedialab.jp/feed/',
    category: 'sns-platforms',
    isPriority: false,
    language: 'ja',
  },
  {
    name: 'ITmedia マーケティング',
    url: 'https://rss.itmedia.co.jp/rss/2.0/marketing.xml',
    category: 'sns-platforms',
    isPriority: false,
    language: 'ja',
  },
  {
    name: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
    category: 'ai-technology',
    isPriority: false,
    language: 'en',
  },
  {
    name: 'The Verge',
    url: 'https://www.theverge.com/rss/index.xml',
    category: 'ai-technology',
    isPriority: false,
    language: 'en',
  },
]
