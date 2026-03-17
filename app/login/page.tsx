'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        router.push('/')
        router.refresh()
      } else {
        setError('パスワードが正しくありません')
      }
    } catch {
      setError('エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-xs">
        <h1 className="text-lg font-bold text-text-primary mb-6 text-center">
          Intelligence Hub
        </h1>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="パスワード"
          autoFocus
          className="w-full px-3 py-2 text-sm rounded-lg bg-bg-card border border-border text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-blue"
        />
        {error && (
          <p className="text-xs text-accent-rose mt-2">{error}</p>
        )}
        <button
          type="submit"
          disabled={isLoading || !password}
          className="w-full mt-3 px-3 py-2 text-sm font-medium rounded-lg bg-accent-blue text-white hover:bg-accent-blue/90 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'ログイン中...' : 'ログイン'}
        </button>
      </form>
    </div>
  )
}
