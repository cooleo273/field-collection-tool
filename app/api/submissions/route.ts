import { NextRequest, NextResponse } from "next/server";
import SubmissionService from "@/lib/services/submissions.service";
import SubmissionController from "@/lib/controllers/submissions.controller";

const submissionController = new SubmissionController();

export async function GET(req: NextRequest, { params }: { params: { id?: string } }) {
    const { id } = params;

    if (id) {
        return submissionController.getSubmissionById(req, id);
    }

    return submissionController.getSubmissions(req);
}

