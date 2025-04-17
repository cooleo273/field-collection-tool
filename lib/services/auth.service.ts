import { supabase } from "./client"

// Use the global client for auth operations
export default class AuthService {
  constructor() {}
  
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { error: { message: error.message } };
      }
      return data;
    } catch (err) {
      console.error("Error in AuthService signIn:", err);
      return { error: { message: "An unexpected error occurred during sign-in." } };
    }
  }

  async signOut() {
    return supabase.auth.signOut()
  }
   async getSession(): Promise<{ data?: any; error?: { message: string } }> {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error in getSession:', error);
        return { error: { message: error.message } };
      }
      return { data };
    } catch (error) {
      console.error('Error in getSession:', error);
      return { error: { message: 'An unexpected error occurred while fetching session.' } };
    }
  }

  async getCurrentUser() {
    const { data } = await supabase.auth.getUser()
    return data.user
  }
}








