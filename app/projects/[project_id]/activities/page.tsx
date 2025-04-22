import { useEffect, useState } from "react";
import { fetchSubmissionsByProjectId } from "@/lib/repositories/submission.repository";
import { useRouter } from "next/router";

export default function ProjectSubmissionsPage() {
  const [submissions, setSubmissions] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { project_id } = router.query;

  useEffect(() => {
    if (project_id) {
      loadSubmissions(project_id as string);
    }
  }, [project_id]);

  const loadSubmissions = async (projectId: string) => {
    setLoading(true);
    try {
      const data = await fetchSubmissionsByProjectId(projectId);
      setSubmissions(data);
    } catch (error) {
      console.error("Error loading submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading submissions...</div>;
  }

  return (
    <div>
      <h1>Submissions for Project {project_id}</h1>
      {submissions.length > 0 ? (
        <ul>
          {submissions.map((submission) => (
            <li key={submission.id}>{submission.name}</li>
          ))}
        </ul>
      ) : (
        <p>No submissions found for this project.</p>
      )}
    </div>
  );
}