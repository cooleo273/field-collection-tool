
import SubmissionController from "@/lib/controllers/submissions.controller";
import { NextRequest, NextResponse } from "next/server";

const submissionController = new SubmissionController();

export async function GET(req: NextRequest) {
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "5", 10); // Default to 5 if limit is not provided
  const response = await submissionController.getRecentSubmissions(limit);
  return NextResponse.json(response.json, { status: response.status });
}