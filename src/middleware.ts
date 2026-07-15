import { NextResponse } from "next/server"
import type { NextRequest, NextFetchEvent } from "next/server"
import { features } from "@/config/features"

type AdminAccess = "admin" | "forbidden" | "unauthenticated" | "unavailable"

async function getAdminAccess(sessionToken: string): Promise<AdminAccess> {
  const databaseUrl = process.env.CLOUDFLARE_DB_URL
  const databaseToken = process.env.CLOUDFLARE_DB_TOKEN
  if (!databaseUrl || !databaseToken) return "unavailable"

  try {
    const response = await fetch(`${databaseUrl.replace(/\/$/, "")}/query`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${databaseToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sql: `SELECT u.dam_access
              FROM "session" s
              INNER JOIN "user" u ON u.id = s.user_id
              WHERE s.token = ? AND s.expires_at > ?
              LIMIT 1`,
        params: [sessionToken, Date.now()],
        method: "get",
      }),
      cache: "no-store",
    })

    if (!response.ok) return "unavailable"
    const payload = await response.json() as { rows?: unknown[] }
    if (!payload.rows?.length) return "unauthenticated"
    return payload.rows[0] === 1 ? "admin" : "forbidden"
  } catch {
    return "unavailable"
  }
}

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

  // The DAM UI lives under /admin/assets; /api/dam endpoints are unchanged.
  const isDAMRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/dam") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/auth")
  const isAdminPage = pathname.startsWith("/admin")
  const isPublicTeamPhotosRead =
    req.method === "GET" && /^\/api\/dam\/team\/[^/]+\/photos$/.test(pathname)
  const isLogoutRoute = pathname === "/api/dam/auth/logout"
  const isProtectedApi =
    (pathname.startsWith("/api/admin") || pathname.startsWith("/api/dam")) &&
    !isPublicTeamPhotosRead &&
    !isLogoutRoute

  // Edge-level cookie presence check for /admin. The layout still validates
  // the session against the DB; this just prevents the page bundle from being
  // shipped to unauthenticated visitors.
  if (isAdminPage && pathname !== "/admin/no-access" && !pathname.startsWith("/admin/login")) {
    const hasAuthCookie = req.cookies.get("auth_token")?.value
    if (!hasAuthCookie) {
      const url = req.nextUrl.clone()
      url.pathname = "/admin/login"
      url.searchParams.set("next", pathname)
      return NextResponse.redirect(url)
    }
  }

  // Validate every private admin/DAM API request at the edge against D1.
  // This protects handlers consistently, including older endpoints that do
  // not yet call requireAdminApi() themselves.
  if (isProtectedApi) {
    const sessionToken = req.cookies.get("auth_token")?.value
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })
    }

    const access = await getAdminAccess(sessionToken)
    if (access === "unauthenticated") {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })
    }
    if (access === "forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    if (access === "unavailable") {
      return NextResponse.json({ error: "Authentication service unavailable" }, { status: 503 })
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
