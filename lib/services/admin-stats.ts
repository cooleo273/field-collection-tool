import { getSupabaseClient } from "./client"

// Add these interfaces to match the dashboard component
interface DashboardStats {
  submissions: number;
  pendingSubmissions: number;
  locations: number;
}

interface SubmissionTrendData {
  date: string;
  count: number;
}

interface StatusDistributionData {
  name: string;
  value: number;
  color: string;
}

interface CampaignPerformanceData {
  name: string;
  value: number;
}

interface DashboardData {
  stats: DashboardStats;
  recentSubmissions: any[];
  submissionTrends: SubmissionTrendData[];
  statusDistribution: StatusDistributionData[];
  campaignPerformance: CampaignPerformanceData[];
}

export async function getProjectAdminDashboardStats(projectId: string): Promise<DashboardData> {
  const supabase = getSupabaseClient();

  try {
    // Get submissions for the project
    const { data: allSubmissions, error: submissionsError } = await supabase
      .from("submissions")
      .select("*")
      .eq("project_id", projectId);

    if (submissionsError) throw submissionsError;

    // Get recent submissions with related data
    const { data: recentSubmissions, error: recentError } = await supabase
      .from("submissions")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (recentError) throw recentError;

    // Count pending submissions
    const pendingSubmissions = allSubmissions?.filter((s) => s.status === "submitted").length || 0;

    // Get unique locations from submissions
    const uniqueLocations = new Set(allSubmissions?.map((s) => s.location_id).filter(Boolean));

    return {
      stats: { // Removed campaigns logic
        submissions: allSubmissions?.length || 0,
        pendingSubmissions,
        locations: uniqueLocations.size,
      },
      recentSubmissions: recentSubmissions || [],
      submissionTrends: calculateSubmissionTrends(allSubmissions || []),
      statusDistribution: calculateStatusDistribution(allSubmissions || []),
      campaignPerformance: [], // Removed campaign performance logic
    };
  } catch (error) {
    console.error("Error fetching project admin dashboard stats:", error);
    throw error;
  }
}

export async function getProjectSubmissionsStats(projectId: string): Promise<DashboardData> {
  const supabase = getSupabaseClient();

  try {
    // Get submissions for the project
    const { data: allSubmissions, error: submissionsError } = await supabase
      .from("submissions")
      .select("*")
      .eq("project_id", projectId);

    if (submissionsError) throw submissionsError;

    // Get recent submissions with related data
    const { data: recentSubmissions, error: recentError } = await supabase
      .from("submissions")
      .select("*, locations(name)")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (recentError) throw recentError;

    // Count pending submissions
    const pendingSubmissions = allSubmissions?.filter((s) => s.status === "submitted").length || 0;

    // Get unique locations from submissions
    const uniqueLocations = new Set(allSubmissions?.map((s) => s.location_id).filter(Boolean));

    return {
      stats: {// Removed campaigns logic
        submissions: allSubmissions?.length || 0,
        pendingSubmissions,
        locations: uniqueLocations.size,
      },
      recentSubmissions: recentSubmissions || [],
      submissionTrends: calculateSubmissionTrends(allSubmissions || []),
      statusDistribution: calculateStatusDistribution(allSubmissions || []),
      campaignPerformance: [], // Removed campaign performance logic
    };
  } catch (error) {
    console.error("Error fetching project submissions stats:", error);
    throw error;
  }
}

// Helper function to calculate submission trends for the last 30 days
function calculateSubmissionTrends(submissions: any[]): SubmissionTrendData[] {
  const today = new Date()
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(today.getDate() - 30)
  
  // Initialize an array for the last 30 days
  const days: SubmissionTrendData[] = []
  for (let i = 0; i < 30; i++) {
    const date = new Date(thirtyDaysAgo)
    date.setDate(date.getDate() + i)
    days.push({
      date: date.toISOString().split('T')[0],
      count: 0
    })
  }
  
  // Count submissions for each day
  submissions.forEach(submission => {
    if (!submission.created_at) return
    
    const submissionDate = new Date(submission.created_at).toISOString().split('T')[0]
    const dayIndex = days.findIndex(day => day.date === submissionDate)
    if (dayIndex !== -1) {
      days[dayIndex].count++
    }
  })
  
  return days
}

// Helper function to calculate status distribution
function calculateStatusDistribution(submissions: any[]): StatusDistributionData[] {
  const statusCounts = {
    pending: 0,
    approved: 0,
    rejected: 0,
    other: 0
  }
  
  submissions.forEach(submission => {
    if (submission.status === 'submitted') {
      statusCounts.pending++
    } else if (submission.status === 'approved') {
      statusCounts.approved++
    } else if (submission.status === 'rejected') {
      statusCounts.rejected++
    } else {
      statusCounts.other++
    }
  })
  
  return [
    { name: 'Pending', value: statusCounts.pending, color: '#facc15' },
    { name: 'Approved', value: statusCounts.approved, color: '#22c55e' },
    { name: 'Rejected', value: statusCounts.rejected, color: '#ef4444' },
    { name: 'Other', value: statusCounts.other, color: '#3b82f6' }
  ]
}

// Helper function to calculate campaign performance
function calculateCampaignPerformance(submissions: any[], campaigns: any[]): CampaignPerformanceData[] {
  // Create a map of campaign IDs to names
  const campaignMap = new Map(campaigns.map(c => [c.id, c.name || `Campaign ${c.id}`]))
  
  // Count submissions by campaign
  const campaignCounts: Record<string, number> = {}
  
  submissions.forEach(submission => {
    const campaignId = submission.campaign_id
    if (campaignId) {
      if (!campaignCounts[campaignId]) {
        campaignCounts[campaignId] = 0
      }
      campaignCounts[campaignId]++
    }
  })
  
  // Convert to array format for chart
  return Object.entries(campaignCounts)
    .map(([campaignId, count]) => ({
      name: campaignMap.get(campaignId) || `Campaign ${campaignId}`,
      value: count
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10) // Top 10 campaigns
}

interface PromoterDashboardStats {
  totalSubmissions: number;
  submittedSubmissions: number;
  approvedSubmissions: number;
  rejectedSubmissions: number;
}

interface PromoterDashboardData {
  stats: PromoterDashboardStats;
  recentSubmissions: any[];
}

export async function getPromoterDashboardStats(userId: string): Promise<PromoterDashboardData> {
  const supabase = getSupabaseClient();

  try {
    // Fetch all submissions by the promoter
    const { data: submissions, error: submissionsError } = await supabase
      .from("submissions")
      .select("*")
      .eq("submitted_by", userId);

    if (submissionsError) throw submissionsError;

    // Calculate stats
    const totalSubmissions = submissions?.length || 0;
    const submittedSubmissions = submissions?.filter((s) => s.status === "submitted").length || 0;
    const approvedSubmissions = submissions?.filter((s) => s.status === "approved").length || 0;
    const rejectedSubmissions = submissions?.filter((s) => s.status === "rejected").length || 0;

    // Fetch recent submissions
    const { data: recentSubmissions, error: recentError } = await supabase
      .from("submissions")
      .select("*")
      .eq("submitted_by", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (recentError) throw recentError;

    return {
      stats: {
        totalSubmissions,
        submittedSubmissions,
        approvedSubmissions,
        rejectedSubmissions,
      },
      recentSubmissions: recentSubmissions || [],
    };
  } catch (error) {
    console.error("Error fetching promoter dashboard stats:", error);
    throw error;
  }
}

export async function getProjectSubmissions(projectId: string) {
  const supabase = getSupabaseClient();

  try {
    // Fetch all submissions for the given project
    const { data: submissions, error } = await supabase
      .from("submissions")
      .select("*")
      .eq("project_id", projectId);

    if (error) throw error;

    return submissions || [];
  } catch (error) {
    console.error("Error fetching submissions for project:", error);
    throw error;
  }
}

export async function getProjectDetails(projectId: string) {
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("projects")
      .select("name")
      .eq("id", projectId)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error fetching project details:", error);
    throw error;
  }
}

export async function getUserDetails(userId: string) {
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("users")
      .select("name")
      .eq("id", userId)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error fetching user details:", error);
    throw error;
  }
}