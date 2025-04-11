"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { UserNav } from "@/components/user-nav"
import { Sidebar } from "./sidebar"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Database, Menu } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export function   DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isLoading, userProfile } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Determine if we're on a mobile device
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Initial check
    checkIfMobile()

    // Add event listener for window resize
    window.addEventListener("resize", checkIfMobile)

    // Cleanup
    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!userProfile) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Mobile-optimized header */}
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="flex h-14 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[80%] max-w-[280px] p-0">
                <div className="py-4">
                  <Sidebar />
                </div>
              </SheetContent>
            </Sheet>
            <Link href="/dashboard" className="flex items-center gap-2 app-logo">
              <Database className="h-5 w-5" />
              <span className="font-bold">Akofada BCC</span>
            </Link>
          </div>
          <UserNav />
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop sidebar - hidden on mobile */}
        <aside className="hidden w-64 border-r bg-background md:block">
          <Sidebar />
        </aside>

        {/* Main content - full width on mobile */}
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}

