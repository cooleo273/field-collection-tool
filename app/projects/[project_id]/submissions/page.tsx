"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/loading-spinner"
// Import necessary icons
import { RefreshCw, CheckCircle, XCircle, Inbox, FileText, CalendarDays, User } from "lucide-react" 
import { formatDate } from "@/lib/utils"
import { getSubmissions, updateSubmissionStatus } from "@/lib/services/submissions"
import { getProjectSubmissions, getProjectDetails, getUserDetails } from "@/lib/services/admin-stats"

// Helper function to get the appropriate status badge - Adjusted styles
const getStatusBadge = (status: string) => {
  switch (status) {
    case "submitted":
      // Use a lighter orange background with darker text for better consistency
      return <Badge variant="secondary" className="bg-orange-100 text-orange-400 border border-orange-300 hover:bg-orange-200">Submitted</Badge>; 
    case "approved":
      // Added a subtle border
      return <Badge variant="secondary" className="bg-green-100 text-green-800 border border-green-200">Approved</Badge>; 
    case "rejected":
      // Use default destructive variant which often has good contrast
      return <Badge variant="destructive">Rejected</Badge>; 
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function ProjectAdminSubmissionsPage() {
  const params = useParams();
  const project_id = params.project_id as string; // Directly access and type project_id

  const router = useRouter()
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSubmissions()
  }, []) // Keep dependency array empty if it should only run once on mount

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const data = await getProjectSubmissions(project_id);
      const enrichedData = await Promise.all(
        data.map(async (submission) => {
          const projectDetails = await getProjectDetails(submission.project_id); // Fetch project details
          const userDetails = await getUserDetails(submission.submitted_by); // Fetch user details
          return {
            ...submission,
            project_name: projectDetails.name,
            submitted_by_name: userDetails.name,
          };
        })
      );
      setSubmissions(enrichedData);
    } catch (error) {
      console.error("Error loading submissions:", error);
    } finally {
      setLoading(false);
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
    router.push(`/projects/submissions/${submissionId}`)
  }

  const handlePromoterClick = (promoterId: string) => {
    router.push(`/projects/${project_id}/promoters/${promoterId}`);
  };

  if (loading) {
    // Centered loading spinner
    return (
      <div className="flex items-center justify-center h-64"> 
        <LoadingSpinner />
      </div>
    );
  }

  // Utility to safely render a property if it's an object
  const renderField = (field: any, fallback?: string) => {
    if (typeof field === "object" && field !== null) {
      return field.name || field.id || fallback || "N/A"
    }
    return field || fallback || "N/A"
  }

  // Helper function for rendering empty state - Moved outside the return statement
  const renderEmptyState = (message: string) => (
    <div className="text-center py-10 text-muted-foreground flex flex-col items-center gap-2">
      <Inbox className="h-8 w-8 opacity-50" /> {/* Added Icon */}
      <p>{message}</p> {/* Correctly accesses the message parameter */}
    </div>
  );

  return (
    // Added padding to the main container
    <div className="p-4 md:p-6 space-y-6"> 
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Submissions</h1> 
          <p className="text-muted-foreground">Review and manage field data submissions</p>
        </div>
        {/* Grouped buttons */}
        <div className="flex gap-2"> 
          <Button variant="outline" size="sm" onClick={() => router.push(`/projects/submissions/new`)}>
            New Submission
          </Button>
          <Button variant="outline" size="sm" onClick={loadSubmissions}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="submitted">
        <TabsList className="mb-4 grid w-full grid-cols-2 sm:grid-cols-4"> {/* Improved responsiveness */}
          <TabsTrigger value="submitted">Pending Review</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All Submissions</TabsTrigger>
        </TabsList>

        {/* Helper function for rendering empty state - Definition removed from here */}
        {/* const renderEmptyState = (message: string) => ( ... ); */}

        {/* Pending submissions */}
        <TabsContent value="submitted">
          <Card>
            <CardHeader>
              <CardTitle>Submissions Awaiting Review</CardTitle>
            </CardHeader>
            <CardContent>
              {submissions.filter((s) => s.status === "submitted").length === 0 ? (
                renderEmptyState("No pending submissions") // Now correctly calls the function
              ) : (
                <div className="space-y-4">
                  {submissions
                    .filter((s) => s.status === "submitted")
                    .map((submission) => (
                      // Added border and hover effect to submission card
                      <Card key={submission.id} className="border hover:shadow-sm transition-shadow duration-200"> 
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div className="flex-grow space-y-2"> {/* Added space-y for vertical spacing */}
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-base"> {/* Slightly larger font */}
                                  {submission.project_name || "Unknown Project"}
                                </h3>
                                {getStatusBadge(submission.status)}
                              </div>
                              <p className="text-sm text-muted-foreground flex items-center gap-1.5"> {/* Added flex for icon alignment */}
                                <FileText className="h-4 w-4" /> {/* Icon */}
                                Location: {renderField(submission.location, "Unknown Location")} • {submission.community_group_type || "N/A"}
                              </p>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground"> {/* Use flex-wrap */}
                                <Badge variant="outline" className="flex items-center gap-1"> {/* Icon in badge */}
                                  <User className="h-3 w-3" />
                                  {submission.participant_count} participants
                                </Badge>
                                <span className="flex items-center gap-1"> {/* Icon for submitter */}
                                  <User className="h-3 w-3" />
                                  Submitted by 
                                  <a
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); handlePromoterClick(submission.submitted_by); }}
                                    className="text-primary hover:underline flex font-medium items-center justify-center" // Use primary color
                                  >
                                    {submission.submitted_by_name}
                                  </a>
                                </span>
                                <span className="flex items-center gap-1"> {/* Icon for date */}
                                  <CalendarDays className="h-3 w-3" />
                                  {formatDate(submission.submitted_at)}
                                </span>
                              </div>
                            </div>
                            {/* Adjusted button spacing and alignment */}
                            <div className="flex gap-2 self-start md:self-center flex-shrink-0"> 
                              <Button variant="outline" size="sm" onClick={() => handleViewDetails(submission.id)}>
                                Details
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:bg-green-50 hover:text-green-700 border-green-200" // Added hover and border
                                onClick={() => handleUpdateStatus(submission.id, "approved")}
                              >
                                <CheckCircle className="mr-1 h-4 w-4" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200" // Added hover and border
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

        {/* Approved submissions - Apply similar styling */}
        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle>Approved Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              {submissions.filter((s) => s.status === "approved").length === 0 ? (
                renderEmptyState("No approved submissions") // Now correctly calls the function
              ) : (
                <div className="space-y-4">
                  {submissions
                    .filter((s) => s.status === "approved")
                    .map((submission) => (
                      // Added border and hover effect
                      <Card key={submission.id} className="border hover:shadow-sm transition-shadow duration-200"> 
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div className="flex-grow space-y-2"> {/* Added space-y */}
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-base">
                                  {submission.project_name || "Unknown Project"}
                                </h3>
                                {getStatusBadge(submission.status)}
                              </div>
                              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                <FileText className="h-4 w-4" />
                                Location: {renderField(submission.location, "Unknown Location")} • {submission.community_group_type || "N/A"}
                              </p>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {submission.participant_count} participants
                                </Badge>
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  Submitted by 
                                  <a
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); handlePromoterClick(submission.submitted_by); }}
                                    className="text-primary hover:underline flex font-medium items-center justify-center"
                                  >
                                    {submission.submitted_by_name}
                                  </a>
                                </span>
                                <span className="flex items-center gap-1">
                                  <CalendarDays className="h-3 w-3" />
                                  {formatDate(submission.submitted_at)}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2 self-start md:self-center flex-shrink-0">
                              <Button variant="outline" size="sm" onClick={() => handleViewDetails(submission.id)}>
                                Details
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

        {/* Rejected submissions - Apply similar styling */}
        <TabsContent value="rejected">
          <Card>
            <CardHeader>
              <CardTitle>Rejected Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              {submissions.filter((s) => s.status === "rejected").length === 0 ? (
                renderEmptyState("No rejected submissions") // Now correctly calls the function
              ) : (
                <div className="space-y-4">
                  {submissions
                    .filter((s) => s.status === "rejected")
                    .map((submission) => (
                      // Added border and hover effect
                      <Card key={submission.id} className="border hover:shadow-sm transition-shadow duration-200"> 
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div className="flex-grow space-y-2"> {/* Added space-y */}
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-base">
                                  {submission.project_name || "Unknown Project"}
                                </h3>
                                {getStatusBadge(submission.status)}
                              </div>
                              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                <FileText className="h-4 w-4" />
                                Location: {renderField(submission.location, "Unknown Location")} • {submission.community_group_type || "N/A"}
                              </p>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {submission.participant_count} participants
                                </Badge>
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  Submitted by 
                                  <a
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); handlePromoterClick(submission.submitted_by); }}
                                    className="text-primary hover:underline flex font-medium items-center justify-center"
                                  >
                                    {submission.submitted_by_name}
                                  </a>
                                </span>
                                <span className="flex items-center gap-1">
                                  <CalendarDays className="h-3 w-3" />
                                  {formatDate(submission.submitted_at)}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2 self-start md:self-center flex-shrink-0">
                              <Button variant="outline" size="sm" onClick={() => handleViewDetails(submission.id)}>
                                Details
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

        {/* All submissions - Apply similar styling */}
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              {submissions.length === 0 ? (
                renderEmptyState("No submissions found") // Now correctly calls the function
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    // Added border and hover effect
                    <Card key={submission.id} className="border hover:shadow-sm transition-shadow duration-200"> 
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          <div className="flex-grow space-y-2"> {/* Added space-y */}
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-base">
                                {submission.project_name || "Unknown Project"}
                              </h3>
                              {getStatusBadge(submission.status)}
                            </div>
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                              <FileText className="h-4 w-4" />
                              Location: {renderField(submission.location, "Unknown Location")} • {submission.community_group_type || "N/A"}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              <Badge variant="outline" className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {submission.participant_count} participants
                              </Badge>
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                Submitted by 
                                <a
                                  href="#"
                                  onClick={(e) => { e.preventDefault(); handlePromoterClick(submission.submitted_by); }}
                                  className="text-primary hover:underline flex font-medium items-center justify-center"
                                >
                                  {submission.submitted_by_name}
                                </a>
                              </span>
                              <span className="flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" />
                                {formatDate(submission.submitted_at)}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2 self-start md:self-center flex-shrink-0">
                            <Button variant="outline" size="sm" onClick={() => handleViewDetails(submission.id)}>
                              Details
                            </Button>
                            {/* Conditionally show Approve/Reject for pending in 'All' tab */}
                            {submission.status === 'submitted' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:bg-green-50 hover:text-green-700 border-green-200"
                                  onClick={() => handleUpdateStatus(submission.id, "approved")}
                                >
                                  <CheckCircle className="mr-1 h-4 w-4" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                                  onClick={() => handleUpdateStatus(submission.id, "rejected")}
                                >
                                  <XCircle className="mr-1 h-4 w-4" />
                                  Reject
                                </Button>
                              </>
                            )}
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