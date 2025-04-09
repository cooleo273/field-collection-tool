import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { useState } from "react"

function generateRandomPassword(length = 12) {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+"
  let password = ""
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length)
    password += charset[randomIndex]
  }
  return password
}

export async function POST(request: Request) {
  try {
    const { name, email, role, status = "active" } = await request.json()
    
    if (!name || !email || !role) {
      return NextResponse.json(
        { error: "Name, email, and role are required" },
        { status: 400 }
      )
    }

    // Create Supabase client with cookies
    // Next.js requires this pattern for route handlers
    const supabase = createRouteHandlerClient({
      cookies
    })
    
    // Generate a random password
    const password = generateRandomPassword()
    
    // Instead of using admin.createUser, let's use the sign-up method and then update the user
    const { data: authUser, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role
        }
      }
    })
    
    if (authError) {
      console.error("Error creating auth user:", authError)
      return NextResponse.json(
        { error: authError.message },
        { status: 500 }
      )
    }
    
    if (!authUser.user) {
      return NextResponse.json(
        { error: "Failed to create auth user" },
        { status: 500 }
      )
    }
    
    // Insert user into the users table
    const { data: dbUser, error: dbError } = await supabase
      .from("users")
      .insert({
        id: authUser.user.id,
        name,
        email,
        role,
        status
      })
      .select("*")
      .single()
    
    if (dbError) {
      console.error("Error creating DB user:", dbError)
      return NextResponse.json(
        { error: dbError.message },
        { status: 500 }
      )
    }
    
    // Return the user and the generated password
    return NextResponse.json({
      user: dbUser,
      password
    })
    
  } catch (error) {
    console.error("Error in users API route:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
} 