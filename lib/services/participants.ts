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

/**
 * Get all campaigns
 */
export async function getCampaigns(): Promise<Participants[]> {
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

/**
 * Get campaign by ID
 */
export async function getCampaignById(id: string) {
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

/**
 * Get participants count by submission ID
 */
export async function getParticipantsCountBySubmissionId(submissionId: string): Promise<number> {
  const getPagination = (page: number, pageSize: number) => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    return { from, to };
  };

  try {
    const page = 1; // Current page number
    const pageSize = 10; // Number of items per page
    const { from, to } = getPagination(page, pageSize);
    const { count, error } = await supabase
      .from("participants")
      .select("id", { count: "exact" })
      .eq("submission_id", submissionId)
      .range(from, to);

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
