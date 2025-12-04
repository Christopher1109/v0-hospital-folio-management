import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  let user = null
  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    user = authUser
  } catch (error) {
    console.error("[v0] Session error:", error)
    // Clear all Supabase cookies on session error
    const supabaseCookies = request.cookies.getAll().filter((cookie) => cookie.name.startsWith("sb-"))

    const response = NextResponse.redirect(new URL("/auth/login", request.url))

    supabaseCookies.forEach((cookie) => {
      response.cookies.delete(cookie.name)
    })

    return response
  }

  if (request.nextUrl.pathname.startsWith("/auth") || request.nextUrl.pathname === "/") {
    return supabaseResponse
  }

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"

    // Clear all Supabase cookies
    const response = NextResponse.redirect(url)
    const supabaseCookies = request.cookies.getAll().filter((cookie) => cookie.name.startsWith("sb-"))

    supabaseCookies.forEach((cookie) => {
      response.cookies.delete(cookie.name)
    })

    return response
  }

  return supabaseResponse
}
