// app/api/users/count/route.ts
import SubmissionController from "@/lib/controllers/submissions.controller";
import { NextRequest } from "next/server";

const submissionController = new SubmissionController();

export async function GET(req: NextRequest) {
  return submissionController.getSubmissionCount(req);
}
    