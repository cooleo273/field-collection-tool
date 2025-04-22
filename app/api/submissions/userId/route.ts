import { NextResponse } from "next/server";
import  SubmissionController  from "@/lib/controllers/submissions.controller";

const submissionController = new SubmissionController();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    const submissions = await submissionController.getSubmissionsByProjectId(userId);
    return NextResponse.json(submissions);
  } catch (error) {
    console.error("Error in GET /api/submissions/projectId:", error);
    return NextResponse.json({ error: "Failed to fetch submissions by project ID" }, { status: 500 });
  }
}