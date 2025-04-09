"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/loading-spinner"
import { PromoterDataEntryForm } from "@/components/data-entry/promoter-data-entry-form"
import { useToast } from "@/components/ui/use-toast"

export default function PromoterDataEntryPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Check if user is authenticated
    const userData = localStorage.getItem("user")
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)

      // Only promoters should access this page
      if (parsedUser.role !== "promoter") {
        router.push("/dashboard")
      } else {
        setLoading(false)
      }
    } else {
      router.push("/")
    }
  }, [router])

  const handleSaveDraft = () => {
    toast({
      title: "Draft saved",
      description: "Your data entry form has been saved as a draft.",
      variant: "success",
    })
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return null
  }

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Data Entry</h1>
          <p className="page-description">Enter field data for your assigned locations</p>
        </div>
        <Button onClick={handleSaveDraft}>Save as Draft</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Field Data Collection Form</CardTitle>
          <CardDescription>Enter information about your community session</CardDescription>
        </CardHeader>
        <CardContent>
          <PromoterDataEntryForm userId={user?.id} />
        </CardContent>
      </Card>
    </div>
  )
}

