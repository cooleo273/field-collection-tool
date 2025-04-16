import { supabase } from "./client"

// Use the global client for auth operations
export default class AuthService {
  constructor() {}
   async signIn(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password })
  }
   async signOut() {
    return supabase.auth.signOut()
  }
   async getSession() {
    return supabase.auth.getSession()
  }
   async getCurrentUser() {
    const { data } = await supabase.auth.getUser()
    return data.user
  }
}








