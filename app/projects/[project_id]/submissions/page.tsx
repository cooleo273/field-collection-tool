"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/loading-spinner";
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  Inbox,
  FileText,
  CalendarDays,
  User,
  Plus,
  AlertTriangle, // Keep necessary imports
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { updateSubmissionStatus } from "@/lib/services/submissions";
import { getProjectSubmissions, ProjectSubmission } from "@/lib/services/admin-stats";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

const getStatusBadge = (status: string) => {
   switch (status) {
    case "submitted":
      return <Badge variant="secondary" className="bg-orange-100 text-orange-800 border border-orange-200 hover:bg-orange-200">Submitted</Badge>;
    case "approved":
      return <Badge variant="secondary" className="bg-green-100 text-green-800 border border-green-200">Approved</Badge>;
    case "rejected":
      return <Badge variant="destructive">Rejected</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const PAGE_SIZE = 10;

export default function ProjectAdminSubmissionsPage() {
  const params = useParams();
  const project_id = params.project_id as string;
  const router = useRouter();

  const [submissions, setSubmissions] = useState<ProjectSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [activeTab, setActiveTab] = useState("submitted");

  const totalPages = Math.ceil(totalSubmissions / PAGE_SIZE);

  const loadSubmissions = useCallback(async (page: number) => {
    if (!project_id) return;

    setLoading(true);
    setError(null);
    console.log(`Loading submissions for page ${page}`);
    try {
      const { data, count } = await getProjectSubmissions(project_id, page, PAGE_SIZE);
      setSubmissions(data || []);
      setTotalSubmissions(count || 0);
    } catch (err: any) {
      console.error("Error loading submissions:", err);
      setError(err.message || "Failed to load submissions.");
      setSubmissions([]);
      setTotalSubmissions(0);
    } finally {
      setLoading(false);
    }
  }, [project_id]);

  useEffect(() => {
    loadSubmissions(currentPage);
  }, [currentPage, loadSubmissions]);

  const handleUpdateStatus = async (submissionId: string, status: "approved" | "rejected") => {
    try {
      setLoading(true);
      await updateSubmissionStatus(submissionId, status);
      await loadSubmissions(currentPage);
    } catch (err) {
      console.error("Error updating status:", err);
      setError("Failed to update submission status.");
    } finally {
        setLoading(false);
    }
  };

  const handleViewDetails = (submissionId: string) => {
    router.push(`/projects/submissions/${submissionId}`);
  };

  const handlePromoterClick = (promoterId: string) => {
    router.push(`/projects/${project_id}/promoters/${promoterId}`);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

   const renderEmptyState = (message: string) => (
    <div className="text-center py-10 text-muted-foreground flex flex-col items-center gap-2">
      <Inbox className="h-8 w-8 opacity-50" />
      <p>{message}</p>
    </div>
  );

  const getFilteredSubmissions = () => {
    if (activeTab === 'all') return submissions;
    return submissions.filter(s => s.status === activeTab);
  }

  const filteredSubmissions = getFilteredSubmissions();

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Submissions</h1>
          <p className="text-muted-foreground">Review and manage field data submissions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/projects/submissions/new`)}>
             <Plus className="mr-2 h-4 w-4"/>
            New Submission
          </Button>
          <Button variant="outline" size="sm" onClick={() => loadSubmissions(currentPage)} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive bg-destructive/10 p-4">
            <div className="flex items-center gap-2 text-destructive font-medium">
                <AlertTriangle className="h-5 w-5"/>
                Error
            </div>
            <p className="text-destructive/90 text-sm mt-1">{error}</p>
        </Card>
      )}

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="submitted">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
            {loading && filteredSubmissions.length === 0 ? (
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => <Card key={i} className="h-24 animate-pulse bg-muted/50"></Card>)}
                </div>
            ) : !loading && filteredSubmissions.length === 0 ? (
                 renderEmptyState(`No ${activeTab === 'all' ? '' : activeTab + ' '}submissions found`)
            ) : (
               <div className="space-y-4">
                {filteredSubmissions.map((submission) => (
                  <Card key={submission.id} className="border hover:shadow-sm transition-shadow duration-200">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-grow space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-base">
                              {submission.project_name || "Unknown Project"}
                            </h3>
                            {getStatusBadge(submission.status)}
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <FileText className="h-4 w-4 shrink-0" />
                            <span className="truncate">
                               {submission.community_group_type || "N/A"} • {submission.activity_stream || "N/A"}
                            </span>
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
                                 className="text-primary hover:underline font-medium ml-1"
                               >
                                 {submission.submitted_by_name || 'Unknown User'}
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
                            {submission.status === 'submitted' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:bg-green-50 hover:text-green-700 border-green-200"
                                  onClick={() => handleUpdateStatus(submission.id, "approved")}
                                  disabled={loading}
                                >
                                  <CheckCircle className="mr-1 h-4 w-4" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                                  onClick={() => handleUpdateStatus(submission.id, "rejected")}
                                  disabled={loading}
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

            {totalPages > 1 && !loading && (
                <Pagination className="mt-6">
                    <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious
                        href="#"
                        onClick={(e) => {e.preventDefault(); handlePageChange(currentPage - 1)}}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
                        />
                    </PaginationItem>
                     <PaginationItem>
                        <span className="px-4 py-2 text-sm">
                            Page {currentPage} of {totalPages}
                        </span>
                    </PaginationItem>
                    <PaginationItem>
                        <PaginationNext
                        href="#"
                        onClick={(e) => {e.preventDefault(); handlePageChange(currentPage + 1)}}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : undefined}
                        />
                    </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}