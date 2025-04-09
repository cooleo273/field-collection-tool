import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function RoleBasedUI() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Role-Based UI Rendering</CardTitle>
          <CardDescription>Dynamic UI based on user roles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-md">
            <pre className="text-sm overflow-auto">
              {`// components/layout/sidebar.tsx
"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Home, Users, FileText, Map, BarChart, Settings, ClipboardList, Upload, CheckSquare } from 'lucide-react';

export function Sidebar() {
  const { data: session } = useSession();
  const userRole = session?.user?.role || "unauthenticated";
  
  // Define navigation items based on user role
  const navigationItems = {
    admin: [
      { name: "Dashboard", href: "/dashboard", icon: Home },
      { name: "Users", href: "/admin/users", icon: Users },
      { name: "Campaigns", href: "/admin/campaigns", icon: FileText },
      { name: "Locations", href: "/admin/locations", icon: Map },
      { name: "Analytics", href: "/admin/analytics", icon: BarChart },
      { name: "Settings", href: "/admin/settings", icon: Settings },
    ],
    "project-admin": [
      { name: "Dashboard", href: "/dashboard", icon: Home },
      { name: "Promoters", href: "/projects/promoters", icon: Users },
      { name: "Campaigns", href: "/projects/campaigns", icon: FileText },
      { name: "Submissions", href: "/projects/submissions", icon: ClipboardList },
      { name: "Analytics", href: "/projects/analytics", icon: BarChart },
    ],
    promoter: [
      { name: "Dashboard", href: "/dashboard", icon: Home },
      { name: "New Submission", href: "/submissions/new", icon: Upload },
      { name: "My Submissions", href: "/submissions", icon: ClipboardList },
      { name: "Sync Data", href: "/submissions/sync", icon: CheckSquare },
    ],
  };
  
  // Get navigation items for current role
  const items = navigationItems[userRole as keyof typeof navigationItems] || [];
  
  return (
    <aside className="w-64 bg-card border-r h-screen p-4">
      <div className="flex items-center mb-6">
        <span className="font-bold text-xl">Akofada BCC</span>
      </div>
      
      <nav className="space-y-1">
        {items.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="flex items-center px-2 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}`}
            </pre>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dashboard Page Example</CardTitle>
          <CardDescription>Role-specific dashboard content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-md">
            <pre className="text-sm overflow-auto">
              {`// app/dashboard/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { AdminDashboard } from "@/components/dashboards/admin-dashboard";
import { ProjectAdminDashboard } from "@/components/dashboards/project-admin-dashboard";
import { PromoterDashboard } from "@/components/dashboards/promoter-dashboard";
import { Unauthorized } from "@/components/unauthorized";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  
  if (status === "loading") {
    return <div>Loading...</div>;
  }
  
  if (status === "unauthenticated") {
    return <Unauthorized />;
  }
  
  // Render dashboard based on user role
  switch (session?.user?.role) {
    case "admin":
      return <AdminDashboard />;
    case "project-admin":
      return <ProjectAdminDashboard />;
    case "promoter":
      return <PromoterDashboard />;
    default:
      return <Unauthorized />;
  }
}`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

