import SubmissionController from "@/lib/controllers/submissions.controller";
import { NextRequest, NextResponse } from "next/server";

const submissionController = new SubmissionController();
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Submission ID is required" }, { status: 400 });
  }

  try {
    const submission = await submissionController.getSubmissionById(request, id);
    return NextResponse.json(submission);
  } catch (error) {
    console.error("Error in GET /api/submissions/id:", error);
    return NextResponse.json({ error: "Failed to fetch submission by ID" }, { status: 500 });
  }
}