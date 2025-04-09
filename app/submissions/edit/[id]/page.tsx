"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/loading-spinner"
import { ArrowLeft } from "lucide-react"
import { getSubmissionById, updateSubmission } from "@/lib/mock-data/submissions"
import { EditSubmissionForm } from "@/components/submissions/edit-submission-form"
import { useToast } from "@/components/ui/use-toast"

export default function EditSubmissionPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [submission, setSubmission] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Check if user is authenticated
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/")
      return
    }

    setUser(JSON.parse(userData))

    const submissionId = params.id as string
    if (submissionId) {
      loadSubmission(submissionId)
    }
  }, [params.id, router])

  const loadSubmission = async (id: string) => {
    try {
      const data = await getSubmissionById(id)
      if (!data) {
        toast({
          title: "Submission not found",
          description: "The submission you're trying to edit doesn't exist.",
          variant: "destructive",
        })
        router.push("/submissions")
        return
      }

      // Check if user is allowed to edit this submission
      const userData = JSON.parse(localStorage.getItem("user") || "{}")
      if (data.submittedBy !== userData.id && userData.role !== "admin") {
        toast({
          title: "Access denied",
          description: "You don't have permission to edit this submission.",
          variant: "destructive",
        })
        router.push("/submissions")
        return
      }

      // Check if submission is editable (not approved or rejected)
      if (data.status === "approved" || data.status === "rejected") {
        toast({
          title: "Cannot edit",
          description: `This submission has already been ${data.status} and cannot be edited.`,
          variant: "destructive",
        })
        router.push(`/submissions/${id}`)
        return
      }

      setSubmission(data)
    } catch (error) {
      console.error("Error loading submission:", error)
      toast({
        title: "Error",
        description: "Failed to load submission. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (updatedData: any) => {
    try {
      await updateSubmission(submission.id, {
        ...updatedData,
        updatedAt: new Date(),
      })

      toast({
        title: "Submission updated",
        description: "Your submission has been updated successfully.",
        variant: "success",
      })

      router.push(`/submissions/${submission.id}`)
    } catch (error) {
      console.error("Error updating submission:", error)
      toast({
        title: "Error",
        description: "Failed to update submission. Please try again.",
        variant: "destructive",
      })
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
            The submission you're trying to edit doesn't exist or you don't have permission to edit it.
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
        <Button variant="outline" size="sm" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Submission</h1>
          <p className="text-muted-foreground">Update your submission details</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Submission Form</CardTitle>
        </CardHeader>
        <CardContent>
          <EditSubmissionForm submission={submission} onUpdate={handleUpdate} userId={user?.id} />
        </CardContent>
      </Card>
    </div>
  )
}

