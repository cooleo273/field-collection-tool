import { getSupabaseClient } from "./client";
import { Database } from "@/types/supabase";

// Extended the Submission type to include an optional user_info property
export type Submission = {
  id: string;
  activity_stream: string | null;
  location: string | null;
  community_group_type: string;
  participant_count: number;
  key_issues: string | null;
  status: string;
  submitted_by: string;
  campaign_id: string | null;
  created_at: string;
  updated_at: string;
  user_info?: {
    id: string;
    full_name: string;
    email: string;
  };
};

type Campaign = Database["public"]["Tables"]["campaigns"]["Row"];

type SubmissionTrend = { date: string; count: number };
type StatusDistribution = { name: string; value: number; color: string };
type CampaignPerformance = { name: string; value: number };

export default class AdminStatsService {
  async getProjectAdminDashboardStats(userId: string, projectId: string) {
    const supabase = getSupabaseClient();

    try {
      // Get campaigns for this project
      const { data: campaigns, error: campaignsError } = await supabase
        .from("campaigns")
        .select("*")
        .eq("project_id", projectId);

      if (campaignsError) throw campaignsError;

      const campaignIds = campaigns?.map((c) => c.id) || [];

      // Get submissions for these campaigns
      const { data: allSubmissions, error: submissionsError } = await supabase
        .from("submissions")
        .select("*")
        .in("campaign_id", campaignIds);

      if (submissionsError) throw submissionsError;

      // Get recent submissions with related data
      const { data: recentSubmissions, error: recentError } = await supabase
        .from("submissions")
        .select(`
          *,
          campaigns(name),
          locations(name)
        `)
        .in("campaign_id", campaignIds)
        .order("created_at", { ascending: false })
        .limit(5);

      if (recentError) throw recentError;

      // Get locations from submissions
      const uniqueLocations = new Set(
        allSubmissions?.map((s: Submission) => s.location).filter(Boolean)
      );

      // Count pending submissions
      const pendingSubmissions =
        allSubmissions?.filter((s: Submission) => s.status === "submitted").length || 0;

      // Add user info to recent submissions
      if (recentSubmissions?.length > 0) {
        const userIds = [
          ...new Set(recentSubmissions.filter((s: Submission) => s.submitted_by).map((s: Submission) => s.submitted_by)),
        ];

        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from("users")
            .select("id, full_name, email")
            .in("id", userIds);

          if (profiles) {
            const userMap = new Map(profiles.map((p) => [p.id, p]));
            recentSubmissions.forEach((submission: Submission) => {
              if (submission.submitted_by && userMap.has(submission.submitted_by)) {
                submission.user_info = userMap.get(submission.submitted_by);
              }
            });
          }
        }
      }

      return {
        stats: {
          campaigns: campaigns?.length || 0,
          submissions: allSubmissions?.length || 0,
          pendingSubmissions,
          locations: uniqueLocations.size,
        },
        recentSubmissions: recentSubmissions || [],
        submissionTrends: this.calculateSubmissionTrends(allSubmissions || []),
        statusDistribution: this.calculateStatusDistribution(allSubmissions || []),
        campaignPerformance: this.calculateCampaignPerformance(
          allSubmissions || [],
          campaigns || []
        ),
      };
    } catch (error) {
      console.error("Error fetching admin dashboard stats:", error);
      throw error;
    }
  }

  // Helper function to calculate submission trends for the last 30 days
  calculateSubmissionTrends(submissions: Submission[]): SubmissionTrend[] {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    // Initialize an array for the last 30 days
    const days: SubmissionTrend[] = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo);
      date.setDate(date.getDate() + i);
      days.push({
        date: date.toISOString().split("T")[0],
        count: 0,
      });
    }

    // Count submissions for each day
    submissions.forEach((submission: Submission) => {
      if (!submission.created_at) return;

      const submissionDate = new Date(submission.created_at)
        .toISOString()
        .split("T")[0];
      const dayIndex = days.findIndex((day) => day.date === submissionDate);
      if (dayIndex !== -1) {
        days[dayIndex].count++;
      }
    });

    return days;
  }

  // Helper function to calculate status distribution
  calculateStatusDistribution(submissions: Submission[]): StatusDistribution[] {
    const statusCounts = {
      pending: 0,
      approved: 0,
      rejected: 0,
      other: 0,
    };

    submissions.forEach((submission: Submission) => {
      if (submission.status === "submitted") {
        statusCounts.pending++;
      } else if (submission.status === "approved") {
        statusCounts.approved++;
      } else if (submission.status === "rejected") {
        statusCounts.rejected++;
      } else {
        statusCounts.other++;
      }
    });

    return [
      { name: "Pending", value: statusCounts.pending, color: "#facc15" },
      { name: "Approved", value: statusCounts.approved, color: "#22c55e" },
      { name: "Rejected", value: statusCounts.rejected, color: "#ef4444" },
      { name: "Other", value: statusCounts.other, color: "#3b82f6" },
    ];
  }

  // Helper function to calculate campaign performance
  calculateCampaignPerformance(
    submissions: Submission[],
    campaigns: Campaign[]
  ): CampaignPerformance[] {
    // Create a map of campaign IDs to names
    const campaignMap = new Map(
      campaigns.map((c: Campaign) => [c.id, c.name || `Campaign ${c.id}`])
    );

    // Count submissions by campaign
    const campaignCounts: Record<string, number> = {};

    submissions.forEach((submission: Submission) => {
      const campaignId = submission.campaign_id;
      if (campaignId) {
        if (!campaignCounts[campaignId]) {
          campaignCounts[campaignId] = 0;
        }
        campaignCounts[campaignId]++;
      }
    });

    // Convert to array format for chart
    return Object.entries(campaignCounts)
      .map(([campaignId, count]) => ({
        name: campaignMap.get(campaignId) || `Campaign ${campaignId}`,
        value: count,
      }))
      .sort((a, b) => (b.value as number) - (a.value as number))
      .slice(0, 10); // Top 10 campaigns
  }
}