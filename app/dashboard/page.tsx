"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AdminDashboard } from "@/components/dashboards/admin-dashboard"
import { ProjectAdminDashboard } from "@/components/dashboards/project-admin-dashboard"
import { PromoterDashboard } from "@/components/dashboards/promoter-dashboard"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useAuth } from "@/contexts/auth-context"

export default function DashboardPage() {
  const { userProfile, isLoading } = useAuth()
  const [dashboardComponent, setDashboardComponent] = useState<React.ReactNode | null>(null)

  useEffect(() => {
    if (!userProfile) return

    // Render dashboard based on user role
    switch (userProfile.role) {
      case "admin":
        setDashboardComponent(<AdminDashboard />)
        break
      case "project-admin":
        setDashboardComponent(<ProjectAdminDashboard />)
        break
      case "promoter":
        setDashboardComponent(<PromoterDashboard />)
        break
      default:
        setDashboardComponent(<div>Unknown role</div>)
    }
  }, [userProfile])

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    )
  }

  return <DashboardLayout>{dashboardComponent}</DashboardLayout>
}

