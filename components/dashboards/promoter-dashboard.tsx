"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  LineChart, 
  Upload, 
  FileCheck,
  ClipboardCheck, 
  FileDown, 
  Map,
  ClipboardList
} from "lucide-react"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Button } from "@/components/ui/button"
// Update imports

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { getPromoterDashboardStats } from "@/lib/repositories/stats.repository"


export function PromoterDashboard() {
  const router = useRouter()
  const { userProfile } = useAuth()
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    submittedSubmissions: 0, // Changed from pendingSubmissions
    approvedSubmissions: 0,
    rejectedSubmissions: 0,
  })
  const [loading, setLoading] = useState(true)
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([])

  useEffect(() => {
    if (!userProfile?.id) return
    
    // Store the ID in a local variable to assure TypeScript it's not null
    const userId = userProfile.id

    async function loadStats() {
      try {
        setLoading(true)
        const { stats: dashboardStats, recentSubmissions: recent } = 
          await getPromoterDashboardStats(userId)
        
        setStats(dashboardStats)
        setRecentSubmissions(recent)
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
        <h1 className="text-2xl font-bold tracking-tight">Promoter Dashboard</h1>
        <Button onClick={() => router.push("/submissions/new")}>
          <Upload className="mr-2 h-4 w-4" />
          New Submission
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubmissions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Data forms submitted
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submitted</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.submittedSubmissions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedSubmissions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Submissions accepted
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <FileDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejectedSubmissions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Need revisions
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="submissions">My Submissions</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Submission History</CardTitle>
                <CardDescription>
                  Your submission trends over time
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <div className="text-muted-foreground flex flex-col items-center">
                  <LineChart className="h-8 w-8 mb-2" />
                  <span>Submission trends visualization</span>
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your latest submissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentSubmissions.length > 0 ? (
                  <div className="space-y-4">
                    {recentSubmissions.map((submission) => (
                      <div key={submission.id} className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(submission.status)}`} />
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {submission.title || `Submission ${submission.id.slice(0, 8)}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(submission.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex justify-center py-6">
                    <p className="text-muted-foreground">No recent submissions</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="submissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Submissions</CardTitle>
              <CardDescription>
                View and manage all your submissions
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <div className="text-muted-foreground flex flex-col items-center">
                <ClipboardList className="h-8 w-8 mb-2" />
                <span>List of all your submissions would appear here</span>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push("/submissions")}>
                  View All Submissions
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Locations</CardTitle>
              <CardDescription>
                View locations you are assigned to
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <div className="text-muted-foreground flex flex-col items-center">
                <Map className="h-8 w-8 mb-2" />
                <span>Map of your assigned locations would appear here</span>
                <Button variant="outline" size="sm" className="mt-4">
                  View Map
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper function to get the right color class based on submission status
function getStatusColor(status: string) {
  switch (status) {
    case "approved":
      return "bg-green-500"
    case "rejected":
      return "bg-red-500"
    case "pending":
      return "bg-yellow-500"
    default:
      return "bg-blue-500"
  }
}

// Helper function to format dates
function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })
}

