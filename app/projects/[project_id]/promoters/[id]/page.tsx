"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { LoadingSpinner } from "@/components/loading-spinner";
import { useProject } from "@/contexts/project-context"; // Assuming this is used, keeping it
import { getPromoterById } from "@/lib/services/promoters";
import { getSubmissionsByUserId } from "@/lib/services/submissions";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator"; // Import Separator
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  Info,
  ExternalLink,
  Edit, // Optional: Add an Edit icon
} from "lucide-react";

// Define Promoter interface
interface Promoter {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "active" | "inactive" | string;
  created_at: string;
  updated_at: string;
}

// Define Submission interface
interface Submission {
    id: string;
    activity_stream: string;
    location?: string | null;
    participant_count: number;
    status: "approved" | "rejected" | "pending" | string;
    submitted_at: string;
}


export default function PromoterDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { id, project_id } = params;

  const promoterId = Array.isArray(id) ? id[0] : id;
  const projectId = Array.isArray(project_id) ? project_id[0] : project_id;

  const { currentProject } = useProject();

  const [promoter, setPromoter] = useState<Promoter | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    setPromoter(null);
    setSubmissions([]);

    if (!promoterId || !projectId) {
      console.error("Promoter ID or Project ID is missing.");
      router.push("/dashboard?error=missing_ids");
      setIsLoading(false);
      return;
    }

    const fetchDetails = async () => {
      try {
        const [promoterData, submissionsData] = await Promise.all([
          getPromoterById(promoterId),
          getSubmissionsByUserId(promoterId),
        ]);

        if (!promoterData) {
            throw new Error("Promoter not found or access denied."); // More specific error
        }

        setPromoter(promoterData);
        setSubmissions(submissionsData || []);

      } catch (err: any) {
        console.error("Error fetching promoter details or submissions:", err);
        setError(
          err.message || "Failed to load promoter details. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [promoterId, projectId, router]);

  // --- Render Helper Functions ---

  const renderLoading = () => (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <LoadingSpinner className="h-10 w-10 text-primary animate-spin" /> {/* Added animation */}
    </div>
  );

  const renderError = (message: string) => (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
       <XCircle className="h-16 w-16 text-destructive mb-4" />
      <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-2">
        Error Loading Promoter
      </h1>
      <p className="text-muted-foreground mb-6 max-w-md">{message}</p>
      <Button
        onClick={() => router.push(`/projects/${projectId}/promoters`)}
        variant="outline"
        size="sm"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Promoters
      </Button>
    </div>
  );

  const renderNotFound = () => (
     <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
       <Info className="h-16 w-16 text-muted-foreground mb-4" />
      <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-2">
        Promoter Not Found
      </h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        The promoter you're looking for doesn't exist or could not be loaded.
      </p>
      <Button
        onClick={() => router.push(`/projects/${projectId}/promoters`)}
        variant="outline"
        size="sm"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Promoters
      </Button>
    </div>
  );

  // --- Main Render Logic ---

  if (isLoading) return renderLoading();
  if (error) return renderError(error);
  if (!promoter) return renderNotFound();

  // --- Helper Functions ---
  const formatDateTime = (dateString: string) => {
      try {
          const date = new Date(dateString);
          // Customize format as needed
          return date.toLocaleString(undefined, { // Use locale default
                year: 'numeric', month: 'short', day: 'numeric',
                hour: 'numeric', minute: '2-digit', hour12: true // Example format
            });
      } catch {
          return "Invalid Date";
      }
  };

  const getStatusBadgeVariant = (status: Promoter['status']): "success" | "destructive" | "secondary" => {
      switch (status?.toLowerCase()) {
          case 'active': return 'success';
          case 'inactive': return 'destructive';
          default: return 'secondary';
      }
  };

  const getSubmissionStatusBadgeVariant = (status: Submission['status']): "success" | "destructive" | "warning" | "secondary" => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'success';
      case 'rejected': return 'destructive';
      case 'pending': return 'warning';
      default: return 'secondary';
    }
  };

  const StatusIcon = ({ status }: { status: Promoter['status'] }) => {
    const lowerStatus = status?.toLowerCase();
    if (lowerStatus === 'active') return <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />;
    if (lowerStatus === 'inactive') return <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />;
    return <Info className="h-5 w-5 text-yellow-600 flex-shrink-0" />; // Use a warning/info color
  };

  // --- Component ---
  return (
    // Use a slightly different background for the page area
    <div className="min-h-screen bg-muted/40 dark:bg-muted/20">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto"> {/* Adjusted max-width for stacked layout */}

          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-3">
               <Button
                  onClick={() => router.push(`/projects/${projectId}/promoters`)}
                  variant="outline"
                  size="icon" // Keep as icon button
                  className="h-9 w-9 flex-shrink-0 md:h-8 md:w-auto md:px-3 md:py-1.5 text-xs"
                >
                  <ArrowLeft className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Back</span>
                </Button>
            </div>
             {/* Optional: Add Edit button */}
             <Button variant="outline" size="sm" disabled> {/* Example: Disabled edit button */}
                <Edit className="mr-2 h-4 w-4" />
                Edit Promoter
             </Button>
          </div>

          {/* Main Content Area - Changed to Flex Column */}
          <div className="flex flex-col gap-6 lg:gap-8">

            {/* Profile Card (Now takes full width) */}
            <Card className="shadow-md dark:border-gray-700/80 w-full">
              <CardHeader className="pb-4"> {/* Removed border, relying on card structure */}
                 {/* Flex container for Title and potentially an Avatar/Icon */}
                 <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-semibold text-primary"> {/* Highlight title */}
                            Promoter Profile
                        </CardTitle>
                        <CardDescription className="text-sm mt-1">
                            Contact details, status, and metadata.
                        </CardDescription>
                    </div>
                    {/* Placeholder for Avatar or large icon */}
                     <div className="p-2 bg-muted rounded-full">
                        <User className="h-6 w-6 text-muted-foreground" />
                     </div>
                 </div>
              </CardHeader>
              <Separator className="mb-6" /> {/* Added separator */}
              <CardContent className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5"> {/* Grid layout inside card */}
                {/* Name */}
                <div className="flex items-start space-x-3 text-sm">
                  <User className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Name</p>
                    <p className="text-md text-foreground font-semibold">{promoter.name}</p> {/* Slightly larger name */}
                  </div>
                </div>

                 {/* Status */}
                <div className="flex items-start space-x-3 text-sm">
                    <StatusIcon status={promoter.status} />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Status</p>
                    <Badge
                        variant={getStatusBadgeVariant(promoter.status)}
                        className="mt-1 capitalize text-xs px-2.5 py-0.5 font-medium"
                    >
                      {promoter.status}
                    </Badge>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start space-x-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Email</p>
                    <p className="text-foreground break-all">{promoter.email}</p>
                  </div>
                </div>

                 {/* Phone */}
                <div className="flex items-start space-x-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Phone</p>
                    <p className="text-foreground">{promoter.phone || <span className="text-muted-foreground italic text-xs">Not provided</span>}</p>
                  </div>
                </div>

                {/* Created At */}
                <div className="flex items-start space-x-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Created</p>
                    <p className="text-foreground text-xs">{formatDateTime(promoter.created_at)}</p> {/* Smaller date */}
                  </div>
                </div>

                {/* Updated At */}
                <div className="flex items-start space-x-3 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Last Updated</p>
                    <p className="text-foreground text-xs">{formatDateTime(promoter.updated_at)}</p> {/* Smaller date */}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submissions Card (Now takes full width, below Profile) */}
            <Card className="shadow-md dark:border-gray-700/80 w-full overflow-hidden"> {/* Added overflow-hidden */}
              <CardHeader className="border-b dark:border-gray-700/60 pb-4 bg-muted/30 dark:bg-muted/20"> {/* Subtle header background */}
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                        <CardTitle className="text-xl font-semibold">Submissions</CardTitle>
                        <CardDescription className="text-sm mt-1">
                         Activity records submitted by {promoter.name}.
                        </CardDescription>
                    </div>
                   <Badge variant="secondary" className="ml-auto sm:ml-2 whitespace-nowrap self-start sm:self-center"> {/* Changed variant */}
                      {submissions.length} {submissions.length === 1 ? 'record' : 'records'}
                   </Badge>
                 </div>
              </CardHeader>
              {/* Content padding handled by table container or empty state */}
              <CardContent className="p-0">
                {submissions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-6 text-center min-h-[200px]"> {/* Min height */}
                    <FileText className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
                    <p className="text-lg font-medium text-muted-foreground mb-1">No Submissions Found</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                      When {promoter.name} submits activity data, it will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto relative">
                    <Table className="min-w-full text-sm">
                      <TableHeader className="bg-gray-100/80 dark:bg-gray-800/50 sticky top-0 z-10">
                        <TableRow className="border-b dark:border-gray-700/80">
                          <TableHead className="py-3 px-4 sm:px-6 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Activity</TableHead>
                          <TableHead className="py-3 px-4 sm:px-6 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell whitespace-nowrap">Location</TableHead>
                          <TableHead className="py-3 px-4 sm:px-6 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Participants</TableHead>
                          <TableHead className="py-3 px-4 sm:px-6 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Status</TableHead>
                          <TableHead className="py-3 px-4 sm:px-6 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell whitespace-nowrap">Submitted Date</TableHead>
                          <TableHead className="py-3 px-4 sm:px-6 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">View</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="bg-card divide-y divide-gray-200 dark:divide-gray-700/60">
                        {submissions.map((submission) => (
                          <TableRow
                            key={submission.id}
                            className="hover:bg-muted/50 dark:hover:bg-muted/30 transition-colors group"
                          >
                            <TableCell className="py-3 px-4 sm:px-6 font-medium text-foreground whitespace-nowrap">{submission.activity_stream}</TableCell>
                            <TableCell className="py-3 px-4 sm:px-6 text-muted-foreground whitespace-nowrap hidden md:table-cell">{submission.location || <span className="italic text-xs">N/A</span>}</TableCell>
                            <TableCell className="py-3 px-4 sm:px-6 text-muted-foreground whitespace-nowrap text-center">{submission.participant_count}</TableCell>
                            <TableCell className="py-3 px-4 sm:px-6 whitespace-nowrap text-center">
                              <Badge
                                variant={getSubmissionStatusBadgeVariant(submission.status)}
                                className="capitalize text-xs px-2 py-0.5 font-medium"
                              >
                                {submission.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-3 px-4 sm:px-6 text-muted-foreground whitespace-nowrap hidden sm:table-cell">
                              {new Date(submission.submitted_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="py-3 px-4 sm:px-6 text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-60 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/projects/submissions/${submission.id}`);
                                }}
                                aria-label="View Submission Details"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div> {/* End Flex Column */}
        </div> {/* End Max Width Container */}
      </div> {/* End Page Container */}
    </div>
  );
}