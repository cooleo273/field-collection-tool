"use client"
import { createContext, useContext, useEffect, useState, useRef } from "react" // Added useRef
import { supabase } from "@/lib/services/client"
import { useRouter } from "next/navigation"
import type { User, AuthChangeEvent, Session } from "@supabase/supabase-js" // Added AuthChangeEvent, Session

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
  const [isLoading, setIsLoading] = useState(true) // For initial load and async operations
  const [lastSignInAttempt, setLastSignInAttempt] = useState<number>(0)
  const RATE_LIMIT_WINDOW = 1000 // 1 second between attempts
  
  const router = useRouter()
  const hasSignedOutRef = useRef(false) // Ref to track logout status

  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, email, role, phone, status")
        .eq("id", userId)
        .single()

      if (error) throw error
      return data as UserProfile
    } catch (error) {
      console.error("Error fetching user profile:", error)
      return null
    }
  }

  // Function to initialize auth state
  const initAuth = async () => {
    setIsLoading(true)
    // Don't reset hasSignedOutRef here; let onAuthStateChange handle INITIAL_SESSION
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("Error getting session:", sessionError)
        setUser(null)
        setUserProfile(null)
        setIsLoading(false)
        return
      }

      if (session?.user) {
        // If a logout happened (e.g., in another tab) since app start, respect it.
        if (hasSignedOutRef.current) {
            setUser(null)
            setUserProfile(null)
        } else {
            setUser(session.user)
            const profile = await fetchUserProfile(session.user.id)
            // Check again after await, in case logout happened during fetch
            if (hasSignedOutRef.current) {
                setUser(null)
                setUserProfile(null)
            } else {
                setUserProfile(profile)
            }
        }
      } else {
        setUser(null)
        setUserProfile(null)
      }
    } catch (error) {
      console.error("Error initializing auth:", error)
      setUser(null)
      setUserProfile(null)
    } finally {
      setIsLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    const now = Date.now()
    if (now - lastSignInAttempt < RATE_LIMIT_WINDOW) {
      return { error: { message: "Please wait a moment before trying again" } }
    }
    
    setLastSignInAttempt(now)
    setIsLoading(true)
    hasSignedOutRef.current = false // Explicitly signing in, so not signed out
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        console.error("Sign-in error:", error)
        // Don't change hasSignedOutRef on error, state before signIn attempt remains.
        return { error: { message: error.message.includes("rate limit") ? "Too many attempts. Please wait." : error.message } }
      }

      if (data?.user) {
        // User is successfully signed in, hasSignedOutRef is false.
        setUser(data.user) // Set user immediately
        const profile = await fetchUserProfile(data.user.id)
        setUserProfile(profile) // Set profile
        router.push("/dashboard")
      } else {
        // Should not happen if error is not present, but as a safeguard
        setUser(null)
        setUserProfile(null)
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
    hasSignedOutRef.current = true // Mark that a sign-out process has started
    await supabase.auth.signOut()
    // Supabase signOut will trigger onAuthStateChange with SIGNED_OUT.
    // That event will also set hasSignedOutRef.current = true.
    // The setTimeout in onAuthStateChange will then handle clearing user/profile.
    // For immediate UI feedback, we can also set them here:
    setUser(null)
    setUserProfile(null)
    router.push("/")
    setIsLoading(false)
  }

  useEffect(() => {
    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      console.log("Auth Event:", event, "Session User:", session?.user?.id, "Current hasSignedOutRef:", hasSignedOutRef.current);

      // Update hasSignedOutRef based on the event, BEFORE scheduling the timeout
      if (event === "SIGNED_OUT") {
        hasSignedOutRef.current = true
      } else if (event === "SIGNED_IN" || (event === "INITIAL_SESSION" && session?.user)) {
        // A definitive sign-in or initial session with user means we are not in a "signed out" state.
        hasSignedOutRef.current = false
      }
      // For events like TOKEN_REFRESHED or USER_UPDATED, we don't change hasSignedOutRef here.
      // The logic inside setTimeout will respect if hasSignedOutRef is already true.

      // The crucial setTimeout, as requested
      setTimeout(async () => {
        // This setIsLoading is for the operations within this specific timeout.
        // This might be what helps with the "stuck loading" perception on tab changes.
        setIsLoading(true)

        try {
          // 1. If a sign-out has occurred (ref is true) AND
          //    this event is NOT a new sign-in overriding it:
          if (hasSignedOutRef.current && !(event === "SIGNED_IN" || (event === "INITIAL_SESSION" && session?.user))) {
            console.log(`setTimeout: hasSignedOutRef is true for event ${event}. Clearing user state.`);
            setUser(null)
            setUserProfile(null)
          }
          // 2. Else (either not signed out OR it's a new sign-in/initial session with user):
          //    If the session from the event has a user, update accordingly.
          else if (session?.user) {
            console.log(`setTimeout: Processing user for event ${event}. User ID: ${session.user.id}`);
            setUser(session.user) // Set user based on current event's session
            
            const fetchedProfile = await fetchUserProfile(session.user.id)
            // CRITICAL: Re-check hasSignedOutRef *after* any async operation (like fetchUserProfile)
            // It's possible a SIGNED_OUT event occurred (e.g., in another tab) during the fetch.
            if (hasSignedOutRef.current && !(event === "SIGNED_IN" || (event === "INITIAL_SESSION" && session?.user))) {
              console.log(`setTimeout: hasSignedOutRef became true during/after fetchProfile for event ${event}. Clearing user/profile.`);
              setUser(null) 
              setUserProfile(null)
            } else {
              setUserProfile(fetchedProfile)
            }
          }
          // 3. Else (session is null or no user, and not explicitly a fresh sign-in that cleared hasSignedOutRef)
          //    This means we should be in a logged-out state.
          else {
            console.log(`setTimeout: No user in session for event ${event} (and not overridden by sign-in). Clearing user state.`);
            setUser(null)
            setUserProfile(null)
          }
        } catch (e) {
            console.error("Error in onAuthStateChange setTimeout logic:", e)
            // Fallback to signed-out state on error to be safe
            setUser(null)
            setUserProfile(null)
        } finally {
          setIsLoading(false)
        }
      }, 0) // 0ms timeout defers execution to the next event loop tick
    })

    return () => {
      subscription.unsubscribe()
    }
  }, []) // Empty dependency array ensures this effect runs only once on mount and cleans up on unmount.

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