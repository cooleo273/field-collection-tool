import { NextRequest, NextResponse } from "next/server";
import StorageService from "../services/storage.service";

export default class StorageController {
  private storageService: StorageService;

  constructor() {
    this.storageService = new StorageService();
  }

  async uploadImage(req: NextRequest, id: string, file: File) {
    return this.handleRequest(req, async () => {
      if (!id) {
        throw new Error("Submission ID is required");
      }

      return this.storageService.uploadImage(file, id);
    });
  }

  async deleteImage(req: NextRequest, url: string) {
    return this.handleRequest(req, async () => {
      return this.storageService.deleteImage(url);
    });
  }

  
  async getPublicUrl(req: NextRequest, id: string) {
    return this.handleRequest(req, async () => {
      return this.storageService.getPublicUrl(id);
    });
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
