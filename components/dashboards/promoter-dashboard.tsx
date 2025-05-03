"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // For error display
import { Skeleton } from "@/components/ui/skeleton"; // For loading states
import {
  Upload,
  FileCheck,
  ClipboardCheck,
  FileDown,
  Map,
  ClipboardList,
  Circle, // Status indicator
  AlertCircle, // Error icon
} from "lucide-react";
import { LoadingSpinner } from "@/components/loading-spinner"; // Assuming this exists
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context"; // Provides userProfile
import { useRouter } from "next/navigation";
import { getPromoterDashboardStats } from "@/lib/services/admin-stats"; // API service

// --- Constants for Statuses ---
// Improves maintainability and reduces typo errors
const STATUS = {
  APPROVED: "approved",
  REJECTED: "rejected",
  SUBMITTED: "submitted",
  PENDING: "pending", // Added for clarity if used
};

// --- Interfaces ---
interface Submission {
  id: string;
  title: string | null;
  activity_stream: string;
  status: string; // Consider using a union type: 'approved' | 'rejected' | 'submitted' etc.
  created_at: string;
  // user_info is optional in the original, keep it that way unless always present
  user_info?: {
    full_name?: string;
  };
}

interface Stats {
  totalSubmissions: number;
  submittedSubmissions: number; // Often corresponds to 'pending'
  approvedSubmissions: number;
  rejectedSubmissions: number;
}

// --- Helper Functions ---
// Moved above the component for better organization

/**
 * Formats a date string into a more readable format.
 * @param dateString - The date string or Date object to format.
 * @returns Formatted date string or "Invalid Date".
 */
function formatDate(dateString: string | Date | undefined): string {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date value");
    }
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return "Invalid Date";
  }
}

/**
 * Gets Tailwind CSS class for status indicator color (dots, text).
 * @param status - The submission status string.
 * @returns Tailwind text color class string.
 */
function getStatusColorClass(status: string): string {
  switch (status?.toLowerCase()) {
    case STATUS.APPROVED:
      return "text-green-500";
    case STATUS.REJECTED:
      return "text-red-500";
    case STATUS.SUBMITTED:
    case STATUS.PENDING: // Grouping submitted/pending
      return "text-yellow-500"; // Using yellow for pending/submitted
    default:
      return "text-gray-500"; // Default for unknown or other statuses
  }
}

/**
 * Gets Tailwind CSS class for status badge background color.
 * @param status - The submission status string.
 * @returns Tailwind background color class string.
 */
function getStatusBadgeColorClass(status: string): string {
  switch (status?.toLowerCase()) {
    case STATUS.APPROVED:
      return "bg-green-600"; // Slightly darker bg for better contrast with white text
    case STATUS.REJECTED:
      return "bg-red-600";
    case STATUS.SUBMITTED:
    case STATUS.PENDING:
      return "bg-yellow-500"; // Yellow might need dark text, adjust if needed
    default:
      return "bg-gray-500";
  }
}

// --- Sub-Components (for better structure and readability) ---

interface StatCardProps {
  title: string;
  value: number;
  description: string;
  icon: React.ElementType; // Pass icon component directly
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, icon: Icon }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-5 w-5 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value.toLocaleString()}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

const StatCardSkeleton: React.FC = () => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-5 rounded-full" />
        </CardHeader>
        <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-full" />
        </CardContent>
    </Card>
);


interface SubmissionListItemProps {
  submission: Submission;
  onClick: () => void;
}

const SubmissionListItem: React.FC<SubmissionListItemProps> = ({ submission, onClick }) => (
  <div
    key={submission.id}
    className="border rounded-md p-3 shadow-sm hover:shadow-lg hover:bg-muted/50 transition-all duration-200 cursor-pointer"
    onClick={onClick}
  >
    <div className="flex items-center justify-between gap-2">
      <h3 className="text-base font-medium truncate flex-1">
        {submission.title || `${submission.activity_stream}`}
      </h3>
      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
        <Circle className={`h-3 w-3 ${getStatusColorClass(submission.status)}`} aria-hidden="true" />
        <span className="text-xs text-muted-foreground capitalize">
          {submission.status}
        </span>
      </div>
    </div>
    <p className="text-sm text-muted-foreground mt-1.5">
      Submitted on {formatDate(submission.created_at)}
    </p>
  </div>
);

const ActivityFeedItem: React.FC<SubmissionListItemProps> = ({ submission, onClick }) => (
     <div
        key={submission.id}
        className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded-md cursor-pointer transition-colors duration-150"
        onClick={onClick}
     >
         <Circle className={`h-3 w-3 mt-1 shrink-0 ${getStatusColorClass(submission.status)}`} aria-label={`Status: ${submission.status}`} />
         <div className="flex-1 space-y-0.5">
            <p className="text-sm font-medium leading-snug truncate">
                {submission.title || `${submission.activity_stream}`}
            </p>
            <p className="text-xs text-muted-foreground">
                Status: <span className="capitalize font-medium">{submission.status}</span> &bull; {formatDate(submission.created_at)}
            </p>
         </div>
     </div>
);



const SubmissionListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
    <div className="space-y-4">
        {Array.from({ length: count }).map((_, index) => (
            <div key={index} className="border rounded-md p-3 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                    <Skeleton className="h-5 w-3/5" />
                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                        <Skeleton className="h-3 w-3 rounded-full" />
                        <Skeleton className="h-3 w-12" />
                    </div>
                </div>
                <Skeleton className="h-4 w-1/2 mt-2" />
            </div>
        ))}
    </div>
);

const SubmissionGridSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: count }).map((_, index) => (
            <div key={index} className="border rounded-lg p-4 shadow-sm flex flex-col h-[120px]"> {/* Fixed height for skeleton */}
                 <div className="flex items-center justify-between mb-2 gap-2">
                    <Skeleton className="h-6 w-3/5" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                 </div>
                <Skeleton className="h-4 w-1/2 mt-auto" />
            </div>
        ))}
    </div>
);


const LocationsPlaceholder: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle>Assigned Locations</CardTitle>
      <CardDescription>
        View locations you are assigned to manage or submit data for.
      </CardDescription>
    </CardHeader>
    <CardContent className="h-[400px] flex items-center justify-center bg-muted/30 rounded-md border border-dashed">
      <div className="text-center text-muted-foreground flex flex-col items-center">
        <Map className="h-12 w-12 mb-4 text-gray-400" />
        <span className="text-lg font-semibold mb-2">Map Feature Coming Soon</span>
        <span className="text-sm max-w-xs mx-auto">
          An interactive map displaying your assigned locations will be available here in a future update.
        </span>
        <Button variant="outline" size="sm" className="mt-5" disabled>
          <Map className="mr-2 h-4 w-4" /> View Map (Disabled)
        </Button>
      </div>
    </CardContent>
  </Card>
);

// --- Main Dashboard Component ---

export function PromoterDashboard() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null); // Initial state null
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = userProfile?.id;

  // Use useCallback to memoize the fetch function if needed, especially if passed down
  const loadDashboardData = useCallback(async () => {
    if (!userId) {
        // Don't set loading to false here if we expect userId to appear later
        // If it's guaranteed to be present or app redirects, this is fine.
        // Setting error might be better if user IS logged in but ID is missing.
        console.log("User ID not available yet.");
        // setError("User information not found. Please try logging in again.");
        setLoading(false); // Stop loading if no ID
        return;
    }

    setLoading(true);
    setError(null); // Clear previous errors

    try {
      // Destructure directly for cleaner access
      const { stats: fetchedStats, recentSubmissions: fetchedSubmissions } =
        await getPromoterDashboardStats(userId);

      setStats(fetchedStats);
      // Ensure recentSubmissions is always an array
      setRecentSubmissions(fetchedSubmissions || []);
    } catch (err) {
      console.error("Error loading promoter dashboard data:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred while fetching dashboard data.");
      // Keep potentially stale data or clear it? Clearing might be less confusing.
      // setStats(null);
      // setRecentSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [userId]); // Dependency on userId

  useEffect(() => {
    loadDashboardData();
    // This effect runs when userId changes (e.g., login/logout)
  }, [loadDashboardData]); // Depend on the memoized fetch function

  const handleSubmissionClick = (submissionId: string) => {
    router.push(`/submissions/${submissionId}`);
  };

  const handleNewSubmissionClick = () => {
    router.push("/submissions/new");
  };

  // Conditional rendering for loading and error states
  // Render basic layout shell even when loading for better perceived performance
  return (
    <div className="container mx-auto py-8 px-4 fade-in"> {/* Added simple fade-in class (needs CSS) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold tracking-tight">DFS Promoter Dashboard</h1>
        <Button onClick={handleNewSubmissionClick} size="lg">
          <Upload className="mr-2 h-5 w-5" />
          New Submission
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Fetching Data</AlertTitle>
          <AlertDescription>
            {error} Please try refreshing the page. If the problem persists, contact support.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {loading || !stats ? (
            <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
            </>
        ) : (
            <>
                <StatCard
                    title="Total Submissions"
                    value={stats.totalSubmissions}
                    description="Data forms submitted by you"
                    icon={ClipboardList}
                />
                <StatCard
                    title="Pending Review" // Changed from "Submitted" for clarity
                    value={stats.submittedSubmissions}
                    description="Submissions awaiting approval"
                    icon={ClipboardCheck} // Or an hourglass icon if available
                />
                <StatCard
                    title="Approved"
                    value={stats.approvedSubmissions}
                    description="Submissions successfully accepted"
                    icon={FileCheck}
                />
                <StatCard
                    title="Rejected"
                    value={stats.rejectedSubmissions}
                    description="Submissions needing revision"
                    icon={FileDown} // Maybe FileWarning or AlertCircle? FileDown is ok.
                />
          </>
        )}
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2"> {/* Full width tabs */}
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="locations">Assigned Locations</TabsTrigger>
        </TabsList>

        {/* Overview Tab Content */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
             {/* Submission History Card */}
             <Card>
                <CardHeader>
                    <CardTitle>Recent Submission History</CardTitle>
                    <CardDescription>
                    A snapshot of your latest submission activity.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <SubmissionListSkeleton count={3} />
                    ) : error ? (
                         <p className="text-red-600 text-center py-4">Could not load submissions.</p>
                    ) : recentSubmissions.length > 0 ? (
                    <div className="space-y-4">
                        {recentSubmissions.slice(0, 5).map((sub) => ( // Limit displayed items if needed
                        <SubmissionListItem
                            key={sub.id}
                            submission={sub}
                            onClick={() => handleSubmissionClick(sub.id)}
                        />
                        ))}
                    </div>
                    ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                         <ClipboardList className="h-10 w-10 mb-3 text-gray-400"/>
                         <p className="font-medium">No Recent Submissions</p>
                         <p className="text-sm">Your recent submissions will appear here.</p>
                    </div>
                    )}
                </CardContent>
             </Card>

            {/* Activity Feed Card */}
            <Card>
              <CardHeader>
                <CardTitle>Activity Feed</CardTitle>
                <CardDescription>
                  Updates on your recent submissions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                     <SubmissionListSkeleton count={3} /> // Use same skeleton type
                ) : error ? (
                    <p className="text-red-600 text-center py-4">Could not load activity.</p>
                ): recentSubmissions.length > 0 ? (
                  <div className="space-y-1"> {/* Reduced spacing for feed items */}
                    {recentSubmissions.slice(0, 7).map((sub) => ( // Show slightly more in feed?
                       <ActivityFeedItem
                           key={sub.id}
                           submission={sub}
                           onClick={() => handleSubmissionClick(sub.id)}
                       />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                    <Circle className="h-10 w-10 mb-3 text-gray-400"/>
                    <p className="font-medium">No Recent Activity</p>
                    <p className="text-sm">Updates will show up here as they happen.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          {/* Chart Placeholder (Optional) */}
          {/* ... (keep commented out or implement) ... */}
        </TabsContent>

        

        {/* Locations Tab Content */}
        <TabsContent value="locations" className="space-y-4">
           {/* Show placeholder regardless of loading state, unless there's a specific error for locations */}
           <LocationsPlaceholder />
        </TabsContent>
      </Tabs>
    </div>
  );
}
