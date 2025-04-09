import type React from "react"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>
}

