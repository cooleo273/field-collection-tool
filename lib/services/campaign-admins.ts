import { supabase } from "./client"
import type { Database } from "@/types/supabase"

export type CampaignAdmin = Database["public"]["Tables"]["campaign_admins"]["Row"]

/**
 * Get all campaign admin assignments
 */
export async function getCampaignAdmins() {
  try {
    const { data, error } = await supabase
      .from("campaign_admins")
      .select(`
        *,
        campaigns:campaign_id (
          id,
          name
        ),
        users:user_id (
          id,
          name,
          email
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching campaign admins:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getCampaignAdmins:", error)
    return []
  }
}

/**
 * Get campaigns assigned to an admin
 */
export async function getAdminCampaigns(userId: string) {
  try {
    const { data, error } = await supabase
      .from("campaign_admins")
      .select(`
        *,
        campaigns:campaign_id (
          id,
          name,
          description,
          status
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching admin campaigns:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getAdminCampaigns:", error)
    return []
  }
}

/**
 * Get admins assigned to a campaign
 */
export async function getCampaignAdminsByCapmaign(campaignId: string) {
  try {
    const { data, error } = await supabase
      .from("campaign_admins")
      .select(`
        *,
        users:user_id (
          id,
          name,
          email,
          role
        )
      `)
      .eq("campaign_id", campaignId)

    if (error) {
      console.error("Error fetching campaign admins by campaign:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getCampaignAdminsByCapmaign:", error)
    return []
  }
}

/**
 * Assign campaigns to an admin
 * This function will remove all existing assignments and add the new ones
 */
export async function assignCampaignsToAdmin(userId: string, campaignIds: string[]) {
  try {
    // First, delete existing assignments
    const { error: deleteError } = await supabase
      .from("campaign_admins")
      .delete()
      .eq("user_id", userId)

    if (deleteError) {
      console.error("Error deleting existing campaign admin assignments:", deleteError)
      throw new Error(deleteError.message || "Failed to update campaign assignments")
    }

    // If there are no campaigns to assign, we're done
    if (campaignIds.length === 0) {
      return true
    }

    // Create new assignments without created_at
    const assignments = campaignIds.map(campaignId => ({
      user_id: userId,
      campaign_id: campaignId
    }))

    const { error: insertError } = await supabase
      .from("campaign_admins")
      .insert(assignments)

    if (insertError) {
      console.error("Error creating campaign admin assignments:", insertError)
      throw new Error(insertError.message || "Failed to create campaign assignments")
    }

    return true
  } catch (error) {
    console.error("Error in assignCampaignsToAdmin:", error)
    throw error instanceof Error ? error : new Error("Unknown error occurred while assigning campaigns")
  }
}

/**
 * Delete a campaign admin assignment
 */
export async function deleteCampaignAdmin(userId: string, campaignId: string) {
  try {
    const { error } = await supabase
      .from("campaign_admins")
      .delete()
      .eq("user_id", userId)
      .eq("campaign_id", campaignId)

    if (error) {
      console.error("Error deleting campaign admin:", error)
      throw new Error(error.message || "Failed to delete campaign admin")
    }

    return true
  } catch (error) {
    console.error("Error in deleteCampaignAdmin:", error)
    throw error instanceof Error ? error : new Error("Unknown error occurred while deleting campaign admin")
  }
} 