"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/services/client"
import type { User } from "@supabase/supabase-js"

type UserProfile = {
  id: string
  name: string
  email: string
  role: string
  phone?: string
  status: string
}

type AuthContextType = {
  user: User | null
  userProfile: UserProfile | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: { message: string } }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Make sure your auth initialization sets isLoading to false when complete
  
  const router = useRouter()

  // Function to fetch user profile
  const fetchUserProfile = async (userId: string) => {
    try {
      
      // First, check if the user exists in the users table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, name, email, role, phone, status")
        .eq("id", userId)
        .single()

      if (userError) {
        console.error("Error fetching user from users table:", userError.message, userError.details)
        
        // Get current user from auth
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        
        if (authError) {
          console.error("Error getting auth user:", authError)
          return null
        }

        if (authUser) {
           
          const { data: newUser, error: createError } = await supabase
            .from("users")
            .insert([
              {
                id: userId,
                email: authUser.email,
                name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
                role: "promoter", // Changed default role to promoter
                status: "active"
              }
            ])
            .select("id, name, email, role, phone, status")
            .single()

          if (createError) {
            console.error("Error creating user profile:", createError.message, createError.details)
            return null
          }

           
          return newUser as UserProfile
        }
        return null
      }

      if (!userData) {
        console.error("No user data found in database")
        return null
      }
      return userData as UserProfile
    } catch (error) {
      console.error("Error in fetchUserProfile:", error instanceof Error ? error.message : error)
      return null
    }
  }

  // Function to initialize auth state
  const initAuth = async () => {
    try {
      setIsLoading(true)

      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("Error getting session:", sessionError)
        setIsLoading(false)
        return
      }

      if (session?.user) {
        setUser(session.user)

        // Fetch user profile
        const profile = await fetchUserProfile(session.user.id)
        if (profile) {
          setUserProfile(profile)
        } else {
          console.error("Failed to fetch user profile")
        }
      } else {
        setUser(null)
        setUserProfile(null)
      }
    } catch (error) {
      console.error("Error initializing auth:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Initialize auth state on mount
  useEffect(() => {
    initAuth()

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      
      if (event === "SIGNED_IN") {
        if (session?.user) {
          setUser(session.user)
          const profile = await fetchUserProfile(session.user.id)
          if (profile) {
            setUserProfile(profile)
          }
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setUserProfile(null)
      }
    })

    // Clean up subscription
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Supabase auth error:", error)
        return { error: { message: error.message } }
      }

      if (!data?.user) {
        console.error("No user data returned from Supabase auth")
        return { error: { message: "No user returned from sign in" } }
      }

      // Fetch user profile
      const profile = await fetchUserProfile(data.user.id)
      if (!profile) {
        return { error: { message: "Could not fetch user profile" } }
      }

      setUserProfile(profile)
      if (profile.role === "admin") {
        router.push("/admin")
      } else if (profile.role === "project-admin") {
        router.push("/dashboard")
      } else {
        router.push("/submissions")
      }

      return {}
    } catch (error) {
      console.error("Error in signIn function:", error)
      return { error: { message: error instanceof Error ? error.message : "An unexpected error occurred" } }
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setIsLoading(true)
      await supabase.auth.signOut()
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const value = {
    user,
    userProfile,
    isLoading,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

