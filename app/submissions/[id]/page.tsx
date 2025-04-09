"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { LoadingSpinner } from "@/components/loading-spinner"
import { ArrowLeft, Clock, MapPin, Users, FileText, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { getSubmissionById } from "@/lib/mock-data/submissions"
import { formatDate } from "@/lib/utils"
import Image from "next/image"

export default function SubmissionDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const [submission, setSubmission] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is authenticated
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/")
      return
    }

    const submissionId = params.id as string
    if (submissionId) {
      loadSubmission(submissionId)
    }
  }, [params.id, router])

  const loadSubmission = async (id: string) => {
    try {
      const data = await getSubmissionById(id)
      if (!data) {
        router.push("/submissions")
        return
      }
      setSubmission(data)
    } catch (error) {
      console.error("Error loading submission:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline">Draft</Badge>
      case "submitted":
        return <Badge variant="secondary">Submitted</Badge>
      case "approved":
        return <Badge variant="success">Approved</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-8 w-8 text-green-500" />
      case "rejected":
        return <XCircle className="h-8 w-8 text-red-500" />
      case "submitted":
        return <Clock className="h-8 w-8 text-blue-500" />
      default:
        return <AlertTriangle className="h-8 w-8 text-amber-500" />
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!submission) {
    return (
      <div className="container py-6">
        <div className="text-center py-10">
          <h1 className="text-2xl font-bold mb-4">Submission Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The submission you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button onClick={() => router.push("/submissions")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Submissions
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="sm" onClick={() => router.push("/submissions")} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Submission Details</h1>
          <p className="text-muted-foreground">
            Viewing details for submission from {formatDate(submission.submittedAt)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{submission.communityGroupName}</CardTitle>
                  <CardDescription>
                    {submission.communityGroupType} • {submission.locationName}
                  </CardDescription>
                </div>
                {getStatusBadge(submission.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Key Issues/Takeaways</h3>
                <p className="text-sm">{submission.keyIssues}</p>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-2">Photo Proof</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {submission.photoProof &&
                    submission.photoProof.map((photo: string, index: number) => (
                      <div key={index} className="relative aspect-square overflow-hidden rounded-md border">
                        <Image
                          src={photo || "/placeholder.svg"}
                          alt={`Photo proof ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}

                  {(!submission.photoProof || submission.photoProof.length === 0) && (
                    <p className="text-sm text-muted-foreground col-span-full">No photos uploaded</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {submission.status === "rejected" && submission.reviewNotes && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-700">Rejection Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-700">{submission.reviewNotes}</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => router.push("/submissions/new")}>
                  Create New Submission
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Submission Status</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center">
              {getStatusIcon(submission.status)}
              <h3 className="font-medium mt-4 mb-1">
                {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
              </h3>
              <p className="text-sm text-muted-foreground">
                {submission.status === "approved" && "This submission has been approved."}
                {submission.status === "rejected" && "This submission has been rejected."}
                {submission.status === "submitted" && "This submission is awaiting review."}
                {submission.status === "draft" && "This submission is saved as a draft."}
              </p>

              {submission.reviewedBy && (
                <div className="mt-4 text-sm">
                  <p className="text-muted-foreground">Reviewed by: Project Admin</p>
                  <p className="text-muted-foreground">{submission.reviewedAt && formatDate(submission.reviewedAt)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <MapPin className="mr-2 h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">{submission.locationName}</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <Users className="mr-2 h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Participants</p>
                    <p className="text-sm text-muted-foreground">{submission.participantCount} people</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <FileText className="mr-2 h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Submission ID</p>
                    <p className="text-sm text-muted-foreground">{submission.id}</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <Clock className="mr-2 h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Submitted On</p>
                    <p className="text-sm text-muted-foreground">{formatDate(submission.submittedAt)}</p>
                  </div>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/submissions/edit/${submission.id}`)}
              >
                Edit Submission
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

