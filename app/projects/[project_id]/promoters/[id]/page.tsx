"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { LoadingSpinner } from "@/components/loading-spinner";
import { useProject } from "@/contexts/project-context";
import { getPromoterById } from "@/lib/services/promoters";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSubmissionsByUserId } from "@/lib/services/submissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Promoter {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function PromoterDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { id, project_id } = params;

  const promoterId = Array.isArray(id) ? id[0] : id;
  const projectId = Array.isArray(project_id) ? project_id[0] : project_id;

  const { currentProject } = useProject();
  const [promoter, setPromoter] = useState<Promoter | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPromoter = async () => {
      if (!promoterId || !projectId) {
        console.error("Promoter ID or Project ID is missing.");
        router.push("/projects");
        return;
      }

      if (!currentProject) {
        router.push("/projects");
        return;
      }

      try {
        const promoterData = await getPromoterById(promoterId);
        setPromoter(promoterData);

        const submissionsData = await getSubmissionsByUserId(promoterId);
        setSubmissions(submissionsData);
      } catch (error) {
        console.error("Error fetching promoter details or submissions:", error);
        router.push(`/projects/${projectId}/promoters`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPromoter();
  }, [currentProject, promoterId, projectId, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <LoadingSpinner />
      </div>
    );
  }

  if (!promoter) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Promoter Not Found</h1>
        <p className="text-gray-600 mb-6 text-center max-w-md">
          The promoter you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Button onClick={() => router.push(`/projects/${projectId}/promoters`)} variant="default">
          Back to Promoters
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <Button
        onClick={() => router.push(`/projects/${projectId}/promoters`)}
        variant="default"
        className="mb-4 text-xs md:text-sm"
      >
        Back to Promoters
      </Button>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg md:text-2xl font-bold text-gray-800 text-center md:text-left">
            Promoter Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <p className="text-xs md:text-sm">
              <strong className="text-gray-700">Name:</strong> {promoter.name}
            </p>
            <p className="text-xs md:text-sm">
              <strong className="text-gray-700">Email:</strong> {promoter.email}
            </p>
            <p className="text-xs md:text-sm">
              <strong className="text-gray-700">Phone:</strong> {promoter.phone}
            </p>
            <div className="flex items-center space-x-2 text-xs md:text-sm">
              <strong className="text-gray-700">Status:</strong>
              <Badge
                variant={promoter.status === "active" ? "success" : "secondary"}
              >
                {promoter.status}
              </Badge>
            </div>
            <p className="text-xs md:text-sm">
              <strong className="text-gray-700">Created At:</strong> {new Date(
                promoter.created_at
              ).toLocaleString()}
            </p>
            <p className="text-xs md:text-sm">
              <strong className="text-gray-700">Updated At:</strong> {new Date(
                promoter.updated_at
              ).toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-xl font-bold text-gray-800 text-center md:text-left">
            Submissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <p className="text-gray-600 text-center text-xs md:text-sm">No submissions found for this promoter.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table className="w-full border border-gray-200 text-xs md:text-sm">
                <TableHeader>
                  <TableRow>
                    <TableHead>Activity</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow
                      key={submission.id}
                      className="hover:bg-gray-50"
                    >
                      <TableCell>{submission.activity_stream}</TableCell>
                      <TableCell>{submission.location || "N/A"}</TableCell>
                      <TableCell>{submission.participant_count}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            submission.status === "approved"
                              ? "success"
                              : "secondary"
                          }
                        >
                          {submission.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(submission.submitted_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}