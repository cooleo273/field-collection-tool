"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  LineChart, 
  BarChart, 
  PieChart,
  Users, 
  FileDown, 
  Map,
  ClipboardList,
  Calendar
} from "lucide-react"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Button } from "@/components/ui/button"
import { getAdminCampaigns } from "@/lib/supabase/campaign-admins"
import { getSubmissionsByCampaignId } from "@/lib/supabase/submissions"
import { useAuth } from "@/contexts/auth-context"

export function ProjectAdminDashboard() {
  const { userProfile } = useAuth()
  const [stats, setStats] = useState({
    campaigns: 0,
    submissions: 0,
    pendingSubmissions: 0,
    locations: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userProfile) return

    async function loadStats() {
      try {
        setLoading(true)
        
        // Get campaigns assigned to this admin
        const adminCampaigns = await getAdminCampaigns(userProfile?.id || "")
        const campaignIds = adminCampaigns.map(ac => ac.campaign_id)
        
        let totalSubmissions = 0
        let pendingCount = 0
        let locationSet = new Set()
        
        // Get submissions for each campaign
        for (const campaignId of campaignIds) {
          const submissions = await getSubmissionsByCampaignId(campaignId)
          totalSubmissions += submissions.length
          
          // Count pending submissions
          const pending = submissions.filter(s => s.status === "pending").length
          pendingCount += pending
          
          // Count unique locations
          submissions.forEach(s => {
            if (s.location_id) locationSet.add(s.location_id)
          })
        }

        setStats({
          campaigns: adminCampaigns.length,
          submissions: totalSubmissions,
          pendingSubmissions: pendingCount,
          locations: locationSet.size,
        })
      } catch (error) {
        console.error("Error loading dashboard stats:", error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [userProfile])

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Project Dashboard</h1>
        <Button variant="outline" size="sm">
          <FileDown className="mr-2 h-4 w-4" />
          Download Report
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.submissions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From all your campaigns
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Submissions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingSubmissions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Campaigns</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.campaigns.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Active campaigns
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locations</CardTitle>
            <Map className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.locations.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Coverage areas
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Submission Trends</CardTitle>
                <CardDescription>
                  Submissions over the last 30 days
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <div className="text-muted-foreground flex flex-col items-center">
                  <LineChart className="h-8 w-8 mb-2" />
                  <span>Submission trend visualization</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
                <CardDescription>
                  Submissions by status
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <div className="text-muted-foreground flex flex-col items-center">
                  <PieChart className="h-8 w-8 mb-2" />
                  <span>Status distribution chart</span>
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
              <CardDescription>Submissions by campaign</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <div className="text-muted-foreground flex flex-col items-center">
                <BarChart className="h-8 w-8 mb-2" />
                <span>Campaign performance chart</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Campaigns</CardTitle>
              <CardDescription>
                Performance metrics for your assigned campaigns
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <div className="text-muted-foreground flex flex-col items-center">
                <BarChart className="h-8 w-8 mb-2" />
                <span>Campaign metrics visualization</span>
                <Button variant="outline" size="sm" className="mt-4">
                  View All Campaigns
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="submissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Submissions</CardTitle>
              <CardDescription>
                Latest data submitted across your campaigns
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <div className="text-muted-foreground flex flex-col items-center">
                <ClipboardList className="h-8 w-8 mb-2" />
                <span>Recent submissions would appear here</span>
                <Button variant="outline" size="sm" className="mt-4">
                  View All Submissions
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

