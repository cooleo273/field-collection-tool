import type React from "react"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // This layout should not include the DashboardLayout component
  // as it's already included in the admin and other layouts
  return children
}

