import { getSupabaseClient, supabase } from "./client"

export interface Participants {
  id: string
  submission_id: string
  name: string
  phone_number: string
  age: string
  gender: "male" | "female" | "other"
  created_at: string
  updated_at: string
}
export default class ParticipantsService {
  constructor() {}  

  async getCampaigns(): Promise<Participants[]> {
    const { data, error } = await supabase
      .from("participants")
      .select("*")
      .order("created_at", { ascending: false })
  
    if (error) {
      console.error("Error fetching participants:", error)
      throw error
    }
  
    return data || []
  }
  async getCampaignById(id: string) {
    try {
      const { data, error } = await supabase.from("participants").select("*").eq("submission_id", id).single()
  
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
  async getParticipantsCountBySubmissionId(submissionId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from("participants")
        .select("id", { count: "exact" })
        .eq("submission_id", submissionId)
  
      if (error) {
        console.error("Error fetching participants count by submission ID:", error)
        throw error
      }
  
      return count || 0
    } catch (error) {
      console.error("Error in getParticipantsCountBySubmissionId:", error)
      throw error
    }
  }
  
}

 


/**
 * Get participants count by submission ID
 */
 