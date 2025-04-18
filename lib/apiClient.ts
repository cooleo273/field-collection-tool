// src/lib/apiClient.ts
import { ApiAction, STATS_API_ENDPOINT } from './constant';
 // Use the constant

// Define a standard API response structure
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string; // Error message if success is false
}

/**
 * A centralized function to handle API requests.
 * @param endpoint The API endpoint path (e.g., '/stats').
 * @param method HTTP method ('GET', 'POST', etc.).
 * @param body Optional request body for POST/PUT etc.
 * @param params Optional query parameters for GET requests.
 * @returns Promise<T> The data from the successful API response.
 * @throws Error If the API request fails or returns an error.
 */
async function fetchApi<T = any>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  body?: Record<string, unknown> | null,
  params?: Record<string, string> | URLSearchParams
): Promise<T> {
  const url = new URL(endpoint, window.location.origin); // Construct full URL safely
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  };

  if (method === 'GET' && params) {
    url.search = new URLSearchParams(params).toString();
  }

  if (method !== 'GET' && body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url.toString(), options);

    // Attempt to parse JSON regardless of status code for error messages
    let responseData: ApiResponse<T>;
    try {
        responseData = await response.json();
    } catch (jsonError) {
        // If JSON parsing fails, create a generic error response
        responseData = {
            success: response.ok,
            message: response.ok ? 'Received non-JSON response' : `HTTP Error ${response.status}: ${response.statusText}`,
        };
    }


    if (!response.ok || !responseData.success) {
      // Use message from API response if available, otherwise use status text
      const errorMessage = responseData.message || `API Error (${response.status}): ${response.statusText}`;
      console.error(`API Error calling ${method} ${endpoint}:`, errorMessage, responseData);
      throw new Error(errorMessage);
    }

    // If successful and data exists
    if (responseData.data !== undefined) {
        return responseData.data;
    } else {
         // Handle cases where API indicates success but provides no data (if this is valid)
         // Or throw an error if data was expected
         console.warn(`API Success calling ${method} ${endpoint}, but no data was returned.`);
         // Depending on use case, you might return null, an empty object/array, or throw
         return null as T; // Or throw new Error('API returned success but no data');
    }

  } catch (error) {
    console.error(`Network or other error calling ${method} ${endpoint}:`, error);
    // Re-throw the original error or a new one
    throw error instanceof Error ? error : new Error('An unexpected network error occurred.');
  }
}

// Specific API call functions using the helper
// =============================================

// Define expected return type for Project Admin Stats
interface ProjectAdminStatsData {
    stats: {
        campaigns: number;
        submissions: number;
        pendingSubmissions: number;
        locations: number;
    };
    recentSubmissions: any[]; // Replace 'any' with a proper Submission type if defined frontend-side
    submissionTrends: { date: string; count: number }[];
    statusDistribution: { name: string; value: number; color: string }[];
    campaignPerformance: { name: string; value: number }[];
}

// Define expected return type for Promoter Stats
interface PromoterStatsData {
    stats: {
        totalSubmissions: number;
        draft: number;
        submitted: number;
        approved: number;
        rejected: number;
    };
    recentSubmissions: any[]; // Replace 'any' with a proper Submission type
}

/**
 * Fetches dashboard statistics for a project admin.
 */
export function getProjectAdminDashboardStats(userId: string, projectId: string): Promise<ProjectAdminStatsData> {
  return fetchApi<ProjectAdminStatsData>(STATS_API_ENDPOINT, 'POST', {
    action: ApiAction.GetProjectAdminDashboardStats, // Use enum
    userId,
    projectId,
  });
}

/**
 * Fetches dashboard statistics for a promoter.
 */
export function getPromoterDashboardStats(userId: string): Promise<PromoterStatsData> {
  const params = {
    action: ApiAction.GetPromoterDashboardStats, // Use enum
    userId,
  };
  return fetchApi<PromoterStatsData>(STATS_API_ENDPOINT, 'GET', null, params);
}