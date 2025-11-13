import { NextResponse } from "next/server"
import type { NextRequest, NextFetchEvent } from "next/server"
import { features } from "@/config/features"

export default async function middleware(req: NextRequest, ev: NextFetchEvent) {
  const { pathname } = req.nextUrl

  // Check if this is a DAM-only deployment
  const isDamOnlyDeployment = process.env.DAM_ONLY_DEPLOYMENT === "true"

  // DAM authentication check
  const isDAMRoute = pathname.startsWith("/dam") || pathname.startsWith("/api/dam")
  const isDAMLogin = pathname === "/dam/login"
  const isDAMAuthAPI = pathname.startsWith("/api/dam/auth")

  if (isDAMRoute && !isDAMLogin && !isDAMAuthAPI) {
    // Check for auth cookie
    const authCookie = req.cookies.get("dam_auth")

    if (!authCookie || authCookie.value !== "authenticated") {
      // Redirect to login
      const url = req.nextUrl.clone()
      url.pathname = "/dam/login"
      return NextResponse.redirect(url)
    }
  }

  // If this is a DAM-only deployment, handle routing
  if (isDamOnlyDeployment) {
    // Redirect root to /dam
    if (pathname === "/") {
      const url = req.nextUrl.clone()
      url.pathname = "/dam"
      return NextResponse.redirect(url)
    }

    // Block non-DAM routes (except login and auth API)
    if (!isDAMRoute && !pathname.startsWith("/_next") && !pathname.startsWith("/api/_")) {
      const url = req.nextUrl.clone()
      url.pathname = "/dam"
      return NextResponse.redirect(url)
    }
  }

  // Original Clerk authentication for non-DAM routes
  if (!features.clerk) {
    return NextResponse.next()
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
