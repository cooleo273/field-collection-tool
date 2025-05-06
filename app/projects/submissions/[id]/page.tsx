"use client"

import { useState, useEffect, useCallback } // Added useCallback
from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { LoadingSpinner } from "@/components/loading-spinner"
import { ArrowLeft, Clock, MapPin, Users, FileText, CheckCircle, XCircle, AlertTriangle, Calendar, Tag, Trash, ThumbsUp, ThumbsDown, ChevronLeft, ChevronRight, Download, Filter } from "lucide-react" // Added ChevronLeft, ChevronRight, Download, Filter
import { formatDate } from "@/lib/utils"
import Image from "next/image"
import { getSupabaseClient } from "@/lib/services/client"
import { useAuth } from "@/contexts/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// Removed getParticipantsCountBySubmissionId import as we fetch count differently now
import { getSubmissionPhotos } from "@/lib/services/submission_photos.service"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useIsMobile } from "@/hooks/use-mobile"
import { getLocationForPromoter } from "@/lib/services/repositories/promoter-location-service"
import { useToast } from "@/components/ui/use-toast"

// Match the database schema
interface Submission {
    id: string
    activity_stream: string
    specific_location: string
    community_group_type: string
    participant_count: number // Expected total participants
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

// Define Participant Type
interface Participant {
    id?: string // Optional if not always needed
    name: string
    age: number | string // Allow string during input
    phone_number: string
    gender: string
}

const PARTICIPANTS_PAGE_SIZE = 5; // How many participants per page

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
    // const [submittedParticipants, setSubmittedParticipants] = useState<number>(0) // Keep track of count separately
    const [submittedParticipantsList, setSubmittedParticipantsList] = useState<Participant[]>([])
    const [showAddParticipantModal, setShowAddParticipantModal] = useState(false) // Kept for mobile

    // --- Pagination State ---
    const [participantsCurrentPage, setParticipantsCurrentPage] = useState(1);
    const [totalParticipantsCount, setTotalParticipantsCount] = useState(0); // Actual total count from DB
    const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);
    // --- End Pagination State ---

    // State for rejection dialog
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
    const [rejectionNote, setRejectionNote] = useState("")

    const handleUpdateStatus = async (newStatus: "approved" | "rejected", note?: string) => {
        if (!submission || !userProfile) return; // Guard clause

        setLoading(true); // Indicate loading state
        try {
            const updateData: Partial<Submission> = {
                status: newStatus,
                reviewed_by: userProfile.id, // Assuming userProfile has an 'id' field
                reviewed_at: new Date().toISOString(),
                review_notes: newStatus === "rejected" ? note : null, // Add note only if rejecting
            };

            const { error } = await supabase
                .from("submissions")
                .update(updateData)
                .eq("id", submission.id);

            if (error) {
                console.error(`Error ${newStatus === 'approved' ? 'approving' : 'rejecting'} submission:`, error);
                toast({
                    title: `Failed to ${newStatus === 'approved' ? 'Approve' : 'Reject'}`,
                    description: error.message || "An error occurred while updating the status.",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: `Submission ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
                    description: `The submission has been successfully ${newStatus}.`,
                    variant: "default", // Use default for success
                });
                // Reload submission data to reflect changes
                await loadSubmission(submission.id);
                setIsRejectDialogOpen(false); // Close dialog if open
                setRejectionNote(""); // Clear rejection note
            }
        } catch (error: any) {
            console.error("Error updating submission status:", error);
            toast({
                title: "Update Error",
                description: error?.message || "An unexpected error occurred.",
                variant: "destructive",
            });
        } finally {
            setLoading(false); // Stop loading indicator
        }
    };


    const isMobile = useIsMobile();

    // --- Modified fetchParticipants with Pagination ---
    const fetchParticipants = useCallback(async (submissionId: string, page: number) => {
        if (!submissionId) return;
        setIsLoadingParticipants(true); // Start loading indicator for participants

        const getPaginationRange = (page: number, pageSize: number) => {
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;
            return { from, to };
        };

        try {
            const { from, to } = getPaginationRange(page, PARTICIPANTS_PAGE_SIZE);

            // Fetch participants for the current page AND the total count
            const { data, error, count } = await supabase
                .from("participants")
                .select("name, age, phone_number, gender", { count: 'exact' }) // Get exact count
                .eq("submission_id", submissionId)
                .order('created_at', { ascending: true }) // Optional: order consistently
                .range(from, to);

            if (error) {
                console.error("Error fetching participants:", error);
                toast({
                  title: "Error Fetching Participants",
                  description: error.message || "Could not load participant details.",
                  variant: "destructive",
                });
                setSubmittedParticipantsList([]); // Clear list on error
                setTotalParticipantsCount(0); // Reset count on error
                return;
            }

            setSubmittedParticipantsList(data || []);
            setTotalParticipantsCount(count ?? 0); // Update total count

        } catch (error: any) {
            console.error("Error loading participants:", error);
             toast({
                title: "Error Loading Participants",
                description: error?.message || "An unexpected error occurred.",
                variant: "destructive",
            });
        } finally {
            setIsLoadingParticipants(false); // Stop loading indicator
        }
    }, [supabase, toast]); // Dependencies for useCallback
    // --- End Modified fetchParticipants ---

    useEffect(() => {
        if (!userProfile && !loading) {
            router.push("/login")
            return
        }

        const submissionId = params.id as string
        if (submissionId && userProfile) {
            loadSubmission(submissionId)
            // Fetch initial participants data (page 1)
            fetchParticipants(submissionId, 1)
            setParticipantsCurrentPage(1) // Ensure page is reset on load
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.id, router, userProfile, loading, fetchParticipants]) // Added fetchParticipants dependency

    const loadSubmission = async (id: string) => {
        // setLoading(true); // Already handled by main loading state
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
                toast({ // Added toast for fetch error
                    title: "Error Fetching Submission",
                    description: error.message || "Could not load submission details.",
                    variant: "destructive",
                })
                setSubmission(null) // Set submission to null on error
                return
            }

            setSubmission(data)
        } catch (error: any) { // Catch block typed
            console.error("Error loading submission:", error)
            toast({
                title: "Error Loading Submission",
                description: error?.message || "An unexpected error occurred.",
                variant: "destructive",
            })
            setSubmission(null) // Ensure submission is null on catch
        } finally {
            setLoading(false)
        }
    }

    // Removed fetchParticipantCount - count is now fetched within fetchParticipants

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
                        } else {
                           setPhotos([]) // Ensure photos are cleared if none found
                        }
                    }
                } catch (err) {
                    console.error("Error processing photos:", err)
                    setPhotos([]) // Clear photos on error
                }
            }

            fetchPhotos()
        } else {
            setPhotos([]) // Clear photos if submission ID is not available
        }
    }, [submission, supabase])

    // Fetch the location dynamically using the promoter-location-service
    useEffect(() => {
        const fetchLocation = async () => {
            if (submission?.submitted_by && !submission.locations) { // Fetch only if location is not already set
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
    }, [submission?.submitted_by, submission?.locations]); // Rerun if submitted_by changes or locations is initially null

    // --- Modified handleParticipantSubmit ---
    const handleParticipantSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!submission?.id) return;

        if (!participantName.trim() || !participantAge.trim() || !participantPhoneNumber.trim() || !participantGender.trim()) {
            toast({
                title: "Missing information",
                description: "All fields are required to add a participant.",
                variant: "destructive"
            })
            return
        }

        // Check if maximum participants reached based on ACTUAL count
        if (totalParticipantsCount >= (submission?.participant_count || Infinity)) {
           toast({
                title: "Limit Reached",
                description: `Cannot add more participants. The limit of ${submission.participant_count} has been reached.`,
                variant: "destructive"
            });
            return;
        }


        setIsLoadingParticipants(true); // Indicate loading while adding
        try {
            const ageNumber = parseInt(participantAge, 10);
            if (isNaN(ageNumber)) {
                toast({ title: "Invalid Age", description: "Please enter a valid number for age.", variant: "destructive"});
                return;
            }

            const { data, error } = await supabase
                .from("participants")
                .insert({
                    submission_id: submission.id,
                    name: participantName,
                    age: ageNumber,
                    phone_number: participantPhoneNumber,
                    gender: participantGender,
                    created_at: new Date().toISOString(),
                })
                .select() // Select the inserted row if needed, useful for getting the ID

            if (error) {
                console.error("Error adding participant:", error)
                toast({
                    title: "Error adding participant",
                    description: error.message || "There was a problem adding the participant.",
                    variant: "destructive"
                })
                return
            }

            // --- Refresh participant list and count for the CURRENT page ---
            await fetchParticipants(submission.id, participantsCurrentPage);

            // Clear form and close modal
            setParticipantName("")
            setParticipantAge("")
            setParticipantPhoneNumber("")
            setParticipantGender("")
            setShowAddParticipantModal(false) // Close mobile modal if open

            toast({
                title: "Participant added",
                description: `${participantName} has been successfully added.`,
                variant: "default"
            })
        } catch (error: any) {
            console.error("Error adding participant:", error)
            toast({
                title: "Error adding participant",
                description: error?.message || "An unexpected error occurred. Please try again.",
                variant: "destructive"
            })
        } finally {
             setIsLoadingParticipants(false);
        }
    }
    // --- End Modified handleParticipantSubmit ---

    // --- Modified handleRemoveParticipant ---
    const handleRemoveParticipant = async (participantToRemove: Participant) => {
        if (!submission?.id) return;

        // Find the participant in the DB to delete (more robust than relying on index)
        // This assumes name, age, phone, gender combination is unique enough *for this submission*
        // A better approach would be to fetch and use the participant's actual `id`
        setIsLoadingParticipants(true);
        try {
            const { error } = await supabase
                .from("participants")
                .delete()
                .eq("submission_id", submission.id)
                // Match on multiple fields for better precision if ID isn't available
                .eq("name", participantToRemove.name)
                .eq("age", participantToRemove.age)
                .eq("phone_number", participantToRemove.phone_number)
                .eq("gender", participantToRemove.gender)
                // Limit 1 just in case of duplicates (though ideally shouldn't happen)
                // .limit(1)  // Use carefully, might hide issues

            if (error) {
                console.error("Error removing participant:", error)
                toast({
                    title: "Error removing participant",
                    description: error.message || "There was a problem removing the participant.",
                    variant: "destructive"
                })
                return
            }

             // --- Refresh participant list and count for the CURRENT page ---
             // Check if the current page might become empty after deletion
             const newTotalCount = totalParticipantsCount - 1;
             const newTotalPages = Math.ceil(newTotalCount / PARTICIPANTS_PAGE_SIZE);
             let pageToFetch = participantsCurrentPage;

             // If current page is now greater than total pages, go to the last page
             if (participantsCurrentPage > newTotalPages && newTotalPages > 0) {
                 pageToFetch = newTotalPages;
                 setParticipantsCurrentPage(newTotalPages); // Update state
             } else if (newTotalCount === 0) {
                 // Handle case where list becomes completely empty
                 pageToFetch = 1;
                 setParticipantsCurrentPage(1);
             }

             await fetchParticipants(submission.id, pageToFetch);


            toast({
                title: "Participant removed",
                description: `${participantToRemove.name} has been successfully removed.`,
                variant: "default"
            })
        } catch (error: any) {
            console.error("Error removing participant:", error)
            toast({
                title: "Error removing participant",
                description: error?.message || "An unexpected error occurred. Please try again.",
                variant: "destructive"
            })
        } finally {
            setIsLoadingParticipants(false);
        }
    }
    // --- End Modified handleRemoveParticipant ---


    // --- Pagination Handlers ---
    const handleNextPage = () => {
        if (submission?.id) {
            const nextPage = participantsCurrentPage + 1;
            setParticipantsCurrentPage(nextPage);
            fetchParticipants(submission.id, nextPage);
        }
    };

    const handlePrevPage = () => {
        if (submission?.id) {
            const prevPage = participantsCurrentPage - 1;
            setParticipantsCurrentPage(prevPage);
            fetchParticipants(submission.id, prevPage);
        }
    };

    const totalPages = Math.ceil(totalParticipantsCount / PARTICIPANTS_PAGE_SIZE);
    // --- End Pagination Handlers ---

    // Add export functions
    const handleExportParticipants = async (format: 'excel' | 'pdf') => {
        if (!submission?.id) {
            toast({ title: "Error", description: "Submission ID is missing.", variant: "destructive"});
            return;
        }

        try {
            // Fetch all participants for this submission
            const { data: allParticipants, error } = await supabase
                .from("participants")
                .select("name, age, phone_number, gender")
                .eq("submission_id", submission.id)
                .order('created_at', { ascending: true });

            if (error) {
                throw error;
            }

            if (!allParticipants || allParticipants.length === 0) {
                toast({
                    title: "No Data",
                    description: "No participants found to export.",
                    variant: "default"
                });
                return;
            }

            if (format === 'excel') {
                // Create Excel workbook
                const XLSX = await import('xlsx');
                const worksheet = XLSX.utils.json_to_sheet(allParticipants);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Participants");
                
                // Generate Excel file
                XLSX.writeFile(workbook, `participants_${submission.id}_${new Date().toISOString().split('T')[0]}.xlsx`);

                toast({
                    title: "Export Successful",
                    description: "Participants list has been exported to Excel successfully.",
                    variant: "default"
                });
            } else if (format === 'pdf') {
                // Import PDF libraries
                const { jsPDF } = await import('jspdf');
                const autoTable = (await import('jspdf-autotable')).default;

                // Create PDF document
                const doc = new jsPDF();
                
                // Add title
                doc.setFontSize(16);
                doc.text("Participants List", 14, 15);
                
                // Add submission details
                doc.setFontSize(10);
                doc.text(`Submission ID: ${submission.id}`, 14, 25);
                doc.text(`Export Date: ${new Date().toLocaleDateString()}`, 14, 30);
                
                // Add table
                autoTable(doc, {
                    startY: 35,
                    head: [['Name', 'Age', 'Phone Number', 'Gender']],
                    body: allParticipants.map(p => [p.name, p.age, p.phone_number, p.gender]),
                    theme: 'grid',
                    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
                    styles: { fontSize: 10, cellPadding: 3 },
                    columnStyles: {
                        0: { cellWidth: 60 },
                        1: { cellWidth: 20 },
                        2: { cellWidth: 40 },
                        3: { cellWidth: 30 }
                    }
                });

                // Save PDF
                doc.save(`participants_${submission.id}_${new Date().toISOString().split('T')[0]}.pdf`);

                toast({
                    title: "Export Successful",
                    description: "Participants list has been exported to PDF successfully.",
                    variant: "default"
                });
            }
        } catch (error: any) {
            console.error("Error exporting participants:", error);
            toast({
                title: "Export Failed",
                description: error?.message || "Failed to export participants list.",
                variant: "destructive"
            });
        }
    };

    if (loading && !submission) { // Show main loading only initially
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

    // Calculate if adding more participants is allowed
    const canAddMoreParticipants = totalParticipantsCount < (submission?.participant_count || 0);


    return (
        // Assuming DashboardLayout provides the overall structure
        // <DashboardLayout>
            <div className="flex flex-col space-y-6 p-4 md:p-6"> {/* Added padding */}
                {/* Add Rejection Dialog */}
                <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                    {/* ... (Dialog content remains the same) ... */}
                     <DialogContent>
                        <DialogHeader>
                        <DialogTitle>Reject Submission</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this submission. This note will be visible to the promoter.
                        </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                        <Textarea
                            placeholder="Enter rejection reason..."
                            value={rejectionNote}
                            onChange={(e) => setRejectionNote(e.target.value)}
                            rows={4}
                        />
                        </div>
                        <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={() => handleUpdateStatus("rejected", rejectionNote)}
                            disabled={!rejectionNote.trim() || loading} // Use main loading state here
                        >
                            Confirm Rejection
                        </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b">
                    {/* ... (Header section remains the same) ... */}
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
                    <div className="flex flex-wrap gap-2"> {/* Added flex-wrap */}
                        {(submission.status === "submitted" || submission.status === "rejected") && (
                        <Button
                            variant="outline"
                            onClick={() => router.push(`/projects/submissions/edit/${submission?.id}`)}
                        >
                            Edit Submission
                        </Button>
                        )}
                        {userProfile?.role === 'project-admin' && submission.status === "submitted" && (
                        <>
                            <Button
                            variant="outline"
                            className="text-green-600 hover:bg-green-50 hover:text-green-700 border-green-200"
                            onClick={() => handleUpdateStatus("approved")}
                            disabled={loading} // Use main loading
                            >
                            <ThumbsUp className="mr-2 h-4 w-4" />
                            Approve
                            </Button>
                            <Button
                            variant="outline"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                            onClick={() => setIsRejectDialogOpen(true)}
                            disabled={loading} // Use main loading
                            >
                            <ThumbsDown className="mr-2 h-4 w-4" />
                            Reject
                            </Button>
                        </>
                        )}
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <div className="md:col-span-2 space-y-6">
                        <Card className="overflow-hidden border-2 shadow-sm">
                            {/* ... (Main Submission Card Header remains the same) ... */}
                             <CardHeader className="pb-3 bg-muted/30">
                                <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="text-xl">{submission?.activity_stream}</CardTitle>
                                    <CardDescription className="mt-1 flex items-center flex-wrap"> {/* Added flex-wrap */}
                                    <Tag className="h-4 w-4 mr-1" />
                                    {submission?.community_group_type} <span className="mx-1">•</span> <MapPin className="h-4 w-4 mr-1" /> {submission?.specific_location || "Unknown specific location"}
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
                                                        // Handle potential null/undefined photo URLs gracefully
                                                        src={photo || "/placeholder.svg"}
                                                        alt={`Photo evidence ${index + 1}`}
                                                        fill
                                                        className="object-cover"
                                                        // Add error handling for images
                                                        onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
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
                             <Card className="border-red-200 bg-red-50/80 shadow-sm"> {/* Adjusted background */}
                                <CardHeader className="pb-2">
                                <CardTitle className="text-red-800 flex items-center text-base font-semibold"> {/* Adjusted text color/size */}
                                    <XCircle className="h-5 w-5 mr-2 flex-shrink-0" /> {/* Added flex-shrink-0 */}
                                    Rejection Feedback
                                </CardTitle>
                                </CardHeader>
                                <CardContent>
                                <p className="text-red-700 italic text-sm">{submission?.review_notes}</p> {/* Adjusted text size */}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <div className="space-y-6">
                        {/* ... (Submission Status Card remains the same) ... */}
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
                                <p className="text-sm text-muted-foreground px-2"> {/* Added padding */}
                                {submission.status === "approved" && "This submission has been reviewed and approved."}
                                {submission.status === "rejected" && "This submission has been reviewed and rejected."}
                                {submission.status === "submitted" && "This submission is currently awaiting review."}
                                {submission.status === "draft" && "This submission is saved as a draft and not yet submitted."}
                                </p>

                                {submission.reviewed_by && (
                                <div className="mt-6 p-4 bg-muted/20 rounded-lg w-full text-left"> {/* Adjusted text alignment */}
                                    <p className="text-sm font-medium">Reviewed by</p>
                                    {/* You might want to fetch the reviewer's name if needed */}
                                    <p className="text-sm text-muted-foreground">Project Admin</p>
                                    {submission?.reviewed_at && (
                                    <p className="text-xs text-muted-foreground mt-1 flex items-center"> {/* Use flex */}
                                        <Calendar className="h-3 w-3 inline mr-1 flex-shrink-0" /> {/* Added flex-shrink-0 */}
                                        {formatDate(submission.reviewed_at)}
                                    </p>
                                    )}
                                </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* ... (Details Card remains the same) ... */}
                         <Card className="border-2 shadow-sm">
                            <CardHeader className="pb-3 bg-muted/30">
                                <CardTitle className="text-lg">Details</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <ul className="space-y-5">
                                <li className="flex items-start">
                                    <div className="bg-primary/10 p-2 rounded-full mr-3 flex-shrink-0"> {/* Added flex-shrink-0 */}
                                    <MapPin className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                    <p className="text-sm font-medium">Location</p>
                                    <p className="text-sm text-muted-foreground">{submission?.locations?.name || "Unknown"}, {submission?.specific_location || "Unknown"}</p>
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <div className="bg-primary/10 p-2 rounded-full mr-3 flex-shrink-0"> {/* Added flex-shrink-0 */}
                                    <Users className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                    <p className="text-sm font-medium">Participants</p>
                                      {/* Display actual count vs expected count */}
                                      <p className="text-sm text-muted-foreground">
                                          {totalParticipantsCount} / {submission?.participant_count || 'N/A'} people
                                      </p>
                                    </div>
                                </li>
                        
                                <li className="flex items-start">
                                    <div className="bg-primary/10 p-2 rounded-full mr-3 flex-shrink-0"> {/* Added flex-shrink-0 */}
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

                {/* --- Participants Section --- */}
                <div className="space-y-6">
                    <Card className="border-2 shadow-lg rounded-lg overflow-hidden">
                        <CardHeader className="pb-4 bg-muted/30">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-semibold text-primary">Participants</CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        {`${totalParticipantsCount} / ${submission?.participant_count || 0} participants added`}
                                    </p>
                                </div>
                                {/* Export Buttons */}
                                {submittedParticipantsList.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleExportParticipants('excel')}
                                            className="flex items-center gap-2"
                                        >
                                            <Download className="h-4 w-4" />
                                            Export Excel
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleExportParticipants('pdf')}
                                            className="flex items-center gap-2"
                                        >
                                            <Download className="h-4 w-4" />
                                            Export PDF
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="p-0"> {/* Remove default padding */}
                            {isLoadingParticipants && (
                                <div className="flex justify-center items-center p-6">
                                    <LoadingSpinner />
                                </div>
                            )}
                            {!isLoadingParticipants && submittedParticipantsList.length === 0 && totalParticipantsCount === 0 && !isMobile && (
                                 <p className="p-6 text-center text-muted-foreground">No participants added yet.</p>
                            )}
                             {/* --- Desktop Table View --- */}
                            {!isMobile && !isLoadingParticipants && (
                                <Table className="w-full">
                                    <TableHeader className="bg-gray-100">
                                        <TableRow>
                                            <TableHead className="px-4 py-2 text-left text-sm font-medium text-gray-700">Name</TableHead>
                                            <TableHead className="px-4 py-2 text-left text-sm font-medium text-gray-700">Age</TableHead>
                                            <TableHead className="px-4 py-2 text-left text-sm font-medium text-gray-700">Phone Number</TableHead>
                                            <TableHead className="px-4 py-2 text-left text-sm font-medium text-gray-700">Gender</TableHead>
                                            <TableHead className="px-4 py-2 text-center text-sm font-medium text-gray-700">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {submittedParticipantsList.map((participant, index) => (
                                            <TableRow key={`${participant.name}-${index}`} className="hover:bg-gray-50 transition-colors"> {/* Improved key */}
                                                <TableCell className="px-4 py-2 text-sm text-gray-800">{participant.name}</TableCell>
                                                <TableCell className="px-4 py-2 text-sm text-gray-800">{participant.age}</TableCell>
                                                <TableCell className="px-4 py-2 text-sm text-gray-800">{participant.phone_number}</TableCell>
                                                <TableCell className="px-4 py-2 text-sm text-gray-800">{participant.gender}</TableCell>
                                                <TableCell className="px-4 py-2 text-sm text-gray-800 text-center">
                                                     {/* Pass the participant object to remove handler */}
                                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveParticipant(participant)}>
                                                        <Trash className="h-4 w-4 text-red-500 hover:text-red-700" /> {/* Smaller Icon */}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {/* --- Inline Add Row (Only if allowed) --- */}
                                        {canAddMoreParticipants && (
                                            <TableRow>
                                                <TableCell className="px-4 py-2">
                                                    <Input
                                                        type="text"
                                                        placeholder="Name" // Shortened placeholder
                                                        value={participantName}
                                                        onChange={(e) => setParticipantName(e.target.value)}
                                                        className="w-full border border-gray-300 rounded-md focus:ring-1 focus:ring-primary focus:outline-none text-sm h-9" // Adjusted styling
                                                    />
                                                </TableCell>
                                                <TableCell className="px-4 py-2">
                                                    <Input
                                                        type="number"
                                                        placeholder="Age" // Shortened placeholder
                                                        value={participantAge}
                                                        onChange={(e) => setParticipantAge(e.target.value)}
                                                        className="w-full border border-gray-300 rounded-md focus:ring-1 focus:ring-primary focus:outline-none text-sm h-9" // Adjusted styling
                                                    />
                                                </TableCell>
                                                <TableCell className="px-4 py-2">
                                                    <Input
                                                        type="text"
                                                        placeholder="Phone" // Shortened placeholder
                                                        value={participantPhoneNumber}
                                                        onChange={(e) => setParticipantPhoneNumber(e.target.value)}
                                                        className="w-full border border-gray-300 rounded-md focus:ring-1 focus:ring-primary focus:outline-none text-sm h-9" // Adjusted styling
                                                    />
                                                </TableCell>
                                                <TableCell className="px-4 py-2">
                                                    <Select onValueChange={setParticipantGender} value={participantGender}>
                                                        <SelectTrigger className="w-full border border-gray-300 rounded-md focus:ring-1 focus:ring-primary focus:outline-none text-sm h-9"> {/* Adjusted styling */}
                                                            <SelectValue placeholder="Gender" /> {/* Shortened placeholder */}
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="male">Male</SelectItem>
                                                            <SelectItem value="female">Female</SelectItem>
                                                            <SelectItem value="other">Other</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell className="px-4 py-2 text-center">
                                                    <Button
                                                        type="button"
                                                        size="sm" // Smaller button
                                                        variant="default"
                                                        className="bg-primary text-white hover:bg-primary/90 focus:ring-1 focus:ring-primary focus:outline-none" // Adjusted styling
                                                        onClick={handleParticipantSubmit}
                                                        disabled={isLoadingParticipants || !canAddMoreParticipants} // Disable while loading or if limit reached
                                                    >
                                                        Add
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                         {/* --- End Inline Add Row --- */}
                                    </TableBody>
                                </Table>
                            )}

                            {/* --- Mobile List View --- */}
                            {isMobile && !isLoadingParticipants && submittedParticipantsList.length > 0 && (
                                <div className="p-4 space-y-3">
                                    {submittedParticipantsList.map((participant, index) => (
                                        <div key={`${participant.name}-${index}`} className="p-3 border rounded-lg shadow-sm bg-white flex justify-between items-start"> {/* Use Flex */}
                                            <div>
                                                <p className="text-sm font-medium">{participant.name}</p>
                                                <p className="text-xs text-muted-foreground">Age: {participant.age}</p>
                                                <p className="text-xs text-muted-foreground">Phone: {participant.phone_number}</p>
                                                <p className="text-xs text-muted-foreground">Gender: {participant.gender}</p>
                                            </div>
                                             {/* Pass the participant object to remove handler */}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRemoveParticipant(participant)}
                                                className="mt-0 ml-2 h-8 w-8" // Adjust size/margin
                                            >
                                                <Trash className="h-4 w-4 text-red-500 hover:text-red-700" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                             {isMobile && !isLoadingParticipants && submittedParticipantsList.length === 0 && totalParticipantsCount === 0 && (
                                 <p className="p-6 text-center text-muted-foreground">No participants added yet.</p>
                             )}
                             {/* --- End Mobile List View --- */}

                        </CardContent>

                         {/* --- Pagination Controls --- */}
                         {(totalParticipantsCount > PARTICIPANTS_PAGE_SIZE || participantsCurrentPage > 1) && !isLoadingParticipants && (
                            <CardFooter className="flex items-center justify-between border-t bg-gray-50 py-3 px-4">
                                <span className="text-sm text-muted-foreground">
                                    Page {participantsCurrentPage} of {totalPages} ({totalParticipantsCount} total)
                                </span>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handlePrevPage}
                                        disabled={participantsCurrentPage <= 1 || isLoadingParticipants}
                                    >
                                        <ChevronLeft className="h-4 w-4 mr-1" />
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleNextPage}
                                        disabled={participantsCurrentPage >= totalPages || isLoadingParticipants}
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </div>
                            </CardFooter>
                        )}
                        {/* --- End Pagination Controls --- */}


                        {/* --- Mobile Add Button (uses Dialog) --- */}
                         {isMobile && !isLoadingParticipants && canAddMoreParticipants && (
                             <CardFooter className="bg-gray-50 py-4 flex justify-end border-t">
                                <Dialog open={showAddParticipantModal} onOpenChange={setShowAddParticipantModal}>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="default"
                                            className="bg-primary text-white hover:bg-primary/90 focus:ring-1 focus:ring-primary focus:outline-none"
                                            disabled={!canAddMoreParticipants || isLoadingParticipants}
                                        >
                                            Add Participant
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px]">
                                        <DialogHeader>
                                            <DialogTitle>Add Participant</DialogTitle>
                                            <DialogDescription>
                                                Fill in the details below. ({totalParticipantsCount}/{submission.participant_count} added)
                                            </DialogDescription>
                                        </DialogHeader>
                                        {/* IMPORTANT: The form submission is handled by handleParticipantSubmit */}
                                        <form onSubmit={handleParticipantSubmit} className="space-y-4 py-4">
                                            <Input
                                                type="text"
                                                placeholder="Enter participant name"
                                                value={participantName}
                                                onChange={(e) => setParticipantName(e.target.value)}
                                                className="w-full border border-gray-300 rounded-md focus:ring-1 focus:ring-primary focus:outline-none h-10" // Standard height
                                                required // Added basic validation
                                            />
                                            <Input
                                                type="number"
                                                placeholder="Enter participant age"
                                                value={participantAge}
                                                onChange={(e) => setParticipantAge(e.target.value)}
                                                className="w-full border border-gray-300 rounded-md focus:ring-1 focus:ring-primary focus:outline-none h-10"
                                                required
                                            />
                                            <Input
                                                type="text" // Consider type="tel"
                                                placeholder="Enter phone number"
                                                value={participantPhoneNumber}
                                                onChange={(e) => setParticipantPhoneNumber(e.target.value)}
                                                className="w-full border border-gray-300 rounded-md focus:ring-1 focus:ring-primary focus:outline-none h-10"
                                                required
                                            />
                                            <Select onValueChange={setParticipantGender} value={participantGender} required>
                                                <SelectTrigger className="w-full border border-gray-300 rounded-md focus:ring-1 focus:ring-primary focus:outline-none h-10">
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
                                                    type="submit"
                                                    variant="default"
                                                    className="w-full bg-primary text-white hover:bg-primary/90 focus:ring-1 focus:ring-primary focus:outline-none"
                                                    disabled={isLoadingParticipants || !canAddMoreParticipants}
                                                >
                                                   {isLoadingParticipants ? <LoadingSpinner className="h-4 w-4 mr-2" /> : null} Add
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                             </CardFooter>
                         )}
                         {/* Display message if participant limit is reached */}
                          {!canAddMoreParticipants && !isLoadingParticipants && (
                            <CardFooter className="bg-yellow-50 border-t border-yellow-200 py-3 px-4 text-center">
                                <p className="text-sm text-yellow-800 font-medium">
                                    Participant limit ({submission.participant_count}) reached.
                                </p>
                            </CardFooter>
                         )}
                        {/* --- End Mobile Add Button --- */}

                    </Card>
                </div>
                {/* --- End Participants Section --- */}
            </div>
        // </DashboardLayout>
    )
}