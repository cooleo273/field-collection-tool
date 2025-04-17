import { NextRequest, NextResponse } from "next/server";
import AdminStatsController from "../../../lib/controllers/admin-stats.controller";

const adminStatsController = new AdminStatsController();

export async function POST(req: NextRequest) {
  const { action, userId, projectId } = await req.json();

  switch (action) {
    case "getProjectAdminDashboardStats":
      return adminStatsController.getProjectAdminDashboardStats(req, userId, projectId);
    case "getPromoterDashboardStats":
      return adminStatsController.getPromoterDashboardStats(req, userId);
    default:
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
  }
}