"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/loading-spinner";
import { getProjectSubmissions } from "@/lib/services/admin-stats";

export default function ProjectSubmissionsPage({ params }: { params: { project_id: string } }) {
  const router = useRouter();
  const { project_id } = params;

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubmissions() {
      try {
        setLoading(true);
        const data = await getProjectSubmissions(project_id);
        setSubmissions(data);
      } catch (error) {
        console.error("Error fetching submissions:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSubmissions();
  }, [project_id]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Project Submissions</h1>
        <Button onClick={() => router.push(`/submissions/new?project_id=${project_id}`)}>New Submission</Button>
      </div>

      {submissions.length === 0 ? (
        <p className="text-muted-foreground">No submissions found for this project.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {submissions.map((submission) => (
            <Card key={submission.id}>
              <CardHeader>
                <CardTitle>{submission.title || "Untitled Submission"}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Status: {submission.status}</p>
                <p>Submitted At: {new Date(submission.created_at).toLocaleString()}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => router.push(`/submissions/${submission.id}`)}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}