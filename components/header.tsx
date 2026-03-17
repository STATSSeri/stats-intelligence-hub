'use client'

interface HeaderProps {
  lastUpdated: string | null
  totalCount: number
  onRefresh: () => void
  isLoading: boolean
}

export default function Header({ lastUpdated, totalCount, onRefresh, isLoading }: HeaderProps) {
  const formattedDate = lastUpdated
    ? new Date(lastUpdated).toLocaleString('ja-JP', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '未取得'

  return (
    <header className="flex items-center justify-between py-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary tracking-tight">
          Intelligence Hub
        </h1>
        <p className="text-xs text-text-muted mt-0.5">
          {totalCount}件のニュース・最終更新: {formattedDate}
        </p>
      </div>
      <button
        onClick={onRefresh}
        disabled={isLoading}
        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-bg-card border border-border text-text-secondary hover:bg-bg-card-hover hover:text-text-primary transition-colors disabled:opacity-50"
      >
        {isLoading ? '読み込み中...' : '更新'}
      </button>
    </header>
  )
}
