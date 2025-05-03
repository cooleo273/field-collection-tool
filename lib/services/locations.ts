import { supabase } from "./client"
import type { Database } from "@/types/supabase"

// Base type from database schema
type LocationRow = Database["public"]["Tables"]["locations"]["Row"]

// Extended type that includes the parent join
export type Location = LocationRow & {
  parent?: {
    id: string
    name: string
    type: "kebele" | "district" | "zone" | "region" | "town"
  } | null
}

/**
 * Get all locations
 */
export async function getLocations(): Promise<Location[]> {
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .order("name")
  
  if (error) {
    console.error("Error fetching locations:", error)
    throw error
  }
  
  return data || []
}

/**
 * Get location by ID
 */
export async function getLocationById(id: string): Promise<Location | null> {
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("id", id)
    .single()
  
  if (error) {
    if (error.code === "PGRST116") {
      // PGRST116 means no rows returned
      return null
    }
    console.error("Error fetching location:", error)
    throw error
  }
  
  return data
}

/**
 * Get locations by type
 */
export async function getLocationsByType(type: "kebele" | "district" | "zone" | "region" | "town") {
  try {
    const { data, error } = await supabase
      .from("locations")
      .select(`
        *,
      `)
      .eq("type", type)
      .order("name", { ascending: true })

    if (error) {
      console.error("Error fetching locations by type:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getLocationsByType:", error)
    return []
  }
}

/**
 * Get child locations
 */


/**
 * Get locations by campaign
 */
export async function getLocationsByCampaign(campaignId: string) {
  try {
    const { data, error } = await supabase
      .from("campaign_locations")
      .select(`
        location:locations(*)
      `)
      .eq("campaign_id", campaignId)
      .order("location(name)")

    if (error) {
      console.error("Error fetching locations by campaign:", error)
      return []
    }

    return data.map(item => item.location) || []
  } catch (error) {
    console.error("Error in getLocationsByCampaign:", error)
    return []
  }
}

/**
 * Create a new location
 */
export async function createLocation(location: Omit<Location, "id" | "created_at" | "updated_at"> & { campaign_id?: string }): Promise<Location> {
  const { data, error } = await supabase
    .from("locations")
    .insert(location)
    .select()
    .single()
  
  if (error) {
    console.error("Error creating location:", error)
    throw error
  }

  // If campaign_id is provided, associate the location with the campaign
  if (location.campaign_id) {
    try {
      await addLocationToCampaign(location.campaign_id, data.id)
    } catch (error) {
      console.error("Error associating location with campaign:", error)
      // Don't throw here, as the location was created successfully
    }
  }
  
  return data
}

/**
 * Update a location
 */
export async function updateLocation(id: string, location: Partial<Location>): Promise<Location> {
  const { data, error } = await supabase
    .from("locations")
    .update(location)
    .eq("id", id)
    .select()
    .single()
  
  if (error) {
    console.error("Error updating location:", error)
    throw error
  }
  
  return data
}

/**
 * Delete a location
 */
export async function deleteLocation(id: string): Promise<void> {
  const { error } = await supabase
    .from("locations")
    .delete()
    .eq("id", id)
  
  if (error) {
    console.error("Error deleting location:", error)
    throw error
  }
}

/**
 * Get location count
 */
export async function getLocationCount() {
  try {
    const { count, error } = await supabase.from("locations").select("*", { count: "exact", head: true })

    if (error) {
      console.error("Error getting location count:", error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error("Error in getLocationCount:", error)
    return 0
  }
}

/**
 * Get locations assigned to a promoter
 */
export async function getPromoterLocations(promoterId: string): Promise<Location[]> {
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("assignedLocations")
    .eq("id", promoterId)
    .single()
  
  if (userError) {
    console.error("Error fetching user assigned locations:", userError)
    throw userError
  }
  
  if (!userData?.assignedLocations || !Array.isArray(userData.assignedLocations) || userData.assignedLocations.length === 0) {
    return []
  }
  
  const locationIds = userData.assignedLocations
  
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .in("id", locationIds)
  
  if (error) {
    console.error("Error fetching promoter locations:", error)
    throw error
  }
  
  return data || []
}

/**
 * Associate a location with a campaign
 */
export async function addLocationToCampaign(campaignId: string, locationId: string) {
  const { data, error } = await supabase
    .from('campaign_locations')
    .insert([{
      campaign_id: campaignId,
      location_id: locationId
    }])
    .select()

  if (error) {
    console.error('Error adding location to campaign:', error)
    throw error
  }

  return data
}

