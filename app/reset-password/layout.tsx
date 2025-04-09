import { ReactNode } from "react"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Reset your password to access your account.",
}

interface ResetPasswordLayoutProps {
  children: ReactNode
}

export default function ResetPasswordLayout({ children }: ResetPasswordLayoutProps) {
  return (
    <div className="min-h-screen bg-muted/40 flex flex-col">
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
} 