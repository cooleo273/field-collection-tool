"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/loading-spinner"
import { RefreshCw, CheckCircle, XCircle } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { getSubmissions, updateSubmissionStatus } from "@/lib/services/submissions"


export default function ProjectAdminSubmissionsPage() {
  const router = useRouter()
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSubmissions()
  }, [])

  const loadSubmissions = async () => {
    setLoading(true)
    try {
      const data = await getSubmissions()
      setSubmissions(data)
    } catch (error) {
      console.error("Error loading submissions:", error)
    } finally {
      setLoading(false)
    }
  }

  // Handler to update the status of a submission
  const handleUpdateStatus = async (submissionId: string, status: "approved" | "rejected") => {
    try {
      await updateSubmissionStatus(submissionId, status)
      await loadSubmissions()
    } catch (error) {
      console.error("Error updating status:", error)
    }
  }

  // Handler to navigate to the submission details page
  const handleViewDetails = (submissionId: string) => {
    router.push(`/submissions/${submissionId}`)
  }

  if (loading) {
    return <LoadingSpinner />
  }

  // Utility to safely render a property if it's an object
  const renderField = (field: any, fallback?: string) => {
    if (typeof field === "object" && field !== null) {
      return field.name || field.id || fallback || "N/A"
    }
    return field || fallback || "N/A"
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Submissions</h1>
          <p className="page-description">Review and manage field data submissions</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadSubmissions}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="submitted">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">Pending Review</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All Submissions</TabsTrigger>
        </TabsList>

        {/* Pending submissions */}
        <TabsContent value="submitted">
          <Card>
            <CardHeader>
              <CardTitle>Submissions Awaiting Review</CardTitle>
            </CardHeader>
            <CardContent>
              {submissions.filter((s) => s.status === "submitted").length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No pending submissions</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions
                    .filter((s) => s.status === "submitted")
                    .map((submission) => (
                      <Card key={submission.id}>
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                              <h3 className="font-medium">
                                Campaign: {renderField(submission.campaign_id, "Unknown Campaign")}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Location: {renderField(submission.location_id, "Unknown Location")} • {submission.community_group_type || "N/A"}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">
                                  {submission.participant_count} participants
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  Submitted by {renderField(submission.submitted_by, "Unknown User")} on {formatDate(submission.submitted_at)}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2 self-end md:self-center">
                              <Button variant="outline" size="sm" onClick={() => handleViewDetails(submission.id)}>
                                View Details
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600"
                                onClick={() => handleUpdateStatus(submission.id, "approved")}
                              >
                                <CheckCircle className="mr-1 h-4 w-4" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600"
                                onClick={() => handleUpdateStatus(submission.id, "rejected")}
                              >
                                <XCircle className="mr-1 h-4 w-4" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approved submissions */}
        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle>Approved Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              {submissions.filter((s) => s.status === "approved").length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No approved submissions</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions
                    .filter((s) => s.status === "approved")
                    .map((submission) => (
                      <Card key={submission.id}>
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                              <h3 className="font-medium">
                                Campaign: {renderField(submission.campaign_id, "Unknown Campaign")}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Location: {renderField(submission.location_id, "Unknown Location")} • {submission.community_group_type || "N/A"}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">
                                  {submission.participant_count} participants
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  Submitted by {renderField(submission.submitted_by, "Unknown User")} on {formatDate(submission.submitted_at)}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2 self-end md:self-center">
                              <Button variant="outline" size="sm" onClick={() => handleViewDetails(submission.id)}>
                                View Details
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rejected submissions */}
        <TabsContent value="rejected">
          <Card>
            <CardHeader>
              <CardTitle>Rejected Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              {submissions.filter((s) => s.status === "rejected").length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No rejected submissions</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions
                    .filter((s) => s.status === "rejected")
                    .map((submission) => (
                      <Card key={submission.id}>
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                              <h3 className="font-medium">
                                Campaign: {renderField(submission.campaign_id, "Unknown Campaign")}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Location: {renderField(submission.location_id, "Unknown Location")} • {submission.community_group_type || "N/A"}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">
                                  {submission.participant_count} participants
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  Submitted by {renderField(submission.submitted_by, "Unknown User")} on {formatDate(submission.submitted_at)}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2 self-end md:self-center">
                              <Button variant="outline" size="sm" onClick={() => handleViewDetails(submission.id)}>
                                View Details
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* All submissions */}
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              {submissions.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No submissions found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <Card key={submission.id}>
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <h3 className="font-medium">
                              Campaign: {renderField(submission.campaign_id, "Unknown Campaign")}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Location: {renderField(submission.location_id, "Unknown Location")} • {submission.community_group_type || "N/A"}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline">
                                {submission.participant_count} participants
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Submitted by {renderField(submission.submitted_by, "Unknown User")} on {formatDate(submission.submitted_at)}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2 self-end md:self-center">
                            <Button variant="outline" size="sm" onClick={() => handleViewDetails(submission.id)}>
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}