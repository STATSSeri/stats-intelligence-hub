import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Intelligence Hub | Stats Corporation',
  description: 'スタッツ株式会社専用ニュース収集・分析ダッシュボード',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  )
}
