import { getSupabaseClient, supabase } from "./client"

export interface Campaign {
  id: string
  name: string
  description: string
  start_date: string
  end_date: string
  status: "draft" | "active" | "completed" | "archived"
  created_at: string
  updated_at: string
}

/**
 * Get all campaigns
 */
export async function getCampaigns(): Promise<Campaign[]> {
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching campaigns:", error)
    throw error
  }

  return data || []
}

/**
 * Get campaign by ID
 */
export async function getCampaignById(id: string) {
  try {
    const { data, error } = await supabase.from("campaigns").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching campaign by ID:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getCampaignById:", error)
    return null
  }
}

/**
 * Create a new campaign
 */
export async function createCampaign(campaign: Omit<Campaign, "id" | "created_at" | "updated_at">): Promise<Campaign> {
  try {
    const { data, error } = await supabase
      .from("campaigns")
      .insert([{
        ...campaign,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single()

    if (error) {
      console.error("Supabase error creating campaign:", error)
      throw new Error(`Failed to create campaign: ${error.message}`)
    }

    if (!data) {
      throw new Error("No data returned from campaign creation")
    }

    return data
  } catch (error) {
    console.error("Error in createCampaign:", error)
    throw error
  }
}

/**
 * Update a campaign
 */
export async function updateCampaign(id: string, campaign: Partial<Campaign>): Promise<Campaign> {
  const { data, error } = await supabase
    .from("campaigns")
    .update(campaign)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating campaign:", error)
    throw error
  }

  return data
}

/**
 * Delete a campaign
 */
export async function deleteCampaign(id: string): Promise<void> {
  const { error } = await supabase
    .from("campaigns")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting campaign:", error)
    throw error
  }
}

/**
 * Get campaign count
 */
export async function getCampaignCount() {
  try {
    const { count, error } = await supabase.from("campaigns").select("*", { count: "exact", head: true })

    if (error) {
      console.error("Error getting campaign count:", error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error("Error in getCampaignCount:", error)
    return 0
  }
}

export async function getAssignedCampaigns(userId: string) {
  const supabase = getSupabaseClient()
  
  try {
    // First, get the campaign IDs assigned to the user
    const { data: promoterData, error: promoterError } = await supabase
      .from('campaign_promoters')
      .select('campaign_id')
      .eq('promoter_id', userId)

    if (promoterError) {
      console.error("Error fetching promoter assignments:", promoterError)
      return []
    }

    if (!promoterData || promoterData.length === 0) {
      return []
    }

    // Then, get the campaign details
    const campaignIds = promoterData.map(item => item.campaign_id)
    const { data: campaigns, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .in('id', campaignIds)

    if (campaignError) {
      console.error("Error fetching campaigns:", campaignError)
      return []
    }

    return campaigns || []
  } catch (error) {
    console.error("Error loading assigned campaigns:", error)
    return []
  }
}

