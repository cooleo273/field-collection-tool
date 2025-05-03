"use client"

import { useState, useEffect, useCallback } // Added useCallback
from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { LoadingSpinner } from "@/components/loading-spinner"
// Added ChevronLeft, ChevronRight, ThumbsUp, ThumbsDown
import { ArrowLeft, Clock, MapPin, Users, FileText, CheckCircle, XCircle, AlertTriangle, Calendar, Tag, Trash, ChevronLeft, ChevronRight, ThumbsUp, ThumbsDown }
from "lucide-react"
import { formatDate } from "@/lib/utils"
import Image from "next/image"
import { getSupabaseClient } from "@/lib/services/client"
import { useAuth } from "@/contexts/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout" // Assuming this component exists

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// Removed getParticipantsCountBySubmissionId as count is fetched differently now
import { getSubmissionPhotos } from "@/lib/services/submission_photos.service"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea" // Need Textarea for rejection dialog
import { useIsMobile } from "@/hooks/use-mobile" // Assuming this hook exists
import { getLocationForPromoter } from "@/lib/services/repositories/promoter-location-service" // Assuming this service exists
import { useToast } from "@/components/ui/use-toast" // Import useToast

// Match the database schema including new fields
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
    pre_session_dfs_level: string | null // Added
    post_session_dfs_improvement: string | null // Added
    estimated_dfs_adoption_count: number | null // Added
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
    const [loading, setLoading] = useState(true) // Main loading state
    const { userProfile } = useAuth() // Assuming useAuth context provides userProfile { id, role }
    const supabase = getSupabaseClient()
    const { toast } = useToast() // Initialize toast

    const [participantName, setParticipantName] = useState("")
    const [participantAge, setParticipantAge] = useState("")
    const [participantPhoneNumber, setParticipantPhoneNumber] = useState("")
    const [participantGender, setParticipantGender] = useState("")
    // Removed submittedParticipants state
    const [submittedParticipantsList, setSubmittedParticipantsList] = useState<Participant[]>([])
    const [showAddParticipantModal, setShowAddParticipantModal] = useState(false) // For mobile dialog

    // --- Pagination State ---
    const [participantsCurrentPage, setParticipantsCurrentPage] = useState(1);
    const [totalParticipantsCount, setTotalParticipantsCount] = useState(0); // Actual total count from DB
    const [isLoadingParticipants, setIsLoadingParticipants] = useState(false); // Loading state for participants section
    // --- End Pagination State ---

     // State for rejection dialog
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
    const [rejectionNote, setRejectionNote] = useState("")

    // Ensure `useIsMobile` is called unconditionally
    const isMobile = useIsMobile();

    // --- Fetch Participants with Pagination ---
    const fetchParticipants = useCallback(async (submissionId: string, page: number) => {
        if (!submissionId) return;
        setIsLoadingParticipants(true);

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
                .order('created_at', { ascending: true }) // Consistent ordering
                .range(from, to);

            if (error) {
                console.error("Error fetching participants:", error);
                toast({
                    title: "Error Fetching Participants",
                    description: error.message || "Could not load participant details.",
                    variant: "destructive",
                });
                setSubmittedParticipantsList([]);
                setTotalParticipantsCount(0);
                return;
            }

            setSubmittedParticipantsList(data || []);
            setTotalParticipantsCount(count ?? 0); // Update total count from DB

        } catch (error: any) {
            console.error("Error loading participants:", error);
            toast({
                title: "Error Loading Participants",
                description: error?.message || "An unexpected error occurred.",
                variant: "destructive",
            });
        } finally {
            setIsLoadingParticipants(false);
        }
    }, [supabase, toast]); // Dependencies
    // --- End Fetch Participants ---


    useEffect(() => {
        if (!userProfile && !loading) {
            router.push("/login") // Redirect to login if not authenticated and not loading
            return
        }

        const submissionId = params.id as string
        if (submissionId && userProfile) {
            loadSubmission(submissionId) // Fetch submission details
            // Fetch initial participants data (page 1) after confirming submissionId
            fetchParticipants(submissionId, 1)
            setParticipantsCurrentPage(1) // Reset page on load
        } else if (!submissionId && !loading) {
             // Handle case where ID is missing but not loading
             toast({ title: "Missing ID", description: "Submission ID not found in URL.", variant: "destructive" });
             router.back(); // Or redirect to a list page
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.id, router, userProfile, loading, fetchParticipants]) // Include fetchParticipants

    const loadSubmission = async (id: string) => {
        // Keep main loading indicator active until submission is loaded
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
                 toast({ // Toast for fetch error
                    title: "Error Fetching Submission",
                    description: error.message || "Could not load submission details.",
                    variant: "destructive",
                });
                setSubmission(null); // Set submission to null on error
                // Avoid automatic redirect, let the component render the 'Not Found' state
                return
            }

            setSubmission(data)
        } catch (error: any) {
            console.error("Error loading submission:", error)
             toast({
                title: "Error Loading Submission",
                description: error?.message || "An unexpected error occurred.",
                variant: "destructive",
            });
            setSubmission(null); // Ensure submission is null on catch
        } finally {
            setLoading(false) // Stop main loading indicator *after* submission fetch attempt
        }
    }

    // Removed fetchParticipantCount function

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "draft":
                return <Badge variant="outline">Draft</Badge>
            case "submitted":
                return <Badge className="bg-orange-300 text-white hover:bg-orange-200 border border-orange-200">Submitted</Badge>
            case "approved":
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border border-green-200">Approved</Badge>
            case "rejected":
                return <Badge variant="destructive">Rejected</Badge>
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "approved":
                return <CheckCircle className="h-10 w-10 text-green-500" />
            case "rejected":
                return <XCircle className="h-10 w-10 text-red-500" />
            case "submitted":
                return <Clock className="h-10 w-10 text-orange-300" />
            default: // Draft or other
                return <FileText className="h-10 w-10 text-gray-500" />
        }
    }

    // Load submission photos
    const [photos, setPhotos] = useState<string[]>([])

    useEffect(() => {
        if (submission?.id) {
            const fetchPhotos = async () => {
                setPhotos([]); // Reset photos before fetching
                try {
                    // Prefer fetching from dedicated table first
                    const photoData = await getSubmissionPhotos(submission.id);

                    if (photoData && photoData.length > 0) {
                        setPhotos(photoData.map(item => item?.photo_url).filter(url => !!url) as string[]); // Ensure URLs are valid strings
                    } else {
                        // Fallback to storage list only if DB table is empty or service fails
                        const { data: storageData, error: storageError } = await supabase.storage
                            .from("submission-photos") // Ensure bucket name is correct
                            .list(`${submission.id}`);

                        if (storageError){
                            console.error("Error listing storage photos:", storageError);
                             // Don't necessarily show toast, let the UI handle no photos
                             return; // Exit if storage listing fails
                        }

                        if (storageData && storageData.length > 0) {
                            const photoUrls = storageData
                                .filter(item => !item.name.endsWith('/')) // Filter out potential placeholder folders
                                .map(item => {
                                    const { data: { publicUrl } } = supabase.storage
                                        .from("submission-photos")
                                        .getPublicUrl(`${submission?.id}/${item.name}`);
                                    return publicUrl;
                                });
                            setPhotos(photoUrls.filter(url => !!url) as string[]); // Ensure URLs are valid
                        }
                    }
                } catch (err) {
                    console.error("Error processing photos:", err);
                    // Do not necessarily show a toast here, empty state handles it visually
                    setPhotos([]); // Ensure photos array is empty on error
                }
            }

            fetchPhotos();
        } else {
             setPhotos([]); // Clear photos if no submission ID
        }
    }, [submission?.id, supabase]); // Depend on submission ID and supabase client


    // Fetch the location dynamically
    useEffect(() => {
        const fetchLocation = async () => {
            // Check if submission exists, has submitted_by, and locations data is missing
            if (submission?.submitted_by && !submission.locations) {
                try {
                    const location = await getLocationForPromoter(submission.submitted_by);
                    if (location) {
                        setSubmission((prev) => {
                            if (!prev) return prev; // Should not happen if submission.submitted_by exists, but good practice
                            return {
                                ...prev,
                                locations: { name: location.name },
                            };
                        });
                    } else {
                         console.warn(`No location found for promoter ID: ${submission.submitted_by}`);
                         // Optionally set a default or leave as is
                    }
                } catch (error) {
                    console.error("Error fetching promoter location:", error);
                    // Optional: Set location to a default/error state or show toast
                    // toast({ title: "Location Error", description: "Could not fetch location data.", variant: "warning" });
                }
            }
        };

        fetchLocation();
        // Rerun if submission object changes (specifically submitted_by or locations presence)
    }, [submission]);


    // --- Handle Participant Add ---
    const handleParticipantSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!submission?.id) {
             toast({ title: "Error", description: "Submission ID is missing.", variant: "destructive"});
             return;
        }

        if (!participantName.trim() || !participantAge.trim() || !participantPhoneNumber.trim() || !participantGender.trim()) {
            toast({
                title: "Missing Information",
                description: "All participant fields are required.",
                variant: "destructive"
            })
            return
        }

         // Check against actual total count
        if (totalParticipantsCount >= (submission?.participant_count || Infinity)) {
           toast({
                title: "Participant Limit Reached",
                description: `Cannot add more participants. The limit of ${submission.participant_count} has been reached.`,
                variant: "destructive" // Use warning variant
            });
            return;
        }

        setIsLoadingParticipants(true);
        try {
            const ageNumber = parseInt(participantAge, 10);
            if (isNaN(ageNumber) || ageNumber <= 0) {
                 toast({ title: "Invalid Age", description: "Please enter a valid positive number for age.", variant: "destructive"});
                 setIsLoadingParticipants(false); // Stop loading
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
                .select() // Select the newly inserted row if needed

            if (error) {
                console.error("Error adding participant:", error)
                toast({
                    title: "Error Adding Participant",
                    description: error.message || "Could not add participant.",
                    variant: "destructive"
                })
                // Let finally block handle loading state
            } else {
                // Refresh participants list for the current page *after* successful insert
                await fetchParticipants(submission.id, participantsCurrentPage);

                // Clear form and close modal
                setParticipantName("")
                setParticipantAge("")
                setParticipantPhoneNumber("")
                setParticipantGender("")
                setShowAddParticipantModal(false) // Close mobile modal

                toast({
                    title: "Participant Added",
                    description: `${participantName} was successfully added.`,
                    variant: "default"
                })
            }

        } catch (error: any) {
            console.error("Error adding participant:", error)
             toast({
                title: "Error Adding Participant",
                description: error?.message || "An unexpected error occurred.",
                variant: "destructive"
            })
        } finally {
             setIsLoadingParticipants(false); // Ensure loading stops
        }
    }
    // --- End Handle Participant Add ---


    // --- Handle Participant Remove ---
    const handleRemoveParticipant = async (participantToRemove: Participant) => {
        if (!submission?.id) {
            toast({ title: "Error", description: "Submission ID is missing.", variant: "destructive"});
            return;
        };

        setIsLoadingParticipants(true);
        try {
            // Attempt to delete based on multiple fields for better accuracy if ID isn't available
            // Ideally, fetch participant with ID first if needed, but this is simpler for now
            const { error } = await supabase
                .from("participants")
                .delete()
                .eq("submission_id", submission.id)
                .eq("name", participantToRemove.name)
                .eq("age", participantToRemove.age)
                .eq("phone_number", participantToRemove.phone_number)
                .eq("gender", participantToRemove.gender)
                // Using multiple eq is generally okay unless exact duplicates exist
                // Consider adding .limit(1) if you only want to delete one match
                // .limit(1)


            if (error) {
                console.error("Error removing participant:", error)
                toast({
                    title: "Error Removing Participant",
                    description: error.message || "Could not remove participant.",
                    variant: "destructive"
                })
                 // Let finally block handle loading state
            } else {
                 // Refresh participant list and count for the CURRENT page *after* successful delete
                 const newTotalCount = totalParticipantsCount > 0 ? totalParticipantsCount - 1 : 0;
                 const newTotalPages = Math.ceil(newTotalCount / PARTICIPANTS_PAGE_SIZE);
                 let pageToFetch = participantsCurrentPage;

                 // Adjust page if the current page becomes empty and it wasn't the first page
                 if (participantsCurrentPage > newTotalPages && newTotalPages > 0) {
                     pageToFetch = newTotalPages;
                     setParticipantsCurrentPage(newTotalPages); // Update state
                 } else if (newTotalCount === 0) {
                     // Handle case where list becomes completely empty
                     pageToFetch = 1;
                     setParticipantsCurrentPage(1);
                 }
                 // Fetch data for the determined page
                 await fetchParticipants(submission.id, pageToFetch);


                toast({
                    title: "Participant Removed",
                    description: `${participantToRemove.name} was successfully removed.`,
                    variant: "default"
                })
            }

        } catch (error: any) {
            console.error("Error removing participant:", error)
             toast({
                title: "Error Removing Participant",
                description: error?.message || "An unexpected error occurred.",
                variant: "destructive"
            })
        } finally {
            setIsLoadingParticipants(false); // Ensure loading stops
        }
    }
     // --- End Handle Participant Remove ---


    // --- Pagination Handlers ---
    const handleNextPage = () => {
        if (submission?.id && participantsCurrentPage < totalPages) {
            const nextPage = participantsCurrentPage + 1;
            setParticipantsCurrentPage(nextPage);
            fetchParticipants(submission.id, nextPage);
        }
    };

    const handlePrevPage = () => {
        if (submission?.id && participantsCurrentPage > 1) {
            const prevPage = participantsCurrentPage - 1;
            setParticipantsCurrentPage(prevPage);
            fetchParticipants(submission.id, prevPage);
        }
    };

    const totalPages = totalParticipantsCount > 0 ? Math.ceil(totalParticipantsCount / PARTICIPANTS_PAGE_SIZE) : 1;
    // --- End Pagination Handlers ---

    // --- Handle Status Update (Approve/Reject) ---
    const handleUpdateStatus = async (newStatus: "approved" | "rejected", note?: string) => {
        if (!submission || !userProfile) {
             toast({ title: "Authentication Error", description: "User profile not found.", variant: "destructive" });
             return;
        }
        // Optional: Check role more specifically if needed
        if (userProfile.role !== 'project-admin') { // Adjust role name if necessary
             toast({ title: "Permission Denied", description: "You do not have permission to update status.", variant: "destructive" });
             return;
        }

        // Use the main loading state for this critical action
        setLoading(true);
        try {
            const updateData: Partial<Submission> = {
                status: newStatus,
                reviewed_by: userProfile.id,
                reviewed_at: new Date().toISOString(),
                review_notes: newStatus === "rejected" ? (note?.trim() || null) : null, // Ensure note is trimmed or null
            };

            const { error } = await supabase
                .from("submissions")
                .update(updateData)
                .eq("id", submission.id);

            if (error) {
                console.error(`Error ${newStatus}ing submission:`, error);
                toast({
                    title: `Failed to ${newStatus === 'approved' ? 'Approve' : 'Reject'}`,
                    description: error.message || "An error occurred while updating the status.",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: `Submission ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
                    description: `The submission has been successfully ${newStatus}.`,
                    variant: "default",
                });
                // Reload submission data to reflect changes IMMEDIATELY
                await loadSubmission(submission.id); // Reload the entire submission
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
            setLoading(false); // Stop main loading indicator
        }
    };
     // --- End Handle Status Update ---


    if (loading && !submission) { // Show main loading indicator only on initial load
        return (
            <DashboardLayout>
                <div className="flex h-full items-center justify-center">
                    <LoadingSpinner />
                </div>
            </DashboardLayout>
        )
    }

    if (!submission) { // Show "Not Found" if submission is null after loading attempt
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="rounded-full bg-muted p-6 mb-4">
                        <FileText className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Submission Not Found</h1>
                    <p className="text-muted-foreground mb-6 text-center max-w-md">
                        The submission could not be loaded, may not exist, or you might lack permission.
                    </p>
                    <Button onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Go Back
                    </Button>
                </div>
            </DashboardLayout>
        )
    }

    // Calculate if adding more participants is allowed based on actual count
    const canAddMoreParticipants = totalParticipantsCount < (submission?.participant_count || 0);


    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-6 p-4 md:p-6"> {/* Added padding */}

                 {/* --- Rejection Dialog --- */}
                <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                     <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Reject Submission</DialogTitle>
                            <DialogDescription>
                                Provide a reason for rejection. This note will be visible to the submitter.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Textarea
                                placeholder="Enter rejection reason..."
                                value={rejectionNote}
                                onChange={(e) => setRejectionNote(e.target.value)}
                                rows={4}
                                required // Make textarea required for rejection
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>Cancel</Button>
                            <Button
                                variant="destructive"
                                onClick={() => handleUpdateStatus("rejected", rejectionNote)}
                                // Disable if note is empty OR main loading is active
                                disabled={!rejectionNote.trim() || loading}
                            >
                                Confirm Rejection
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                 {/* --- End Rejection Dialog --- */}


                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b">
                    {/* Header Left: Back Button and Title */}
                    <div className="flex items-center">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-4 flex-shrink-0">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Submission Details</h1>
                            <p className="text-muted-foreground text-sm">
                                Submitted on {formatDate(submission?.submitted_at || submission?.created_at)}
                            </p>
                        </div>
                    </div>
                     {/* Header Right: Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2"> {/* Added flex-wrap and items-center */}
                        {/* Edit button - Show if NOT approved */}
                         {(submission.status !== "approved") && (
                            <Button
                                variant="outline"
                                onClick={() => router.push(`/projects/submissions/edit/${submission?.id}`)} // Use correct edit route
                            >
                                {submission.status === "rejected" ? "Update & Resubmit" : "Edit Submission"}
                            </Button>
                        )}

                         {/* Approve/Reject buttons - Show for admin users when status is 'submitted' */}
                        {userProfile?.role === 'project-admin' && submission.status === "submitted" && ( // Adjust role check as needed
                            <>
                                <Button
                                    variant="outline"
                                    className="text-green-600 hover:bg-green-50 hover:text-green-700 border-green-200"
                                    onClick={() => handleUpdateStatus("approved")}
                                    disabled={loading} // Use main loading state
                                >
                                    <ThumbsUp className="mr-2 h-4 w-4" />
                                    Approve
                                </Button>
                                <Button
                                    variant="outline"
                                    className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                                    onClick={() => setIsRejectDialogOpen(true)} // Open the rejection dialog
                                    disabled={loading} // Use main loading state
                                >
                                    <ThumbsDown className="mr-2 h-4 w-4" />
                                    Reject
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Left Column (Main Content) */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Rejection Feedback Card (if applicable) */}
                        {submission.status === "rejected" && submission.review_notes && (
                            <Card className="border-red-200 bg-red-50/80 shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-red-800 flex items-center text-base font-semibold">
                                        <XCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                                        Rejection Feedback
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-red-700 italic text-sm">{submission?.review_notes}</p>
                                </CardContent>
                                {/* Removed footer with button, Edit button is now at the top */}
                            </Card>
                        )}

                        {/* Main Submission Details Card */}
                        <Card className="overflow-hidden border-2 shadow-sm">
                            <CardHeader className="pb-3 bg-muted/30">
                                <div className="flex items-start justify-between gap-4"> {/* Added gap */}
                                    <div>
                                        <CardTitle className="text-xl">{submission?.activity_stream}</CardTitle>
                                        <CardDescription className="mt-1 flex items-center flex-wrap text-sm"> {/* Added flex-wrap and text-sm */}
                                            <Tag className="h-4 w-4 mr-1 flex-shrink-0" />
                                            {submission?.community_group_type}
                                            <span className="mx-1.5">•</span> {/* Adjusted spacing */}
                                            <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                                            {submission?.specific_location || "N/A"}, {submission?.locations?.name || "Loading location..."}
                                        </CardDescription>
                                    </div>
                                    <div className="flex-shrink-0"> {/* Prevent badge from shrinking */}
                                        {getStatusBadge(submission?.status)}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                {/* Key Issues Section */}
                                <div>
                                    <h3 className="font-semibold text-lg mb-3">Key Issues/Takeaways</h3>
                                    <div className="bg-muted/20 p-4 rounded-lg border"> {/* Added border */}
                                        <p className="text-sm leading-relaxed">{submission?.key_issues || <span className="text-muted-foreground italic">No key issues recorded</span>}</p>
                                    </div>
                                </div>

                                {/* DFS Metrics Section */}
                                <div>
                                    <h3 className="font-semibold text-lg mb-3">DFS Session Impact</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="bg-muted/20 p-3 rounded-lg border"> {/* Adjusted padding */}
                                            <p className="text-xs text-muted-foreground mb-1">Pre-Session Level</p>
                                            <p className="text-sm font-medium">{submission?.pre_session_dfs_level || "N/A"}</p>
                                        </div>
                                        <div className="bg-muted/20 p-3 rounded-lg border"> {/* Adjusted padding */}
                                            <p className="text-xs text-muted-foreground mb-1">Post-Session Improvement</p>
                                            <p className="text-sm font-medium">{submission?.post_session_dfs_improvement || "N/A"}</p>
                                        </div>
                                        <div className="bg-muted/20 p-3 rounded-lg border"> {/* Adjusted padding */}
                                            <p className="text-xs text-muted-foreground mb-1">Est. Adoption Count</p>
                                            {/* Use ?? for nullish coalescing with numbers (0 is valid) */}
                                            <p className="text-sm font-medium">{submission?.estimated_dfs_adoption_count ?? "N/A"}</p>
                                        </div>
                                    </div>
                                </div>

                                <Separator className="my-6" />

                                {/* Photo Evidence Section */}
                                <div>
                                    <h3 className="font-semibold text-lg mb-3">Photo Evidence</h3>
                                    <div className={`grid gap-4 ${photos.length > 0 ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'}`}> {/* Adjust grid based on photos */}
                                        {photos.length > 0 ? (
                                            photos.map((photo: string, index: number) => (
                                                <div key={index} className="relative aspect-square overflow-hidden rounded-lg border shadow-sm hover:shadow-md transition-shadow duration-200">
                                                    {/* Basic Image Component - Consider adding a lightbox for larger view */}
                                                    <Image
                                                        src={photo || "/placeholder.svg"} // Fallback image
                                                        alt={`Photo evidence ${index + 1}`}
                                                        fill
                                                        sizes="(max-width: 768px) 50vw, 33vw" // Optimize image loading
                                                        className="object-cover"
                                                         onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} // Handle broken images
                                                    />
                                                </div>
                                            ))
                                        ) : (
                                            // No Photos Placeholder
                                            <div className="col-span-full flex flex-col items-center justify-center p-8 bg-muted/20 rounded-lg border border-dashed">
                                                <Image
                                                    src="/placeholder.svg" // Use a placeholder image
                                                    alt="No photos available"
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
                    </div> {/* End Left Column */}

                     {/* Right Column (Status & Details) */}
                    <div className="space-y-6">
                        {/* Submission Status Card */}
                        <Card className="border-2 shadow-sm">
                            <CardHeader className="pb-3 bg-muted/30">
                                <CardTitle className="text-lg">Submission Status</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center text-center pt-6">
                                <div className="rounded-full bg-muted/30 p-3 mb-4"> {/* Adjusted padding */}
                                    {getStatusIcon(submission.status)}
                                </div>
                                <h3 className="font-semibold text-lg mb-1"> {/* Adjusted margin */}
                                    {submission?.status.charAt(0).toUpperCase() + submission?.status.slice(1)}
                                </h3>
                                <p className="text-sm text-muted-foreground px-2"> {/* Added padding */}
                                    {submission.status === "approved" && "This submission has been reviewed and approved."}
                                    {submission.status === "rejected" && "This submission has been reviewed and rejected."}
                                    {submission.status === "submitted" && "This submission is currently awaiting review."}
                                    {submission.status === "draft" && "This submission is saved as a draft."}
                                </p>
                                {/* Reviewer Info (if applicable) */}
                                {submission.reviewed_by && (
                                    <div className="mt-5 p-3 bg-muted/20 rounded-lg w-full text-left text-sm"> {/* Adjusted padding/margin/size */}
                                        <p className="font-medium">Reviewed by</p>
                                         {/* You might want to fetch reviewer name later */}
                                        <p className="text-muted-foreground">Project Admin</p>
                                        {submission?.reviewed_at && (
                                            <p className="text-xs text-muted-foreground mt-1 flex items-center">
                                                <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                                                {formatDate(submission.reviewed_at)}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Details Card */}
                        <Card className="border-2 shadow-sm">
                            <CardHeader className="pb-3 bg-muted/30">
                                <CardTitle className="text-lg">Details</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <ul className="space-y-4 text-sm"> {/* Reduced spacing */}
                                    <li className="flex items-start">
                                        <div className="bg-primary/10 p-2 rounded-full mr-3 flex-shrink-0">
                                            <MapPin className="h-4 w-4 text-primary" /> {/* Adjusted icon size */}
                                        </div>
                                        <div>
                                            <p className="font-medium">Location</p>
                                            <p className="text-muted-foreground">{submission?.locations?.name || "Unknown"}, {submission?.specific_location || "N/A"}</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start">
                                        <div className="bg-primary/10 p-2 rounded-full mr-3 flex-shrink-0">
                                            <Users className="h-4 w-4 text-primary" /> {/* Adjusted icon size */}
                                        </div>
                                        <div>
                                            <p className="font-medium">Participants</p>
                                            {/* Show actual vs expected count */}
                                            <p className="text-muted-foreground">{totalParticipantsCount} / {submission?.participant_count || 'N/A'} expected</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start">
                                        <div className="bg-primary/10 p-2 rounded-full mr-3 flex-shrink-0">
                                            <FileText className="h-4 w-4 text-primary" /> {/* Adjusted icon size */}
                                        </div>
                                        <div>
                                            <p className="font-medium">Submission ID</p>
                                            <p className="text-muted-foreground font-mono text-xs break-all">{submission.id}</p> {/* Smaller font, break-all */}
                                        </div>
                                    </li>
                                     <li className="flex items-start">
                                        <div className="bg-primary/10 p-2 rounded-full mr-3 flex-shrink-0">
                                            <Calendar className="h-4 w-4 text-primary" /> {/* Changed icon to Calendar */}
                                        </div>
                                        <div>
                                            <p className="font-medium">Submitted On</p>
                                            <p className="text-muted-foreground">
                                                {formatDate(submission?.submitted_at || submission?.created_at)}
                                            </p>
                                        </div>
                                    </li>
                                     {/* Submitter Info */}
                                     <li className="flex items-start">
                                        <div className="bg-primary/10 p-2 rounded-full mr-3 flex-shrink-0">
                                            <Users className="h-4 w-4 text-primary" /> {/* Reused Users icon */}
                                        </div>
                                        <div>
                                            <p className="font-medium">Submitted By</p>
                                            <p className="text-muted-foreground">
                                                {submission?.users?.name || "Unknown User"}
                                                {submission?.users?.email && ` (${submission.users.email})`}
                                            </p>
                                        </div>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div> {/* End Right Column */}
                </div> {/* End Grid */}

                {/* Participants Section */}
                <div className="space-y-6">
                    <Card className="border-2 shadow-lg rounded-lg overflow-hidden">
                        <CardHeader className="pb-4 bg-muted/30">
                            <CardTitle className="text-lg font-semibold text-primary">Participants List</CardTitle>
                            {/* Display actual count vs expected */}
                            <p className="text-sm text-muted-foreground">
                                {`${totalParticipantsCount} / ${submission?.participant_count || 0} participants added`}
                            </p>
                        </CardHeader>
                        <CardContent className="p-0"> {/* Remove padding for table/list */}
                            {/* Loading state for participants */}
                            {isLoadingParticipants && (
                                <div className="flex justify-center items-center p-10">
                                    <LoadingSpinner />
                                    <span className="ml-2 text-muted-foreground">Loading participants...</span>
                                </div>
                            )}

                             {/* --- Desktop Table View --- */}
                            {!isMobile && !isLoadingParticipants && (
                                <>
                                {submittedParticipantsList.length > 0 || canAddMoreParticipants ? (
                                    <Table className="w-full">
                                        <TableHeader className="bg-gray-100">
                                            <TableRow>
                                                <TableHead className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Name</TableHead>
                                                <TableHead className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Age</TableHead>
                                                <TableHead className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Phone</TableHead>
                                                <TableHead className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Gender</TableHead>
                                                <TableHead className="px-4 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {submittedParticipantsList.map((participant, index) => (
                                                <TableRow key={`${participant.phone_number}-${index}`} className="hover:bg-gray-50 transition-colors"> {/* More unique key */}
                                                    <TableCell className="px-4 py-2 text-sm text-gray-800">{participant.name}</TableCell>
                                                    <TableCell className="px-4 py-2 text-sm text-gray-800">{participant.age}</TableCell>
                                                    <TableCell className="px-4 py-2 text-sm text-gray-800">{participant.phone_number}</TableCell>
                                                    <TableCell className="px-4 py-2 text-sm text-gray-800 capitalize">{participant.gender}</TableCell> {/* Capitalize */}
                                                    <TableCell className="px-4 py-2 text-sm text-gray-800 text-center">
                                                        {/* Pass the full participant object */}
                                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveParticipant(participant)} className="h-8 w-8">
                                                            <Trash className="h-4 w-4 text-red-500 hover:text-red-700" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {/* Inline Add Row (Only if limit not reached) */}
                                            {canAddMoreParticipants && (
                                                <TableRow className="bg-gray-50/50">
                                                    <TableCell className="px-4 py-2">
                                                        <Input
                                                            type="text"
                                                            placeholder="Name"
                                                            value={participantName}
                                                            onChange={(e) => setParticipantName(e.target.value)}
                                                            className="w-full border-gray-300 rounded-md focus:ring-1 focus:ring-primary focus:border-primary text-sm h-9"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="px-4 py-2">
                                                        <Input
                                                            type="number"
                                                            placeholder="Age"
                                                            value={participantAge}
                                                            onChange={(e) => setParticipantAge(e.target.value)}
                                                             min="1" // Basic validation
                                                            className="w-full border-gray-300 rounded-md focus:ring-1 focus:ring-primary focus:border-primary text-sm h-9"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="px-4 py-2">
                                                        <Input
                                                            type="tel" // Use tel for phone numbers
                                                            placeholder="Phone Number"
                                                            value={participantPhoneNumber}
                                                            onChange={(e) => setParticipantPhoneNumber(e.target.value)}
                                                            className="w-full border-gray-300 rounded-md focus:ring-1 focus:ring-primary focus:border-primary text-sm h-9"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="px-4 py-2">
                                                        <Select onValueChange={setParticipantGender} value={participantGender}>
                                                            <SelectTrigger className="w-full border-gray-300 rounded-md focus:ring-1 focus:ring-primary focus:border-primary text-sm h-9">
                                                                <SelectValue placeholder="Gender" />
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
                                                            size="sm"
                                                            variant="outline" // Use outline for inline add
                                                            className="border-primary text-primary hover:bg-primary/10"
                                                            onClick={handleParticipantSubmit}
                                                            disabled={isLoadingParticipants || !canAddMoreParticipants} // Disable if loading or limit reached
                                                        >
                                                            Add
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                     ) : (
                                     <p className="p-6 text-center text-muted-foreground italic">No participants have been added yet.</p>
                                 )}
                                </>
                            )}

                            {/* --- Mobile List View --- */}
                            {isMobile && !isLoadingParticipants && (
                                <>
                                {submittedParticipantsList.length > 0 ? (
                                    <div className="p-4 space-y-3">
                                        {submittedParticipantsList.map((participant, index) => (
                                            <div key={`${participant.phone_number}-${index}`} className="p-3 border rounded-lg shadow-sm bg-white flex justify-between items-start gap-2">
                                                <div>
                                                    <p className="text-sm font-medium">{participant.name}</p>
                                                    <p className="text-xs text-muted-foreground">Age: {participant.age} | Gender: <span className="capitalize">{participant.gender}</span></p>
                                                    <p className="text-xs text-muted-foreground">Phone: {participant.phone_number}</p>
                                                </div>
                                                {/* Pass full participant object */}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleRemoveParticipant(participant)}
                                                    className="mt-0 ml-auto h-8 w-8 flex-shrink-0" // Pushes button right
                                                >
                                                    <Trash className="h-4 w-4 text-red-500 hover:text-red-700" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                 ) : (
                                      !canAddMoreParticipants && totalParticipantsCount > 0 ? null : // Hide if limit reached and list empty only on mobile
                                      <p className="p-6 text-center text-muted-foreground italic">No participants added yet.</p>
                                 )}
                                </>
                            )}
                            {/* --- End Mobile List View --- */}

                        </CardContent>

                         {/* --- Pagination Controls --- */}
                         {/* Show pagination only if there's more than one page */}
                         {totalPages > 1 && !isLoadingParticipants && (
                            <CardFooter className="flex items-center justify-between border-t bg-gray-50 py-3 px-4">
                                <span className="text-sm text-muted-foreground">
                                    Page {participantsCurrentPage} of {totalPages}
                                    <span className="hidden sm:inline"> ({totalParticipantsCount} total participants)</span> {/* Show total on larger screens */}
                                </span>
                                <div className="flex items-center space-x-1 sm:space-x-2"> {/* Reduced spacing on small screens */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handlePrevPage}
                                        disabled={participantsCurrentPage <= 1 || isLoadingParticipants}
                                    >
                                        <ChevronLeft className="h-4 w-4 sm:mr-1" /> {/* Hide text on very small screens */}
                                        <span className="hidden sm:inline">Previous</span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleNextPage}
                                        disabled={participantsCurrentPage >= totalPages || isLoadingParticipants}
                                    >
                                         <span className="hidden sm:inline">Next</span>
                                        <ChevronRight className="h-4 w-4 sm:ml-1" /> {/* Hide text on very small screens */}
                                    </Button>
                                </div>
                            </CardFooter>
                        )}
                        {/* --- End Pagination Controls --- */}


                        {/* --- Mobile Add Button (uses Dialog) --- */}
                         {isMobile && !isLoadingParticipants && canAddMoreParticipants && (
                             <CardFooter className="bg-gray-50 py-3 px-4 flex justify-end border-t"> {/* Adjusted padding */}
                                <Dialog open={showAddParticipantModal} onOpenChange={setShowAddParticipantModal}>
                                    <DialogTrigger asChild>
                                        <Button
                                            size="sm" // Smaller button on mobile footer
                                            variant="default"
                                            className="bg-primary text-white hover:bg-primary/90 focus:ring-1 focus:ring-primary"
                                            disabled={!canAddMoreParticipants || isLoadingParticipants}
                                        >
                                            Add Participant
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px]">
                                        <DialogHeader>
                                            <DialogTitle>Add New Participant</DialogTitle>
                                            <DialogDescription>
                                                Fill in details below. {totalParticipantsCount}/{submission.participant_count} added.
                                            </DialogDescription>
                                        </DialogHeader>
                                        {/* Form submits via handleParticipantSubmit */}
                                        <form onSubmit={handleParticipantSubmit} className="space-y-4 py-4">
                                            <Input
                                                type="text"
                                                placeholder="Participant Name"
                                                value={participantName}
                                                onChange={(e) => setParticipantName(e.target.value)}
                                                className="w-full border-gray-300 rounded-md focus:ring-1 focus:ring-primary h-10"
                                                required
                                            />
                                            <Input
                                                type="number"
                                                placeholder="Age"
                                                min="1"
                                                value={participantAge}
                                                onChange={(e) => setParticipantAge(e.target.value)}
                                                className="w-full border-gray-300 rounded-md focus:ring-1 focus:ring-primary h-10"
                                                required
                                            />
                                            <Input
                                                type="tel"
                                                placeholder="Phone Number"
                                                value={participantPhoneNumber}
                                                onChange={(e) => setParticipantPhoneNumber(e.target.value)}
                                                className="w-full border-gray-300 rounded-md focus:ring-1 focus:ring-primary h-10"
                                                required
                                            />
                                            <Select onValueChange={setParticipantGender} value={participantGender} required>
                                                <SelectTrigger className="w-full border-gray-300 rounded-md focus:ring-1 focus:ring-primary h-10">
                                                    <SelectValue placeholder="Select Gender" />
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
                                                    className="w-full bg-primary text-white hover:bg-primary/90 focus:ring-1 focus:ring-primary"
                                                    disabled={isLoadingParticipants || !canAddMoreParticipants}
                                                >
                                                   {/* Show spinner inside button when adding */}
                                                   {isLoadingParticipants && <LoadingSpinner className="h-4 w-4 mr-2 inline-block" />}
                                                   Add Participant
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                             </CardFooter>
                         )}
                         {/* --- End Mobile Add Button --- */}

                         {/* Display message if participant limit is reached */}
                          {!canAddMoreParticipants && !isLoadingParticipants && (
                            <CardFooter className="bg-yellow-50 border-t border-yellow-200 py-3 px-4 text-center">
                                <p className="text-sm text-yellow-800 font-medium flex items-center justify-center">
                                    <AlertTriangle className="h-4 w-4 mr-2 text-yellow-600" /> {/* Added icon */}
                                    Participant limit ({submission.participant_count}) reached.
                                </p>
                            </CardFooter>
                         )}

                    </Card>
                </div> {/* End Participants Section */}

            </div> {/* End Main Page Container */}
        </DashboardLayout>
    )
}