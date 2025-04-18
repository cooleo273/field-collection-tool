// src/lib/services/admin-stats.service.ts
import { getSupabaseClient } from "./client"; // Adjust path
import { Database } from "@/types/supabase"; // Adjust path
import {
    SubmissionStatus,
    RECENT_SUBMISSIONS_LIMIT,
    SUBMISSION_TREND_DAYS,
    TOP_CAMPAIGN_LIMIT,
    STATUS_COLORS,
    STATUS_DISTRIBUTION_NAMES
} from "../constant"; // Corrected path: constants (plural)

// Types
type SubmissionBase = Database["public"]["Tables"]["submissions"]["Row"];
type Submission = SubmissionBase & {
  user_info?: { id: string; full_name: string | null; email: string | null } | null;
  campaigns?: { name: string | null } | null;
  locations?: { name: string | null } | null;
  users?: { id: string; full_name: string | null; email: string | null } | null;
};
type Campaign = Pick<Database["public"]["Tables"]["campaigns"]["Row"], 'id' | 'name'>;
type SubmissionTrend = { date: string; count: number };
type StatusDistribution = { name: string; value: number; color: string };
type CampaignPerformance = { name: string; value: number };
// Adjusted PromoterStatusCounts slightly for clarity
type PromoterStatusCounts = {
    totalSubmissions: number;
    [SubmissionStatus.Draft]?: number;
    [SubmissionStatus.Submitted]?: number;
    [SubmissionStatus.Approved]?: number;
    [SubmissionStatus.Rejected]?: number;
};


interface ProjectAdminDashboardData {
    stats: {
        campaigns: number;
        submissions: number;
        pendingSubmissions: number;
        locations: number;
    };
    recentSubmissions: Submission[];
    submissionTrends: SubmissionTrend[];
    statusDistribution: StatusDistribution[];
    campaignPerformance: CampaignPerformance[];
}

interface PromoterDashboardData {
    stats: PromoterStatusCounts;
    recentSubmissions: Submission[];
}


export default class AdminStatsService {

  /**
   * Fetches comprehensive statistics for the project admin dashboard.
   * @param userId - ID of the admin user (currently unused in logic but passed).
   * @param projectId - ID of the project to fetch stats for.
   * @returns Promise<ProjectAdminDashboardData>
   * @throws Error if database query fails.
   */
  async getProjectAdminDashboardStats(userId: string, projectId: string): Promise<ProjectAdminDashboardData> {
    const supabase = getSupabaseClient();

    try {
      // 1. Get campaigns (only id and name needed)
      const { data: campaigns, error: campaignsError } = await supabase
        .from("campaigns")
        .select("id, name")
        .eq("project_id", projectId);

      if (campaignsError) throw new Error(`Failed to fetch campaigns: ${campaignsError.message}`);
      // Ensure campaigns is treated as an array, even if null/undefined initially
      const safeCampaigns = campaigns || [];
      if (safeCampaigns.length === 0) {
         return { stats: { campaigns: 0, submissions: 0, pendingSubmissions: 0, locations: 0 }, recentSubmissions: [], submissionTrends: [], statusDistribution: [], campaignPerformance: [] };
      }

      const campaignIds = safeCampaigns.map((c) => c.id);

      // 2. Get all submissions (only fields needed for calculations)
      // Explicitly type the selected data structure if needed, or rely on inference
      const { data: allSubmissions, error: submissionsError } = await supabase
        .from("submissions")
        .select("id, location, status, submitted_by, campaign_id, created_at")
        .in("campaign_id", campaignIds);

       if (submissionsError) throw new Error(`Failed to fetch submissions: ${submissionsError.message}`);
       const safeAllSubmissions = allSubmissions || [];

      // 3. Get recent submissions with related data (limit applied)
       const { data: recentSubmissionsData, error: recentError } = await supabase
        .from("submissions")
        .select(`*, campaigns ( name ), locations ( name ), users ( id, full_name, email )`)
        .in("campaign_id", campaignIds)
        .order("created_at", { ascending: false })
        .limit(RECENT_SUBMISSIONS_LIMIT);

      if (recentError) {
           console.warn(`Failed to fetch recent submissions: ${recentError.message}`);
      }

      // Process recent submissions
      const recentSubmissions: Submission[] = (recentSubmissionsData || []).map(s => ({
          ...s,
          // Ensure 'users' relation exists before accessing, provide null fallback
          user_info: s.users ? { id: s.users.id, full_name: s.users.full_name, email: s.users.email } : null
        }));

      // Calculate Stats
      const uniqueLocations = new Set(safeAllSubmissions.map(s => s.location).filter(Boolean));
      const pendingSubmissionsCount = safeAllSubmissions.filter(s => s.status === SubmissionStatus.Submitted).length;

      return {
        stats: {
          campaigns: safeCampaigns.length,
          submissions: safeAllSubmissions.length,
          pendingSubmissions: pendingSubmissionsCount,
          locations: uniqueLocations.size,
        },
        recentSubmissions,
        submissionTrends: this.calculateSubmissionTrends(safeAllSubmissions),
        statusDistribution: this.calculateStatusDistribution(safeAllSubmissions),
        // Pass safeCampaigns here
        campaignPerformance: this.calculateCampaignPerformance(safeAllSubmissions, safeCampaigns),
      };
    } catch (error) {
      console.error("Error in getProjectAdminDashboardStats service:", error);
      // Consider wrapping the error for more context if needed
      throw error instanceof Error ? error : new Error("An unexpected error occurred retrieving project stats.");
    }
  }

  /**
   * Fetches statistics relevant to a promoter's dashboard.
   * @param userId - The ID of the promoter.
   * @returns Promise<PromoterDashboardData>
   * @throws Error if database query fails.
   */
  async getPromoterDashboardStats(userId: string): Promise<PromoterDashboardData> {
    const supabase = getSupabaseClient();

    try {
      const { data: submissions, error: submissionsError } = await supabase
        .from("submissions")
        .select(`*`) // Select necessary fields
        .eq("submitted_by", userId)
        .order("created_at", { ascending: false });

      if (submissionsError) throw new Error(`Failed to fetch promoter submissions: ${submissionsError.message}`);
      const safeSubmissions = submissions || [];

      // Calculate status counts
      const statusCounts: Partial<Record<SubmissionStatus, number>> = {};
      safeSubmissions.forEach((submission) => {
         const statusKey = submission.status as SubmissionStatus;
         if (Object.values(SubmissionStatus).includes(statusKey)) {
              statusCounts[statusKey] = (statusCounts[statusKey] || 0) + 1;
         }
      });

      // Build the final stats object matching PromoterStatusCounts
      const finalStats: PromoterStatusCounts = {
          totalSubmissions: safeSubmissions.length,
          [SubmissionStatus.Draft]: statusCounts[SubmissionStatus.Draft] || 0,
          [SubmissionStatus.Submitted]: statusCounts[SubmissionStatus.Submitted] || 0,
          [SubmissionStatus.Approved]: statusCounts[SubmissionStatus.Approved] || 0,
          [SubmissionStatus.Rejected]: statusCounts[SubmissionStatus.Rejected] || 0,
      };

      return {
        stats: finalStats,
        recentSubmissions: safeSubmissions.slice(0, RECENT_SUBMISSIONS_LIMIT),
      };
    } catch (error) {
      console.error("Error in getPromoterDashboardStats service:", error);
      throw error instanceof Error ? error : new Error("An unexpected error occurred retrieving promoter stats.");
    }
  }

  // --- Helper Functions ---

  /** Calculates submission counts for the last N days. */
  private calculateSubmissionTrends(submissions: Pick<SubmissionBase, 'created_at'>[]): SubmissionTrend[] {
    const trends: { [key: string]: number } = {};
    const daysResult: SubmissionTrend[] = [];
    const endDate = new Date();
    const startDate = new Date();
    startDate.setUTCDate(endDate.getUTCDate() - SUBMISSION_TREND_DAYS);
    startDate.setUTCHours(0, 0, 0, 0);

    for (let i = 0; i < SUBMISSION_TREND_DAYS; i++) {
        const date = new Date(startDate);
        date.setUTCDate(date.getUTCDate() + i);
        const dateString = date.toISOString().split("T")[0];
        trends[dateString] = 0;
    }

    submissions.forEach((submission) => {
        if (!submission.created_at) return;
        try {
            const submissionDate = new Date(submission.created_at);
            if (submissionDate >= startDate && submissionDate <= endDate) {
                const dateString = submissionDate.toISOString().split("T")[0];
                if (trends.hasOwnProperty(dateString)) {
                    trends[dateString]++;
                }
            }
        } catch(e) { console.warn("Could not parse submission date:", submission.created_at, e); }
    });

    Object.keys(trends).sort().forEach(date => {
        daysResult.push({ date, count: trends[date] });
    });
    return daysResult;
  }

  /** Calculates the distribution of submission statuses. */
  private calculateStatusDistribution(submissions: Pick<SubmissionBase, 'status'>[]): StatusDistribution[] {
    const statusCounts: { [key: string]: number } = {};
    Object.values(SubmissionStatus).forEach(s => statusCounts[s] = 0);
    statusCounts.other = 0;

    submissions.forEach((submission) => {
        const statusKey = submission.status as SubmissionStatus;
        if (Object.values(SubmissionStatus).includes(statusKey)) {
            statusCounts[statusKey]++;
        } else if (submission.status) {
            statusCounts.other++;
        }
    });

    return Object.entries(statusCounts)
        .map(([statusKey, count]) => ({
            name: STATUS_DISTRIBUTION_NAMES[statusKey] || 'Unknown',
            value: count,
            color: STATUS_COLORS[statusKey] || STATUS_COLORS.other,
        }))
        .filter(item => item.value > 0);
  }

  /**
   * Calculates submission counts per campaign for the top N campaigns.
   * FIX: Changed input type for submissions to be more specific and address TS errors.
   */
  private calculateCampaignPerformance(
    submissions: Array<{ campaign_id: string | null }>, // FIX: Simplified input type
    campaigns: Campaign[]
  ): CampaignPerformance[] {
    // campaignMap keys are string (campaign.id)
    const campaignMap = new Map(campaigns.map(c => [c.id, c.name || `Campaign ${c.id}`]));
    // campaignCounts keys will be string
    const campaignCounts: Record<string, number> = {};

    submissions.forEach((submission) => {
        const currentCampaignId = submission.campaign_id; // Assign to variable

        // FIX: Check if it's a non-null string AND exists in the map
        if (typeof currentCampaignId === 'string' && campaignMap.has(currentCampaignId)) {
            // TS now knows currentCampaignId is a valid string key here
            campaignCounts[currentCampaignId] = (campaignCounts[currentCampaignId] || 0) + 1;
        }
    });

    return Object.entries(campaignCounts)
      // FIX: Ensure name is retrieved correctly and handle potential undefined case gracefully
      .map(([campaignId, count]): CampaignPerformance | null => {
          // campaignId is string here. campaignMap.get expects string.
          const name = campaignMap.get(campaignId);
          if (name === undefined) {
              // Should not happen if logic is correct, but good to safeguard.
               console.warn(`In calculateCampaignPerformance: Campaign name not found for ID: ${campaignId}`);
              return null; // Skip this entry if name is missing
          }
          return { name, value: count };
      })
      // FIX: Filter out any null entries potentially created above
      .filter((item): item is CampaignPerformance => item !== null)
      .sort((a, b) => b.value - a.value)
      .slice(0, TOP_CAMPAIGN_LIMIT);
  }
}