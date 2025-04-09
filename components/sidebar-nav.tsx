"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Home,
  Users,
  Map,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useState } from "react"

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Campaigns",
    href: "/campaigns",
    icon: Map,
  },
  {
    title: "Submissions",
    href: "/submissions",
    icon: FileText,
  },
  {
    title: "Users",
    href: "/users",
    icon: Users,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
]

export function SidebarNav() {
  const pathname = usePathname()
  const { signOut } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="mobile-only fixed top-4 right-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="mobile-button-icon"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Mobile Menu */}
      <div
        className={cn(
          "mobile-only fixed inset-0 z-40 transform transition-transform duration-200 ease-in-out",
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="h-full w-64 bg-background border-r">
          <div className="flex h-16 items-center px-4 border-b">
            <h2 className="text-lg font-semibold">Menu</h2>
          </div>
          <nav className="space-y-1 p-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "mobile-nav-item",
                  pathname === item.href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.title}</span>
              </Link>
            ))}
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
              onClick={() => {
                signOut()
                setIsMobileMenuOpen(false)
              }}
            >
              <LogOut className="h-5 w-5" />
              <span>Sign out</span>
            </Button>
          </nav>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="desktop-only w-64 border-r">
        <div className="flex h-16 items-center px-4 border-b">
          <h2 className="text-lg font-semibold">Menu</h2>
        </div>
        <nav className="space-y-1 p-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "sidebar-link",
                pathname === item.href
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.title}</span>
            </Link>
          ))}
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
            onClick={signOut}
          >
            <LogOut className="h-5 w-5" />
            <span>Sign out</span>
          </Button>
        </nav>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="mobile-only fixed bottom-0 left-0 right-0 bg-background border-t">
        <div className="grid grid-cols-4 gap-1 p-2">
          {navItems.slice(0, 4).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "mobile-nav-item",
                pathname === item.href
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs">{item.title}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
} 