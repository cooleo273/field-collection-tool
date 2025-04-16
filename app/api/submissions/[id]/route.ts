import { NextResponse } from "next/server";
import SubmissionService from "@/lib/services/submissions.service";

const submissionService = new SubmissionService();

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const submission = await submissionService.getSubmissionById(params.id);
    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }
    return NextResponse.json(submission);
  } catch (error) {
    console.error("Error fetching submission:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
