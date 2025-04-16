import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// List of public routes that don't require authentication
const publicRoutes = ["/login", "/reset-password"]

export async function middleware(req: NextRequest) {
//   const res = NextResponse.next()
//   const supabase = createMiddlewareClient({ req, res })

//   // Get the session
//   const {
//     data: { session },
//   } = await supabase.auth.getSession()

//   const { pathname } = req.nextUrl

//   // Check if the current path is a public route
//   const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

//   // If the user is not authenticated and trying to access a protected route
//   if (!session && !isPublicRoute) {
//     // Create a redirect URL to the login page
//     const redirectUrl = new URL('/login', req.url)
//     // Add the current path as a redirect parameter
//     redirectUrl.searchParams.set('redirectTo', pathname)
//     return NextResponse.redirect(redirectUrl)
//   }

//   // If the user is authenticated and trying to access the login page
//   if (session && pathname === '/login') {
//     return NextResponse.redirect(new URL('/dashboard', req.url))
//   }

//   return res
// }

// // Configure which routes to run the middleware on
// export const config = {
//   matcher: [
//     /*
//      * Match all request paths except:
//      * - _next/static (static files)
//      * - _next/image (image optimization files)
//      * - favicon.ico (favicon file)
//      * - public folder
//      */
//     "/((?!_next/static|_next/image|favicon.ico|public).*)",
//   ],
}

