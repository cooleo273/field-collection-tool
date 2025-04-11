// Fix the import to use the correct function or use the existing supabase client
import { supabase } from "./client"
import type { Database } from "@/types/supabase"

export type Submission = Database["public"]["Tables"]["submissions"]["Row"]

/**
 * Get all submissions
 */
export async function getSubmissions() {
  const { data, error } = await supabase
    .from('submissions')
    .select(`
      *,
      submitted_by:users!submissions_submitted_by_fkey (
        id,
        name,
        email
      ),
      reviewed_by:users!submissions_reviewed_by_fkey (
        id,
        name,
        email
      )
    `)
    .order('submitted_at', { ascending: false })

  if (error) {
    console.error('Error fetching submissions:', error)
    throw error
  }

  return data
}

/**
 * Get submissions by user ID
 */
export async function getSubmissionsByUserId(userId: string) {
  try {
    const { data, error } = await supabase
      .from("submissions")
      .select("*, users(name, email, role), locations(name, address), campaigns(name, description)")
      .eq("submitted_by", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching submissions by user ID:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getSubmissionsByUserId:", error)
    return []
  }
}

/**
 * Get submission by ID
 */
export async function getSubmissionById(id: string) {
  try {
    const { data, error } = await supabase
      .from("submissions")
      .select(`
        *,
        campaigns(name),
        locations(name)
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching submission by ID:", error)
      throw error // Throw the actual error instead of returning null
    }

    if (!data) {
      throw new Error("Submission not found")
    }

    return data
  } catch (error) {
    console.error("Error in getSubmissionById:", error)
    throw error // Propagate the error instead of returning null
  }
}




// Update createSubmission function
export async function createSubmission(
  submission: Omit<Database['public']['Tables']['submissions']['Insert'], 'id' | 'created_at' | 'updated_at'>,
  photoUrls?: string[]
) {
  const { data, error } = await supabase
    .from('submissions')
    .insert([{
      ...submission,
      status: 'submitted' as SubmissionStatus, // Changed from 'pending' to 'submitted'
      sync_status: 'synced' as SyncStatusType, // Changed from 'pending' to 'synced'
      submitted_at: new Date().toISOString()
    }])
    .select()
    .single()

  if (error) {
    console.error('Error creating submission:', error)
    throw error
  }

  // If photos were provided, store them in the submission_photos table
  if (photoUrls && photoUrls.length > 0 && data) {
    const photoEntries = photoUrls.map(url => ({
      submission_id: data.id,
      photo_url: url,
      created_at: new Date().toISOString()
    }))

    const { error: photoError } = await supabase
      .from('submission_photos')
      .insert(photoEntries)

    if (photoError) {
      console.error('Error storing submission photos:', photoError)
      // We don't throw here to avoid rolling back the submission creation
      // Instead, we log the error and continue
    }
  }

  return data
}

/**
 * Update a submission
 */
export async function updateSubmission(
  id: string,
  submission: Partial<Omit<Submission, "id" | "created_at" | "updated_at">>,
) {
  try {
    const { data, error } = await supabase
      .from("submissions")
      .update({
        ...submission,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()

    if (error) {
      console.error("Error updating submission:", error)
      return null
    }

    return data?.[0] || null
  } catch (error) {
    console.error("Error in updateSubmission:", error)
    return null
  }
}

/**
 * Delete a submission
 */
export async function deleteSubmission(id: string) {
  try {
    const { error } = await supabase.from("submissions").delete().eq("id", id)

    if (error) {
      console.error("Error deleting submission:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in deleteSubmission:", error)
    return false
  }
}

/**
 * Get submissions by status
 */
export async function getSubmissionsByStatus(status: SubmissionStatus) {
  try {
    const { data, error } = await supabase
      .from("submissions")
      .select("*, users(name, email, role), locations(name, address), campaigns(name, description)")
      .eq("status", status)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching submissions by status:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getSubmissionsByStatus:", error)
    return []
  }
}

/**
 * Get submissions by campaign ID
 */
export async function getSubmissionsByCampaignId(campaignId: string) {
  try {
    const { data, error } = await supabase
      .from("submissions")
      .select("*, users(name, email, role), locations(name, address), campaigns(name, description)")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching submissions by campaign ID:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getSubmissionsByCampaignId:", error)
    return []
  }
}

/**
 * Get submissions by location ID
 */
export async function getSubmissionsByLocationId(locationId: string) {
  try {
    const { data, error } = await supabase
      .from("submissions")
      .select("*, users(name, email, role), locations(name, address), campaigns(name, description)")
      .eq("location_id", locationId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching submissions by location ID:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getSubmissionsByLocationId:", error)
    return []
  }
}

/**
 * Get submissions count
 */
export async function getSubmissionCount() {
  try {
    const { count, error } = await supabase.from("submissions").select("*", { count: "exact", head: true })

    if (error) {
      console.error("Error fetching submissions count:", error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error("Error in getSubmissionCount:", error)
    return 0
  }
}

/**
 * Get recent submissions
 */
export async function getRecentSubmissions(limit = 5) {
  try {
    const { data, error } = await supabase
      .from("submissions")
      .select("*, users(name, email, role), locations(name), campaigns(name)")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching recent submissions:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getRecentSubmissions:", error)
    return []
  }
}

/**
 * Get submissions by date range
 */
export async function getSubmissionsByDateRange(startDate: string, endDate: string) {
  try {
    const { data, error } = await supabase
      .from("submissions")
      .select("*, users(name, email, role), locations(name, address), campaigns(name, description)")
      .gte("created_at", startDate)
      .lte("created_at", endDate)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching submissions by date range:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getSubmissionsByDateRange:", error)
    return []
  }
}

// Define the new TypeScript types for the enums
type SubmissionStatus = 'draft' | 'submitted' | 'approved' | 'rejected';
type SyncStatusType = 'local' | 'synced';

export async function updateSubmissionStatus(submissionId: string, status: SubmissionStatus) {
  try {
    // Get the current user ID for the reviewer field
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase
      .from('submissions')
      .update({
        status: status,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        sync_status: 'synced' as SyncStatusType
      })
      .eq('id', submissionId)
    
    if (error) {
      console.error('Error updating submission status:', error)
      throw error
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error updating submission status:', error)
    throw error
  }
}

/**
 * Get submission photos by submission ID
 */
export async function getSubmissionPhotos(submissionId: string) {
  try {
    const { data, error } = await supabase
      .from("submission_photos")
      .select("*")
      .eq("submission_id", submissionId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching submission photos:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getSubmissionPhotos:", error)
    return []
  }
}


// Add this new function to get dashboard stats
export async function getPromoterDashboardStats(userId: string) {
  
  
  try {
    // Get total count
    const { count: totalCount } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('submitted_by', userId)

    // Get counts by status
    const { data: statusCounts } = await supabase
      .from('submissions')
      .select('status')
      .eq('submitted_by', userId)

    // Get recent submissions with campaign and location info
    const { data: recentSubmissions } = await supabase
      .from('submissions')
      .select(`
        *,
        campaigns(name),
        locations(name)
      `)
      .eq('submitted_by', userId)
      .order('created_at', { ascending: false })
      .limit(5)

    // Calculate counts by status
    const pendingCount = statusCounts?.filter(s => s.status === 'pending').length || 0
    const submittedCount = statusCounts?.filter(s => s.status === 'submitted').length || 0
    const approvedCount = statusCounts?.filter(s => s.status === 'approved').length || 0
    const rejectedCount = statusCounts?.filter(s => s.status === 'rejected').length || 0

    return {
      stats: {
        totalSubmissions: totalCount || 0,
        submittedSubmissions: submittedCount, // Changed from pendingSubmissions
        approvedSubmissions: approvedCount,
        rejectedSubmissions: rejectedCount,
      },
      recentSubmissions: recentSubmissions || []
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    throw error
  }
}
