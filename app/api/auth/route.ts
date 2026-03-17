import { NextRequest, NextResponse } from 'next/server'
import { createSession, SESSION_COOKIE } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const { password } = await request.json()

  if (password !== process.env.ADMIN_PASSWORD) {
    return Response.json({ error: 'Invalid password' }, { status: 401 })
  }

  const token = await createSession()

  const response = NextResponse.json({ success: true })
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60, // 30日
    path: '/',
  })

  return response
}
