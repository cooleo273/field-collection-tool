import { NextRequest, NextResponse } from "next/server";
import SubmissionService from "@/lib/services/submissions.service";
import SubmissionController from "@/lib/controllers/submissions.controller";

const submissionController = new SubmissionController();

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const submission = await submissionController.getSubmissionById(req, params.id);
    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }
    return NextResponse.json(submission);
  } catch (error) {
    console.error("Error fetching submission:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  return submissionController.updateSubmission(req, id);
}