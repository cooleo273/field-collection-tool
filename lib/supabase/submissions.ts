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
      .select("*, users(name, email, role), locations(name, address), campaigns(name, description)")
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching submission by ID:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getSubmissionById:", error)
    return null
  }
}

/**
 * Create a new submission
 */
export async function createSubmission(
  submission: Omit<Database['public']['Tables']['submissions']['Insert'], 'id' | 'created_at' | 'updated_at'>
) {
  const { data, error } = await supabase
    .from('submissions')
    .insert([{
      ...submission,
      status: 'pending',
      sync_status: 'pending',
      submitted_at: new Date().toISOString()
    }])
    .select()
    .single()

  if (error) {
    console.error('Error creating submission:', error)
    throw error
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
export async function getSubmissionsByStatus(status: string) {
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

export async function updateSubmissionStatus(
  submissionId: string,
  status: "approved" | "rejected"
) {
  const { data, error } = await supabase
    .from("submissions")
    .update({ status })
    .eq("id", submissionId)
  if (error) throw error
  return data
}
