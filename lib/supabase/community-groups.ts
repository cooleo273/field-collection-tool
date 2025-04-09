import { supabase } from "./client"
import type { Database } from "@/types/supabase"

type CommunityGroupRow = Database["public"]["Tables"]["community_groups"]["Row"]
type CommunityGroupInsert = Database["public"]["Tables"]["community_groups"]["Insert"]
type CommunityGroupUpdate = Database["public"]["Tables"]["community_groups"]["Update"]

export interface CommunityGroup extends CommunityGroupRow {
  location?: {
    id: string
    name: string
  }
}

/**
 * Get all community groups
 */
export async function getCommunityGroups(): Promise<CommunityGroup[]> {
  const { data, error } = await supabase
    .from("community_groups")
    .select(`
      *,
      location:locations (
        id,
        name
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching community groups:", error)
    throw error
  }

  return data
}

/**
 * Get community groups by campaign
 */
export async function getCommunityGroupsByCampaign(campaignId: string) {
  try {
    const { data, error } = await supabase
      .from("community_groups")
      .select(`
        *,
        type:community_group_types(*)
      `)
      .eq("campaign_id", campaignId)
      .order("name")

    if (error) {
      console.error("Error fetching community groups by campaign:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getCommunityGroupsByCampaign:", error)
    return []
  }
}

/**
 * Get community group types
 */
export async function getCommunityGroupTypes() {
  try {
    const { data, error } = await supabase
      .from("community_group_types")
      .select("*")
      .order("name")

    if (error) {
      // If the table doesn't exist, return default types
      if (error.code === '42P01') {
        console.warn("Community group types table does not exist. Using default types.")
        return [
          { id: '1', name: 'Religious', description: 'Religious community groups' },
          { id: '2', name: 'Cultural', description: 'Cultural community groups' },
          { id: '3', name: 'Educational', description: 'Educational community groups' },
          { id: '4', name: 'Social', description: 'Social community groups' },
          { id: '5', name: 'Youth', description: 'Youth community groups' },
          { id: '6', name: 'Women', description: 'Women community groups' },
          { id: '7', name: 'Other', description: 'Other types of community groups' }
        ]
      }
      console.error("Error fetching community group types:", error)
      throw new Error(error.message || "Failed to fetch community group types")
    }

    return data || []
  } catch (error) {
    console.error("Error in getCommunityGroupTypes:", error)
    throw error instanceof Error ? error : new Error("Failed to fetch community group types")
  }
}

/**
 * Create a new community group
 */
export async function createCommunityGroup(group: { 
  name: string
  type: string
  location_id?: string | null
  campaign_id?: string | null
}): Promise<CommunityGroup> {
  try {
    const { data, error } = await supabase
      .from("community_groups")
      .insert({
        name: group.name,
        type: group.type,
        location_id: group.location_id || null,
        campaign_id: group.campaign_id || null
      })
      .select(`
        *,
        location:locations (
          id,
          name
        )
      `)
      .single()

    if (error) {
      console.error("Error creating community group:", error)
      throw new Error(error.message || "Failed to create community group")
    }

    if (!data) {
      throw new Error("No data returned after creating community group")
    }

    return data
  } catch (error) {
    console.error("Error in createCommunityGroup:", error)
    throw error instanceof Error ? error : new Error("Failed to create community group")
  }
}

/**
 * Update a community group
 */
export async function updateCommunityGroup(id: string, group: Omit<CommunityGroupUpdate, "id" | "created_at" | "updated_at">): Promise<CommunityGroup> {
  const { data, error } = await supabase
    .from("community_groups")
    .update(group)
    .eq("id", id)
    .select(`
      *,
      location:locations (
        id,
        name
      )
    `)
    .single()

  if (error) {
    console.error("Error updating community group:", error)
    throw error
  }

  return data
}

/**
 * Delete a community group
 */
export async function deleteCommunityGroup(id: string): Promise<void> {
  const { error } = await supabase
    .from("community_groups")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting community group:", error)
    throw error
  }
} 