import { NextRequest, NextResponse } from "next/server";
import AdminStatsService from "../services/admin-stats.service";

export default class AdminStatsController {
  private adminStatsService: AdminStatsService;

  constructor() {
    this.adminStatsService = new AdminStatsService();
  }

  async getProjectAdminDashboardStats(req: NextRequest, userId: string, projectId: string) {
    return this.handleRequest(req, async () => {
      return this.adminStatsService.getProjectAdminDashboardStats(userId, projectId);
    });
  }
  async getPromoterDashboardStats(req: NextRequest, userId: string) {
    return this.handleRequest(req, async () => {
      return this.adminStatsService.getPromoterAdminDashboardStats(userId);
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
      console.error("Error in AdminStatsController:", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "An error occurred" },
        { status: 500 }
      );
    }
  }
}