import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE = 'ih_session'

// 認証不要のパス
const PUBLIC_PATHS = ['/login', '/api/auth', '/api/cron']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 公開パスはスキップ
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // 静的ファイルはスキップ
  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next()
  }

  // セッションCookieの存在チェック
  // （Redisでの検証はAPI Route側で行う。middlewareではCookie有無のみ）
  const session = request.cookies.get(SESSION_COOKIE)
  if (!session?.value) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
