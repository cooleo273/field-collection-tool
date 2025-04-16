"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { UserNav } from "@/components/user-nav"
import { LoadingSpinner } from "@/components/loading-spinner"
import {
  Users,
  Map,
  Settings,
  FileInput,
  PieChart,
  Calendar,
  LayoutDashboard,
  Menu,
  X,
  UserCog,
  UserPlus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const { userProfile, isLoading, user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

   ("AdminDashboardLayout - Current state:", {
    isLoading,
    userProfile,
    user,
    pathname
  })

  // Close sidebar when path changes (mobile navigation)
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // Check if we need to wait for auth
  useEffect(() => {
    if (!isLoading) {
      setIsCheckingAuth(false)
    }
  }, [isLoading])

  // Show loading spinner only during initial auth check
  if (isCheckingAuth) {
     ("AdminDashboardLayout - Initial auth check")
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  // If not authenticated, redirect to login
  if (!user) {
     ("AdminDashboardLayout - No authenticated user")
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold">Authentication Required</h1>
        <p className="mt-2 text-muted-foreground">Please sign in to access this area.</p>
        <Link href="/" className="mt-4">
          <Button>Go to Login</Button>
        </Link>
      </div>
    )
  }

  // If authenticated but no profile yet, show loading
  if (!userProfile) {
     ("AdminDashboardLayout - No user profile, but authenticated")
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4 text-center">
        <LoadingSpinner />
        <p className="mt-4 text-muted-foreground">Loading your profile...</p>
      </div>
    )
  }

  // If not an admin, show access denied
  if (userProfile.role !== "admin") {
     ("AdminDashboardLayout - Invalid role:", userProfile.role)
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="mt-2 text-muted-foreground">You don't have permission to access this area.</p>
        <Link href="/dashboard" className="mt-4">
          <Button>Go to Dashboard</Button>
        </Link>
      </div>
    )
  }

  const navigationItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Project Admins", href: "/admin/project-admins", icon: UserCog },
    { name: "Projects", href: "/admin/projects", icon: Map },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      {/* Single responsive header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold sm:text-xl md:text-2xl">Akofada BCC</h1>
          </div>
          <div className="flex items-center gap-2">
            <UserNav />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar for mobile */}
        <aside
          className={cn(
            "fixed inset-y-0 top-10 left-0 z-20 w-64 transform border-r bg-background transition-transform duration-200 ease-in-out lg:static lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          {/* Navigation */}
          <nav className="flex-1 overflow-auto py-6 px-4">
            <ul className="space-y-2">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
                
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap overflow-hidden",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted",
                      )}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {/* Page content */}
          <div className="container mx-auto p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}

