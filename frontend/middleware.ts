// middleware.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // Skip if env is missing (nice for local/storybook)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return NextResponse.next()

  try {
    // Only forward headers — do NOT pass the whole request
    const requestHeaders = new Headers(request.headers)
    const response = NextResponse.next({ request: { headers: requestHeaders } })

    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookies) {
          // Set cookies ONLY on the response
          cookies.forEach(({ name, value, options }) => {
            response.cookies.set({
              name,
              value,
              ...(options as CookieOptions | undefined),
            })
          })
        },
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Auth gating
    const { pathname } = request.nextUrl
    if (!user && pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (user && pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
  } catch (err) {
    console.error('Middleware error:', err)
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

