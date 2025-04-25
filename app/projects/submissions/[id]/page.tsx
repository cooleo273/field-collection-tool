"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { LoadingSpinner } from "@/components/loading-spinner"
import { ArrowLeft, Clock, MapPin, Users, FileText, CheckCircle, XCircle, AlertTriangle, Calendar, Tag } from "lucide-react"
import { formatDate } from "@/lib/utils"
import Image from "next/image"
import { getSupabaseClient } from "@/lib/services/client"
import { useAuth } from "@/contexts/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getParticipantsCountBySubmissionId } from "@/lib/services/participants"
import { getSubmissionPhotos } from "@/lib/services/submission_photos.service"

// Match the database schema
interface Submission {
  id: string
  activity_stream: string
  location: string
  community_group_type: string
  participant_count: number
  key_issues: string
  status: string
  submitted_by: string
  submitted_at: string
  reviewed_by: string | null
  reviewed_at: string | null
  review_notes: string | null
  sync_status: string
  created_at: string
  updated_at: string
  // Join data
  campaigns?: { name: string }
  locations?: { name: string }
  users?: { name: string, email: string }
}

export default function SubmissionDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const previousPageRef = useRef<string | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const { userProfile } = useAuth()
  const supabase = getSupabaseClient()

  const [participantName, setParticipantName] = useState("")
  const [participantAge, setParticipantAge] = useState("")
  const [participantPhoneNumber, setParticipantPhoneNumber] = useState("")
  const [participantGender, setParticipantGender] = useState("")
  const [submittedParticipants, setSubmittedParticipants] = useState<number>(0)

  useEffect(() => {
    if (document.referrer) {
      previousPageRef.current = document.referrer
    }
  }, [])

  useEffect(() => {
    if (!userProfile && !loading) {
      router.push("/login")
      return
    }

    const submissionId = params.id as string
    if (submissionId && userProfile) {
      loadSubmission(submissionId)
      fetchParticipantCount(submissionId)
    }
  }, [params.id, router, userProfile, loading])

  const loadSubmission = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("submissions")
        .select(`
          *,
          users:submitted_by(name, email)
        `)
        .eq("id", id)
        .single()

      if (error) {
        console.error("Error fetching submission:", error)
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

  const fetchParticipantCount = async (submissionId: string) => {
    try {
      const count = await getParticipantsCountBySubmissionId(submissionId)
      setSubmittedParticipants(count)
    } catch (error) {
      console.error("Error fetching participant count:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge className="px-3 py-1 text-sm font-medium" variant="outline">Draft</Badge>
      case "submitted":
        return <Badge className="px-3 py-1 text-sm font-medium" variant="secondary">Submitted</Badge>
      case "approved":
        return <Badge className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 hover:bg-green-200">Approved</Badge>
      case "rejected":
        return <Badge className="px-3 py-1 text-sm font-medium" variant="destructive">Rejected</Badge>
      default:
        return <Badge className="px-3 py-1 text-sm font-medium" variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-12 w-12 text-green-500" />
      case "rejected":
        return <XCircle className="h-12 w-12 text-red-500" />
      case "submitted":
        return <Clock className="h-12 w-12 text-blue-500" />
      default:
        return <AlertTriangle className="h-12 w-12 text-amber-500" />
    }
  }

  // Load submission photos
  const [photos, setPhotos] = useState<string[]>([])

  useEffect(() => {
    if (submission?.id) {
      const fetchPhotos = async () => {
        try {
          // Get photos from the submission_photos table
          const photoData = await getSubmissionPhotos(submission.id)

          if (photoData && photoData.length > 0) {
            // Extract the photo URLs
            setPhotos(photoData.map(item => item?.photo_url))
          } else {
            // Fallback: Try to list files from the storage bucket directly
            const { data: storageData, error: storageError } = await supabase.storage
              .from("submission-photos")
              .list(`${submission.id}`)

            if (!storageError && storageData && storageData.length > 0) {
              const photoUrls = storageData
                .filter(item => !item.id.endsWith('/')) // Filter out folders
                .map(item => {
                  const { data: { publicUrl } } = supabase.storage
                    .from("submission-photos")
                    .getPublicUrl(`${submission?.id}/${item?.name}`)
                  return publicUrl
                })
              setPhotos(photoUrls)
            }
          }
        } catch (err) {
          console.error("Error processing photos:", err)
        }
      }

      fetchPhotos()
    }
  }, [submission, supabase])

  const handleAddParticipant = async () => {
    try {
      const { data, error } = await supabase
        .from("participants")
        .insert({
          submission_id: submission?.id,
          created_at: new Date().toISOString(),
        })

      if (error) {
        console.error("Error adding participant:", error)
        return
      }

      // Optionally, refresh the submission or participants list here
    } catch (error) {
      console.error("Error adding participant:", error)
    }
  }

  const handleParticipantSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!participantName.trim() || !participantAge.trim() || !participantPhoneNumber.trim() || !participantGender.trim()) {
      alert("All fields are required.")
      return
    }

    try {
      const { data, error } = await supabase
        .from("participants")
        .insert({
          submission_id: submission?.id,
          name: participantName,
          age: parseInt(participantAge, 10),
          phone_number: participantPhoneNumber,
          gender: participantGender,
          created_at: new Date().toISOString(),
        })

      if (error) {
        console.error("Error adding participant:", error)
        return
      }

      const participantCount = await getParticipantsCountBySubmissionId(submission?.id || "")
      setSubmittedParticipants(participantCount)
      setParticipantName("")
      setParticipantAge("")
      setParticipantPhoneNumber("")
      setParticipantGender("")
    } catch (error) {
      console.error("Error adding participant:", error)
    }
  }

  const handleBackClick = () => {
    if (previousPageRef.current) {
      router.push(previousPageRef.current)
    } else {
      router.push("/das") // Default fallback
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!submission) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="rounded-full bg-muted p-6 mb-4">
          <FileText className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Submission Not Found</h1>
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          The submission you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Button onClick={handleBackClick} variant="default">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Submissions
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={handleBackClick} className="mr-4">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Submission Details</h1>
            <p className="text-muted-foreground">
              Submitted on {formatDate(submission?.submitted_at || submission?.created_at)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {submission.status !== "approved" && (
            <Button
              variant="outline"
              onClick={() => router.push(`/submissions/edit/${submission?.id}`)}
            >
              Edit Submission
            </Button>
          )}
          <Button
            variant="default"
            onClick={handleBackClick}
          >
            Back to List
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card className="overflow-hidden border-2 shadow-sm">
            <CardHeader className="pb-3 bg-muted/30">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{submission?.activity_stream}</CardTitle>
                  <CardDescription className="mt-1 flex items-center">
                    <Tag className="h-4 w-4 mr-1" />
                    {submission?.community_group_type} • <MapPin className="h-4 w-4 mx-1" /> {submission?.location || "Unknown location"}
                  </CardDescription>
                </div>
                {getStatusBadge(submission?.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div>
                <h3 className="font-semibold text-lg mb-3">Key Issues/Takeaways</h3>
                <div className="bg-muted/20 p-4 rounded-lg">
                  <p className="text-sm leading-relaxed">{submission?.key_issues || "No key issues recorded"}</p>
                </div>
              </div>

              <Separator className="my-6" />

              <div>
                <h3 className="font-semibold text-lg mb-3">Photo Evidence</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {photos.length > 0 &&
                    photos.map((photo: string, index: number) => (
                      <div key={index} className="relative aspect-square overflow-hidden rounded-lg border shadow-sm hover:shadow-md transition-shadow duration-200">
                        <Image
                          src={photo || "/placeholder.svg"}
                          alt={`Photo evidence ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}

                  {photos.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center p-8 bg-muted/20 rounded-lg border border-dashed">
                      <Image
                        src="/placeholder.svg"
                        alt="No photos"
                        width={80}
                        height={80}
                        className="opacity-50 mb-3"
                      />
                      <p className="text-sm text-muted-foreground">No photos uploaded for this submission</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {submission.status === "rejected" && submission.review_notes && (
            <Card className="border-red-200 bg-red-50 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-red-700 flex items-center">
                  <XCircle className="h-5 w-5 mr-2" />
                  Rejection Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-700 italic">{submission?.review_notes}</p>
              </CardContent>
              <CardFooter className="border-t border-red-200 pt-4">
                <Button variant="outline" className="w-full" onClick={() => router.push("/submissions/new")}>
                  Create New Submission
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-2 shadow-sm">
            <CardHeader className="pb-3 bg-muted/30">
              <CardTitle className="text-lg">Submission Status</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center pt-6">
              <div className="rounded-full bg-muted/30 p-4 mb-4">
                {getStatusIcon(submission.status)}
              </div>
              <h3 className="font-medium text-lg mb-2">
                {submission?.status.charAt(0).toUpperCase() + submission?.status.slice(1)}
              </h3>
              <p className="text-sm text-muted-foreground">
                {submission.status === "approved" && "This submission has been reviewed and approved."}
                {submission.status === "rejected" && "This submission has been reviewed and rejected."}
                {submission.status === "submitted" && "This submission is currently awaiting review."}
                {submission.status === "draft" && "This submission is saved as a draft and not yet submitted."}
              </p>

              {submission.reviewed_by && (
                <div className="mt-6 p-4 bg-muted/20 rounded-lg w-full">
                  <p className="text-sm font-medium">Reviewed by</p>
                  <p className="text-sm text-muted-foreground">Project Admin</p>
                  {submission?.reviewed_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {formatDate(submission.reviewed_at)}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 shadow-sm">
            <CardHeader className="pb-3 bg-muted/30">
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-5">
                <li className="flex items-start">
                  <div className="bg-primary/10 p-2 rounded-full mr-3">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">{submission?.locations?.name || "Unknown"}</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-primary/10 p-2 rounded-full mr-3">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Participants</p>
                    <p className="text-sm text-muted-foreground">{submission?.participant_count} people</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-primary/10 p-2 rounded-full mr-3">
                    <Tag className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Campaign</p>
                    <p className="text-sm text-muted-foreground">{submission?.campaigns?.name || "Unknown"}</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-primary/10 p-2 rounded-full mr-3">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Submission ID</p>
                    <p className="text-sm text-muted-foreground font-mono">{submission.id}</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-primary/10 p-2 rounded-full mr-3">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Submitted On</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(submission?.submitted_at || submission?.created_at)}
                    </p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="space-y-6">
        <Card className="border-2 shadow-sm">
          <CardHeader className="pb-3 bg-muted/30">
            <CardTitle className="text-lg">Add Participants</CardTitle>
          </CardHeader>
          <CardContent>
            {submittedParticipants < submission.participant_count ? (
              <form onSubmit={handleParticipantSubmit} className="space-y-4">
                <Input
                  type="text"
                  placeholder="Enter participant name"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  className="w-full"
                />
                <Input
                  type="number"
                  placeholder="Enter participant age"
                  value={participantAge}
                  onChange={(e) => setParticipantAge(e.target.value)}
                  className="w-full"
                />
                <Input
                  type="text"
                  placeholder="Enter phone number"
                  value={participantPhoneNumber}
                  onChange={(e) => setParticipantPhoneNumber(e.target.value)}
                  className="w-full"
                />
                <Select onValueChange={setParticipantGender} value={participantGender}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" variant="default" className="w-full">
                  Add Participant
                </Button>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground">
                All participants have been added.
              </p>
            )}
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">
              {submittedParticipants}/{submission?.participant_count} participants added.
            </p>
          </CardFooter>
        </Card>
      </div>
      <div className="flex justify-end">
        <Button
          onClick={() => router.push(`/submissions/${submission?.id}/participants`)}
          variant="default"
        >
          View Participants
        </Button>
      </div>
    </div>
  )
}
