"use client"
import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/services/client"
import { useRouter } from "next/navigation"
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
  
  const router = useRouter()

  // Function to check session from localStorage
  const getSessionFromLocalStorage = () => {
    const session = localStorage.getItem('supabase_session')
    if (session) {
      return JSON.parse(session)
    }
    return null
  }

  // Function to save session in localStorage
  const saveSessionToLocalStorage = (session: any) => {
    localStorage.setItem('supabase_session', JSON.stringify(session))
  }

  // Function to initialize auth state
  const initAuth = async () => {
    setIsLoading(true)
    try {
      const sessionFromStorage = getSessionFromLocalStorage()

      if (sessionFromStorage) {
        const { user, expires_at } = sessionFromStorage
        if (expires_at > Date.now() / 1000) { // Check if session is valid
          setUser(user)
          const profile = await fetchUserProfile(user.id)
          setUserProfile(profile)
        } else {
          // Expired session, remove it from localStorage
          localStorage.removeItem('supabase_session')
          setUser(null)
          setUserProfile(null)
        }
      } else {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Error getting session:", sessionError)
          setIsLoading(false)
          return
        }

        if (session?.user) {
          setUser(session.user)
          saveSessionToLocalStorage(session) // Store session in localStorage
          const profile = await fetchUserProfile(session.user.id)
          setUserProfile(profile)
        } else {
          setUser(null)
          setUserProfile(null)
        }
      }
    } catch (error) {
      console.error("Error initializing auth:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, email, role, phone, status")
        .eq("id", userId)
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error("Error fetching user profile:", error)
      return null
    }
  }

  useEffect(() => {
    // Check session when component mounts
    initAuth()
  }, [])

  const signIn = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        console.error("Sign-in error:", error)
        return { error: { message: error.message } }
      }

      if (data?.user) {
        const profile = await fetchUserProfile(data.user.id)
        setUserProfile(profile)
        saveSessionToLocalStorage(data) // Store the session in localStorage
        router.push("/dashboard") // Or redirect based on role
      }

      return {}
    } catch (error: any) {
      console.error("Error during sign-in:", error)
      return { error: { message: error.message } }
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    setIsLoading(true)
    await supabase.auth.signOut()
    localStorage.removeItem('supabase_session') // Clear session from localStorage
    setUser(null)
    setUserProfile(null)
    router.push("/")
    setIsLoading(false)
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
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
