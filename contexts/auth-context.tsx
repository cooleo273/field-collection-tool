"use client";

import type React from "react";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getSession,
  signIn as signInUser,
} from "@/lib/repositories/auth.repository";
import { getUser, createUser } from "@/lib/repositories/user.repository";
import type { User } from "@supabase/supabase-js";

type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  status: string;
};

type AuthContextType = {
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error?: { message: string } }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();

  const fetchUserProfile = async (userId: string) => {
    try {
      const profile = await getUser(userId);
      if (!profile) {
        const authUser = await getSession();
        if (authUser) {
          const newUser = await createUser({
            id: userId,
            email: authUser.data,
            name: authUser.data.name || authUser.data.email.split("@")[0] || "User",
            role: "promoter",
            status: "active",
          });
          return newUser;
        }
      }
      return profile;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  };

  const initAuth = async () => {
    try {
      setIsLoading(true);
      const session = await getSession();
      if (session?.data) {
        setUser(session.data);
        const profile = await fetchUserProfile(session.data.id);
        setUserProfile(profile);
      } else {
        setUser(null);
        setUserProfile(null);
      }
    } catch (error) {
      console.error("Error initializing auth:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error?: { message: string } | undefined }> => {
    try {
      setIsLoading(true);
      const result = await signInUser(email, password);
      if (result && !result.error) {
        const session = await getSession();
        if (session?.data) {
          setUser(session.data);
          const profile = await fetchUserProfile(session.data.id);
          setUserProfile(profile);
          router.push(
            profile.role === "admin"
              ? "/admin"
              : profile.role === "project-admin"
              ? "/dashboard"
              : "/submissions"
          );
        }
        return {};
      } else {
        console.error("Sign-in error:", result?.error?.message);
        return {
          error: { message: result?.error?.message || "Unknown error" },
        };
      }
    } catch (error) {
      console.error("Error signing in:", error);
      return { error: { message: "An error occurred during sign-in." } };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    userProfile,
    isLoading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
