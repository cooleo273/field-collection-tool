import { NextRequest, NextResponse } from "next/server";
import SubmissionController from "../../../lib/controllers/submissions.controller";

const submissionController = new SubmissionController();

export async function GET(req: NextRequest) {
    return submissionController.getSubmissions(req);

}
