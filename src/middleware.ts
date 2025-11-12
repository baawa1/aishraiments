import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Database } from '@/types/database'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If user is not signed in and trying to access protected routes, redirect to login
  if (!session && !req.nextUrl.pathname.startsWith('/login')) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  // If user is signed in and trying to access login, redirect to dashboard
  if (session && req.nextUrl.pathname.startsWith('/login')) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/inventory/:path*',
    '/jobs/:path*',
    '/expenses/:path*',
    '/sales/:path*',
    '/customers/:path*',
    '/receivables/:path*',
    '/collections/:path*',
    '/reports/:path*',
    '/settings/:path*',
    '/login',
  ],
}
