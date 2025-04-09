import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the id from params
    const id = params.id
    
    // Create Supabase client with cookies
    // Next.js requires this pattern for dynamic route handlers
    const supabase = createRouteHandlerClient({
      cookies
    })
    
    // First, delete the user from the database
    const { error: dbError } = await supabase
      .from("users")
      .delete()
      .eq("id", id)
    
    if (dbError) {
      console.error("Error deleting user from database:", dbError)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }
    
    // For security, we don't have permission to delete auth users directly
    // The user will need to be cleaned up by an admin or through Supabase dashboard
    // This is a limitation when not using service_role key
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error("Error in delete user API route:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the id from params
    const id = await params.id
    const userData = await request.json()
    
    // Create Supabase client with cookies
    // Next.js requires this pattern for dynamic route handlers
    const supabase = createRouteHandlerClient({
      cookies
    })
    
    // Update user in the database
    const { data, error } = await supabase
      .from("users")
      .update({
        ...userData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
    
    if (error) {
      console.error("Error updating user:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    if (!data || data.length === 0) {
      return NextResponse.json({ error: "User not found or not updated" }, { status: 404 })
    }
    
    return NextResponse.json({ user: data[0] })
    
  } catch (error) {
    console.error("Error in update user API route:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
} 