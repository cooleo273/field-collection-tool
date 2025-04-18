// src/lib/controllers/admin-stats.controller.ts
import { NextResponse } from "next/server";
import AdminStatsService from "../services/admin-stats.service"; // Adjust path
// Assuming ProjectAdminStatsData and PromoterStatsData types are defined/imported if needed here
// Or rely on the service's return types implicitly

// Standard API Response Structure (can be shared type)
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

export default class AdminStatsController {
  private adminStatsService: AdminStatsService;

  constructor() {
    this.adminStatsService = new AdminStatsService();
  }

  /**
   * Gets project admin dashboard stats.
   * @param userId - The ID of the user requesting the stats.
   * @param projectId - The ID of the project.
   * @returns NextResponse containing the stats data or an error message.
   */
  async getProjectAdminDashboardStats(userId: string, projectId: string): Promise<NextResponse> {
    return this.handleRequest(async () => {
      // The service method should return data matching ProjectAdminStatsData
      return await this.adminStatsService.getProjectAdminDashboardStats(userId, projectId);
    });
  }

  /**
   * Gets promoter dashboard stats.
   * @param userId - The ID of the promoter.
   * @returns NextResponse containing the stats data or an error message.
   */
  async getPromoterDashboardStats(userId: string): Promise<NextResponse> {
    return this.handleRequest(async () => {
      // The service method should return data matching PromoterStatsData
      return await this.adminStatsService.getPromoterDashboardStats(userId);
    });
  }

  /**
   * Private helper to handle requests, execute service logic, and format responses.
   * @param handler - An async function that calls the appropriate service method.
   * @returns A NextResponse object.
   */
  private async handleRequest<T>(
    handler: () => Promise<T>
  ): Promise<NextResponse<ApiResponse<T>>> {
    try {
      const data = await handler();
      // Consistent success response
      return NextResponse.json({ success: true, data });
    } catch (error) {
      console.error("Error handled in AdminStatsController:", error);
      const message = error instanceof Error ? error.message : "An unexpected server error occurred.";
      // Consistent error response
      // Determine appropriate status code (500 is default, could be 4xx for specific errors)
      const status = error instanceof Error && error.message.includes("not found") ? 404 : 500; // Example specific status
      return NextResponse.json(
          { success: false, message },
          { status }
        );
    }
  }
}