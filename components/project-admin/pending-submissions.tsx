"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { updateSubmission } from "@/lib/services/submissions"

interface PendingSubmissionsProps {
  submissions: any[]
}

export function PendingSubmissions({ submissions }: PendingSubmissionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { userProfile } = useAuth()
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({})

  const handleReviewNotesChange = (id: string, value: string) => {
    setReviewNotes((prev) => ({ ...prev, [id]: value }))
  }

  const handleApprove = async (submission: any) => {
    if (!userProfile) return

    setIsSubmitting((prev) => ({ ...prev, [submission.id]: true }))

    try {
      await updateSubmission(submission.id, {
        ...submission,
        status: "approved",
        reviewedBy: userProfile.id,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes[submission.id] || "",
      })

      toast({
        title: "Submission approved",
        description: "The submission has been approved successfully.",
      })
    } catch (error) {
      console.error("Error approving submission:", error)
      toast({
        title: "Error",
        description: "Failed to approve submission. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting((prev) => ({ ...prev, [submission.id]: false }))
    }
  }

  const handleReject = async (submission: any) => {
    if (!userProfile) return

    if (!reviewNotes[submission.id]) {
      toast({
        title: "Review notes required",
        description: "Please provide review notes explaining why the submission is being rejected.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting((prev) => ({ ...prev, [submission.id]: true }))

    try {
      await updateSubmission(submission.id, {
        ...submission,
        status: "rejected",
        reviewedBy: userProfile.id,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes[submission.id],
      })

      toast({
        title: "Submission rejected",
        description: "The submission has been rejected with feedback.",
      })
    } catch (error) {
      console.error("Error rejecting submission:", error)
      toast({
        title: "Error",
        description: "Failed to reject submission. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting((prev) => ({ ...prev, [submission.id]: false }))
    }
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No pending submissions to review</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {submissions.map((submission) => (
        <Card key={submission.id}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{submission.communityGroupName}</CardTitle>
                <CardDescription>
                  {submission.locationName} • {formatDate(submission.submittedAt)}
                </CardDescription>
              </div>
              <Badge>Pending Review</Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <p className="text-muted-foreground">Group Type</p>
                <p className="font-medium">{submission.communityGroupType}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Participants</p>
                <p className="font-medium">{submission.participantCount}</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-muted-foreground text-sm">Key Issues/Takeaways</p>
              <p className="text-sm">{submission.keyIssues}</p>
            </div>

            <div>
              <p className="text-muted-foreground text-sm mb-2">Review Notes</p>
              <Textarea
                placeholder="Enter your review notes here..."
                value={reviewNotes[submission.id] || ""}
                onChange={(e) => handleReviewNotesChange(submission.id, e.target.value)}
                className="resize-none"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => router.push(`/submissions/${submission.id}`)}>
              View Details
            </Button>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={() => handleReject(submission)}
                disabled={isSubmitting[submission.id]}
              >
                Reject
              </Button>
              <Button
                variant="default"
                onClick={() => handleApprove(submission)}
                disabled={isSubmitting[submission.id]}
              >
                Approve
              </Button>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

