import { cookies } from 'next/headers'
import { Redis } from '@upstash/redis'

const SESSION_COOKIE = 'ih_session'
const SESSION_TTL = 30 * 24 * 60 * 60 // 30日

function getRedis() {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })
}

// セッション作成
export async function createSession(): Promise<string> {
  const token = crypto.randomUUID()
  const redis = getRedis()
  await redis.set(`session:${token}`, 'valid', { ex: SESSION_TTL })
  return token
}

// セッション検証
export async function validateSession(token: string): Promise<boolean> {
  const redis = getRedis()
  const value = await redis.get(`session:${token}`)
  return value === 'valid'
}

// Cookieからセッションを取得・検証
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return false
  return validateSession(token)
}

// セッションCookie名（middleware用）
export { SESSION_COOKIE }
