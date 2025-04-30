"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { LoadingSpinner } from "@/components/loading-spinner"
import { ArrowLeft, Clock, MapPin, Users, FileText, CheckCircle, XCircle, AlertTriangle, Calendar, Tag, Trash } from "lucide-react"
import { formatDate } from "@/lib/utils"
import Image from "next/image"
import { getSupabaseClient } from "@/lib/services/client"
import { useAuth } from "@/contexts/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getParticipantsCountBySubmissionId } from "@/lib/services/participants"
import { getSubmissionPhotos } from "@/lib/services/submission_photos.service"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useIsMobile } from "@/hooks/use-mobile"
import { getLocationForPromoter } from "@/lib/services/repositories/promoter-location-service"
import { useToast } from "@/components/ui/use-toast"

// Match the database schema
interface Submission {
  id: string
  activity_stream: string
  specific_location: string
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
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const { userProfile } = useAuth()
  const supabase = getSupabaseClient()
  const { toast } = useToast()

  const [participantName, setParticipantName] = useState("")
  const [participantAge, setParticipantAge] = useState("")
  const [participantPhoneNumber, setParticipantPhoneNumber] = useState("")
  const [participantGender, setParticipantGender] = useState("")
  const [submittedParticipants, setSubmittedParticipants] = useState<number>(0)
  const [submittedParticipantsList, setSubmittedParticipantsList] = useState<any[]>([])
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false)

  // Ensure `useMobile` is called unconditionally to maintain consistent hook order
  const isMobile = useIsMobile();

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
        return <Badge className="px-3 py-1 text-sm font-medium bg-orange-300" variant="secondary">Submitted</Badge>
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
        return <Clock className="h-12 w-12 text-orange-300" />
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

  useEffect(() => {
    const fetchParticipants = async () => {
      if (!submission?.id) return;

      try {
        const { data, error } = await supabase
          .from("participants")
          .select("name, age, phone_number, gender")
          .eq("submission_id", submission.id);

        if (error) {
          console.error("Error fetching participants:", error);
          return;
        }

        setSubmittedParticipantsList(data || []);
      } catch (error) {
        console.error("Error loading participants:", error);
      }
    };

    fetchParticipants();
  }, [submission?.id]);

  // Fetch the location dynamically using the promoter-location-service
  useEffect(() => {
    const fetchLocation = async () => {
      if (submission?.submitted_by) {
        const location = await getLocationForPromoter(submission.submitted_by);
        if (location) {
          setSubmission((prev) => {
            if (!prev) return prev; // Ensure prev is not null
            return {
              ...prev,
              locations: { name: location.name },
            };
          });
        }
      }
    };

    fetchLocation();
  }, [submission?.submitted_by]);

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
    console.log("handleParticipantSubmit called!"); // Add this line
    e.preventDefault()

    if (!participantName.trim() || !participantAge.trim() || !participantPhoneNumber.trim() || !participantGender.trim()) {
      toast({
        title: "Missing information",
        description: "All fields are required to add a participant.",
        variant: "destructive"
      })
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
        toast({
          title: "Error adding participant",
          description: error.message || "There was a problem adding the participant.",
          variant: "destructive"
        })
        return
      }

      const participantCount = await getParticipantsCountBySubmissionId(submission?.id || "")
      setSubmittedParticipants(participantCount)
      setSubmittedParticipantsList([...submittedParticipantsList, { name: participantName, age: participantAge, phone_number: participantPhoneNumber, gender: participantGender }])
      setParticipantName("")
      setParticipantAge("")
      setParticipantPhoneNumber("")
      setParticipantGender("")
      setShowAddParticipantModal(false)
      
      toast({
        title: "Participant added",
        description: `${participantName} has been successfully added to the submission.`,
        variant: "default"
      })
    } catch (error) {
      console.error("Error adding participant:", error)
      toast({
        title: "Error adding participant",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleRemoveParticipant = async (index: number) => {
    const participant = submittedParticipantsList[index]
    try {
      const { error } = await supabase
        .from("participants")
        .delete()
        .eq("submission_id", submission?.id)
        .eq("name", participant.name)
        .eq("age", participant.age)
        .eq("phone_number", participant.phone_number)
        .eq("gender", participant.gender)

      if (error) {
        console.error("Error removing participant:", error)
        toast({
          title: "Error removing participant",
          description: error.message || "There was a problem removing the participant.",
          variant: "destructive"
        })
        return
      }

      const updatedList = [...submittedParticipantsList]
      updatedList.splice(index, 1)
      setSubmittedParticipantsList(updatedList)
      const participantCount = await getParticipantsCountBySubmissionId(submission?.id || "")
      setSubmittedParticipants(participantCount)
      
      toast({
        title: "Participant removed",
        description: `${participant.name} has been successfully removed from the submission.`,
        variant: "default"
      })
    } catch (error) {
      console.error("Error removing participant:", error)
      toast({
        title: "Error removing participant",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      })
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
          <Button onClick={() => router.back()}>
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
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-4">
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
                onClick={() => router.push(`/projects/submissions/edit/${submission?.id}`)}
              >
                Edit Submission
              </Button>
            )}
            <Button
              variant="default"
              onClick={() => router.push("/submissions")}
            >
              Back to List
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card className="overflow-hidden border-2 shadow-sm">
              {/* Display the location and specific location of the submission */}
              <CardHeader className="pb-3 bg-muted/30">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{submission?.activity_stream}</CardTitle>
                    <CardDescription className="mt-1 flex items-center">
                      <Tag className="h-4 w-4 mr-1" />
                      {submission?.community_group_type} • <MapPin className="h-4 w-4 mx-1" /> {submission?.specific_location || "Unknown specific location"}
                    </CardDescription>
                    <p className="text-sm text-muted-foreground mt-2">
                      Location: {submission?.locations?.name || "Unknown location"}
                    </p>
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
                      <p className="text-sm text-muted-foreground">{submission?.locations?.name || "Unknown"}, {submission?.specific_location || "Unknown"}</p>
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
          <Card className="border-2 shadow-lg rounded-lg overflow-hidden">
            <CardHeader className="pb-4 bg-muted/30">
              <CardTitle className="text-lg font-semibold text-primary">Participants</CardTitle>
              <p className="text-sm text-muted-foreground">
                {`${submittedParticipants}/${submission?.participant_count || 0} participants submitted`}
              </p>
            </CardHeader>
            <CardContent>
              {isMobile ? (
                <div>
                  {submittedParticipantsList.map((participant: { name: string; age: number; phone_number: string; gender: string }, index: number) => (
                    <div key={index} className="p-4 border rounded-lg shadow-sm bg-white">
                      <p className="text-sm font-medium">Name: {participant.name}</p>
                      <p className="text-sm text-muted-foreground">Age: {participant.age}</p>
                      <p className="text-sm text-muted-foreground">Phone: {participant.phone_number}</p>
                      <p className="text-sm text-muted-foreground">Gender: {participant.gender}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveParticipant(index)}
                        className="mt-2"
                      >
                        <Trash className="h-5 w-5 text-red-500 hover:text-red-700" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <Table className="w-full border-collapse border border-gray-300 rounded-lg">
                  <TableHeader className="bg-gray-100">
                    <TableRow>
                      <TableHead className="px-4 py-2 text-left text-sm font-medium text-gray-700">Name</TableHead>
                      <TableHead className="px-4 py-2 text-left text-sm font-medium text-gray-700">Age</TableHead>
                      <TableHead className="px-4 py-2 text-left text-sm font-medium text-gray-700">Phone Number</TableHead>
                      <TableHead className="px-4 py-2 text-left text-sm font-medium text-gray-700">Gender</TableHead>
                      <TableHead className="px-4 py-2 text-left text-sm font-medium text-gray-700">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submittedParticipantsList.map((participant: { name: string; age: number; phone_number: string; gender: string }, index: number) => (
                      <TableRow key={index} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="px-4 py-2 text-sm text-gray-800">{participant.name}</TableCell>
                        <TableCell className="px-4 py-2 text-sm text-gray-800">{participant.age}</TableCell>
                        <TableCell className="px-4 py-2 text-sm text-gray-800">{participant.phone_number}</TableCell>
                        <TableCell className="px-4 py-2 text-sm text-gray-800">{participant.gender}</TableCell>
                        <TableCell className="px-4 py-2 text-sm text-gray-800">
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveParticipant(index)}>
                            <Trash className="h-5 w-5 text-red-500 hover:text-red-700" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell className="px-4 py-2">
                        <Input
                          type="text"
                          placeholder="Enter participant name"
                          value={participantName}
                          onChange={(e) => setParticipantName(e.target.value)}
                          className="w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                      </TableCell>
                      <TableCell className="px-4 py-2">
                        <Input
                          type="number"
                          placeholder="Enter participant age"
                          value={participantAge}
                          onChange={(e) => setParticipantAge(e.target.value)}
                          className="w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                      </TableCell>
                      <TableCell className="px-4 py-2">
                        <Input
                          type="text"
                          placeholder="Enter phone number"
                          value={participantPhoneNumber}
                          onChange={(e) => setParticipantPhoneNumber(e.target.value)}
                          className="w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                      </TableCell>
                      <TableCell className="px-4 py-2">
                        <Select onValueChange={setParticipantGender} value={participantGender}>
                          <SelectTrigger className="w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:outline-none">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="px-4 py-2">
                        <Button
                          type="button" // Ensure it's not type="submit" if not inside a <form>
                          variant="default"
                          className="w-full bg-primary text-white hover:bg-primary-dark focus:ring-2 focus:ring-primary focus:outline-none"
                          onClick={handleParticipantSubmit} // Verify this line
                          disabled={submittedParticipants >= (submission?.participant_count || 0)}
                        >
                          Add
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
              <CardFooter className="bg-gray-50 py-4 flex justify-end md:hidden">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="default"
                      className="bg-primary text-white hover:bg-primary-dark focus:ring-2 focus:ring-primary focus:outline-none"
                    >
                      Add Participant
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add Participant</DialogTitle>
                      <DialogDescription>
                        Fill in the details below to add a new participant.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleParticipantSubmit} className="space-y-4">
                      <Input
                        type="text"
                        placeholder="Enter participant name"
                        value={participantName}
                        onChange={(e) => setParticipantName(e.target.value)}
                        className="w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                      <Input
                        type="number"
                        placeholder="Enter participant age"
                        value={participantAge}
                        onChange={(e) => setParticipantAge(e.target.value)}
                        className="w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                      <Input
                        type="text"
                        placeholder="Enter phone number"
                        value={participantPhoneNumber}
                        onChange={(e) => setParticipantPhoneNumber(e.target.value)}
                        className="w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                      <Select onValueChange={setParticipantGender} value={participantGender}>
                        <SelectTrigger className="w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:outline-none">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <DialogFooter>
                        <Button
                          type="submit" // This should be type="submit" for the form
                          variant="default"
                          className="w-full bg-primary text-white hover:bg-primary-dark focus:ring-2 focus:ring-primary focus:outline-none"
                          // No onClick needed here if type="submit" and onSubmit is on the form
                          disabled={submittedParticipants >= (submission?.participant_count || 0)} 
                        >
                          Add
                        </Button>
                      </DialogFooter>
                    </form> {/* Ensure onSubmit is here */}
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </CardContent>
          </Card>
        </div>
      </div>
  )
}

