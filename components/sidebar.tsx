"use client"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  Users,
  Map,
  Settings,
  ClipboardList,
  Upload,
  CheckSquare,
  UserCog,
  UserPlus,
  FileInput,
  PieChart,
  Calendar,
  LayoutDashboard,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { useProject } from "@/contexts/project-context"
// Add this import

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const { userProfile, isLoading } = useAuth()
  const { currentProject, isLoading: projectLoading } = useProject()

  console.log("Sidebar - Current Project:", currentProject)
  console.log("Sidebar - Current Path:", pathname)

  // Wait for both auth and project to load
  if (isLoading || projectLoading) {
    return (
      <div className="flex h-full flex-col border-r">
        <div className="flex-1 overflow-auto py-4">
          <div className="grid gap-1 px-2">
            <div className="h-10 md:h-8 w-full animate-pulse rounded bg-muted"></div>
            <div className="h-10 md:h-8 w-full animate-pulse rounded bg-muted"></div>
            <div className="h-10 md:h-8 w-full animate-pulse rounded bg-muted"></div>
          </div>
        </div>
      </div>
    )
  }

  const userRole = userProfile?.role || "unauthenticated"

  // Define navigation items based on user role and current project
  const navigationItems = {
    admin: [
      // Admin items remain unchanged
    ],
    "project-admin": [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { 
        name: "Promoters", 
        href: currentProject ? `/projects/${currentProject.id}/promoters` : "/dashboard", 
        icon: Users 
      },
      { 
        name: "Activities", 
        href: currentProject ? `/projects/${currentProject.id}/activities` : "/dashboard", 
        icon: Calendar 
      },
      { 
        name: "Locations", 
        href: currentProject ? `/projects/${currentProject.id}/locations` : "/dashboard", 
        icon: Map 
      },
      { 
        name: "Submissions", 
        href: currentProject ? `/projects/${currentProject.id}/submissions` : "/dashboard", 
        icon: ClipboardList 
      },
      { 
        name: "Reports", 
        href: currentProject ? `/projects/${currentProject.id}/reports` : "/dashboard", 
        icon: PieChart 
      },
    ],
    promoter: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "New Submission", href: "/submissions/new", icon: Upload },
      { name: "My Submissions", href: "/submissions", icon: ClipboardList },
      { name: "Reports", href: "/submissions/reports", icon: PieChart },
    ]
    // Promoter items remain unchanged
  }

  // Get navigation items for current role
  const items = navigationItems[userRole as keyof typeof navigationItems] || []

  const handleNavigation = (href: string) => {
    if (userRole === "unauthenticated") {
      toast({
        title: "Authentication Required",
        description: "Please log in to access this page",
        variant: "destructive",
      })
      router.push("/login")
      return
    }
    router.push(href)
  }

  return (
    <div className="flex h-full flex-col border-r">
      <nav className="flex-1 overflow-auto py-4">
        <ul className="grid gap-1 px-2">
          {items.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={cn(
                  "sidebar-link",
                  pathname === item.href || pathname.startsWith(item.href + "/")
                    ? "sidebar-link-active"
                    : "sidebar-link-inactive",
                )}
              >
                <item.icon className="h-5 w-5 md:h-4 md:w-4" />
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

