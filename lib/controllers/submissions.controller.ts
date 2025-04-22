import { NextRequest, NextResponse } from "next/server";
import SubmissionService from "../services/submissions.service";
import SubmissionPhotoService from "../services/submission_photos.service";

export default class SubmissionController {
  private submissionService: SubmissionService;
  private submissionPhotoService: SubmissionPhotoService;

  constructor() {
    this.submissionService = new SubmissionService();
    this.submissionPhotoService = new SubmissionPhotoService();
  }

  async getSubmissionById(req: NextRequest, id: string) {
    return this.handleRequest(req, async () => {
      if (!id) {
        throw new Error("Submission ID is required");
      }

      return this.submissionService.getSubmissionById(id);
    });
  }

  async getSubmissions(req: NextRequest) {
    return this.handleRequest(req, async () => {
      return this.submissionService.getSubmissions();
    });
  }

  async getSubmissionPhotosById(req: NextRequest, params: { id: string }) {
    return this.handleRequest(req, async () => {
      const { id } = params;

      if (!id) {
        throw new Error("Submission ID is required");
      }

      return this.submissionPhotoService.getSubmissionPhotos(id);
    });
  }

  async getSubmissionPhotosStorage(req: NextRequest, params: { id: string }) {
    return this.handleRequest(req, async () => {
      const { id } = params;

      if (!id) {
        throw new Error("Submission ID is required");
      }

      return this.submissionPhotoService.getSubmissionStorageData(id);
    });
  }

  async getSubmissionCount(_req: NextRequest): Promise<NextResponse> {
    try {
      const count = await this.submissionService.getSubmissionCount();
      return NextResponse.json({ count });
    } catch (error) {
      console.error("Controller Error:", error);
      return NextResponse.json({ error: "Failed to get user count" }, { status: 500 });
    }
  }
  
  async updateSubmission(req: NextRequest, id: string) {
    return this.handleRequest(req, async () => {
      if (!id) {
        throw new Error("Submission ID is required");
      }

      const body = await req.json();
      return this.submissionService.updateSubmission(id, body);
    });
  }
  async getSubmissionsByProjectId(projectId: string) {
    try {
      const submissions = await this.submissionService.getSubmissionsByProjectId(projectId);
      if (!submissions || submissions.length === 0) {
        throw new Error("No submissions found for the given project ID");
      }
      return { status: 200, json: submissions };
    } catch (error) {
      console.error("Error fetching submissions by project ID:", error);
      return { status: 500, json: { error: "Failed to fetch submissions by project ID" } };
    }
  }
  async getSubmissionsByUserId(userId: string) {
    try {
      const submissions = await this.submissionService.getSubmissionsByUserId(userId);
      if (!submissions || submissions.length === 0) {
        throw new Error("No submissions found for the given user ID");
      }
      return { status: 200, json: submissions };
    }
    catch (error) {
      console.error("Error fetching submissions by user ID:", error);
      return { status: 500, json: { error: "Failed to fetch submissions by user ID" } };
    }
  }
  private async handleRequest(
    req: NextRequest,
    handler: () => Promise<any>
  ): Promise<NextResponse> {
    try {
      const data = await handler();
      return NextResponse.json(data);
    } catch (error) {
      console.error("Error in SubmissionController:", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "An error occurred" },
        { status: 500 }
      );
    }
  }
}
