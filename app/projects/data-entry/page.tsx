"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadingSpinner } from "@/components/loading-spinner"
import { DataEntryForm } from "@/components/data-entry/data-entry-form"
import { DataEntryTemplates } from "@/components/data-entry/data-entry-templates"
import { useToast } from "@/components/ui/use-toast"
import { PlusCircle } from "lucide-react"
import { getCampaigns } from "@/lib/supabase/campaigns"
import { Campaign } from "@/lib/supabase/campaigns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ProjectAdminDataEntryPage() {
  const [selectedCampaign, setSelectedCampaign] = useState<string>("")
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    loadCampaigns()
  }, [])

  const loadCampaigns = async () => {
    try {
      setLoading(true)
      const data = await getCampaigns()
      setCampaigns(data)
      if (data.length > 0) {
        setSelectedCampaign(data[0].id)
      }
    } catch (error) {
      console.error("Error loading campaigns:", error)
      toast({
        title: "Error",
        description: "Failed to load campaigns. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveChanges = async () => {
    try {
      setLoading(true)
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
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Entry Forms</h1>
          <p className="text-muted-foreground">
            Configure data collection forms for your campaigns
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select campaign" />
            </SelectTrigger>
            <SelectContent>
              {campaigns.map((campaign) => (
                <SelectItem key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleSaveChanges} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="form" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="form">Form Builder</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="form">
          <Card>
            <CardHeader>
              <CardTitle>Data Collection Form Builder</CardTitle>
              <CardDescription>
                Design the form that promoters will use for data collection
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedCampaign ? (
                <DataEntryForm campaignId={selectedCampaign} />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <PlusCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No Campaign Selected</h3>
                  <p className="text-sm text-muted-foreground">
                    Please select a campaign to start building your form
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Form Templates</CardTitle>
              <CardDescription>
                Manage reusable form templates for different types of data collection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataEntryTemplates />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

