"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoadingSpinner } from "@/components/loading-spinner"
import { BarChart, PieChart, FileDown } from "lucide-react"
import { getSubmissions } from "@/lib/mock-data/submissions"
import { getLocations } from "@/lib/mock-data/locations"

export default function PromoterReportsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [selectedDateRange, setSelectedDateRange] = useState("all")
  const [selectedLocation, setSelectedLocation] = useState("all")

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
        loadData(parsedUser.id)
      }
    } else {
      router.push("/")
    }
  }, [router])

  const loadData = async (userId: string) => {
    try {
      const [submissionsData, locationsData] = await Promise.all([getSubmissions(userId), getLocations()])

      setSubmissions(submissionsData)
      setLocations(locationsData)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    // In a real app, this would generate and download a report
    alert("Report export functionality would be implemented here")
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return null
  }

  // Calculate statistics
  const totalSubmissions = submissions.length
  const approvedSubmissions = submissions.filter((s) => s.status === "approved").length
  const pendingSubmissions = submissions.filter((s) => s.status === "submitted").length
  const rejectedSubmissions = submissions.filter((s) => s.status === "rejected").length

  // Calculate total participants
  const totalParticipants = submissions.reduce((sum, s) => sum + (s.participantCount || 0), 0)

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">My Reports</h1>
          <p className="page-description">View reports on your data collection activities</p>
        </div>
        <Button onClick={handleExport}>
          <FileDown className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Date Range</CardTitle>
          </CardHeader>
          <CardContent>
            <Select defaultValue={selectedDateRange} onValueChange={setSelectedDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="last7">Last 7 Days</SelectItem>
                <SelectItem value="last30">Last 30 Days</SelectItem>
                <SelectItem value="last90">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Location</CardTitle>
          </CardHeader>
          <CardContent>
            <Select defaultValue={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubmissions}</div>
            <p className="text-xs text-muted-foreground">All your data collection submissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedSubmissions}</div>
            <p className="text-xs text-muted-foreground">Submissions approved by admins</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingSubmissions}</div>
            <p className="text-xs text-muted-foreground">Awaiting admin review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalParticipants}</div>
            <p className="text-xs text-muted-foreground">People reached in your sessions</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="summary">
        <TabsList className="mb-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Submissions by Status</CardTitle>
                <CardDescription>Status of your submitted data</CardDescription>
              </CardHeader>
              <CardContent className="h-80 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <PieChart className="h-16 w-16 text-muted-foreground mx-auto" />
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex flex-col items-center">
                      <div className="w-4 h-4 rounded-full bg-green-500 mb-1"></div>
                      <div className="font-medium">Approved</div>
                      <div>{approvedSubmissions}</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-4 h-4 rounded-full bg-blue-500 mb-1"></div>
                      <div className="font-medium">Pending</div>
                      <div>{pendingSubmissions}</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-4 h-4 rounded-full bg-red-500 mb-1"></div>
                      <div className="font-medium">Rejected</div>
                      <div>{rejectedSubmissions}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Submissions by Location</CardTitle>
                <CardDescription>Number of submissions per location</CardDescription>
              </CardHeader>
              <CardContent className="h-80 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <BarChart className="h-16 w-16 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground">
                    {submissions.length > 0
                      ? "Chart would show submissions by location"
                      : "No data available to display"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="submissions">
          <Card>
            <CardHeader>
              <CardTitle>My Submissions</CardTitle>
              <CardDescription>Detailed report on your submissions</CardDescription>
            </CardHeader>
            <CardContent>
              {submissions.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No submissions found</p>
                  <Button variant="outline" className="mt-4" onClick={() => router.push("/submissions/new")}>
                    Create your first submission
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">Detailed submissions report would be displayed here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="participants">
          <Card>
            <CardHeader>
              <CardTitle>Participants Report</CardTitle>
              <CardDescription>Detailed report on participants in your sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <p className="text-muted-foreground">
                  {totalParticipants > 0
                    ? "Detailed participants report would be displayed here"
                    : "No participant data available"}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

