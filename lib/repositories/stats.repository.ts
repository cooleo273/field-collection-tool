// src/lib/data-fetching/admin-stats-api.ts // Or wherever you keep client-side API calls

import { ApiAction } from "@/lib/constant"; // Assuming ApiAction is available on frontend

// Standard API Response Structure (should match your backend ApiResponse interface)
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

// Import backend types if needed for frontend type safety
// import { ProjectAdminDashboardData, PromoterDashboardData } from "../services/admin-stats.service";

export async function getProjectAdminDashboardStats(
  userId: string,
  projectId: string
) {
  try {
    const result = await fetch("/api/stats", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // Body for POST request
      body: JSON.stringify({
        action: ApiAction.GetProjectAdminDashboardStats,
        userId,
        projectId,
      }),
    });

    if (!result.ok) {
      // Handle non-2xx responses, e.g., 400, 500
      const errorBody = await result.json();
      console.error(
        `API Error ${result.status} in getProjectAdminDashboardStats:`,
        errorBody.message
      );
      // Re-throw with more context or return a structured error response
      return {
        success: false,
        message:
          errorBody.message ||
          `API request failed with status ${result.status}`,
      };
    }

    const response=
      await result.json();
    return response;
  } catch (error) {
    console.error(
      "Network or unexpected error in getProjectAdminDashboardStats:",
      error
    );
    // Return a consistent error structure
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An unexpected client error occurred.",
    };
  }
}

export async function getPromoterDashboardStats(
  userId: string
) {
  try {
    // Correct approach for GET requests - use query parameters
    const queryParams = new URLSearchParams({
      action: ApiAction.GetPromoterDashboardStats, // Use the enum value
      userId: userId,
    }).toString();

    const result = await fetch(`/api/stats?${queryParams}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json", // Optional header for GET
      },
    });

    if (!result.ok) {
      // Handle non-2xx responses
      const errorBody = await result.json();
      console.error(
        `API Error ${result.status} in getPromoterDashboardStats:`,
        errorBody.message
      );
      return {
        success: false,
        message:
          errorBody.message ||
          `API request failed with status ${result.status}`,
      };
    }

    const response = await result.json();
    return response;
  } catch (error) {
    console.error(
      "Network or unexpected error in getPromoterDashboardStats:",
      error
    );
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An unexpected client error occurred.",
    };
  }
}

// You should also define/import the types ProjectAdminDashboardData and PromoterDashboardData
// on the frontend if you want type safety when using these functions.
// For example:
/*
interface ProjectAdminDashboardData {
    stats: { ... };
    recentSubmissions: Submission[]; // Define Submission type too
    submissionTrends: SubmissionTrend[]; // Define SubmissionTrend type too
    statusDistribution: StatusDistribution[]; // Define StatusDistribution type too
    campaignPerformance: CampaignPerformance[]; // Define CampaignPerformance type too
}

interface PromoterDashboardData {
    stats: PromoterStatusCounts; // Define PromoterStatusCounts type too
    recentSubmissions: Submission[]; // Define Submission type too
}
*/
