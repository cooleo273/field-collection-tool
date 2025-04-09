import type { ReactNode } from "react"
import { AdminDashboardLayout } from "@/components/layouts/admin-dashboard-layout"

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminDashboardLayout>{children}</AdminDashboardLayout>
}

