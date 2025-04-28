"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LoginForm } from "@/components/login-form"
import { useAuth } from "@/contexts/auth-context"
import { Card } from "@/components/ui/card"

export default function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      const redirectTo = searchParams.get("redirectTo") || "/dashboard"
      router.push(redirectTo)
    }
  }, [user, router, searchParams])

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background/95 to-muted/50">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      
      {/* Main Content */}
      <div className="container relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8">
          {/* Left Side - Branding */}
          <div className="hidden lg:flex flex-col justify-center space-y-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold tracking-tight">Field Data Collection Tool</h1>
              </div>
              <p className="text-lg text-muted-foreground">
                Streamline your field data collection process with our intuitive and powerful platform.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Real-time Data Collection</h3>
                  <p className="text-muted-foreground">Capture and sync data instantly from the field</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Offline Capabilities</h3>
                  <p className="text-muted-foreground">Work seamlessly even without internet connection</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Advanced Analytics</h3>
                  <p className="text-muted-foreground">Get insights from your collected data</p>
                </div>
              </div>
            </div>
          </div>

          {/* Login form */}
          <LoginForm />
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-0 w-full py-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Field Data Collection Tool. All rights reserved.
      </footer>
    </div>
  )
}