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
export default class CampaignService {
  constructor() {}
  async getCampaigns(): Promise<Campaign[]> {
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
  async getCampaignById(id: string) {
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
  async createCampaign(campaign: Omit<Campaign, "id" | "created_at" | "updated_at">): Promise<Campaign> {
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
  async updateCampaign(id: string, campaign: Partial<Campaign>): Promise<Campaign> {
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
   async deleteCampaign(id: string): Promise<void> {
    const { error } = await supabase
      .from("campaigns")
      .delete()
      .eq("id", id)
  
    if (error) {
      console.error("Error deleting campaign:", error)
      throw error
    }
  }
   async getCampaignCount() {
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
  async getAssignedCampaigns(userId: string) {
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
  
} 

/**
 * Get campaign by ID
 */
 
/**
 * Create a new campaign
 */ 
/**
 * Update a campaign
 */ 

/**
 * Delete a campaign
 */


/**
 * Get campaign count
 */


 
