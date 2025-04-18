// src/app/api/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import AdminStatsController from "../../../lib/controllers/admin-stats.controller"; // Adjust path if needed
import { ApiAction } from "@/lib/constant";
 // Adjust path if needed

// Instantiate the controller (usually fine per request in serverless environments)
const adminStatsController = new AdminStatsController();

/**
 * Handles POST requests for statistics actions.
 * Currently supports: getProjectAdminDashboardStats
 * Expects JSON body: { action: ApiAction, userId: string, projectId?: string }
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: any;
  try {
    body = await req.json();
    const { action, userId, projectId } = body;

    // Validate required fields
    if (!action || !userId) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: action and userId" },
        { status: 400 }
      );
    }

    switch (action) {
      case ApiAction.GetProjectAdminDashboardStats:
        if (!projectId) {
          return NextResponse.json(
            { success: false, message: "Missing required field for this action: projectId" },
            { status: 400 }
          );
        }
        // Delegate to controller - it now handles response formatting (success/error)
        return await adminStatsController.getProjectAdminDashboardStats(userId, projectId);

      // Add other POST actions here if needed
      // case OtherAction:
      //   ...

      default:
        return NextResponse.json(
          { success: false, message: `Invalid action specified for POST request: ${action}` },
          { status: 400 } // Bad Request - invalid action
        );
    }
  } catch (error) {
    // Handle JSON parsing errors or other unexpected issues during request processing
    console.error("Error in POST /api/stats:", { error, requestBody: body }); // Log potentially problematic body

    const message = error instanceof Error
        ? `Invalid request body: ${error.message}` // More specific for JSON errors
        : "An internal server error occurred processing the POST request.";

    // Ensure consistent error response structure
    return NextResponse.json(
        { success: false, message },
        { status: error instanceof SyntaxError ? 400 : 500 } // Bad Request for JSON errors, otherwise Internal Server Error
      );
  }
}

/**
 * Handles GET requests for statistics actions.
 * Currently supports: getPromoterDashboardStats
 * Expects query params: ?action=ApiAction&userId=string
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = req.nextUrl;
    const action = searchParams.get("action");
    const userId = searchParams.get("userId");

    // Validate required query parameters
    if (!action || !userId) {
      return NextResponse.json(
        { success: false, message: "Missing required query parameters: action and userId" },
        { status: 400 }
      );
    }

    switch (action) {
      case ApiAction.GetPromoterDashboardStats:
        // Delegate to controller - it now handles response formatting (success/error)
        return await adminStatsController.getPromoterDashboardStats(userId);

      // Add other GET actions here if needed
      // case OtherGetAction:
      //  ...

      default:
        return NextResponse.json(
          { success: false, message: `Invalid action specified for GET request: ${action}` },
          { status: 400 } // Bad Request - invalid action
        );
    }
   } catch (error) {
     // Handle unexpected errors during GET request processing (less likely than POST body issues)
    console.error("Error in GET /api/stats:", { error, url: req.url });
    const message = error instanceof Error ? error.message : "An internal server error occurred processing the GET request.";

    // Ensure consistent error response structure
    return NextResponse.json(
        { success: false, message },
        { status: 500 } // Internal Server Error
      );
  }
}