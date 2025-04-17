import { NextRequest, NextResponse } from "next/server";
import ProjectService from "../services/projects.service";

export default class ProjectController {
  private projectService: ProjectService;

  constructor() {
    this.projectService = new ProjectService();
  }

  async getProjects(req: NextRequest) {
    return this.handleRequest(req, async () => {
      return this.projectService.getProjects();
    });
  }

  async getProjectById(req: NextRequest, id: string) {
    return this.handleRequest(req, async () => {
      if (!id) {
        throw new Error("Project ID is required");
      }
      return this.projectService.getProjectById(id);
    });
  }

  async createProject(req: NextRequest) {
    return this.handleRequest(req, async () => {
      const body = await req.json();
      return this.projectService.createProjects(body);
    });
  }

  async updateProject(req: NextRequest, id: string) {
    return this.handleRequest(req, async () => {
      if (!id) {
        throw new Error("Project ID is required");
      }
      const body = await req.json();
      return this.projectService.updateProject(id, body);
    });
  }

  async deleteProject(req: NextRequest, id: string) {
    return this.handleRequest(req, async () => {
      if (!id) {
        throw new Error("Project ID is required");
      }
      return this.projectService.deleteProject(id);
    });
  }
  async getAssignedProjects(req: NextRequest, userId: string) {
    return this.handleRequest(req, async () => {
      if (!userId) {
        throw new Error("User ID is required");
      }
      return this.projectService.getAssignedProjects(userId);
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
      console.error("Error in ProjectController:", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "An error occurred" },
        { status: 500 }
      );
    }
  }
}