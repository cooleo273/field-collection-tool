import { NextResponse } from "next/server";
import  SubmissionController  from "@/lib/controllers/submissions.controller";

const submissionController = new SubmissionController();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
  }

  try {
    const submissions = await submissionController.getSubmissionsByProjectId(projectId);
    return NextResponse.json(submissions);
  } catch (error) {
    console.error("Error in GET /api/submissions/projectId:", error);
    return NextResponse.json({ error: "Failed to fetch submissions by project ID" }, { status: 500 });
  }
}