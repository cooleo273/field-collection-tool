import type React from "react"
import "./globals.css"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { ProjectProvider } from '@/contexts/project-context'
import { Toaster } from "@/components/ui/toaster" // Make sure this import exists

const inter = Inter({ subsets: ["latin"] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' }
  ]
}

export const metadata: Metadata = {
  title: "Akofada BCC",
  description: "Akofada BCC Data Collection Platform",
  generator: 'v0.dev',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Akofada BCC'
  },
  // icons: {
  //   icon: '../public/Main_logo.svg',
  //   apple: '../public/Main_logo.svg'
  // }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider attribute="class" defaultTheme="light">
          <AuthProvider>
            <div className="app-content safe-area-top safe-area-bottom">
              <ProjectProvider>
                {children}
                <Toaster /> {/* Ensure this is present */}
              </ProjectProvider>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'