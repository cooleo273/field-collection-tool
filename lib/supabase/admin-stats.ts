import { getSupabaseClient } from "./client"

// Add these interfaces to match the dashboard component
interface DashboardStats {
  campaigns: number;
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

export async function getProjectAdminDashboardStats(userId: string): Promise<DashboardData> {
  const supabase = getSupabaseClient()
  
  try {
    console.log("Getting stats for admin:", userId)
    
    // Get all submissions
    const { data: allSubmissions, error: submissionsError } = await supabase
      .from('submissions')
      .select('*')
    
    if (submissionsError) {
      console.error("Error fetching submissions:", submissionsError)
      throw submissionsError
    }
    
    // Get campaigns
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*')
    
    if (campaignsError) {
      console.error("Error fetching campaigns:", campaignsError)
      throw campaignsError
    }
    
    // Get locations from submissions
    const uniqueLocations = new Set()
    if (allSubmissions) {
      allSubmissions.forEach(submission => {
        if (submission.location_id) {
          uniqueLocations.add(submission.location_id)
        }
      })
    }
    
    // Count submissions by status
    const pendingSubmissions = allSubmissions ? 
      allSubmissions.filter(s => s.status === 'submitted').length : 0
    
    // Get recent submissions - without trying to join with profiles
    const { data: recentSubmissions, error: recentError } = await supabase
      .from('submissions')
      .select(`
        *,
        campaigns(name),
        locations(name)
      `)
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (recentError) {
      console.error("Error fetching recent submissions:", recentError)
      throw recentError
    }
    
    // If we need user information, we can fetch it separately
    if (recentSubmissions && recentSubmissions.length > 0) {
      // Get unique user IDs from submissions
      const userIds = [...new Set(recentSubmissions
        .filter(s => s.user_id)
        .map(s => s.user_id))]
      
      if (userIds.length > 0) {
        // Fetch user profiles
        const { data: profiles } = await supabase
          .from('users') // Use the correct table name for user profiles
          .select('id, full_name, email')
          .in('id', userIds)
        
        // Add user info to submissions
        if (profiles) {
          const userMap = new Map(profiles.map(p => [p.id, p]))
          recentSubmissions.forEach(submission => {
            if (submission.user_id && userMap.has(submission.user_id)) {
              submission.user_info = userMap.get(submission.user_id)
            }
          })
        }
      }
    }
    
    // Make sure your function returns all these properties
    return {
      stats: {
        campaigns: campaigns?.length || 0,
        submissions: allSubmissions?.length || 0,
        pendingSubmissions: pendingSubmissions,
        locations: uniqueLocations.size,
      },
      recentSubmissions: recentSubmissions || [],
      submissionTrends: calculateSubmissionTrends(allSubmissions || []),
      statusDistribution: calculateStatusDistribution(allSubmissions || []),
      campaignPerformance: calculateCampaignPerformance(allSubmissions || [], campaigns || [])
    };
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error)
    throw error
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