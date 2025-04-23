"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/loading-spinner"
import { getUserCount } from "@/lib/services/users"
import { getCampaignCount } from "@/lib/services/campaigns"
import { getLocationCount } from "@/lib/services/locations"
import { Users, Map, ClipboardList, Calendar } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { getRecentSubmissions, getSubmissionCount } from "@/lib/services/submissions"

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    userCount: 0,
    submissionCount: 0,
    campaignCount: 0,
    locationCount: 0,
  })
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([])

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true)

        // Fetch all stats in parallel with error handling
        const userCountPromise = getUserCount().catch((err) => {
          console.error("Error fetching user count:", err)
          return 0
        })

        const submissionCountPromise = getSubmissionCount().catch((err) => {
          console.error("Error fetching submission count:", err)
          return 0
        })

        const campaignCountPromise = getCampaignCount().catch((err) => {
          console.error("Error fetching campaign count:", err)
          return 0
        })

        const locationCountPromise = getLocationCount().catch((err) => {
          console.error("Error fetching location count:", err)
          return 0
        })

        const submissionsPromise = getRecentSubmissions(5).catch((err) => {
          console.error("Error fetching recent submissions:", err)
          return []
        })

        // Wait for all promises to resolve
        const [userCount, submissionCount, campaignCount, locationCount, submissions] = await Promise.all([
          userCountPromise,
          submissionCountPromise,
          campaignCountPromise,
          locationCountPromise,
          submissionsPromise,
        ])

        setStats({
          userCount,
          submissionCount,
          campaignCount,
          locationCount,
        })

        setRecentSubmissions(submissions)
      } catch (error) {
        console.error("Error loading dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Admin Dashboard</h1>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.userCount}</div>
            <p className="text-xs text-muted-foreground">Across all roles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Submissions</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.submissionCount}</div>
            <p className="text-xs text-muted-foreground">Total data submissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Campaigns</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.campaignCount}</div>
            <p className="text-xs text-muted-foreground">Active and completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Locations</CardTitle>
            <Map className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.locationCount}</div>
            <p className="text-xs text-muted-foreground">Registered locations</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent submissions */}
      <h2 className="mt-8 mb-4 text-xl font-semibold">Recent Submissions</h2>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left text-sm font-medium">Promoter</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Campaign</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Location</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentSubmissions.length > 0 ? (
                  recentSubmissions.map((submission) => (
                    <tr key={submission.id} className="border-b">
                      <td className="px-4 py-3 text-sm">{submission.users?.name || "Unknown"}</td>
                      <td className="px-4 py-3 text-sm">{submission.campaigns?.name || "Unknown"}</td>
                      <td className="px-4 py-3 text-sm">{submission.locations?.name || "Unknown"}</td>
                      <td className="px-4 py-3 text-sm">{formatDate(submission.created_at)}</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                            submission.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : submission.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-3 text-center text-sm text-muted-foreground">
                      No recent submissions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

