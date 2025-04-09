import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { getUserById } from "@/lib/supabase/users"

/**
 * Send password reset email to user
 * 
 * POST /api/users/[id]/reset-password
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the id from params - use it after awaiting
    const id = params.id

    // Get user from database
    const user = await getUserById(id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Create Supabase client with cookies
    // Next.js requires this pattern for dynamic route handlers
    const supabase = createRouteHandlerClient({
      cookies
    })

    // Send password reset email
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      user.email,
      {
        redirectTo: new URL("/reset-password", process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").toString()
      }
    )

    if (resetError) {
      console.error("Error resetting password:", resetError)
      return NextResponse.json({ error: resetError.message }, { status: 500 })
    }

    return NextResponse.json({ message: "Password reset email sent" }, { status: 200 })
  } catch (error) {
    console.error("Error in reset password route:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
} 