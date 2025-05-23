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

    // Get all locations for the project
    const { data: locations, error: locationsError } = await supabase
      .from("locations")
      .select("*")

    if (locationsError) throw locationsError;

    // Get recent submissions with related data including user information
    const { data: recentSubmissions, error: recentError } = await supabase
      .from("submissions")
      .select(`
        *,
        user_info:users!submissions_submitted_by_fkey(id, name)
      `)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (recentError) throw recentError;

    // Count pending submissions
    const pendingSubmissions = allSubmissions?.filter((s) => s.status === "submitted").length || 0;

    return {
      stats: {
        submissions: allSubmissions?.length || 0,
        pendingSubmissions,
        locations: locations?.length || 0,
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

// export async function getProjectSubmissionsStats(projectId: string): Promise<DashboardData> {
//   const supabase = getSupabaseClient();

//   try {
//     // Get submissions for the project
//     const { data: allSubmissions, error: submissionsError } = await supabase
//       .from("submissions")
//       .select("*")
//       .eq("project_id", projectId);

//     if (submissionsError) throw submissionsError;

//     // Get recent submissions with related data including user information
//     const { data: recentSubmissions, error: recentError } = await supabase
//       .from("submissions")
//       .select(`
//         *,
//         user_info:submitted_by(
//           id,
//           name,
//           full_name
//         )
//       `)
//       .eq("project_id", projectId)
//       .order("created_at", { ascending: false })
//       .limit(5);

//     if (recentError) throw recentError;

//     // Count pending submissions
//     const pendingSubmissions = allSubmissions?.filter((s) => s.status === "submitted").length || 0;

//     // Get unique locations from submissions
//     const uniqueLocations = new Set(allSubmissions?.map((s) => s.location_id).filter(Boolean));

//     return {
//       stats: {// Removed campaigns logic
//         submissions: allSubmissions?.length || 0,
//         pendingSubmissions,
//         locations: uniqueLocations.size,
//       },
//       recentSubmissions: recentSubmissions || [],
//       submissionTrends: calculateSubmissionTrends(allSubmissions || []),
//       statusDistribution: calculateStatusDistribution(allSubmissions || []),
//       campaignPerformance: [], // Removed campaign performance logic
//     };
//   } catch (error) {
//     console.error("Error fetching project submissions stats:", error);
//     throw error;
//   }
// }

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
    submitted: 0,
    approved: 0,
    rejected: 0,
    other: 0
  }
  
  submissions.forEach(submission => {
    if (submission.status === 'submitted') {
      statusCounts.submitted++
    } else if (submission.status === 'approved') {
      statusCounts.approved++
    } else if (submission.status === 'rejected') {
      statusCounts.rejected++
    } else {
      statusCounts.other++
    }
  })
  
  return [
    { name: 'Pending', value: statusCounts.submitted, color: '#facc15' },
    { name: 'Approved', value: statusCounts.approved, color: '#22c55e' },
    { name: 'Rejected', value: statusCounts.rejected, color: '#ef4444' },
    { name: 'Other', value: statusCounts.other, color: '#3b82f6' }
  ]
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

// export async function getProjectSubmissions(projectId: string) {
//   const supabase = getSupabaseClient();

//   try {
//     // Fetch all submissions for the given project
//     const { data: submissions, error } = await supabase
//       .from("submissions")
//       .select("*")
//       .eq("project_id", projectId);

//     if (error) throw error;

//     return submissions || [];
//   } catch (error) {
//     console.error("Error fetching submissions for project:", error);
//     throw error;
//   }
// }

// export async function getProjectDetails(projectId: string) {
//   const supabase = getSupabaseClient();

//   try {
//     const { data, error } = await supabase
//       .from("projects")
//       .select("name")
//       .eq("id", projectId)
//       .single();

//     if (error) throw error;

//     return data;
//   } catch (error) {
//     console.error("Error fetching project details:", error);
//     throw error;
//   }
// }

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

// --- EXPORT this interface ---
export interface ProjectSubmission {
  // Include all fields from your 'submissions' table you need
  id: string;
  project_id: string;
  submitted_by: string;
  status: string;
  community_group_type: string;
  activity_stream: string; // Added based on usage
  participant_count: number;
  submitted_at: string;
  // Add other submission fields...

  // These will be populated by the join
  project_name?: string;
  submitted_by_name?: string;
}

// --- DEFINE and EXPORT this interface ---
export interface GetSubmissionsResponse {
  data: ProjectSubmission[];
  count: number | null; // Total count for pagination
}

// --- MODIFIED getProjectSubmissions ---
export async function getProjectSubmissions(
  projectId: string,
  page: number = 1,         // ACCEPT page argument
  pageSize: number = 10     // ACCEPT pageSize argument
): Promise<GetSubmissionsResponse> { // RETURN this Promise structure
  const supabase = getSupabaseClient();
  const offset = (page - 1) * pageSize;

  try {
    const { data, error, count } = await supabase
      .from("submissions")
      .select(
        `
        *,
        projects:project_id ( name ),
        users:submitted_by ( name )
      `,
        { count: "exact" } // USE count
      )
      .eq("project_id", projectId)
      .order("submitted_at", { ascending: false })
      .range(offset, offset + pageSize - 1); // USE range

    if (error) throw error;

    const mappedData = data?.map((item: any) => ({
        ...item,
        project_name: item.projects?.name,
        submitted_by_name: item.users?.name
    })) || [];

    // RETURN the object structure
    return { data: mappedData, count: count };

  } catch (err) {
    console.error("Error in getProjectSubmissions service:", err);
    throw new Error(`Failed to fetch submissions for project ${projectId}`);
  }
}

// --- Keep other functions as needed ---
export async function getProjectDetails(projectId: string) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('projects').select('name').eq('id', projectId).single();
    if (error) throw error;
    return data || { name: 'Unknown Project' };
}
