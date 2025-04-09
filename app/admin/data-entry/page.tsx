"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadingSpinner } from "@/components/loading-spinner"
import { DataEntryForm } from "@/components/data-entry/data-entry-form"
import { DataEntryTemplates } from "@/components/data-entry/data-entry-templates"
import { DataEntrySettings } from "@/components/data-entry/data-entry-settings"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import { getUserByEmail } from "@/lib/supabase/users"
import type { User } from "@/lib/supabase/users"

export default function DataEntryPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    checkUserRole()
  }, [])

  const checkUserRole = async () => {
    try {
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        throw sessionError
      }

      if (!session?.user?.email) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to access this page.",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      // Get user details from database
      const userData = await getUserByEmail(session.user.email)
      
      if (!userData) {
        toast({
          title: "User Not Found",
          description: "Your account information could not be found.",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      setUser(userData)

      // Check if user has admin role
      if (userData.role !== "admin") {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page.",
          variant: "destructive",
        })
        router.push("/dashboard")
        return
      }
    } catch (error) {
      console.error("Error checking user role:", error)
      toast({
        title: "Error",
        description: "Failed to verify user permissions. Please try again.",
        variant: "destructive",
      })
      router.push("/")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveChanges = async () => {
    try {
      // TODO: Implement save changes functionality
      toast({
        title: "Success",
        description: "Changes saved successfully.",
      })
    } catch (error) {
      console.error("Error saving changes:", error)
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Entry</h1>
          <p className="text-muted-foreground">Configure and manage data collection forms</p>
        </div>
        <Button onClick={handleSaveChanges}>Save Changes</Button>
      </div>

      <Tabs defaultValue="form" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="form">Form Builder</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Collection Form Builder</CardTitle>
              <CardDescription>Design the form that promoters will use for data collection</CardDescription>
            </CardHeader>
            <CardContent>
              <DataEntryForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Form Templates</CardTitle>
              <CardDescription>Manage reusable form templates for different types of data collection</CardDescription>
            </CardHeader>
            <CardContent>
              <DataEntryTemplates />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Form Settings</CardTitle>
              <CardDescription>Configure global settings for data collection forms</CardDescription>
            </CardHeader>
            <CardContent>
              <DataEntrySettings />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

