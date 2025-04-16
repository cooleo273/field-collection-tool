import SubmissionController from "@/lib/controllers/submissions.controller";
import { NextRequest, NextResponse } from "next/server";

const submissionController = new SubmissionController();

export async function GET(req: NextRequest, {params}: {params: {id: string}}) {
const {id} = await params// Extract the ID from the request parameters
return submissionController.getSubmissionById(req, id); // Pass the ID to the controller method
}
