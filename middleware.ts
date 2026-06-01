import { NextResponse } from "next/server"
import type { NextRequest, NextFetchEvent } from "next/server"
import { features } from "@/config/features"

export default async function middleware(req: NextRequest, ev: NextFetchEvent) {
  const { pathname } = req.nextUrl

  // Propagate the request pathname to RSC/layouts. Next.js doesn't expose
  // the current URL inside server components by default; we read this in
  // /admin/layout.tsx to make the no-access route an exception to the shell.
  const reqHeaders = new Headers(req.headers)
  reqHeaders.set('x-pathname', pathname)

  // Check if this is a DAM-only deployment by hostname or env var
  const hostname = req.headers.get("host") || ""
  const isDamOnlyDeployment =
    hostname.includes("lashpop-dam") ||
    process.env.DAM_ONLY_DEPLOYMENT === "true"

  // DAM + Admin authentication is enforced at the layout/route-handler level
  // (where we have a Node runtime + DB access). Middleware only enforces the
  // cheap "must have an auth_token cookie" gate at the edge — anything more
  // requires Drizzle which can't run here.
  // The DAM UI now lives under /admin/assets; /api/dam endpoints are unchanged.
  const isDAMRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/dam") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/auth")
  const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/api/admin")

  // Edge-level cookie presence check for /admin. The layout still validates
  // the session against the DB; this just prevents the page bundle from being
  // shipped to unauthenticated visitors.
  if (isAdminRoute && pathname !== "/admin/no-access" && !pathname.startsWith("/admin/login")) {
    const hasAuthCookie = req.cookies.get("auth_token")?.value
    if (!hasAuthCookie) {
      const url = req.nextUrl.clone()
      url.pathname = "/admin/login"
      url.searchParams.set("next", pathname)
      return NextResponse.redirect(url)
    }
  }

  // If this is a DAM-only deployment, handle routing
  if (isDamOnlyDeployment) {
    // Redirect root to the asset manager
    if (pathname === "/") {
      const url = req.nextUrl.clone()
      url.pathname = "/admin/assets"
      return NextResponse.redirect(url)
    }

    // Block non-DAM routes (except Next.js internals)
    if (!isDAMRoute && !pathname.startsWith("/_next") && !pathname.startsWith("/api/_")) {
      const url = req.nextUrl.clone()
      url.pathname = "/admin/assets"
      return NextResponse.redirect(url)
    }
  }

  // Original Clerk authentication for non-DAM routes
  if (!features.clerk) {
    return NextResponse.next({ request: { headers: reqHeaders } })
  }

  const { clerkMiddleware, createRouteMatcher } = await import(
    "@clerk/nextjs/server"
  )

  const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"])

  const handler = clerkMiddleware(async (auth, reqInner) => {
    const { userId, redirectToSignIn } = await auth()

    if (!userId && isProtectedRoute(reqInner)) {
      return redirectToSignIn()
    }

    return NextResponse.next()
  })

  return handler(req, ev)
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)"
  ]
}
